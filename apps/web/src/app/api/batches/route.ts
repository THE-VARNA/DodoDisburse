import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payoutBatches, tenants } from '@gcp/db';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const schema = z.object({
  tenantId: z.string().uuid(),
  label: z.string().min(1),
  note: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  const rows = await db.select().from(payoutBatches)
    .where(eq(payoutBatches.tenantId, tenantId))
    .orderBy(desc(payoutBatches.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const [batch] = await db.insert(payoutBatches).values(parsed.data).returning();
  return NextResponse.json(batch, { status: 201 });
}
