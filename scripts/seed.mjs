#!/usr/bin/env node
/**
 * Seed script — creates demo tenant + sample contractors
 * Usage: DATABASE_URL=... node scripts/seed.mjs
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../apps/web/.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }

const sqlClient = neon(DATABASE_URL);
const db = drizzle(sqlClient);

async function seed() {
  console.log('🌱 Seeding database…');

  // Insert demo tenant
  const [tenant] = await db.execute(sql`
    INSERT INTO tenants (id, name, slug, available_balance_minor, reserved_balance_minor, total_funded_minor, total_disbursed_minor)
    VALUES (
      gen_random_uuid(),
      'Acme AI Corp',
      'acme-ai',
      0, 0, 0, 0
    )
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id, name
  `);
  console.log('✅ Tenant:', tenant);

  // Insert sample contractors
  const contractors = [
    { name: 'Alice Chen', email: 'alice@example.com', wallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU' },
    { name: 'Bob Nakamura', email: 'bob@example.com', wallet: '9n4nbM75f5Ui33ZbPYXn59EwSgHk5pHKPDzEsVGPjZEJ' },
    { name: 'Carol Osei', email: 'carol@example.com', wallet: 'GsbwXfJraMomNxBcjYLcG3mxkBUiyWXAB8dMEYmkQfb' },
  ];

  for (const c of contractors) {
    await db.execute(sql`
      INSERT INTO contractors (id, tenant_id, name, email, wallet_address, status)
      VALUES (gen_random_uuid(), ${tenant.id}, ${c.name}, ${c.email}, ${c.wallet}, 'active')
      ON CONFLICT DO NOTHING
    `);
    console.log(`✅ Contractor: ${c.name}`);
  }

  console.log(`\n📋 Demo Tenant ID: ${tenant.id}`);
  console.log('Add this to your .env.local:');
  console.log(`DEMO_TENANT_ID=${tenant.id}`);
  console.log(`NEXT_PUBLIC_DEMO_TENANT_ID=${tenant.id}`);
}

seed().catch(console.error);
