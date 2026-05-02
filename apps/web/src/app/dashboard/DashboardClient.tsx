'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { TrendingUp, Send, DollarSign, ArrowRight, Zap, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatUsd, formatDate } from '@/lib/utils';

interface Props {
  tenant: {
    name: string;
    availableBalanceMinor: number;
    reservedBalanceMinor: number;
    totalFundedMinor: number;
    totalDisbursedMinor: number;
  } | null;
  recentIntents: Array<{
    id: string;
    tierLabel: string;
    amountMinor: number;
    status: string;
    createdAt: Date;
  }>;
  recentBatches: Array<{
    id: string;
    label: string;
    totalAmountMinor: number;
    recipientCount: number;
    status: string;
    createdAt: Date;
  }>;
}

const stagger = { container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }, item: { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } } };

function StatusIcon({ status }: { status: string }) {
  if (status === 'succeeded' || status === 'completed') return <CheckCircle size={14} color="#34d399" />;
  if (status === 'failed') return <XCircle size={14} color="#f87171" />;
  if (status === 'processing' || status === 'executing') return <Clock size={14} color="#fbbf24" />;
  return <AlertCircle size={14} color="#818cf8" />;
}

function statusBadgeClass(status: string) {
  if (status === 'succeeded' || status === 'completed' || status === 'approved') return 'badge badge-success';
  if (status === 'failed') return 'badge badge-danger';
  if (status === 'processing' || status === 'executing') return 'badge badge-warning';
  return 'badge badge-info';
}

export function DashboardClient({ tenant, recentIntents, recentBatches }: Props) {
  const balanceCards = [
    {
      label: 'Available Balance',
      value: formatUsd(tenant?.availableBalanceMinor ?? 0),
      icon: DollarSign,
      color: '#10b981',
      glow: 'rgba(16,185,129,0.2)',
      sub: 'Ready to disburse',
    },
    {
      label: 'Reserved (In Batch)',
      value: formatUsd(tenant?.reservedBalanceMinor ?? 0),
      icon: Clock,
      color: '#f59e0b',
      glow: 'rgba(245,158,11,0.2)',
      sub: 'Locked for payouts',
    },
    {
      label: 'Total Funded',
      value: formatUsd(tenant?.totalFundedMinor ?? 0),
      icon: TrendingUp,
      color: '#6366f1',
      glow: 'rgba(99,102,241,0.2)',
      sub: 'All-time inbound',
    },
    {
      label: 'Total Disbursed',
      value: formatUsd(tenant?.totalDisbursedMinor ?? 0),
      icon: Send,
      color: '#8b5cf6',
      glow: 'rgba(139,92,246,0.2)',
      sub: 'On-chain payments sent',
    },
  ];

  return (
    <div style={{ padding: '40px 40px 40px', maxWidth: 1100 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Live</span>
        </div>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '2rem', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
          {tenant?.name ?? 'Global Contractor Hub'}
        </h1>
        <p style={{ color: '#64748b', marginTop: 6, fontSize: '0.875rem' }}>
          Dodo-funded treasury · Solana devnet USDC payouts
        </p>
      </motion.div>

      {/* Balance Cards */}
      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 32 }}
      >
        {balanceCards.map((card) => (
          <motion.div key={card.label} variants={stagger.item} className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {card.label}
              </div>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: card.glow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.icon size={15} color={card.color} />
              </div>
            </div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.6rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              {card.value}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 6 }}>{card.sub}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        style={{ display: 'flex', gap: 12, marginTop: 32 }}
      >
        <Link href="/funding" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          <DollarSign size={15} /> Add Funds
        </Link>
        <Link href="/batches/new" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
          <Send size={15} /> New Payout Batch
        </Link>
      </motion.div>

      {/* Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 40 }}>
        {/* Recent Funding */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8', margin: 0 }}>Recent Funding</h2>
            <Link href="/funding" style={{ color: '#6366f1', fontSize: '0.75rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {recentIntents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#334155', fontSize: '0.875rem' }}>
              No funding yet — <Link href="/funding" style={{ color: '#6366f1' }}>add funds</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentIntents.map((intent) => (
                <div key={intent.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StatusIcon status={intent.status} />
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>{intent.tierLabel}</div>
                      <div style={{ fontSize: '0.72rem', color: '#475569' }}>{formatDate(intent.createdAt)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.875rem', color: '#f8fafc', fontWeight: 600 }}>
                      {formatUsd(intent.amountMinor)}
                    </span>
                    <span className={statusBadgeClass(intent.status)}>{intent.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Batches */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8', margin: 0 }}>Recent Batches</h2>
            <Link href="/batches/new" style={{ color: '#6366f1', fontSize: '0.75rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              New <ArrowRight size={12} />
            </Link>
          </div>
          {recentBatches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#334155', fontSize: '0.875rem' }}>
              No batches yet — <Link href="/batches/new" style={{ color: '#6366f1' }}>create one</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentBatches.map((batch) => (
                <Link key={batch.id} href={`/batches/${batch.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StatusIcon status={batch.status} />
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>{batch.label}</div>
                      <div style={{ fontSize: '0.72rem', color: '#475569' }}>{batch.recipientCount} contractors · {formatDate(batch.createdAt)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.875rem', color: '#f8fafc', fontWeight: 600 }}>
                      {formatUsd(batch.totalAmountMinor)}
                    </span>
                    <span className={statusBadgeClass(batch.status)}>{batch.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
