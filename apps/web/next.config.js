/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@gcp/db', '@gcp/config', '@gcp/solana'],
  serverExternalPackages: ['@solana/web3.js', 'bigint-buffer', 'dodopayments', 'drizzle-orm'],
};

export default nextConfig;
