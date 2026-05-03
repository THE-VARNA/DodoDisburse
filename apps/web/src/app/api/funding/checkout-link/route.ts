import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dodo } from '@/lib/dodo';
import { fundingIntents, tenants } from '@gcp/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { env } from '@gcp/config';

const TIER_PRODUCTS: Record<string, { productId: string; amountMinor: number; label: string; qtyScale?: number }> = {
  tier_50: {
    productId: process.env.DODO_PRODUCT_50 ?? 'prd_50',
    amountMinor: 5000,
    label: '$50 Top-Up',
  },
  tier_1000: {
    productId: process.env.DODO_PRODUCT_100 ?? 'prd_100', // Scale $100 product by 10
    amountMinor: 100000,
    label: '$1000 Top-Up',
    qtyScale: 10,
  },
  custom: {
    productId: process.env.DODO_PRODUCT_100 ?? 'prd_1', 
    amountMinor: 10000,
    label: 'Custom Top-Up',
  },
};

const SUB_PRODUCTS: Record<string, { productId: string; amountMinor: number; label: string; qtyScale?: number }> = {
  tier_50: {
    productId: process.env.DODO_SUB_50 ?? 'prd_sub_50',
    amountMinor: 5000,
    label: '$50 Monthly Auto-Fund',
  },
  tier_1000: {
    productId: process.env.DODO_SUB_100 ?? 'prd_sub_100', // Scale $100 sub product by 10
    amountMinor: 100000,
    label: '$1000 Monthly Auto-Fund',
    qtyScale: 10,
  },
  custom: {
    productId: process.env.DODO_SUB_100 ?? 'prd_sub_1', 
    amountMinor: 10000,
    label: 'Custom Monthly Auto-Fund',
  },
};

const schema = z.object({
  tenantId: z.string().uuid(),
  tier: z.enum(['tier_50', 'tier_1000', 'custom']),
  isSubscription: z.boolean().optional(),
  customAmount: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { tenantId, tier, isSubscription, customAmount } = parsed.data;
    const tierInfo = isSubscription ? SUB_PRODUCTS[tier] : TIER_PRODUCTS[tier];
    
    let finalAmountMinor = tierInfo.amountMinor;
    let finalLabel = tierInfo.label;
    let quantity = tierInfo.qtyScale ?? 1;

    if (tier === 'custom' && customAmount) {
      const isFallback = !process.env.DODO_PRODUCT_CUSTOM;
      const unitPrice = isFallback ? 100 : 1;
      quantity = Math.max(1, Math.floor(customAmount / unitPrice));
      finalAmountMinor = quantity * unitPrice * 100;
      finalLabel = `$${quantity * unitPrice} ${isSubscription ? 'Monthly ' : ''}Funding`;
    }

    const rows = await db.select().from(tenants).where(eq(tenants.id, tenantId));
    const tenant = rows[0];
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const [intent] = await db.insert(fundingIntents).values({
      tenantId,
      tierLabel: finalLabel,
      amountMinor: finalAmountMinor,
      status: 'pending',
    }).returning();

    const returnUrl = env.resolvedReturnUrl;
    const customerArg = tenant.dodoCustomerId ? { customer_id: tenant.dodoCustomerId } : undefined;

    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: tierInfo.productId, quantity }],
      billing_currency: 'USD',
      return_url: returnUrl,
      metadata: { funding_intent_id: intent.id, tenant_id: tenantId },
      ...(customerArg ? { customer: customerArg } : {}),
    });

    await db.update(fundingIntents)
      .set({ dodoSessionId: session.session_id })
      .where(eq(fundingIntents.id, intent.id));

    return NextResponse.json({
      checkout_url: session.checkout_url,
      session_id: session.session_id,
      intent_id: intent.id,
    });
  } catch (err: any) {
    console.error('[checkout-link] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
