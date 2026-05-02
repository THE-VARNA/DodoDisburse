import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payoutBatches, payoutItems, tenants, contractors, ledgerEntries } from '@gcp/db';
import { eq, and } from 'drizzle-orm';
import { transferUsdc } from '@gcp/solana';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;

  const [batch] = await db.select().from(payoutBatches).where(eq(payoutBatches.id, batchId));
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  if (batch.status !== 'approved') {
    return NextResponse.json({ error: `Batch must be approved first (status: ${batch.status})` }, { status: 409 });
  }

  // Mark batch as executing
  await db.update(payoutBatches).set({ status: 'executing', executedAt: new Date(), updatedAt: new Date() })
    .where(eq(payoutBatches.id, batchId));

  const items = await db
    .select({ item: payoutItems, contractor: contractors })
    .from(payoutItems)
    .innerJoin(contractors, eq(payoutItems.contractorId, contractors.id))
    .where(and(eq(payoutItems.batchId, batchId), eq(payoutItems.status, 'pending')));

  const rpcUrl = process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';
  const treasuryKey = process.env.SOLANA_TREASURY_SECRET_KEY ?? '';
  const usdcMint = process.env.SOLANA_USDC_MINT ?? 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr';

  let succeeded = 0;
  let failed = 0;

  for (const { item, contractor } of items) {
    // Mark item processing
    await db.update(payoutItems).set({ status: 'processing' }).where(eq(payoutItems.id, item.id));

    try {
      const result = await transferUsdc({
        rpcUrl,
        treasurySecretKey: treasuryKey,
        usdcMint,
        recipientWallet: contractor.walletAddress,
        amountMinor: item.amountMinor,
      });

      await db.update(payoutItems).set({
        status: 'succeeded',
        txSignature: result.signature,
        executedAt: new Date(),
        confirmedAt: new Date(),
      }).where(eq(payoutItems.id, item.id));

      // Ledger: payout_debit
      await db.insert(ledgerEntries).values({
        tenantId: batch.tenantId,
        type: 'payout_debit',
        amountMinor: -item.amountMinor,
        referenceId: item.id,
        referenceType: 'payout_item',
      });

      succeeded++;
    } catch (err) {
      await db.update(payoutItems).set({
        status: 'failed',
        errorMessage: String(err),
        executedAt: new Date(),
      }).where(eq(payoutItems.id, item.id));
      failed++;
    }
  }

  // Finalize batch status
  const totalItems = items.length;
  const finalStatus = failed === 0 ? 'completed' : succeeded === 0 ? 'failed' : 'partial';

  await db.update(payoutBatches).set({ status: finalStatus, updatedAt: new Date() })
    .where(eq(payoutBatches.id, batchId));

  // Release reserved balance: move remaining reserved → reduce by succeeded amount
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, batch.tenantId));
  if (tenant) {
    const successAmountMinor = items
      .filter((x) => x.item.status !== 'failed')
      .reduce((s, x) => s + x.item.amountMinor, 0);
    const disbursedThisRun = succeeded > 0
      ? items.filter((_, i) => i < succeeded).reduce((s, x) => s + x.item.amountMinor, 0)
      : 0;

    // Calculate what was actually paid out vs failed
    const allItems = await db.select().from(payoutItems).where(eq(payoutItems.batchId, batchId));
    const actualDisbursed = allItems.filter((x) => x.status === 'succeeded').reduce((s, x) => s + x.amountMinor, 0);
    const failedAmount = allItems.filter((x) => x.status === 'failed').reduce((s, x) => s + x.amountMinor, 0);

    await db.update(tenants).set({
      reservedBalanceMinor: Math.max(0, tenant.reservedBalanceMinor - batch.totalAmountMinor),
      totalDisbursedMinor: tenant.totalDisbursedMinor + actualDisbursed,
      // Return failed amounts back to available
      availableBalanceMinor: tenant.availableBalanceMinor + failedAmount,
      updatedAt: new Date(),
    }).where(eq(tenants.id, tenant.id));

    if (failedAmount > 0) {
      await db.insert(ledgerEntries).values({
        tenantId: tenant.id,
        type: 'reserve_release',
        amountMinor: failedAmount,
        referenceId: batchId,
        referenceType: 'payout_batch',
      });
    }
  }

  return NextResponse.json({ status: finalStatus, succeeded, failed, total: totalItems });
}
