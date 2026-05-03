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
    productId: process.env.DODO_PRODUCT_CUSTOM ?? 'prd_1', // Assumes a $1 base product
    amountMinor: 100,
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
    productId: process.env.DODO_SUB_CUSTOM ?? 'prd_sub_1', // Assumes a $1 base sub product
    amountMinor: 100,
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
    
    const finalAmountMinor = tier === 'custom' && customAmount ? customAmount * 100 : tierInfo.amountMinor;
    const finalLabel = tier === 'custom' && customAmount ? `$${customAmount} ${isSubscription ? 'Monthly ' : ''}Funding` : tierInfo.label;
    const quantity = tier === 'custom' && customAmount ? customAmount : 1;

    // Verify tenant exists
    let tenant;
    try {
      const rows = await db.select().from(tenants).where(eq(tenants.id, tenantId));
      tenant = rows[0];
    } catch (dbErr: any) {
      console.error('[checkout-link] DB error fetching tenant:', dbErr?.message ?? dbErr);
      return NextResponse.json({ error: 'Database unavailable. Please ensure the schema is migrated and the tenant is seeded.' }, { status: 503 });
    }

    if (!tenant) {
      return NextResponse.json({ error: `Tenant not found: ${tenantId}. Run: node scripts/seed.mjs` }, { status: 404 });
    }

    // Create funding intent record first
    let intent;
    try {
      const rows = await db
        .insert(fundingIntents)
        .values({
          tenantId,
          tierLabel: finalLabel,
          amountMinor: finalAmountMinor,
          status: 'pending',
        })
        .returning();
      intent = rows[0];
    } catch (dbErr: any) {
      console.error('[checkout-link] DB error inserting intent:', dbErr?.message ?? dbErr);
      return NextResponse.json({ error: 'Failed to create funding intent in database.' }, { status: 503 });
    }

    const returnUrl = env.resolvedReturnUrl;
    const cancelUrl = `${env.resolvedAppUrl}/funding?status=cancelled`;

    // Build customer arg: attach existing if we have dodo_customer_id
    const customerArg = tenant.dodoCustomerId
      ? { customer_id: tenant.dodoCustomerId }
      : undefined;

    // Create Dodo checkout session via SDK directly
    let session;
    try {
      session = await dodo.checkoutSessions.create({
        product_cart: [{ product_id: tierInfo.productId, quantity }],
        return_url: returnUrl,
        metadata: {
          funding_intent_id: intent.id,
          tenant_id: tenantId,
        },
        ...(customerArg ? { customer: customerArg } : {}),
      });
    } catch (dodoErr: any) {
      console.error('[checkout-link] Dodo SDK error:', dodoErr?.message ?? dodoErr);
      return NextResponse.json({ error: `Dodo Payments error: ${dodoErr?.message ?? 'Unknown error'}` }, { status: 502 });
    }

    // Store session ID on intent
    await db
      .update(fundingIntents)
      .set({ dodoSessionId: session.session_id })
      .where(eq(fundingIntents.id, intent.id));

    return NextResponse.json({
      checkout_url: session.checkout_url,
      session_id: session.session_id,
      intent_id: intent.id,
    });
  } catch (err: any) {
    console.error('[checkout-link] Unhandled error:', err?.message ?? err);
    return NextResponse.json({ error: `Internal server error: ${err?.message ?? 'Unknown'}` }, { status: 500 });
  }
}
