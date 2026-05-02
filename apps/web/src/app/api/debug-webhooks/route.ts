import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { webhookEvents, fundingIntents, payments, tenants } from '@gcp/db';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const intents = await db.select().from(fundingIntents).orderBy(desc(fundingIntents.createdAt)).limit(5);
    const pmts = await db.select().from(payments).orderBy(desc(payments.createdAt)).limit(5);
    const evts = await db.select().from(webhookEvents).orderBy(desc(webhookEvents.createdAt)).limit(3);
    const t = await db.select().from(tenants);
    return NextResponse.json({ intents, pmts, evts, tenants: t });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
