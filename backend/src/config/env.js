import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(3000),
  FRONTEND_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  REMINDER_HOURS_BEFORE: z.coerce.number().default(24),
  CRON_ENABLED: z.string().default('false'),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  const missing = result.error.issues.map((i) => i.path.join('.')).join(', ');
  console.error(`[env] Variables de entorno faltantes o inválidas: ${missing}`);
  process.exit(1);
}

export const env = result.data;
