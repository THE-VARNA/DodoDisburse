# 🦤 DodoDisburse
**Global Payout Hub · Fiat to Crypto · Solana Settlements**

[![Built for Hackathon](https://img.shields.io/badge/Built_for-Superteam_x_Dodo_Payments-6366f1?style=for-the-badge)](https://dodopayments.com)
[![Solana](https://img.shields.io/badge/Powered_by-Solana-14F195?style=for-the-badge&logo=solana&logoColor=black)](#)

DodoDisburse is a unified financial command center providing Cross-Border Payments for Businesses — helping SaaS, AI-native, and creator platforms pay contractors and teams globally without wire fees or banking friction.

Companies fund their treasury using local fiat methods (Cards, Bank Transfers, UPI) via Dodo Payments. DodoDisburse leverages a pre-funded Solana USDC treasury. 

The moment a fiat top-up succeeds, our system instantly allocates the equivalent USDC balance to your account, enabling finance teams to execute 1-click global payouts. The result? Traditional fiat compliance on the front-end, combined with sub-second, frictionless crypto settlement on the back-end.

---

## ✨ Key Features
- **⚡ Instant USDC Settlements:** Convert slow fiat operations into sub-second Solana transfers.
- **🔄 Monthly Auto-Fund:** "Set it and forget it" treasury management powered by Dodo Payments' recurring subscriptions.
- **🛡️ Wallet Authorization Gate:** Payout executions are cryptographically protected. Treasury Admins must connect their Solana wallet and sign a transaction to approve mass payouts.
- **📊 Immutable Ledger:** Real-time reconciliation hub with an append-only audit trail and CSV exports for accounting.
- **👥 Contractor Management:** Centralized directory mapping traditional contractor identities to verified Web3 addresses.

---

## 🛠️ How it Works
1.  **Fund:** The company tops up their treasury via a Dodo Payments checkout session ($USD) or sets up a recurring Auto-Fund subscription.
2.  **Verify:** A Svix-secured webhook confirms the payment and credits the internal ledger.
3.  **Batch:** The treasurer creates a payout batch for global contractors.
4.  **Authorize:** The Treasury Admin connects their Solana wallet (Phantom/Solflare) and signs the payout execution.
5.  **Execute:** Funds are disbursed via SPL tokens (USDC) on the Solana network in seconds.

---

## 📂 Project Structure
This repository is organized as a modern monorepo to ensure clean separation of concerns:
- `apps/web/` — The Next.js 16 frontend, dashboard UI, and serverless API routes (including Dodo Webhooks).
- `packages/db/` — Shared database schema (Drizzle ORM) and Neon serverless connection logic.
- `packages/solana/` — Shared Web3 utilities for executing USDC transfers and managing on-chain interactions.
- `packages/config/` — Centralized environment variables, Tailwind styles, and TypeScript configurations.
- `scripts/` — Development utilities, including the database seeder for instant demo environments.

---

## 🏗️ Technology Stack
| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), Tailwind CSS, Framer Motion |
| **Logic** | TypeScript, Drizzle ORM |
| **Database** | Neon Postgres (Serverless) |
| **Fiat Rail** | Dodo Payments (Checkout, Subscriptions, Webhooks) |
| **Settlement** | Solana Devnet, `@solana/wallet-adapter` |

---

## 🛡️ Security & Production Readiness
We built DodoDisburse with enterprise-grade treasury security in mind:
- **Admin Wallet Signatures:** Mass payouts cannot be triggered by a simple API call. The Treasury Admin must connect their verified Solana wallet and cryptographically sign the authorization payload.
- **Webhook Signature Verification:** All inbound requests from Dodo Payments are cryptographically verified using **Svix** to prevent spoofing.
- **Amount Matching:** The platform verifies that the payment amount received from Dodo exactly matches the internal intent before crediting the treasury.
- **Idempotency Logic:** Every webhook event is persisted and checked against a `webhook_id` to prevent double-funding from duplicate deliveries.
- **Balance Isolation:** Payout funds are "Reserved" from the available balance before execution to ensure solvency and prevent race conditions.

---

## 🏁 Getting Started

### 1. Prerequisites
- Node.js 20+ and pnpm
- Dodo Payments Developer Account
- Solana CLI (for treasury keypair management)

### 2. Installation
```bash
pnpm install
```

### 3. Environment Setup
Copy the example environment file and fill in your credentials:
```bash
cp .env.example apps/web/.env.local
```

### 4. Database Setup
Push the schema to your Neon serverless instance:
```bash
pnpm db:push
```

### 5. Initialize Demo
Seed the demo tenant and contractors:
```bash
pnpm seed
```

### 6. Run the App
```bash
pnpm dev
```

---
*Built with ❤️ for the Superteam x Dodo Payments Hackathon.*
