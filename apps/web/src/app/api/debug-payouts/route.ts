import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payoutItems } from '@gcp/db';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const items = await db.select({
      id: payoutItems.id,
      status: payoutItems.status,
      errorMessage: payoutItems.errorMessage,
      executedAt: payoutItems.executedAt
    })
    .from(payoutItems)
    .orderBy(desc(payoutItems.executedAt))
    .limit(5);
    
    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
