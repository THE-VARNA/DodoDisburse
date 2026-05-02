import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { webhookEvents } from '@gcp/db';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const events = await db.select().from(webhookEvents).orderBy(desc(webhookEvents.createdAt)).limit(5);
    return NextResponse.json({ events });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
