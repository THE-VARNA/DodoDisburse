'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { CheckCircle, Clock, XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function FundingReturnPage() {
  const params = useSearchParams();
  const paymentId = params.get('payment_id');
  const status = params.get('status');

  const isSuccess = status === 'succeeded' || !!paymentId;
  const isCancelled = !paymentId && status === 'cancelled';

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 40 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card"
        style={{ padding: 48, textAlign: 'center', maxWidth: 460, width: '100%' }}
      >
        {isCancelled ? (
          <>
            <XCircle size={48} color="#f87171" style={{ marginBottom: 16 }} />
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px' }}>
              Payment Cancelled
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 32px' }}>
              No charge was made. You can try again anytime.
            </p>
          </>
        ) : isSuccess ? (
          <>
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5, delay: 0.2 }}>
              <Clock size={48} color="#fbbf24" style={{ marginBottom: 16 }} />
            </motion.div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px' }}>
              Payment Received
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 8px' }}>
              Awaiting webhook confirmation from Dodo Payments.
            </p>
            <p style={{ color: '#475569', fontSize: '0.75rem', margin: '0 0 32px' }}>
              Your balance will update automatically once confirmed — usually within seconds.
            </p>
            {paymentId && (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 16px', marginBottom: 24 }}>
                <span style={{ fontSize: '0.72rem', color: '#475569' }}>Payment ID: </span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>{paymentId}</span>
              </div>
            )}
          </>
        ) : (
          <>
            <CheckCircle size={48} color="#34d399" style={{ marginBottom: 16 }} />
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px' }}>
              Processing
            </h1>
          </>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/dashboard" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Go to Dashboard
          </Link>
          <Link href="/funding" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
