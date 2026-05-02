import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { refunds, payments, tenants } from '@gcp/db';
import { eq, and } from 'drizzle-orm';
import { dodo } from '@/lib/dodo';
import { z } from 'zod';

const schema = z.object({
  tenantId: z.string().uuid(),
  paymentId: z.string().uuid(),
  amountMinor: z.number().int().positive(),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { tenantId, paymentId, amountMinor, reason } = parsed.data;

  // Prechecks (per Dodo docs: payment must be succeeded, within 30 days, no over-refund)
  const [payment] = await db.select().from(payments).where(
    and(eq(payments.id, paymentId), eq(payments.tenantId, tenantId))
  );

  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  if (payment.status !== 'succeeded') {
    return NextResponse.json({ error: 'Only succeeded payments can be refunded' }, { status: 422 });
  }

  const ageDays = (Date.now() - new Date(payment.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > 30) {
    return NextResponse.json({ error: 'Refund window expired (30 days)' }, { status: 422 });
  }

  const maxRefundable = payment.amountMinor - payment.refundedAmountMinor;
  if (amountMinor > maxRefundable) {
    return NextResponse.json({ error: `Cannot refund more than ${maxRefundable} minor units` }, { status: 422 });
  }

  // Create refund record (pending — webhook will finalize)
  const [refund] = await db.insert(refunds).values({
    tenantId,
    paymentId,
    amountMinor,
    reason: reason ?? null,
    status: 'pending',
  }).returning();

  // Call Dodo refunds API
  const dodoRefund = await dodo.refunds.create({
    payment_id: payment.dodoPaymentId,
    reason: reason ?? null,
  });

  // Store dodo refund ID so webhook can find this record
  await db.update(refunds).set({
    dodoRefundId: dodoRefund.refund_id,
    status: (dodoRefund.status as 'pending' | 'succeeded' | 'failed' | 'review') ?? 'pending',
    updatedAt: new Date(),
  }).where(eq(refunds.id, refund.id));

  return NextResponse.json({ refund_id: refund.id, dodo_refund_id: dodoRefund.refund_id, status: dodoRefund.status });
}
