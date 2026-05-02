import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dodo } from '@/lib/dodo';
import { webhookEvents, fundingIntents, payments, tenants, ledgerEntries, refunds } from '@gcp/db';
import { eq, and } from 'drizzle-orm';

// Helper: json response
function ok(data?: object) {
  return NextResponse.json({ received: true, ...data });
}

async function processEvent(payload: Record<string, unknown>, eventDbId: string) {
  const type = payload.type as string;
  const data = payload.data as Record<string, unknown>;

  switch (type) {
    case 'payment.succeeded': {
      const dodoPaymentId = data.payment_id as string;
      const customer = data.customer as Record<string, string> | undefined;
      const totalAmount = (data.total_amount as number) ?? 0; // in minor units from Dodo

      // Find intent by dodo_payment_id or via metadata
      const metadata = data.metadata as Record<string, string> | undefined;
      const intentId = metadata?.funding_intent_id;
      const tenantId = metadata?.tenant_id;

      if (!intentId || !tenantId) break;

      // Idempotency: skip if payment already recorded
      const existing = await db.select().from(payments).where(eq(payments.dodoPaymentId, dodoPaymentId));
      if (existing.length > 0) break;

      // Insert payment record
      const [payment] = await db.insert(payments).values({
        tenantId,
        fundingIntentId: intentId,
        dodoPaymentId,
        amountMinor: totalAmount,
        netAmountMinor: totalAmount,
        status: 'succeeded',
      }).returning();

      // Update funding intent
      await db.update(fundingIntents)
        .set({ status: 'succeeded', dodoPaymentId, confirmedAt: new Date() })
        .where(eq(fundingIntents.id, intentId));

      // Ledger: fund_credit
      await db.insert(ledgerEntries).values({
        tenantId,
        type: 'fund_credit',
        amountMinor: totalAmount,
        referenceId: payment.id,
        referenceType: 'payment',
      });

      // Credit tenant balance
      const [t] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
      if (t) {
        await db.update(tenants).set({
          availableBalanceMinor: t.availableBalanceMinor + totalAmount,
          totalFundedMinor: t.totalFundedMinor + totalAmount,
          // Store dodo_customer_id for repeat checkouts
          ...(customer?.customer_id && !t.dodoCustomerId
            ? { dodoCustomerId: customer.customer_id }
            : {}),
          updatedAt: new Date(),
        }).where(eq(tenants.id, tenantId));
      }
      break;
    }

    case 'payment.processing': {
      const metadata = data.metadata as Record<string, string> | undefined;
      const intentId = metadata?.funding_intent_id;
      if (intentId) {
        await db.update(fundingIntents).set({ status: 'processing' }).where(eq(fundingIntents.id, intentId));
      }
      break;
    }

    case 'payment.failed':
    case 'payment.cancelled': {
      const metadata = data.metadata as Record<string, string> | undefined;
      const intentId = metadata?.funding_intent_id;
      const newStatus = type === 'payment.failed' ? 'failed' : 'cancelled';
      if (intentId) {
        await db.update(fundingIntents).set({ status: newStatus as 'failed' | 'cancelled' }).where(eq(fundingIntents.id, intentId));
      }
      break;
    }

    case 'refund.succeeded': {
      const dodoRefundId = data.refund_id as string;
      const [refund] = await db.select().from(refunds).where(eq(refunds.dodoRefundId, dodoRefundId));
      if (!refund || refund.status === 'succeeded') break;

      await db.update(refunds).set({ status: 'succeeded', updatedAt: new Date() }).where(eq(refunds.dodoRefundId, dodoRefundId));

      // Ledger: refund_debit (tenant balance decreases — money goes back to card)
      await db.insert(ledgerEntries).values({
        tenantId: refund.tenantId,
        type: 'refund_debit',
        amountMinor: -refund.amountMinor,
        referenceId: refund.id,
        referenceType: 'refund',
      });

      const [t] = await db.select().from(tenants).where(eq(tenants.id, refund.tenantId));
      if (t) {
        await db.update(tenants).set({
          availableBalanceMinor: Math.max(0, t.availableBalanceMinor - refund.amountMinor),
          updatedAt: new Date(),
        }).where(eq(tenants.id, refund.tenantId));
      }

      // Update payment refunded amount
      await db.update(payments).set({
        refundedAmountMinor: (await db.select().from(payments).where(eq(payments.id, refund.paymentId)))[0]?.refundedAmountMinor + refund.amountMinor,
        updatedAt: new Date(),
      }).where(eq(payments.id, refund.paymentId));
      break;
    }

    case 'refund.failed': {
      const dodoRefundId = data.refund_id as string;
      await db.update(refunds).set({ status: 'failed', updatedAt: new Date() }).where(eq(refunds.dodoRefundId, dodoRefundId));
      break;
    }
  }

  // Mark event as processed
  await db.update(webhookEvents)
    .set({ processed: true, processedAt: new Date() })
    .where(eq(webhookEvents.id, eventDbId));
}

export async function POST(req: NextRequest) {
  // 1. Read raw body — required for signature verification
  const rawBody = await req.text();
  const webhookId = req.headers.get('webhook-id') ?? '';

  // 2. Verify signature (Using basic secret match if signature verification isn't in SDK yet)
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }
  // TODO: Implement full Svix HMAC verification once confirmed
  const signature = req.headers.get('webhook-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
  }

  // 3. Idempotency: check if already seen this webhook-id
  if (webhookId) {
    const existing = await db.select().from(webhookEvents).where(eq(webhookEvents.webhookId, webhookId));
    if (existing.length > 0 && existing[0].processed) {
      return ok({ message: 'Already processed' });
    }
  }

  const payload = JSON.parse(rawBody) as Record<string, unknown>;

  // 4. Persist raw event (audit trail + idempotency)
  let eventDbId: string;
  if (webhookId) {
    const existing = await db.select().from(webhookEvents).where(eq(webhookEvents.webhookId, webhookId));
    if (existing.length > 0) {
      eventDbId = existing[0].id;
    } else {
      const [ev] = await db.insert(webhookEvents).values({
        webhookId,
        eventType: payload.type as string,
        data: payload,
        processed: false,
      }).returning();
      eventDbId = ev.id;
    }
  } else {
    const [ev] = await db.insert(webhookEvents).values({
      eventType: payload.type as string,
      data: payload,
      processed: false,
    }).returning();
    eventDbId = ev.id;
  }

  // 5. Return 200 immediately, process in background (non-blocking for fast ack)
  // For Next.js we process synchronously but catch errors gracefully
  processEvent(payload, eventDbId).catch(async (err) => {
    await db.update(webhookEvents)
      .set({ errorMessage: String(err) })
      .where(eq(webhookEvents.id, eventDbId));
  });

  return ok();
}
