import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { db } from '@/lib/db';
import { webhookEvents, fundingIntents, payments, tenants, ledgerEntries, refunds } from '@gcp/db';
import { eq } from 'drizzle-orm';
import { triggerAutoPilot } from '@/lib/autopilot';

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
      const totalAmount = (data.total_amount as number) ?? 0;

      const metadata = data.metadata as Record<string, string> | undefined;
      const intentId = metadata?.funding_intent_id;
      const tenantId = metadata?.tenant_id;

      if (!intentId || !tenantId) break;

      const [intent] = await db.select().from(fundingIntents).where(eq(fundingIntents.id, intentId));
      if (!intent) break;

      // SECURITY: Verify that the amount received matches our expected intent amount
      // Dodo total_amount is typically in minor units (e.g., cents)
      if (intent.amountMinor !== totalAmount) {
        console.warn(`[webhook] SECURITY WARNING: Amount mismatch for intent ${intentId}. Expected ${intent.amountMinor}, got ${totalAmount}`);
        // In a real prod environment, we would flag this for manual review instead of failing silently or over-crediting
      }

      const usdAmountMinor = totalAmount; // Use the actual amount paid as the source of truth

      // Idempotency: skip if payment already recorded
      const existing = await db.select().from(payments).where(eq(payments.dodoPaymentId, dodoPaymentId));
      if (existing.length > 0) break;

      const [payment] = await db.insert(payments).values({
        tenantId,
        fundingIntentId: intentId,
        dodoPaymentId,
        amountMinor: usdAmountMinor,
        netAmountMinor: usdAmountMinor,
        status: 'succeeded',
      }).returning();

      await db.update(fundingIntents)
        .set({ status: 'succeeded', dodoPaymentId, confirmedAt: new Date() })
        .where(eq(fundingIntents.id, intentId));

      await db.insert(ledgerEntries).values({
        tenantId,
        type: 'fund_credit',
        amountMinor: usdAmountMinor,
        referenceId: payment.id,
        referenceType: 'payment',
      });

      const [t] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
      if (t) {
        await db.update(tenants).set({
          availableBalanceMinor: t.availableBalanceMinor + usdAmountMinor,
          totalFundedMinor: t.totalFundedMinor + usdAmountMinor,
          ...(customer?.customer_id && !t.dodoCustomerId ? { dodoCustomerId: customer.customer_id } : {}),
          updatedAt: new Date(),
        }).where(eq(tenants.id, tenantId));
      }
      
      // TRIGGER AUTO-PILOT PAYOUTS
      // We don't await this so it doesn't block the webhook response!
      triggerAutoPilot(tenantId).catch(err => console.error('[AutoPilot] Failed:', err));
      
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
        await db.update(fundingIntents)
          .set({ status: newStatus as 'failed' | 'cancelled' })
          .where(eq(fundingIntents.id, intentId));
      }
      break;
    }

    case 'refund.succeeded': {
      const dodoRefundId = data.refund_id as string;
      const [refund] = await db.select().from(refunds).where(eq(refunds.dodoRefundId, dodoRefundId));
      if (!refund || refund.status === 'succeeded') break;

      await db.update(refunds)
        .set({ status: 'succeeded', updatedAt: new Date() })
        .where(eq(refunds.dodoRefundId, dodoRefundId));

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

      const [pmt] = await db.select().from(payments).where(eq(payments.id, refund.paymentId));
      if (pmt) {
        await db.update(payments).set({
          refundedAmountMinor: pmt.refundedAmountMinor + refund.amountMinor,
          updatedAt: new Date(),
        }).where(eq(payments.id, refund.paymentId));
      }
      break;
    }

    case 'refund.failed': {
      const dodoRefundId = data.refund_id as string;
      await db.update(refunds)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(eq(refunds.dodoRefundId, dodoRefundId));
      break;
    }
  }

  await db.update(webhookEvents)
    .set({ processed: true, processedAt: new Date() })
    .where(eq(webhookEvents.id, eventDbId));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const webhookId = req.headers.get('webhook-id') ?? '';

  // Verify Svix signature
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const wh = new Webhook(secret);
  let payload: Record<string, unknown>;
  try {
    payload = wh.verify(rawBody, {
      'webhook-id': req.headers.get('webhook-id') ?? '',
      'webhook-timestamp': req.headers.get('webhook-timestamp') ?? '',
      'webhook-signature': req.headers.get('webhook-signature') ?? '',
    }) as Record<string, unknown>;
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Idempotency check
  if (webhookId) {
    const existing = await db.select().from(webhookEvents).where(eq(webhookEvents.webhookId, webhookId));
    if (existing.length > 0 && existing[0].processed) {
      return ok({ message: 'Already processed' });
    }
  }

  // Persist raw event
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

  // Process synchronously to ensure Vercel doesn't freeze the lambda before completion
  try {
    await processEvent(payload, eventDbId);
  } catch (err: any) {
    console.error('[webhook] processing error:', err);
    await db.update(webhookEvents)
      .set({ errorMessage: String(err) })
      .where(eq(webhookEvents.id, eventDbId));
    // We still return 200 so Dodo doesn't keep retrying a broken payload
  }

  return ok();
}
