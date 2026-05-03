'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { DollarSign, Zap, CheckCircle, Clock, XCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from '@/components/layout/Toaster';
import { formatUsd, formatDate } from '@/lib/utils';

const DEMO_TENANT_ID = 'f582c4cf-2f41-48e9-a795-d2f263f6baf1';

const TIERS = [
  { id: 'tier_50', label: '$50', subLabel: 'Quick Top-Up', amountMinor: 5000, popular: false },
  { id: 'tier_100', label: '$100', subLabel: 'Standard', amountMinor: 10000, popular: true },
  { id: 'tier_250', label: '$250', subLabel: 'Growth', amountMinor: 25000, popular: false },
  { id: 'tier_500', label: '$500', subLabel: 'Enterprise', amountMinor: 50000, popular: false },
];

interface Intent {
  id: string;
  tierLabel: string;
  amountMinor: number;
  status: string;
  createdAt: string | Date;
}

interface Props {
  intents: Intent[];
}

export default function FundingPageClient({ intents }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [isSubscription, setIsSubscription] = useState(false);

  async function handleFund(tierId: string) {
    setLoading(tierId);
    try {
      const res = await fetch('/api/funding/checkout-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: DEMO_TENANT_ID, tier: tierId, isSubscription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      window.location.href = data.checkout_url;
    } catch (err) {
      toast(String(err), 'error');
      setLoading(null);
    }
  }

  function StatusIcon({ status }: { status: string }) {
    if (status === 'succeeded') return <CheckCircle size={14} color="#34d399" />;
    if (status === 'failed' || status === 'cancelled') return <XCircle size={14} color="#f87171" />;
    return <Clock size={14} color="#fbbf24" />;
  }

  function badgeClass(status: string) {
    if (status === 'succeeded') return 'badge badge-success';
    if (status === 'failed' || status === 'cancelled') return 'badge badge-danger';
    if (status === 'processing') return 'badge badge-warning';
    return 'badge badge-info';
  }

  return (
    <div style={{ padding: '40px', maxWidth: 900 }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            Add Funds
          </h1>
          <p style={{ color: '#64748b', marginTop: 6, fontSize: '0.875rem' }}>
            Fund your treasury via Dodo Payments — USDC-equivalent balance confirmed after webhook
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', padding: '10px 16px', borderRadius: 99 }}>
          <span style={{ fontSize: '0.875rem', color: isSubscription ? '#f8fafc' : '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} color={isSubscription ? '#6366f1' : '#64748b'} />
            Monthly Auto-Fund
          </span>
          <button
            onClick={() => setIsSubscription(!isSubscription)}
            style={{
              width: 44, height: 24, borderRadius: 24, padding: 2, cursor: 'pointer',
              background: isSubscription ? '#6366f1' : '#334155', border: 'none',
              transition: 'background 0.2s', position: 'relative'
            }}
          >
            <motion.div
              initial={false}
              animate={{ x: isSubscription ? 20 : 0 }}
              style={{ width: 20, height: 20, background: 'white', borderRadius: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
            />
          </button>
        </div>
      </motion.div>

      {/* Tier Cards */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 32 }}
      >
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            className="glass-card"
            style={{
              padding: 24,
              textAlign: 'center',
              position: 'relative',
              border: tier.popular ? '1px solid rgba(99,102,241,0.4)' : undefined,
              cursor: 'pointer',
            }}
          >
            {tier.popular && (
              <div style={{
                position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                background: '#6366f1', color: 'white', fontSize: '0.65rem', fontWeight: 700,
                padding: '2px 10px', borderRadius: 999, letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                Popular
              </div>
            )}
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '2rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              {tier.label}
              {isSubscription && <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 400 }}>/mo</span>}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 20, marginTop: 4 }}>
              {isSubscription ? 'Billed Monthly' : tier.subLabel}
            </div>
            <button
              id={`fund-${tier.id}`}
              onClick={() => handleFund(tier.id)}
              disabled={!!loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}
            >
              {loading === tier.id ? (
                <><span className="shimmer" style={{ width: 60, height: 14, borderRadius: 4, display: 'inline-block' }} /></>
              ) : (
                <><Zap size={13} /> Fund {tier.label}</>
              )}
            </button>
          </div>
        ))}
      </motion.div>

      {/* Payment History */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="glass-card" style={{ marginTop: 40, padding: 24 }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8', margin: '0 0 20px' }}>Payment History</h2>
        {intents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#334155' }}>
            No funding history yet
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {intents.map((intent) => (
                <tr key={intent.id}>
                  <td style={{ color: '#e2e8f0' }}>{intent.tierLabel}</td>
                  <td style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc', fontWeight: 600 }}>
                    {formatUsd(intent.amountMinor)}
                  </td>
                  <td>
                    <span className={badgeClass(intent.status)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <StatusIcon status={intent.status} />
                      {intent.status}
                    </span>
                  </td>
                  <td>{formatDate(intent.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
}
