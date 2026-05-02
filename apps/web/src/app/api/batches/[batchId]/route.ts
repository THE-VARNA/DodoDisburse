import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payoutBatches, payoutItems, contractors } from '@gcp/db';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const [batch] = await db.select().from(payoutBatches).where(eq(payoutBatches.id, batchId));
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

  const items = await db
    .select({
      item: payoutItems,
      contractor: contractors,
    })
    .from(payoutItems)
    .innerJoin(contractors, eq(payoutItems.contractorId, contractors.id))
    .where(eq(payoutItems.batchId, batchId));

  return NextResponse.json({ batch, items });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const body = await req.json();
  const { items } = body as { items: Array<{ contractorId: string; amountMinor: number }> };

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'items required' }, { status: 400 });
  }

  // Delete existing draft items, re-insert
  await db.delete(payoutItems).where(eq(payoutItems.batchId, batchId));

  const rows = await db.insert(payoutItems).values(
    items.map((it) => ({
      batchId,
      contractorId: it.contractorId,
      amountMinor: it.amountMinor,
      status: 'pending' as const,
    }))
  ).returning();

  const total = items.reduce((s, i) => s + i.amountMinor, 0);
  await db.update(payoutBatches).set({
    totalAmountMinor: total,
    recipientCount: items.length,
    updatedAt: new Date(),
  }).where(eq(payoutBatches.id, batchId));

  return NextResponse.json({ updated: rows.length });
}
