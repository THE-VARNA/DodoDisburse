import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dodo } from '@/lib/dodo';
import { fundingIntents, tenants } from '@gcp/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Pre-created product IDs in Dodo dashboard — set these in env
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
};

const schema = z.object({
  tenantId: z.string().uuid(),
  tier: z.enum(['tier_50', 'tier_100', 'tier_250', 'tier_500']),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { tenantId, tier } = parsed.data;
  const tierInfo = TIER_PRODUCTS[tier];

  // Verify tenant exists
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  // Create funding intent record first
  const [intent] = await db
    .insert(fundingIntents)
    .values({
      tenantId,
      tierLabel: tierInfo.label,
      amountMinor: tierInfo.amountMinor,
      status: 'pending',
    })
    .returning();

  const returnUrl = process.env.DODO_PAYMENTS_RETURN_URL ?? 'http://localhost:3000/funding/return';
  const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/funding?status=cancelled`;

  // Build customer arg: attach existing if we have dodo_customer_id
  const customerArg = tenant.dodoCustomerId
    ? { customer_id: tenant.dodoCustomerId }
    : undefined;

  // Create Dodo checkout session via SDK directly
  const session = await dodo.checkoutSessions.create({
    product_cart: [{ product_id: tierInfo.productId, quantity: 1 }],
    return_url: returnUrl,
    metadata: {
      funding_intent_id: intent.id,
      tenant_id: tenantId,
    },
    ...(customerArg ? { customer: customerArg } : {}),
  });

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
}
