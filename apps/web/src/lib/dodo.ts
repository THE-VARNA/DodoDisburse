import DodoPayments from 'dodopayments';

const globalForDodo = globalThis as unknown as { dodo: DodoPayments | undefined };

export const dodo =
  globalForDodo.dodo ??
  new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY ?? '',
    environment: (process.env.DODO_PAYMENTS_ENVIRONMENT as 'test_mode' | 'live_mode') ?? 'test_mode',
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY,
  });

if (process.env.NODE_ENV !== 'production') globalForDodo.dodo = dodo;
