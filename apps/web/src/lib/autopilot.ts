import { db } from '@/lib/db';
import { payoutItems, payoutBatches, contractors, ledgerEntries } from '@gcp/db';
import { eq, and } from 'drizzle-orm';
import { transferUsdc } from '@gcp/solana';

export async function triggerAutoPilot(tenantId: string) {
  try {
    console.log(`[AutoPilot] Triggered for tenant ${tenantId}`);
    
    // Find all failed payout items for this tenant
    // (Join with contractors to get wallet address)
    const items = await db
      .select({
        item: payoutItems,
        batch: payoutBatches,
        contractor: contractors,
      })
      .from(payoutItems)
      .innerJoin(payoutBatches, eq(payoutBatches.id, payoutItems.batchId))
      .innerJoin(contractors, eq(contractors.id, payoutItems.contractorId))
      .where(and(
        eq(payoutBatches.tenantId, tenantId),
        eq(payoutItems.status, 'failed')
      ));

    if (items.length === 0) {
      console.log('[AutoPilot] No failed payouts to retry.');
      return;
    }

    console.log(`[AutoPilot] Found ${items.length} failed payouts. Executing...`);

    const rpcUrl = process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';
    const treasuryKey = process.env.SOLANA_TREASURY_SECRET_KEY ?? '';
    const usdcMint = 'DUgtqBhTfsxuPULLtabnU5PKjmEDPipJZbxQHjmtmUkG'; // Force Mock USDC

    for (const { item, batch, contractor } of items) {
      console.log(`[AutoPilot] Retrying payout ${item.id} to ${contractor.walletAddress}...`);
      
      try {
        await db.update(payoutItems).set({ status: 'processing' }).where(eq(payoutItems.id, item.id));

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
          errorMessage: null,
        }).where(eq(payoutItems.id, item.id));

        await db.insert(ledgerEntries).values({
          tenantId: batch.tenantId,
          type: 'payout_debit',
          amountMinor: -item.amountMinor,
          referenceId: item.id,
          referenceType: 'payout_item',
        });
        
        console.log(`[AutoPilot] Payout ${item.id} succeeded: ${result.signature}`);
      } catch (err) {
        console.error(`[AutoPilot] Payout ${item.id} failed again:`, err);
        await db.update(payoutItems).set({
          status: 'failed',
          errorMessage: String(err),
        }).where(eq(payoutItems.id, item.id));
      }
    }
  } catch (error) {
    console.error('[AutoPilot] Fatal error:', error);
  }
}
