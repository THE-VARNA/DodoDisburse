import { db } from '@/lib/db';
import { fundingIntents } from '@gcp/db';
import { eq, desc } from 'drizzle-orm';
import FundingClient from './FundingClient';
const DEMO_TENANT_ID = process.env.DEMO_TENANT_ID || 'f582c4cf-2f41-48e9-a795-d2f263f6baf1';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FundingPage() {
  let intents: any[] = [];
  try {
    if (DEMO_TENANT_ID) {
      intents = await db
        .select()
        .from(fundingIntents)
        .where(eq(fundingIntents.tenantId, DEMO_TENANT_ID))
        .orderBy(desc(fundingIntents.createdAt));
    }
  } catch {
    // Database not seeded or connection failed
  }

  return <FundingClient intents={intents} />;
}
