import { db } from '@/lib/db';
import { tenants, fundingIntents, payoutBatches, ledgerEntries } from '@gcp/db';
import { eq, desc, and, or } from 'drizzle-orm';
import { DashboardClient } from './DashboardClient';

// Demo tenant ID — seeded on first run
const DEMO_TENANT_ID = 'f582c4cf-2f41-48e9-a795-d2f263f6baf1';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  let tenant = null;
  let recentIntents: typeof fundingIntents.$inferSelect[] = [];
  let recentBatches: typeof payoutBatches.$inferSelect[] = [];

  try {
    if (DEMO_TENANT_ID) {
      const [t] = await db.select().from(tenants).where(eq(tenants.id, DEMO_TENANT_ID));
      tenant = t ?? null;
      recentIntents = await db
        .select()
        .from(fundingIntents)
        .where(eq(fundingIntents.tenantId, DEMO_TENANT_ID))
        .orderBy(desc(fundingIntents.createdAt))
        .limit(5);
      recentBatches = await db
        .select()
        .from(payoutBatches)
        .where(eq(payoutBatches.tenantId, DEMO_TENANT_ID))
        .orderBy(desc(payoutBatches.createdAt))
        .limit(5);

      // Calculate dynamic reserved balance (sum of all approved or executing batches)
      const activeBatches = await db
        .select({ totalAmountMinor: payoutBatches.totalAmountMinor })
        .from(payoutBatches)
        .where(and(
          eq(payoutBatches.tenantId, DEMO_TENANT_ID),
          or(eq(payoutBatches.status, 'approved'), eq(payoutBatches.status, 'executing'))
        ));
      
      const dynamicReservedMinor = activeBatches.reduce((sum, b) => sum + b.totalAmountMinor, 0);
      
      if (tenant) {
        tenant.reservedBalanceMinor = dynamicReservedMinor;
      }
    }
  } catch {
    // DB not yet migrated — show empty state
  }

  return (
    <DashboardClient
      tenant={tenant}
      recentIntents={recentIntents}
      recentBatches={recentBatches}
    />
  );
}
