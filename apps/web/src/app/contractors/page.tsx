'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Upload, Search, Users, X, Check } from 'lucide-react';
import { toast } from '@/components/layout/Toaster';
import { shortenAddress } from '@/lib/utils';

const DEMO_TENANT_ID = process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? '';

interface Contractor {
  id: string;
  name: string;
  email: string;
  walletAddress: string;
  status: string;
  createdAt: string;
}

function statusClass(s: string) {
  if (s === 'active') return 'badge badge-success';
  if (s === 'inactive') return 'badge badge-muted';
  return 'badge badge-warning';
}

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState(true);

  // Add form state
  const [form, setForm] = useState({ name: '', email: '', walletAddress: '' });
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const res = await fetch(`/api/contractors?tenantId=${DEMO_TENANT_ID}`);
      const data = await res.json();
      if (Array.isArray(data)) setContractors(data);
      else setContractors([]);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/contractors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tenantId: DEMO_TENANT_ID }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
      toast('Contractor added!', 'success');
      setShowAdd(false);
      setForm({ name: '', email: '', walletAddress: '' });
      load();
    } catch (err) {
      toast(String(err), 'error');
    }
    setSubmitting(false);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('tenantId', DEMO_TENANT_ID);
    fd.append('file', file);
    try {
      const res = await fetch('/api/contractors/import', { method: 'POST', body: fd });
      const data = await res.json();
      toast(`Imported ${data.imported} contractors${data.failed?.length ? ` (${data.failed.length} failed)` : ''}`, data.failed?.length ? 'info' : 'success');
      setShowImport(false);
      load();
    } catch (err) {
      toast(String(err), 'error');
    }
  }

  const filtered = contractors.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 40, maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Contractors</h1>
          <p style={{ color: '#64748b', marginTop: 6, fontSize: '0.875rem' }}>{contractors.length} registered · Solana wallet addresses</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button id="import-contractors-btn" onClick={() => setShowImport(true)} className="btn btn-ghost">
            <Upload size={14} /> Import CSV
          </button>
          <button id="add-contractor-btn" onClick={() => setShowAdd(true)} className="btn btn-primary">
            <Plus size={14} /> Add Contractor
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <Search size={15} color="#475569" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          className="input"
          style={{ paddingLeft: 40 }}
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#334155' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Users size={32} color="#1e293b" style={{ marginBottom: 12 }} />
            <p style={{ color: '#334155', margin: 0 }}>No contractors found</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr>
              <th>Name</th><th>Email</th><th>Wallet</th><th>Status</th>
            </tr></thead>
            <tbody>
              {filtered.map((c) => (
                <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td style={{ color: '#e2e8f0', fontWeight: 500 }}>{c.name}</td>
                  <td>{c.email}</td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#6366f1' }}>
                      {shortenAddress(c.walletAddress)}
                    </span>
                  </td>
                  <td><span className={statusClass(c.status)}>{c.status}</span></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card" style={{ padding: 32, width: 440 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Add Contractor</h2>
                <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={18} color="#64748b" />
                </button>
              </div>
              <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 6 }}>Name</label>
                  <input id="contractor-name" className="input" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 6 }}>Email</label>
                  <input id="contractor-email" className="input" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 6 }}>Solana Wallet Address</label>
                  <input id="contractor-wallet" className="input" required value={form.walletAddress} onChange={(e) => setForm((f) => ({ ...f, walletAddress: e.target.value }))} placeholder="Base58 public key…" />
                </div>
                <button id="submit-add-contractor" type="submit" disabled={submitting} className="btn btn-primary" style={{ marginTop: 8 }}>
                  {submitting ? 'Adding…' : <><Check size={14} /> Add Contractor</>}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {showImport && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowImport(false); }}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card" style={{ padding: 32, width: 440 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Import CSV</h2>
                <button onClick={() => setShowImport(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={18} color="#64748b" />
                </button>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 8 }}>
                Required columns: <code style={{ color: '#818cf8' }}>name, email, wallet_address</code>
              </p>
              <label
                style={{
                  display: 'block', border: '2px dashed rgba(99,102,241,0.3)', borderRadius: 10,
                  padding: '32px', textAlign: 'center', cursor: 'pointer',
                  color: '#475569', fontSize: '0.875rem',
                }}
              >
                <Upload size={24} color="#6366f1" style={{ marginBottom: 8 }} />
                <br />Click to select CSV file
                <input id="csv-upload" type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
              </label>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
