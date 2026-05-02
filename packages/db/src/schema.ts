import {
  pgTable,
  uuid,
  text,
  bigint,
  boolean,
  timestamp,
  jsonb,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Tenants ────────────────────────────────────────────────────────────────

export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  dodoCustomerId: text('dodo_customer_id'), // stored after first checkout
  availableBalanceMinor: bigint('available_balance_minor', { mode: 'number' }).notNull().default(0),
  reservedBalanceMinor: bigint('reserved_balance_minor', { mode: 'number' }).notNull().default(0),
  totalFundedMinor: bigint('total_funded_minor', { mode: 'number' }).notNull().default(0),
  totalDisbursedMinor: bigint('total_disbursed_minor', { mode: 'number' }).notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Funding Intents ─────────────────────────────────────────────────────────

export const fundingIntents = pgTable('funding_intents', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  tierLabel: text('tier_label').notNull(), // e.g. "$100 Top-Up"
  amountMinor: bigint('amount_minor', { mode: 'number' }).notNull(),
  dodoPaymentId: text('dodo_payment_id'), // filled on webhook
  dodoSessionId: text('dodo_session_id'), // checkout session id
  status: text('status', {
    enum: ['pending', 'processing', 'succeeded', 'failed', 'cancelled'],
  }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
});

// ─── Payments ────────────────────────────────────────────────────────────────

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  fundingIntentId: uuid('funding_intent_id').references(() => fundingIntents.id),
  dodoPaymentId: text('dodo_payment_id').notNull().unique(),
  amountMinor: bigint('amount_minor', { mode: 'number' }).notNull(),
  refundedAmountMinor: bigint('refunded_amount_minor', { mode: 'number' }).notNull().default(0),
  netAmountMinor: bigint('net_amount_minor', { mode: 'number' }).notNull(),
  status: text('status', {
    enum: ['pending', 'processing', 'succeeded', 'failed', 'cancelled'],
  }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Refunds ─────────────────────────────────────────────────────────────────

export const refunds = pgTable('refunds', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  paymentId: uuid('payment_id').notNull().references(() => payments.id, { onDelete: 'restrict' }),
  dodoRefundId: text('dodo_refund_id').unique(),
  amountMinor: bigint('amount_minor', { mode: 'number' }).notNull(),
  reason: text('reason'),
  status: text('status', {
    enum: ['pending', 'succeeded', 'failed', 'review'],
  }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Webhook Events ──────────────────────────────────────────────────────────

export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  webhookId: text('webhook_id').unique(), // idempotency key from header
  eventType: text('event_type').notNull(),
  data: jsonb('data').notNull(),
  processed: boolean('processed').notNull().default(false),
  errorMessage: text('error_message'),
  attempts: integer('attempts').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
});

// ─── Contractors ─────────────────────────────────────────────────────────────

export const contractors = pgTable('contractors', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  walletAddress: text('wallet_address').notNull(),
  status: text('status', {
    enum: ['active', 'inactive', 'kyc_pending'],
  }).notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Payout Batches ──────────────────────────────────────────────────────────

export const payoutBatches = pgTable('payout_batches', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  note: text('note'),
  status: text('status', {
    enum: ['draft', 'approved', 'executing', 'partial', 'completed', 'failed', 'cancelled'],
  }).notNull().default('draft'),
  totalAmountMinor: bigint('total_amount_minor', { mode: 'number' }).notNull().default(0),
  recipientCount: integer('recipient_count').notNull().default(0),
  reservedAt: timestamp('reserved_at', { withTimezone: true }),
  executedAt: timestamp('executed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Payout Items ────────────────────────────────────────────────────────────

export const payoutItems = pgTable('payout_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  batchId: uuid('batch_id').notNull().references(() => payoutBatches.id, { onDelete: 'cascade' }),
  contractorId: uuid('contractor_id').notNull().references(() => contractors.id, { onDelete: 'restrict' }),
  amountMinor: bigint('amount_minor', { mode: 'number' }).notNull(), // kept as number; converted to BigInt before SPL
  status: text('status', {
    enum: ['pending', 'processing', 'succeeded', 'failed'],
  }).notNull().default('pending'),
  txSignature: text('tx_signature'),
  errorMessage: text('error_message'),
  executedAt: timestamp('executed_at', { withTimezone: true }),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
});

// ─── Ledger Entries (immutable append-only) ──────────────────────────────────

export const ledgerEntries = pgTable('ledger_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: ['fund_credit', 'reserve', 'payout_debit', 'refund_debit', 'reserve_release'],
  }).notNull(),
  amountMinor: bigint('amount_minor', { mode: 'number' }).notNull(), // positive = credit, negative = debit
  referenceId: text('reference_id').notNull(),
  referenceType: text('reference_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Relations ───────────────────────────────────────────────────────────────

export const tenantsRelations = relations(tenants, ({ many }) => ({
  fundingIntents: many(fundingIntents),
  payments: many(payments),
  refunds: many(refunds),
  contractors: many(contractors),
  batches: many(payoutBatches),
  ledger: many(ledgerEntries),
}));

export const fundingIntentsRelations = relations(fundingIntents, ({ one }) => ({
  tenant: one(tenants, { fields: [fundingIntents.tenantId], references: [tenants.id] }),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  tenant: one(tenants, { fields: [payments.tenantId], references: [tenants.id] }),
  fundingIntent: one(fundingIntents, { fields: [payments.fundingIntentId], references: [fundingIntents.id] }),
  refunds: many(refunds),
}));

export const refundsRelations = relations(refunds, ({ one }) => ({
  tenant: one(tenants, { fields: [refunds.tenantId], references: [tenants.id] }),
  payment: one(payments, { fields: [refunds.paymentId], references: [payments.id] }),
}));

export const contractorsRelations = relations(contractors, ({ one, many }) => ({
  tenant: one(tenants, { fields: [contractors.tenantId], references: [tenants.id] }),
  payoutItems: many(payoutItems),
}));

export const payoutBatchesRelations = relations(payoutBatches, ({ one, many }) => ({
  tenant: one(tenants, { fields: [payoutBatches.tenantId], references: [tenants.id] }),
  items: many(payoutItems),
}));

export const payoutItemsRelations = relations(payoutItems, ({ one }) => ({
  batch: one(payoutBatches, { fields: [payoutItems.batchId], references: [payoutBatches.id] }),
  contractor: one(contractors, { fields: [payoutItems.contractorId], references: [contractors.id] }),
}));
