import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payoutItems, payoutBatches, tenants, contractors, ledgerEntries } from '@gcp/db';
import { eq } from 'drizzle-orm';
import { transferUsdc } from '@gcp/solana';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const [item] = await db.select().from(payoutItems).where(eq(payoutItems.id, itemId));
  if (!item) return NextResponse.json({ error: 'Payout item not found' }, { status: 404 });
  if (item.status !== 'failed') {
    return NextResponse.json({ error: 'Can only retry failed items' }, { status: 409 });
  }

  const [batch] = await db.select().from(payoutBatches).where(eq(payoutBatches.id, item.batchId));
  const [contractor] = await db.select().from(contractors).where(eq(contractors.id, item.contractorId));
  if (!batch || !contractor) return NextResponse.json({ error: 'Related records not found' }, { status: 404 });

  await db.update(payoutItems).set({ status: 'processing' }).where(eq(payoutItems.id, itemId));

  try {
    const result = await transferUsdc({
      rpcUrl: process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com',
      treasurySecretKey: process.env.SOLANA_TREASURY_SECRET_KEY ?? '',
      usdcMint: process.env.SOLANA_USDC_MINT ?? 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr',
      recipientWallet: contractor.walletAddress,
      amountMinor: item.amountMinor,
    });

    await db.update(payoutItems).set({
      status: 'succeeded',
      txSignature: result.signature,
      executedAt: new Date(),
      confirmedAt: new Date(),
      errorMessage: null,
    }).where(eq(payoutItems.id, itemId));

    await db.insert(ledgerEntries).values({
      tenantId: batch.tenantId,
      type: 'payout_debit',
      amountMinor: -item.amountMinor,
      referenceId: item.id,
      referenceType: 'payout_item',
    });

    return NextResponse.json({ status: 'succeeded', signature: result.signature });
  } catch (err) {
    await db.update(payoutItems).set({
      status: 'failed',
      errorMessage: String(err),
    }).where(eq(payoutItems.id, itemId));
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
