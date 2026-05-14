'use client';

import { useState } from 'react';
import { formatUsd, formatDate } from '@/lib/utils';

interface Batch {
  id: string;
  label: string;
  status: string;
  recipientCount: number;
  totalAmountMinor: number;
  createdAt: string | Date;
}

export default function RecentBatches({ batches }: { batches: Batch[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? batches : batches.slice(0, 10);

  if (batches.length === 0) {
    return <div style={{ textAlign: 'center', padding: '32px 0', color: '#334155' }}>No batches found</div>;
  }

  return (
    <div className="glass-card" style={{ padding: 24, marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8', margin: 0 }}>Recent Payout Batches</h2>
        {batches.length > 10 && (
          <button 
            onClick={() => setShowAll(!showAll)} 
            style={{ background: 'transparent', border: 'none', color: '#6366f1', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
          >
            {showAll ? 'Show Less' : 'View All'}
          </button>
        )}
      </div>
      
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
          {displayed.map((b) => (
            <tr key={b.id}>
              <td style={{ color: '#e2e8f0' }}>{b.label}</td>
              <td>
                <span className={`badge ${b.status === 'completed' || b.status === 'succeeded' ? 'badge-success' : b.status === 'failed' ? 'badge-danger' : 'badge-warning'}`}>
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
      {!showAll && batches.length > 10 && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0 }}>Showing 10 of {batches.length} batches</p>
        </div>
      )}
    </div>
  );
}
