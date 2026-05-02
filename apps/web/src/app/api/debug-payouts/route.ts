import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payoutItems } from '@gcp/db';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const items = await db.select().from(payoutItems).orderBy(desc(payoutItems.createdAt)).limit(5);
    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
