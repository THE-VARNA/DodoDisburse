import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// ONE-TIME setup endpoint — creates tables and seeds demo tenant
// Protected by a secret key to prevent accidental re-runs
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== 'dododisburse-setup-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: string[] = [];

  try {
    // ── Drop all tables in reverse FK order so we start fresh ─────
    await db.execute(sql`DROP TABLE IF EXISTS ledger_entries CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS payout_items CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS payout_batches CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS refunds CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS payments CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS webhook_events CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS funding_intents CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS contractors CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS tenants CASCADE`);
    results.push('🗑️ Old tables dropped');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tenants (
        id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name                    TEXT NOT NULL,
        slug                    TEXT NOT NULL UNIQUE,
        dodo_customer_id        TEXT,
        available_balance_minor BIGINT NOT NULL DEFAULT 0,
        reserved_balance_minor  BIGINT NOT NULL DEFAULT 0,
        total_funded_minor      BIGINT NOT NULL DEFAULT 0,
        total_disbursed_minor   BIGINT NOT NULL DEFAULT 0,
        created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    results.push('✅ tenants table ready');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS funding_intents (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        tier_label       TEXT NOT NULL,
        amount_minor     BIGINT NOT NULL,
        dodo_payment_id  TEXT,
        dodo_session_id  TEXT,
        status           TEXT NOT NULL DEFAULT 'pending',
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        confirmed_at     TIMESTAMPTZ
      )
    `);
    results.push('✅ funding_intents table ready');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payments (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        funding_intent_id     UUID REFERENCES funding_intents(id),
        dodo_payment_id       TEXT NOT NULL UNIQUE,
        amount_minor          BIGINT NOT NULL,
        refunded_amount_minor BIGINT NOT NULL DEFAULT 0,
        net_amount_minor      BIGINT NOT NULL,
        status                TEXT NOT NULL DEFAULT 'pending',
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    results.push('✅ payments table ready');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS refunds (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        payment_id      UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
        dodo_refund_id  TEXT UNIQUE,
        amount_minor    BIGINT NOT NULL,
        reason          TEXT,
        status          TEXT NOT NULL DEFAULT 'pending',
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    results.push('✅ refunds table ready');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS webhook_events (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        webhook_id    TEXT UNIQUE,
        event_type    TEXT NOT NULL,
        data          JSONB NOT NULL,
        processed     BOOLEAN NOT NULL DEFAULT FALSE,
        error_message TEXT,
        attempts      INTEGER NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        processed_at  TIMESTAMPTZ
      )
    `);
    results.push('✅ webhook_events table ready');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS contractors (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name           TEXT NOT NULL,
        email          TEXT NOT NULL,
        wallet_address TEXT NOT NULL,
        status         TEXT NOT NULL DEFAULT 'active',
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    results.push('✅ contractors table ready');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payout_batches (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        label             TEXT NOT NULL,
        note              TEXT,
        status            TEXT NOT NULL DEFAULT 'draft',
        total_amount_minor BIGINT NOT NULL DEFAULT 0,
        recipient_count   INTEGER NOT NULL DEFAULT 0,
        reserved_at       TIMESTAMPTZ,
        executed_at       TIMESTAMPTZ,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    results.push('✅ payout_batches table ready');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payout_items (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        batch_id        UUID NOT NULL REFERENCES payout_batches(id) ON DELETE CASCADE,
        contractor_id   UUID NOT NULL REFERENCES contractors(id) ON DELETE RESTRICT,
        amount_minor    BIGINT NOT NULL,
        status          TEXT NOT NULL DEFAULT 'pending',
        tx_signature    TEXT,
        error_message   TEXT,
        executed_at     TIMESTAMPTZ,
        confirmed_at    TIMESTAMPTZ
      )
    `);
    results.push('✅ payout_items table ready');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ledger_entries (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        type            TEXT NOT NULL,
        amount_minor    BIGINT NOT NULL,
        reference_id    TEXT NOT NULL,
        reference_type  TEXT NOT NULL,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    results.push('✅ ledger_entries table ready');

    // ── Seed Demo Tenant ──────────────────────────────────────────
    const TENANT_ID = process.env.DEMO_TENANT_ID || 'f582c4cf-2f41-48e9-a795-d2f263f6baf1';

    await db.execute(sql`
      INSERT INTO tenants (id, name, slug, available_balance_minor, reserved_balance_minor, total_funded_minor, total_disbursed_minor)
      VALUES (
        ${TENANT_ID}::uuid,
        'Acme AI Corp',
        'acme-ai',
        0, 0, 0, 0
      )
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    `);
    results.push(`✅ Tenant seeded: ${TENANT_ID}`);

    // ── Seed Sample Contractors ───────────────────────────────────
    const contractors = [
      { name: 'Alice Chen',     email: 'alice@example.com', wallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU' },
      { name: 'Bob Nakamura',   email: 'bob@example.com',   wallet: '9n4nbM75f5Ui33ZbPYXn59EwSgHk5pHKPDzEsVGPjZEJ' },
      { name: 'Carol Osei',     email: 'carol@example.com', wallet: 'GsbwXfJraMomNxBcjYLcG3mxkBUiyWXAB8dMEYmkQfb' },
    ];

    for (const c of contractors) {
      await db.execute(sql`
        INSERT INTO contractors (id, tenant_id, name, email, wallet_address, status)
        VALUES (gen_random_uuid(), ${TENANT_ID}::uuid, ${c.name}, ${c.email}, ${c.wallet}, 'active')
        ON CONFLICT DO NOTHING
      `);
      results.push(`✅ Contractor: ${c.name}`);
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error('[setup] Error:', err);
    return NextResponse.json({ success: false, error: err?.message ?? String(err), results }, { status: 500 });
  }
}
