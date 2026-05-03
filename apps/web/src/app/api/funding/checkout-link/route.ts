import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dodo } from '@/lib/dodo';
import { fundingIntents, tenants } from '@gcp/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { env } from '@gcp/config';

const TIER_PRODUCTS: Record<string, { productId: string; amountMinor: number; label: string }> = {
  tier_50: {
    productId: process.env.DODO_PRODUCT_50 ?? 'prd_50',
    amountMinor: 5000,
    label: '$50 Top-Up',
  },
  tier_100: {
    productId: process.env.DODO_PRODUCT_100 ?? 'prd_100',
    amountMinor: 10000,
    label: '$100 Top-Up',
  },
  tier_250: {
    productId: process.env.DODO_PRODUCT_250 ?? 'prd_250',
    amountMinor: 25000,
    label: '$250 Top-Up',
  },
  tier_500: {
    productId: process.env.DODO_PRODUCT_500 ?? 'prd_500',
    amountMinor: 50000,
    label: '$500 Top-Up',
  },
  custom: {
    productId: process.env.DODO_PRODUCT_100 ?? 'prd_1', // Fallback to $100 product
    amountMinor: 10000,
    label: 'Custom Top-Up',
  },
};

const SUB_PRODUCTS: Record<string, { productId: string; amountMinor: number; label: string }> = {
  tier_50: {
    productId: process.env.DODO_SUB_50 ?? 'prd_sub_50',
    amountMinor: 5000,
    label: '$50 Monthly Auto-Fund',
  },
  tier_100: {
    productId: process.env.DODO_SUB_100 ?? 'prd_sub_100',
    amountMinor: 10000,
    label: '$100 Monthly Auto-Fund',
  },
  tier_250: {
    productId: process.env.DODO_SUB_250 ?? 'prd_sub_250',
    amountMinor: 25000,
    label: '$250 Monthly Auto-Fund',
  },
  tier_500: {
    productId: process.env.DODO_SUB_500 ?? 'prd_sub_500',
    amountMinor: 50000,
    label: '$500 Monthly Auto-Fund',
  },
  custom: {
    productId: process.env.DODO_SUB_100 ?? 'prd_sub_1', // Fallback to $100 sub product
    amountMinor: 10000,
    label: 'Custom Monthly Auto-Fund',
  },
};

const schema = z.object({
  tenantId: z.string().uuid(),
  tier: z.enum(['tier_50', 'tier_100', 'tier_250', 'tier_500', 'custom']),
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
    let quantity = 1;

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
