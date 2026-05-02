import { createDb } from '@gcp/db';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');

// Singleton for Next.js (avoids creating new connections on every hot reload)
const globalForDb = globalThis as unknown as { db: ReturnType<typeof createDb> | undefined };
export const db = globalForDb.db ?? createDb(DATABASE_URL);
if (process.env.NODE_ENV !== 'production') globalForDb.db = db;
