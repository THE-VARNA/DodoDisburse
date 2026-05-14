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

async function cleanup() {
  console.log('🧹 Cleaning up contractors and associated payout items…');
  
  await db.execute(sql`
    DELETE FROM payout_items 
    WHERE contractor_id IN (
      SELECT id FROM contractors 
      WHERE name IN ('Bob Nakamura', 'Alice Engineering', 'Alice Chen')
    )
  `);

  const res = await db.execute(sql`
    DELETE FROM contractors 
    WHERE name IN ('Bob Nakamura', 'Alice Engineering', 'Alice Chen')
  `);
  
  console.log('✅ Deleted contractors');
}

cleanup().catch(console.error);
