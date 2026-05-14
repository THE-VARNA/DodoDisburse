import { db } from '@/lib/db';
import { payoutBatches } from '@gcp/db';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import BatchesList from './BatchesList';

const DEMO_TENANT_ID = 'f582c4cf-2f41-48e9-a795-d2f263f6baf1';

export const dynamic = 'force-dynamic';

export default async function BatchesPage() {
  const batches = await db
    .select()
    .from(payoutBatches)
    .where(eq(payoutBatches.tenantId, DEMO_TENANT_ID))
    .orderBy(desc(payoutBatches.createdAt));

  return (
    <div style={{ padding: 40, maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Payout Batches</h1>
          <p style={{ color: '#64748b', marginTop: 6, fontSize: '0.875rem' }}>Manage and execute mass payouts to contractors</p>
        </div>
        <Link href="/batches/new" className="btn btn-primary">
          <Plus size={14} /> New Batch
        </Link>
      </div>

      <BatchesList batches={batches as any} />
    </div>
  );
}
