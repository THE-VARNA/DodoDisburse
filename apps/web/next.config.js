/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@gcp/db', '@gcp/config', '@gcp/solana'],
  experimental: {
    serverComponentsExternalPackages: [
      '@solana/web3.js',
      '@solana/spl-token',
      'bs58',
    ],
  },
};

module.exports = nextConfig;
