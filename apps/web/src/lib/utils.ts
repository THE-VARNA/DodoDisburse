/** Format minor units (e.g. cents) to a USD display string */
export function formatUsd(minor: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(minor / 100);
}

/** Format a USDC amount from 6-decimal minor units */
export function formatUsdc(minor: number): string {
  return `${(minor / 1_000_000).toFixed(2)} USDC`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Solscan link for a tx signature on devnet */
export function solscanUrl(signature: string, cluster: 'devnet' | 'mainnet-beta' = 'devnet'): string {
  return `https://solscan.io/tx/${signature}?cluster=${cluster}`;
}
