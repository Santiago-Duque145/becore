import { z } from 'zod';

// Texto opcional: una variable vacía en .env (GEMINI_TEXT_MODELS=) cuenta como no definida y toma el valor por defecto
const optionalText = () => z.preprocess((value) => (value === '' ? undefined : value), z.string().min(1).optional());

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(3000),
  FRONTEND_URL: z.string().url(),
  // URL pública para los enlaces de los correos (modo demo con túnel). Vacía = no definida
  APP_URL: z.preprocess((value) => (value === '' ? undefined : value), z.string().url().optional()),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  REMINDER_HOURS_BEFORE: z.coerce.number().default(24),
  CRON_ENABLED: z.string().default('false'),
  // IA con Gemini (docs/specs/ai.md §12). Todo opcional: sin clave o con AI_ENABLED=false la app funciona con las reglas.
  GEMINI_API_KEY: optionalText(),
  // Cadena de modelos de texto, separados por comas, en orden de preferencia (mediciones del 22 oct en docs/progreso/17_*).
  // Cada modelo de la capa gratuita tiene su propio cupo diario: si uno se agota o falla, se usa el siguiente.
  GEMINI_TEXT_MODELS: optionalText().default('gemini-3.6-flash,gemini-3-flash-preview,gemini-3.5-flash'),
  GEMINI_EMBEDDING_MODEL: optionalText().default('gemini-embedding-2'),
  AI_ENABLED: z.preprocess((value) => (value === '' ? undefined : value), z.enum(['true', 'false']).default('false')),
  // Sal de la prueba A/B: la variante es sha256(user_id + AB_SALT). Cambiarla reparte de nuevo a todos.
  AB_SALT: optionalText().default('becore-ab-2026'),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  const missing = result.error.issues.map((i) => i.path.join('.')).join(', ');
  console.error(`[env] Variables de entorno faltantes o inválidas: ${missing}`);
  process.exit(1);
}

export const env = result.data;
