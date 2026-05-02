import { db } from '@/lib/db';
import { fundingIntents } from '@gcp/db';
import { eq, desc } from 'drizzle-orm';
import FundingPageClient from './page';

const DEMO_TENANT_ID = process.env.DEMO_TENANT_ID ?? '';

// Re-export the client component as the default — funding page is fully client-side
// The history table below is server-fetched here
export { default } from './page';
