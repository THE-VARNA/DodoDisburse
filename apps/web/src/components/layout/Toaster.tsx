'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Global toast store
let _listeners: Array<(toasts: Toast[]) => void> = [];
let _toasts: Toast[] = [];

export function toast(message: string, type: ToastType = 'info') {
  const id = Math.random().toString(36).slice(2);
  _toasts = [..._toasts, { id, message, type }];
  _listeners.forEach((l) => l(_toasts));
  setTimeout(() => {
    _toasts = _toasts.filter((t) => t.id !== id);
    _listeners.forEach((l) => l(_toasts));
  }, 4000);
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    _listeners.push(setToasts);
    return () => {
      _listeners = _listeners.filter((l) => l !== setToasts);
    };
  }, []);

  const icons = { success: CheckCircle, error: XCircle, info: Info };
  const colors = {
    success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', color: '#34d399' },
    error: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', color: '#f87171' },
    info: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', color: '#818cf8' },
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map((t) => {
        const Icon = icons[t.type];
        const c = colors[t.type];
        return (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              borderRadius: 12,
              background: c.bg,
              border: `1px solid ${c.border}`,
              backdropFilter: 'blur(16px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              minWidth: 280,
              maxWidth: 380,
            }}
          >
            <Icon size={16} color={c.color} />
            <span style={{ flex: 1, fontSize: '0.875rem', color: '#f8fafc' }}>{t.message}</span>
            <button
              onClick={() => {
                _toasts = _toasts.filter((x) => x.id !== t.id);
                _listeners.forEach((l) => l(_toasts));
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <X size={14} color="#64748b" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
