import { db } from '@/lib/db';
import { fundingIntents } from '@gcp/db';
import { eq, desc } from 'drizzle-orm';
import FundingClient from './FundingClient';

const DEMO_TENANT_ID = process.env.DEMO_TENANT_ID ?? '';

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
