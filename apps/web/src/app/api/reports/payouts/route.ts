import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payoutItems, payoutBatches, contractors } from '@gcp/db';
import { eq } from 'drizzle-orm';
import { formatUsd } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 });

  const rows = await db
    .select({
      item: payoutItems,
      batch: payoutBatches,
      contractor: contractors,
    })
    .from(payoutItems)
    .innerJoin(payoutBatches, eq(payoutItems.batchId, payoutBatches.id))
    .innerJoin(contractors, eq(payoutItems.contractorId, contractors.id))
    .where(eq(payoutBatches.tenantId, tenantId));

  // CSV response
  const csvLines = [
    'Batch ID,Batch Label,Contractor,Email,Wallet,Amount (USD),Status,TX Signature,Executed At',
    ...rows.map((r) =>
      [
        r.batch.id,
        `"${r.batch.label}"`,
        `"${r.contractor.name}"`,
        r.contractor.email,
        r.contractor.walletAddress,
        (r.item.amountMinor / 1_000_000).toFixed(2),
        r.item.status,
        r.item.txSignature ?? '',
        r.item.executedAt?.toISOString() ?? '',
      ].join(',')
    ),
  ].join('\n');

  return new NextResponse(csvLines, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="payouts.csv"',
    },
  });
}
