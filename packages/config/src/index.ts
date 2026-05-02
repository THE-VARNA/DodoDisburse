import { z } from 'zod';

const envSchema = z.object({
  // Dodo Payments — official env names
  DODO_PAYMENTS_API_KEY: z.string().min(1, 'DODO_PAYMENTS_API_KEY is required'),
  DODO_PAYMENTS_WEBHOOK_KEY: z.string().min(1, 'DODO_PAYMENTS_WEBHOOK_KEY is required'),
  DODO_PAYMENTS_RETURN_URL: z.string().url('DODO_PAYMENTS_RETURN_URL must be a valid URL'),
  DODO_PAYMENTS_ENVIRONMENT: z.enum(['test_mode', 'live_mode']).default('test_mode'),

  // Neon Postgres
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Solana
  SOLANA_TREASURY_SECRET_KEY: z.string().min(1, 'SOLANA_TREASURY_SECRET_KEY is required'),
  SOLANA_RPC_URL: z.string().url().default('https://api.devnet.solana.com'),
  SOLANA_USDC_MINT: z.string().default('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (_env) return _env;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`❌ Invalid environment variables:\n${missing}`);
  }
  _env = parsed.data;
  return _env;
}

// Named exports for convenience
export const env = new Proxy({} as Env, {
  get(_, key: string) {
    return getEnv()[key as keyof Env];
  },
});
