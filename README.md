# Global Contractor Payout Hub

**Fund via Dodo Payments · Pay contractors instantly via USDC on Solana**

A production-style treasury operations platform for SaaS and AI finance teams.

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend + API | Next.js 16 App Router |
| Database | Neon Postgres + Drizzle ORM |
| Inbound billing | Dodo Payments (checkout sessions + webhooks) |
| Outbound payouts | Solana devnet · USDC SPL token |
| Monorepo | pnpm workspaces |

```
apps/web        → Next.js app (UI + all API routes)
apps/worker     → Standalone payout worker (future)
packages/config → Zod env validation
packages/db     → Drizzle schema + Neon client
packages/solana → SPL USDC transfer helpers
```

## Quick Start

### 1. Install dependencies
```bash
pnpm install
```

### 2. Configure environment
```bash
cp .env.example apps/web/.env.local
# Fill in all values
```

### 3. Run database migrations
```bash
pnpm db:push
```

### 4. Seed demo data
```bash
DATABASE_URL=your_url node scripts/seed.mjs
# Copy DEMO_TENANT_ID output → apps/web/.env.local
```

### 5. Start dev server
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Core User Flow

1. **Fund** → Click a tier on `/funding` → Dodo hosted checkout → webhook credits ledger
2. **Add Contractors** → `/contractors` → manual add or CSV import
3. **Create Batch** → `/batches/new` → select contractors + set USDC amounts
4. **Approve** → reserves balance (prevents double-spend)
5. **Execute** → SPL transfers sent on-chain → TX signatures stored
6. **Export** → `/reports` → CSV reconciliation with Solscan links

## Webhook Setup (Dodo Dashboard)

Navigate: **Developer → Webhooks → Add Endpoint**

URL: `https://your-domain.com/api/webhooks/dodo`

Subscribe to:
- `payment.succeeded`
- `payment.failed`
- `payment.processing`
- `payment.cancelled`
- `refund.succeeded`
- `refund.failed`

## Treasury Wallet Setup

Generate a Solana keypair and fund it with devnet USDC:
```bash
solana-keygen new --outfile treasury.json
solana airdrop 2 $(solana-keygen pubkey treasury.json) --url devnet
# Then get devnet USDC from the USDC devnet faucet
```

Export the secret key as base58 and set `SOLANA_TREASURY_SECRET_KEY`.

## Key Design Decisions

- **Webhook idempotency**: `webhook-id` header used as unique key — duplicate deliveries safely ignored
- **Balance reservation**: funds locked before batch execution — prevents double-spend
- **Ledger**: immutable append-only `ledger_entries` table — complete audit trail
- **Refund direction**: `refund_debit` reduces tenant balance (money returns to card)
- **BigInt safety**: SPL amounts converted to `BigInt` right at the transfer call
