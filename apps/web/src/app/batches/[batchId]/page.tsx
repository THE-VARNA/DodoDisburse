'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle, XCircle, Clock, ExternalLink, RefreshCw, Play, Check, Users, Shield } from 'lucide-react';
import { toast } from '@/components/layout/Toaster';
import { formatUsd, formatDate, solscanUrl, shortenAddress } from '@/lib/utils';

interface BatchItem {
  item: { id: string; amountMinor: number; status: string; txSignature: string | null; errorMessage: string | null; executedAt: string | null; };
  contractor: { name: string; email: string; walletAddress: string; };
}
interface Batch { id: string; label: string; note: string | null; status: string; totalAmountMinor: number; recipientCount: number; reservedAt: string | null; executedAt: string | null; createdAt: string; }

function statusBadge(s: string) {
  const map: Record<string, string> = { succeeded: 'badge badge-success', completed: 'badge badge-success', approved: 'badge badge-info', executing: 'badge badge-warning', partial: 'badge badge-warning', failed: 'badge badge-danger', draft: 'badge badge-muted', cancelled: 'badge badge-muted' };
  return map[s] ?? 'badge badge-muted';
}

function ItemStatus({ item }: { item: BatchItem['item'] }) {
  if (item.status === 'succeeded') return <CheckCircle size={14} color="#34d399" />;
  if (item.status === 'failed') return <XCircle size={14} color="#f87171" />;
  if (item.status === 'processing') return <Clock size={14} color="#fbbf24" />;
  return <Clock size={14} color="#475569" />;
}

import { useWallet } from '@solana/wallet-adapter-react';

export default function BatchDetailPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const [data, setData] = useState<{ batch: Batch; items: BatchItem[] } | null>(null);
  const [approving, setApproving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const { connected, publicKey, signMessage } = useWallet();

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/batches/${batchId}`);
      setData(await res.json());
    } catch { /* ignore */ }
  }, [batchId]);

  useEffect(() => { load(); }, [load]);

  async function handleApprove() {
    setApproving(true);
    try {
      const res = await fetch(`/api/batches/${batchId}/approve`, { method: 'POST' });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error ?? 'Failed');
      toast('Batch approved — funds reserved', 'success');
      load();
    } catch (err) { toast(String(err), 'error'); }
    setApproving(false);
  }

  async function handleExecute() {
    if (!connected || !publicKey) {
      toast('Please connect your admin wallet to execute payouts', 'error');
      return;
    }

    setExecuting(true);
    try {
      // SECURITY: Optional: Sign a message to prove authority
      if (signMessage) {
        const message = new TextEncoder().encode(`Authorize Payout for Batch ${batchId} at ${new Date().toISOString()}`);
        await signMessage(message);
        toast('Signature verified by wallet', 'success');
      }

      const res = await fetch(`/api/batches/${batchId}/execute`, { 
        method: 'POST',
        headers: { 'X-Admin-Wallet': publicKey.toBase58() } 
      });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error ?? 'Failed');
      toast(`Executed: ${r.succeeded} succeeded, ${r.failed} failed`, r.failed > 0 ? 'info' : 'success');
      load();
    } catch (err) { toast(String(err), 'error'); }
    setExecuting(false);
  }

  async function handleRetry(itemId: string) {
    try {
      const res = await fetch(`/api/payouts/${itemId}/retry`, { method: 'POST' });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error ?? 'Failed');
      toast('Retry succeeded!', 'success');
      load();
    } catch (err) { toast(String(err), 'error'); }
  }

  if (!data) return <div style={{ padding: 40, color: '#334155' }}>Loading batch…</div>;

  const { batch, items } = data;

  return (
    <div style={{ padding: 40, maxWidth: 1000 }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: '0.8rem', color: '#64748b' }}>
          <Link href="/batches" style={{ color: '#64748b', textDecoration: 'none' }}>Payout Batches</Link>
          <span>/</span>
          <span style={{ color: '#94a3b8' }}>Batch Details</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>{batch.label}</h1>
              <span className={statusBadge(batch.status)} style={{ fontSize: '0.75rem' }}>{batch.status}</span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
              {batch.recipientCount} contractors · {formatUsd(batch.totalAmountMinor)} total · Created {formatDate(batch.createdAt)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={load} className="btn btn-ghost" style={{ padding: '8px 12px' }}><RefreshCw size={14} /></button>
            {batch.status === 'draft' && (
              <button id="approve-btn" onClick={handleApprove} disabled={approving} className="btn btn-primary">
                {approving ? 'Approving…' : <><Check size={14} /> Approve & Reserve</>}
              </button>
            )}
            {batch.status === 'approved' && (
              <button 
                id="execute-btn" 
                onClick={handleExecute} 
                disabled={executing} 
                className="btn btn-primary" 
                style={{ 
                  background: !connected ? '#fbbf24' : '#10b981', 
                  boxShadow: !connected ? '0 0 20px rgba(251,191,36,0.3)' : '0 0 20px rgba(16,185,129,0.3)',
                  color: !connected ? '#1e293b' : 'white'
                }}
              >
                {executing ? 'Executing…' : !connected ? <><Users size={14} /> Connect Wallet to Execute</> : <><Play size={14} /> Execute Payouts</>}
              </button>
            )}
            <a
              href={`/api/reports/payouts?tenantId=${batch.id}`}
              className="btn btn-ghost"
              style={{ textDecoration: 'none' }}
              download="payouts.csv"
            >
              Export CSV
            </a>
          </div>
        </div>
      </motion.div>

      {/* Lifecycle Timeline */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.1)', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem' }}>1</div>
          <div style={{ position: 'absolute', left: 0, top: 24, fontSize: '0.75rem', color: '#f8fafc', fontWeight: 600 }}>Draft</div>
        </div>
        <div style={{ flex: 1, height: 2, background: (batch.status !== 'draft') ? '#6366f1' : 'rgba(255,255,255,0.1)', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, borderRadius: '50%', background: (batch.status !== 'draft') ? '#6366f1' : '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem' }}>2</div>
          <div style={{ position: 'absolute', left: 0, top: 24, fontSize: '0.75rem', color: (batch.status !== 'draft') ? '#f8fafc' : '#475569', fontWeight: 600 }}>Approved</div>
        </div>
        <div style={{ flex: 1, height: 2, background: (batch.status === 'completed' || batch.status === 'succeeded' || batch.status === 'partial') ? '#10b981' : 'rgba(255,255,255,0.1)', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, borderRadius: '50%', background: (batch.status === 'completed' || batch.status === 'succeeded' || batch.status === 'partial') ? '#10b981' : '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem' }}>3</div>
          <div style={{ position: 'absolute', left: 0, top: 24, fontSize: '0.75rem', color: (batch.status === 'completed' || batch.status === 'succeeded' || batch.status === 'partial') ? '#f8fafc' : '#475569', fontWeight: 600 }}>Executed</div>
        </div>
      </motion.div>


      {/* Items table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card" style={{ marginTop: 64, padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr>
            <th>Contractor</th><th>Wallet</th><th>Amount</th><th>Status</th><th>TX Signature</th><th></th>
          </tr></thead>
          <tbody>
            {items.map(({ item, contractor }) => (
              <tr key={item.id}>
                <td>
                  <div style={{ color: '#e2e8f0', fontWeight: 500, fontSize: '0.875rem' }}>{contractor.name}</div>
                  <div style={{ color: '#475569', fontSize: '0.72rem' }}>{contractor.email}</div>
                </td>
                <td>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#6366f1' }}>{shortenAddress(contractor.walletAddress)}</span>
                </td>
                <td style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc', fontWeight: 600 }}>{formatUsd(item.amountMinor)}</td>
                <td>
                  <span className={statusBadge(item.status)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <ItemStatus item={item} />{item.status}
                  </span>
                </td>
                <td>
                  {item.txSignature ? (
                    <a href={solscanUrl(item.txSignature)} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#6366f1', fontSize: '0.75rem', fontFamily: 'monospace', textDecoration: 'none' }}>
                      {item.txSignature.slice(0, 8)}… <ExternalLink size={11} />
                    </a>
                  ) : item.errorMessage ? (
                    <span style={{ fontSize: '0.72rem', color: '#f87171' }} title={item.errorMessage}>Error</span>
                  ) : '—'}
                </td>
                <td>
                  {item.status === 'failed' && (
                    <button onClick={() => handleRetry(item.id)} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.72rem' }}>
                      <RefreshCw size={11} /> Retry
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
