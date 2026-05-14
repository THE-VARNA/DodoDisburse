'use client';

import { motion, Variants } from 'motion/react';
import Link from 'next/link';
import { ArrowRight, Diamond, Zap, Shield, CreditCard, Coins, CheckCircle2, Play } from 'lucide-react';

export default function LandingClient() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.4, duration: 0.8 } },
  };

  const floatVariants: Variants = {
    animate: {
      y: [0, -15, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const floatReverseVariants: Variants = {
    animate: {
      y: [0, 15, 0],
      transition: {
        duration: 5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Background Ambient Glows */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '50vw',
          height: '50vw',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(15,23,42,0) 70%)',
          filter: 'blur(80px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-10%',
          width: '60vw',
          height: '60vw',
          background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(15,23,42,0) 70%)',
          filter: 'blur(100px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(99,102,241,0.4)' }}>
            <Zap size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.5px', background: 'linear-gradient(to right, #ffffff, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            DodoDisburse
          </span>
        </div>
        <Link href="/dashboard" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
          Open App <ArrowRight size={16} />
        </Link>
      </nav>

      {/* Hero Section */}
      <main style={{ position: 'relative', zIndex: 10, maxWidth: 1200, margin: '0 auto', padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{ textAlign: 'center', maxWidth: 800, position: 'relative' }}
        >
          {/* Floating UI Elements (Decorative) */}
          <motion.div
            variants={floatVariants}
            animate="animate"
            className="glass-card"
            style={{ position: 'absolute', top: -40, left: -100, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 16 }}
          >
            <div style={{ background: 'rgba(52,211,153,0.2)', padding: 8, borderRadius: 8 }}>
              <CheckCircle2 size={20} color="#34d399" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Dodo Webhook</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>+$500.00 Funded</div>
            </div>
          </motion.div>

          <motion.div
            variants={floatReverseVariants}
            animate="animate"
            className="glass-card"
            style={{ position: 'absolute', bottom: 40, right: -120, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 16 }}
          >
            <div style={{ background: 'rgba(99,102,241,0.2)', padding: 8, borderRadius: 8 }}>
              <Zap size={20} color="#818cf8" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Solana Network</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>USDC Disbursed</div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 100, color: '#818cf8', fontSize: '0.85rem', fontWeight: 600, marginBottom: 24, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Powered by Dodo Payments & Solana
          </motion.div>

          <motion.h1
            variants={itemVariants}
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '4.5rem',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-2px',
              margin: '0 0 24px',
              background: 'linear-gradient(to right, #ffffff, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Global Payroll at<br />Solana Speed.
          </motion.h1>

          <motion.p
            variants={itemVariants}
            style={{ fontSize: '1.25rem', color: '#64748b', lineHeight: 1.6, margin: '0 auto 40px', maxWidth: 600 }}
          >
            Bridge the gap between Fiat and Web3. Fund your treasury with credit cards instantly via Dodo Payments, and disburse USDC to contractors worldwide on Solana.
          </motion.p>

          <motion.div variants={itemVariants} style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
            <Link href="/dashboard" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem', borderRadius: 12, textDecoration: 'none' }}>
              Launch App
            </Link>
            <a 
              href="https://www.loom.com/share/d5e58a6fc1644a62923f8c15b4238032" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-ghost" 
              style={{ 
                padding: '16px 32px', 
                fontSize: '1.1rem', 
                borderRadius: 12, 
                textDecoration: 'none', 
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Play size={18} fill="currentColor" /> Watch Demo
            </a>
          </motion.div>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginTop: 100, width: '100%' }}
        >
          <motion.div variants={itemVariants} className="glass-card" style={{ padding: 32, borderRadius: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <CreditCard size={24} color="#818cf8" />
            </div>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.3rem', margin: '0 0 12px', color: '#f8fafc' }}>Frictionless Funding</h3>
            <p style={{ color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              Use Dodo Payments to checkout via credit cards, Apple Pay, or standard fiat rails. Webhooks automatically credit your secure immutable ledger.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-card" style={{ padding: 32, borderRadius: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Zap size={24} color="#34d399" />
            </div>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.3rem', margin: '0 0 12px', color: '#f8fafc' }}>Solana Speed</h3>
            <p style={{ color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              Batch process thousands of contractor payouts using SPL Token instructions. Near-instant finality and virtually zero gas fees on the Solana network.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-card" style={{ padding: 32, borderRadius: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Shield size={24} color="#fb7185" />
            </div>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.3rem', margin: '0 0 12px', color: '#f8fafc' }}>Treasury Security</h3>
            <p style={{ color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              Custodial backend wallet isolates smart contract risk. Centralized PostgreSQL ledger ensures balances are accurately reserved before dual-execution.
            </p>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '32px 0', textAlign: 'center', position: 'relative', zIndex: 10, marginTop: 60 }}>
        <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>
          Built for the Superteam x Dodo Payments Hackathon.
        </p>
      </footer>
    </div>
  );
}
