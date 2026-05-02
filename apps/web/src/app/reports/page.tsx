'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Download, BarChart3 } from 'lucide-react';

const DEMO_TENANT_ID = process.env.NEXT_PUBLIC_DEMO_TENANT_ID || 'f582c4cf-2f41-48e9-a795-d2f263f6baf1';

export default function ReportsPage() {
  const [downloading, setDownloading] = useState(false);

  async function handleExport() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/reports/payouts?tenantId=${DEMO_TENANT_ID}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payouts-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
    setDownloading(false);
  }

  return (
    <div style={{ padding: 40, maxWidth: 900 }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Reports</h1>
            <p style={{ color: '#64748b', marginTop: 6, fontSize: '0.875rem' }}>Reconciliation export for all payout batches</p>
          </div>
          <button id="export-csv-btn" onClick={handleExport} disabled={downloading} className="btn btn-primary">
            <Download size={14} /> {downloading ? 'Exporting…' : 'Export Payouts CSV'}
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
        <BarChart3 size={40} color="#334155" style={{ marginBottom: 16 }} />
        <div style={{ color: '#475569', fontSize: '0.875rem', marginBottom: 8 }}>
          Export a full reconciliation CSV with batch IDs, contractor details, amounts, TX signatures, and status.
        </div>
        <div style={{ fontSize: '0.75rem', color: '#334155' }}>
          Columns: Batch ID · Batch Label · Contractor · Email · Wallet · Amount (USDC) · Status · TX Signature · Executed At
        </div>
      </motion.div>
    </div>
  );
}
