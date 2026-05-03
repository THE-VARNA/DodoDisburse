import { db } from '@/lib/db';
import { payoutBatches, ledgerEntries, tenants } from '@gcp/db';
import { eq, desc, sql } from 'drizzle-orm';
import { Download, BarChart3, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { formatUsd, formatDate } from '@/lib/utils';

const DEMO_TENANT_ID = 'f582c4cf-2f41-48e9-a795-d2f263f6baf1';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, DEMO_TENANT_ID));
  const batches = await db
    .select()
    .from(payoutBatches)
    .where(eq(payoutBatches.tenantId, DEMO_TENANT_ID))
    .orderBy(desc(payoutBatches.createdAt))
    .limit(10);

  const stats = await db
    .select({
      totalInbound: sql<number>`sum(case when type = 'fund_credit' then amount_minor else 0 end)`,
      totalOutbound: sql<number>`abs(sum(case when type = 'payout_debit' then amount_minor else 0 end))`,
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.tenantId, DEMO_TENANT_ID));

  const metrics = [
    { label: 'All-Time Inbound', value: formatUsd(stats[0]?.totalInbound ?? 0), icon: TrendingUp, color: '#10b981' },
    { label: 'All-Time Payouts', value: formatUsd(stats[0]?.totalOutbound ?? 0), icon: TrendingDown, color: '#f87171' },
    { label: 'Current Reserve', value: formatUsd(tenant?.reservedBalanceMinor ?? 0), icon: Clock, color: '#f59e0b' },
  ];

  return (
    <div style={{ padding: 40, maxWidth: 1000 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Reports</h1>
        <p style={{ color: '#64748b', marginTop: 6, fontSize: '0.875rem' }}>Financial reconciliation & batch history</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {metrics.map((m) => (
          <div key={m.label} className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>{m.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <m.icon size={16} color={m.color} />
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ padding: 24, marginBottom: 32 }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8', margin: '0 0 20px' }}>Recent Payout Batches</h2>
        {batches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#334155' }}>No batches found</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Batch Name</th>
                <th>Status</th>
                <th>Recipients</th>
                <th>Total Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id}>
                  <td style={{ color: '#e2e8f0' }}>{b.label}</td>
                  <td>
                    <span className={`badge ${b.status === 'completed' ? 'badge-success' : b.status === 'failed' ? 'badge-danger' : 'badge-warning'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td>{b.recipientCount}</td>
                  <td style={{ fontWeight: 600, color: '#f8fafc' }}>{formatUsd(b.totalAmountMinor)}</td>
                  <td>{formatDate(b.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="glass-card" style={{ padding: 32, textAlign: 'center', background: 'rgba(99,102,241,0.03)' }}>
        <BarChart3 size={32} color="#6366f1" style={{ marginBottom: 16 }} />
        <div style={{ color: '#cbd5e1', fontSize: '0.875rem', marginBottom: 12 }}>
          Generate a detailed reconciliation export for all transaction history.
        </div>
        <form action="/api/reports/payouts">
          <input type="hidden" name="tenantId" value={DEMO_TENANT_ID} />
          <button type="submit" className="btn btn-primary">
            <Download size={14} /> Export Reconciliation CSV
          </button>
        </form>
      </div>
    </div>
  );
}
