'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Send, DollarSign } from 'lucide-react';
import { toast } from '@/components/layout/Toaster';
import { formatUsd, shortenAddress } from '@/lib/utils';

const DEMO_TENANT_ID = 'f582c4cf-2f41-48e9-a795-d2f263f6baf1';

interface Contractor { id: string; name: string; email: string; walletAddress: string; }

export default function NewBatchPage() {
  const router = useRouter();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<Array<{ contractorId: string; amountMinor: number }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/contractors?tenantId=${DEMO_TENANT_ID}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setContractors(data);
        else setContractors([]);
      })
      .catch(() => setContractors([]));
  }, []);

  function addItem(contractorId: string) {
    if (items.some((i) => i.contractorId === contractorId)) return;
    setItems((prev) => [...prev, { contractorId, amountMinor: 0 }]);
  }

  function removeItem(contractorId: string) {
    setItems((prev) => prev.filter((i) => i.contractorId !== contractorId));
  }

  function updateAmount(contractorId: string, usdStr: string) {
    const minor = Math.round((parseFloat(usdStr) || 0) * 100);
    setItems((prev) => prev.map((i) => i.contractorId === contractorId ? { ...i, amountMinor: minor } : i));
  }

  const total = items.reduce((s, i) => s + i.amountMinor, 0);

  async function handleCreate() {
    if (!label) return toast('Batch label required', 'error');
    if (items.length === 0) return toast('Add at least one contractor', 'error');
    if (items.some((i) => i.amountMinor <= 0)) return toast('All amounts must be > $0', 'error');
    setLoading(true);
    try {
      const batchRes = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: DEMO_TENANT_ID, label, note }),
      });
      const batch = await batchRes.json();
      if (!batchRes.ok) throw new Error(batch.error ?? 'Failed');
      await fetch(`/api/batches/${batch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      toast('Batch created!', 'success');
      router.push(`/batches/${batch.id}`);
    } catch (err) {
      toast(String(err), 'error');
      setLoading(false);
    }
  }

  const unselected = contractors.filter((c) => !items.some((i) => i.contractorId === c.id));

  return (
    <div style={{ padding: 40, maxWidth: 900 }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>New Payout Batch</h1>
        <p style={{ color: '#64748b', marginTop: 6, fontSize: '0.875rem' }}>Select contractors and amounts — funds reserved on approval</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, marginTop: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 6 }}>Batch Label *</label>
              <input id="batch-label" className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="May 2026 Payout" />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 6 }}>Note</label>
              <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional reference…" />
            </div>
          </div>

          <div className="glass-card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8', margin: '0 0 16px' }}>Recipients ({items.length})</h2>
            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#334155', fontSize: '0.875rem' }}>Add contractors →</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map((item) => {
                  const c = contractors.find((x) => x.id === item.contractorId);
                  return (
                    <div key={item.contractorId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.875rem', color: '#e2e8f0', fontWeight: 500 }}>{c?.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace' }}>{shortenAddress(c?.walletAddress ?? '')}</div>
                      </div>
                      <span style={{ color: '#64748b' }}>$</span>
                      <input
                        style={{ width: 80, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 8px', color: '#f8fafc', fontSize: '0.875rem', outline: 'none', textAlign: 'right' }}
                        type="number" min="0" step="0.01"
                        defaultValue={(item.amountMinor / 100).toFixed(2)}
                        onChange={(e) => updateAmount(item.contractorId, e.target.value)}
                      />
                      <button onClick={() => removeItem(item.contractorId)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                        <Trash2 size={14} color="#f87171" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc', margin: '4px 0 4px' }}>{formatUsd(total)}</div>
            <div style={{ fontSize: '0.72rem', color: '#475569', marginBottom: 20 }}>{items.length} recipients</div>
            <button id="create-batch-btn" onClick={handleCreate} disabled={loading || !label || items.length === 0} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Creating…' : <><Send size={14} /> Create Batch</>}
            </button>
          </div>

          <div className="glass-card" style={{ padding: 20, maxHeight: 380, overflowY: 'auto' }}>
            <h2 style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Add Contractors</h2>
            {unselected.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: '#334155', textAlign: 'center', padding: '16px 0' }}>All added</div>
            ) : (
              unselected.map((c) => (
                <button key={c.id} onClick={() => addItem(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', textAlign: 'left' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={13} color="#818cf8" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#475569' }}>{c.email}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
