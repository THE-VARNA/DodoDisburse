import { db } from '@/lib/db';
import { payoutBatches } from '@gcp/db';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { Plus, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatUsd, formatDate } from '@/lib/utils';

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

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {batches.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <Send size={40} color="#1e293b" style={{ marginBottom: 16 }} />
            <p style={{ color: '#475569', margin: 0 }}>No payout batches created yet.</p>
            <Link href="/batches/new" style={{ color: '#6366f1', fontSize: '0.875rem', marginTop: 12, display: 'inline-block' }}>
              Create your first batch →
            </Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Batch Name</th>
                <th>Status</th>
                <th>Recipients</th>
                <th>Total Amount</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id}>
                  <td style={{ color: '#f8fafc', fontWeight: 600 }}>{b.label}</td>
                  <td>
                    <span className={`badge ${b.status === 'completed' ? 'badge-success' : b.status === 'failed' ? 'badge-danger' : b.status === 'approved' ? 'badge-info' : 'badge-warning'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td>{b.recipientCount} recipients</td>
                  <td style={{ fontWeight: 600, color: '#f8fafc' }}>{formatUsd(b.totalAmountMinor)}</td>
                  <td>{formatDate(b.createdAt)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/batches/${b.id}`} style={{ color: '#6366f1', fontSize: '0.875rem', textDecoration: 'none' }}>
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
