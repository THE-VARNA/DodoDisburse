import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tenants, fundingIntents, payoutItems, webhookEvents } from '@gcp/db';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const t = await db.select().from(tenants);
    const i = await db.select().from(fundingIntents).orderBy(desc(fundingIntents.createdAt)).limit(10);
    const p = await db.select().from(payoutItems).orderBy(desc(payoutItems.executedAt)).limit(10);
    const e = await db.select().from(webhookEvents).orderBy(desc(webhookEvents.createdAt)).limit(10);
    
    return NextResponse.json({ 
      env: {
        DEMO_TENANT_ID: process.env.DEMO_TENANT_ID,
        NEXT_PUBLIC_DEMO_TENANT_ID: process.env.NEXT_PUBLIC_DEMO_TENANT_ID
      },
      tenants: t, 
      intents: i, 
      payouts: p, 
      events: e 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
