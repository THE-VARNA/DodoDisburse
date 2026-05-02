import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contractors } from '@gcp/db';
import { z } from 'zod';
import Papa from 'papaparse';

const rowSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  wallet_address: z.string().min(32).max(44),
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const tenantId = formData.get('tenantId') as string | null;
  const file = formData.get('file') as File | null;

  if (!tenantId || !file) {
    return NextResponse.json({ error: 'tenantId and file required' }, { status: 400 });
  }

  const text = await file.text();
  const { data, errors } = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });

  if (errors.length > 0) {
    return NextResponse.json({ error: 'CSV parse error', details: errors }, { status: 400 });
  }

  const valid: Array<typeof contractors.$inferInsert> = [];
  const failed: Array<{ row: number; error: string }> = [];

  data.forEach((row, i) => {
    const parsed = rowSchema.safeParse(row);
    if (parsed.success) {
      valid.push({
        tenantId,
        name: parsed.data.name,
        email: parsed.data.email,
        walletAddress: parsed.data.wallet_address,
        status: 'active',
      });
    } else {
      failed.push({ row: i + 2, error: parsed.error.issues.map((x) => x.message).join(', ') });
    }
  });

  let inserted: typeof contractors.$inferSelect[] = [];
  if (valid.length > 0) {
    inserted = await db
      .insert(contractors)
      .values(valid)
      .onConflictDoNothing()
      .returning();
  }

  return NextResponse.json({ imported: inserted.length, failed });
}
