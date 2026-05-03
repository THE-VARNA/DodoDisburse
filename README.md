# DodoDisburse
**Global Payout Hub · Fiat to Crypto · Solana Settlements**

**DodoDisburse** is a production-grade treasury operations platform that bridges traditional fiat funding with high-speed stablecoin settlements. Designed for global SaaS and AI teams, it eliminates the friction of cross-border contractor payroll by combining the compliance and reach of **Dodo Payments** with the instant settlement power of **Solana**.

---

## 🚀 What is DodoDisburse?
DodoDisburse serves as a unified command center for international finance teams. It allows companies to fund their corporate treasury using local payment methods (Cards, Bank Transfers, UPI) and instantly disburse those funds to a global workforce using USDC on Solana.

---

## 🛠️ How it Works
1.  **Fund:** The company tops up their treasury via a Dodo Payments checkout session ($USD).
2.  **Verify:** A webhook confirms the payment and credits the internal ledger.
3.  **Batch:** The treasurer creates a payout batch for contractors.
4.  **Execute:** Funds are disbursed via SPL tokens on the Solana network in seconds.
5.  **Reconcile:** All transactions are logged and exportable for accounting.

---

## 🔄 Core Flows
- **Fiat-to-Treasury Bridge:** Seamlessly convert fiat into a digital treasury balance via Dodo Payments.
- **Contractor Lifecycle:** Manage contractor wallets, emails, and payment tiers in a central directory.
- **Automated Payout Batches:** Group multiple contractor payments into a single approval workflow.
- **Real-time Observability:** Track every webhook, reservation, and transfer through a live System Activity Feed.

---

## 💼 Use Cases
- **Global AI Startups:** Pay distributed researchers and engineers in USDC instantly.
- **SaaS Platforms:** Manage international marketing and support contractor payroll.
- **Web3 Foundations:** Simplify grant distributions and contributor rewards.
- **Cross-border E-commerce:** Pay global vendors and logistics partners without wire fees.

---

## 🏗️ Technology Stack
| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), Tailwind CSS |
| **Logic** | TypeScript, Drizzle ORM |
| **Database** | Neon Postgres (Serverless) |
| **Fiat Rail** | Dodo Payments (Checkout + Webhooks) |
| **Settlement** | Solana Devnet (USDC SPL Tokens) |
| **Animations** | Motion (framer-motion) |

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
Push the schema to your Neon instance:
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

## 📜 Available Scripts
- `pnpm dev`: Start the Next.js development server.
- `pnpm build`: Build the application for production.
- `pnpm db:push`: Sync the Drizzle schema with the database.
- `pnpm seed`: Run the database seeding script for demo data.
- `pnpm typecheck`: Run TypeScript compiler check.

---

## 🛡️ Key Features for Judges
- **Immutable Ledger:** Every cent is tracked in an append-only transaction log.
- **Double-Spend Protection:** Funds are reserved at the batch level before execution.
- **Webhook Idempotency:** Securely handles duplicate event deliveries from Dodo Payments.
- **Reconciliation-First:** Built-in CSV export with on-chain transaction verification.

---
*Built for the Superteam x Dodo Payments Hackathon.*
