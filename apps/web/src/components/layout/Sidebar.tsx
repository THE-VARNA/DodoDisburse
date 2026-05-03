'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  Users,
  Send,
  BarChart3,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Play,
  Check,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/funding', label: 'Funding', icon: CreditCard },
  { href: '/contractors', label: 'Contractors', icon: Users },
  { href: '/batches', label: 'Payout Batches', icon: Send },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 240,
        minHeight: '100vh',
        background: 'rgba(255,255,255,0.02)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #10b981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99,102,241,0.4)',
            }}
          >
            <Zap size={18} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc', letterSpacing: '-0.01em' }}>
              DodoDisburse
            </div>
            <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: 1 }}>Contractor Payouts</div>
          </div>
        </div>
      </Link>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href.replace('/new', '')));
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 10,
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: active ? 600 : 400,
                color: active ? '#f8fafc' : '#64748b',
                background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                border: active ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} color={active ? '#818cf8' : '#64748b'} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Wallet Connection */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, marginTop: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <DynamicWalletButton />
        </div>
        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
          Solana Devnet · USDC
        </div>
        <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: 2 }}>
          Treasury Admin Auth
        </div>
      </div>
    </aside>
  );
}

import dynamic from 'next/dynamic';
const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

function DynamicWalletButton() {
  return (
    <div className="wallet-btn-wrapper">
      <WalletMultiButtonDynamic 
        style={{ 
          background: 'rgba(99,102,241,0.1)', 
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 8,
          fontSize: '0.75rem',
          height: 36,
          padding: '0 12px',
          width: '100%',
          justifyContent: 'center',
          color: '#818cf8',
          fontFamily: 'inherit'
        }} 
      />
      <style dangerouslySetInnerHTML={{ __html: `
        .wallet-btn-wrapper .wallet-adapter-button-trigger {
          background: rgba(99,102,241,0.1) !important;
          border: 1px solid rgba(99,102,241,0.2) !important;
          width: 100% !important;
          height: 36px !important;
          line-height: 36px !important;
          font-size: 0.75rem !important;
          font-weight: 500 !important;
          border-radius: 8px !important;
          transition: all 0.2s !important;
        }
        .wallet-btn-wrapper .wallet-adapter-button-trigger:hover {
          background: rgba(99,102,241,0.2) !important;
          border-color: rgba(99,102,241,0.4) !important;
        }
      `}} />
    </div>
  );
}
