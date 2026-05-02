import type { Metadata } from 'next';
import './globals.css';
import { SidebarWrapper } from '@/components/layout/SidebarWrapper';
import { Toaster } from '@/components/layout/Toaster';

export const metadata: Metadata = {
  title: 'PayHub — Global Contractor Payout Hub',
  description:
    'Fund via Dodo Payments. Pay contractors instantly via USDC on Solana. Full ledger, reconciliation, and CSV export.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <div className="flex min-h-screen">
          <SidebarWrapper />
          <main className="flex-1 min-w-0 flex flex-col">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
