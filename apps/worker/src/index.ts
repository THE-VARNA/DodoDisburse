import { db } from '@gcp/db';
import { payoutBatches, payoutItems, contractors, tenants, ledgerEntries } from '@gcp/db';
import { eq, and } from 'drizzle-orm';
import { transferUsdc } from '@gcp/solana';
import { env } from '@gcp/config';

async function processPendingBatches() {
  console.log(`[${new Date().toISOString()}] Worker starting payout processing run...`);

  const batches = await db.select().from(payoutBatches).where(eq(payoutBatches.status, 'executing'));

  if (batches.length === 0) {
    console.log('No batches currently executing.');
    return;
  }

  for (const batch of batches) {
    console.log(`Processing batch ${batch.id}...`);

    const items = await db
      .select({ item: payoutItems, contractor: contractors })
      .from(payoutItems)
      .innerJoin(contractors, eq(payoutItems.contractorId, contractors.id))
      .where(and(eq(payoutItems.batchId, batch.id), eq(payoutItems.status, 'pending')));

    if (items.length === 0) {
      console.log(`No pending items in batch ${batch.id}. Skipping.`);
      continue;
    }

    let succeeded = 0;
    let failed = 0;

    for (const { item, contractor } of items) {
      await db.update(payoutItems).set({ status: 'processing' }).where(eq(payoutItems.id, item.id));

      try {
        const result = await transferUsdc({
          rpcUrl: env.SOLANA_RPC_URL,
          treasurySecretKey: env.SOLANA_TREASURY_SECRET_KEY,
          usdcMint: env.SOLANA_USDC_MINT,
          recipientWallet: contractor.walletAddress,
          amountMinor: item.amountMinor,
        });

        await db.update(payoutItems).set({
          status: 'succeeded',
          txSignature: result.signature,
          executedAt: new Date(),
          confirmedAt: new Date(),
        }).where(eq(payoutItems.id, item.id));

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

    console.log(`Batch ${batch.id} run completed. Succeeded: ${succeeded}, Failed: ${failed}`);
    
    // We leave finalizing the batch status and tenant balance reconciliation to the API route 
    // or a separate worker step, since this worker might only process a subset of items.
  }
}

// Run once for the demo/worker execution test
processPendingBatches().then(() => {
  console.log('Worker execution finished.');
  process.exit(0);
}).catch(err => {
  console.error('Worker failed:', err);
  process.exit(1);
});
