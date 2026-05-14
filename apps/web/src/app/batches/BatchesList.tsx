'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Send, Plus } from 'lucide-react';
import { formatUsd, formatDate } from '@/lib/utils';

interface Batch {
  id: string;
  label: string;
  status: string;
  recipientCount: number;
  totalAmountMinor: number;
  createdAt: string | Date;
}

export default function BatchesList({ batches }: { batches: Batch[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? batches : batches.slice(0, 10);

  if (batches.length === 0) {
    return (
      <div className="glass-card" style={{ padding: 64, textAlign: 'center' }}>
        <Send size={40} color="#1e293b" style={{ marginBottom: 16 }} />
        <p style={{ color: '#475569', margin: 0 }}>No payout batches created yet.</p>
        <Link href="/batches/new" style={{ color: '#6366f1', fontSize: '0.875rem', marginTop: 12, display: 'inline-block' }}>
          Create your first batch →
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
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
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {displayed.map((b) => (
            <tr key={b.id}>
              <td style={{ color: '#f8fafc', fontWeight: 600 }}>{b.label}</td>
              <td>
                <span className={`badge ${b.status === 'completed' || b.status === 'succeeded' ? 'badge-success' : b.status === 'failed' ? 'badge-danger' : b.status === 'approved' ? 'badge-info' : 'badge-warning'}`}>
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
      {!showAll && batches.length > 10 && (
        <div style={{ textAlign: 'center', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0 }}>Showing 10 of {batches.length} batches</p>
        </div>
      )}
    </div>
  );
}
