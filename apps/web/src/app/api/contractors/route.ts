import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contractors } from '@gcp/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const schema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  walletAddress: z.string().min(32).max(44),
  status: z.enum(['active', 'inactive', 'kyc_pending']).default('active'),
});

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  const rows = await db.select().from(contractors).where(eq(contractors.tenantId, tenantId));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const [row] = await db.insert(contractors).values(parsed.data).returning();
  return NextResponse.json(row, { status: 201 });
}
