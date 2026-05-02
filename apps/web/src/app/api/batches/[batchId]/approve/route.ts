import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payoutBatches, tenants, ledgerEntries } from '@gcp/db';
import { eq } from 'drizzle-orm';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;

  const [batch] = await db.select().from(payoutBatches).where(eq(payoutBatches.id, batchId));
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  if (batch.status !== 'draft') {
    return NextResponse.json({ error: `Batch is already ${batch.status}` }, { status: 409 });
  }

  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, batch.tenantId));
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

  if (tenant.availableBalanceMinor < batch.totalAmountMinor) {
    return NextResponse.json({
      error: 'Insufficient balance',
      available: tenant.availableBalanceMinor,
      required: batch.totalAmountMinor,
    }, { status: 402 });
  }

  // Reserve balance atomically
  await db.update(tenants).set({
    availableBalanceMinor: tenant.availableBalanceMinor - batch.totalAmountMinor,
    reservedBalanceMinor: tenant.reservedBalanceMinor + batch.totalAmountMinor,
    updatedAt: new Date(),
  }).where(eq(tenants.id, tenant.id));

  // Ledger: reserve entry
  await db.insert(ledgerEntries).values({
    tenantId: tenant.id,
    type: 'reserve',
    amountMinor: -batch.totalAmountMinor,
    referenceId: batchId,
    referenceType: 'payout_batch',
  });

  // Mark batch approved
  await db.update(payoutBatches).set({
    status: 'approved',
    reservedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(payoutBatches.id, batchId));

  return NextResponse.json({ status: 'approved' });
}
