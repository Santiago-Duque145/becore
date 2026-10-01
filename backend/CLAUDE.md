# backend/CLAUDE.md — API Express de Be Core

Complementa el `CLAUDE.md` de la raíz. Aplica a todo lo que esté dentro de `backend/`.

## 1. Estructura

```
backend/
├── package.json
├── .env.example
├── eslint.config.js
├── vitest.config.js
├── scripts/
│   ├── seed.js                     ← usuarios y eventos de demo
│   └── run-reminders.js            ← ejecuta runRemindersOnce() una vez y termina (demo)
├── src/
│   ├── server.js                   ← arranca HTTP y el cron. Única entrada de `npm run dev`
│   ├── app.js                      ← crea y exporta la app Express (sin listen; lo usa Supertest)
│   ├── config/
│   │   ├── env.js                  ← lee process.env, valida con Zod, exporta `env`
│   │   └── supabase.js             ← cliente admin (secret key)
│   ├── middleware/
│   │   ├── require-auth.js
│   │   ├── require-role.js
│   │   ├── validate.js
│   │   ├── not-found.js
│   │   └── error-handler.js
│   ├── utils/
│   │   ├── app-error.js
│   │   └── db-errors.js            ← traduce errores de Supabase/Postgres a AppError
│   ├── schemas/                    ← esquemas Zod por módulo (events.schemas.js, ...)
│   ├── repositories/               ← SOLO consultas a Supabase
│   ├── services/                   ← reglas de negocio
│   ├── controllers/                ← req/res
│   ├── routes/
│   │   ├── index.js                ← monta todo bajo /api/v1
│   │   └── *.routes.js
│   ├── mail/
│   │   ├── mailer.js               ← transporte Nodemailer + sendMail()
│   │   └── templates/*.js          ← funciones que devuelven { subject, html, text }
│   └── jobs/
│       └── reminders.job.js        ← node-cron cada 15 min
└── tests/
    ├── helpers/
    └── *.test.js
```

## 2. Reglas de capas (estrictas)

| Capa | Puede | No puede |
|---|---|---|
| routes | Encadenar `requireAuth`, `requireRole`, `validate`, controller | Tener lógica |
| controllers | Leer `req.params/query/body` ya validados, llamar un service, responder | Llamar a Supabase |
| services | Reglas de negocio, orquestar repositorios, enviar correos, lanzar `AppError` | Tocar `req`/`res` |
| repositories | Consultas con el cliente admin; devolver objetos planos en camelCase | Reglas de negocio |

Convierte `snake_case` de la base a `camelCase` **en el repositorio** (función `toCamel` por entidad).
La API responde siempre en camelCase.

## 3. Variables de entorno (`backend/.env.example`)

```
PORT=3000
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=becore.app@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
MAIL_FROM="Be Core <becore.app@gmail.com>"
REMINDER_HOURS_BEFORE=24
CRON_ENABLED=true
```

`src/config/env.js` valida estas variables con Zod al arrancar y termina el proceso con un mensaje claro
si falta alguna. El resto del código importa `env` desde ahí; **nadie más lee `process.env`**.

`SMTP_USER`, `SMTP_PASS` y `MAIL_FROM` pueden estar vacíos hasta el Sprint 2: `env.js` los define como
`z.string().optional()` (sin `.min(1)`), y `mailer.js` no inicializa el transporte Nodemailer si alguno
de esos tres falta — simplemente registra una advertencia en consola y omite el envío.

Scripts de `package.json`:

```json
{
  "dev": "node --env-file=.env --watch src/server.js",
  "start": "node --env-file=.env src/server.js",
  "seed": "node --env-file=.env scripts/seed.js",
  "reminders": "node --env-file=.env scripts/run-reminders.js",
  "lint": "eslint .",
  "test": "vitest run",
  "test:integration": "vitest run --config vitest.integration.config.js"
}
```

No uses `dotenv` ni `nodemon`: Node 22 trae `--env-file` y `--watch`.

Instalación (desde la **raíz**, nunca con `cd backend && npm i`):

```bash
npm i express @supabase/supabase-js zod cors helmet morgan nodemailer node-cron -w backend
npm i -D vitest supertest eslint @eslint/js globals -w backend
```

## 4. Piezas base (copia estos patrones tal cual)

### 4.1 Cliente Supabase admin — `src/config/supabase.js`

```js
import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
```

### 4.2 Error de aplicación — `src/utils/app-error.js`

```js
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
```

### 4.3 Autenticación — `src/middleware/require-auth.js`

```js
import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/app-error.js';
import { findProfileById } from '../repositories/profiles.repository.js';

export async function requireAuth(req, _res, next) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError(401, 'UNAUTHENTICATED', 'Debes iniciar sesión');

  const { data, error } = await supabaseAdmin.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Tu sesión expiró, inicia sesión de nuevo');
  }

  const profile = await findProfileById(data.claims.sub);
  if (!profile) throw new AppError(401, 'UNAUTHENTICATED', 'Perfil no encontrado');

  req.user = profile; // { id, email, fullName, role }
  next();
}
```

### 4.4 Rol — `src/middleware/require-role.js`

```js
import { AppError } from '../utils/app-error.js';

export const requireRole = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user?.role)) {
    throw new AppError(403, 'FORBIDDEN', 'No tienes permiso para esta acción');
  }
  next();
};
```

### 4.5 Validación — `src/middleware/validate.js`

```js
import { AppError } from '../utils/app-error.js';

// schemas: { body?, params?, query? } con esquemas Zod
export const validate = (schemas) => (req, _res, next) => {
  for (const part of ['params', 'query', 'body']) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part]);
    if (!result.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Revisa los datos enviados',
        result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })));
    }
    // Express 5: req.query es de solo lectura, por eso se guarda aparte
    if (part === 'query') req.validatedQuery = result.data;
    else req[part] = result.data;
  }
  next();
};
```

Los controllers leen la query validada desde `req.validatedQuery`, nunca desde `req.query`.

### 4.6 Manejador de errores — `src/middleware/error-handler.js`

```js
import { AppError } from '../utils/app-error.js';

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.details && { details: err.details }) },
    });
  }
  console.error(err);
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Algo salió mal, intenta de nuevo' } });
}
```

Express 5 envía automáticamente al manejador los errores lanzados en funciones `async`.
**No** uses `express-async-handler` ni bloques `try/catch` solo para llamar a `next(err)`.

### 4.7 Errores de base — `src/utils/db-errors.js`

Las funciones SQL `confirm_attendance` y `cancel_attendance` lanzan excepciones cuyo **mensaje es el código**
(`EVENT_FULL`, `ALREADY_CONFIRMED`, ...). Supabase lo devuelve en `error.message`. Traduce con la tabla de
`docs/specs/api.md` §2. Además: código Postgres `23514` (check) → 409 `CONSTRAINT_VIOLATION` salvo que el
constraint sea `events_confirmed_within_capacity` → 409 `CAPACITY_BELOW_CONFIRMED`; `23505` (unique) → 409
`DUPLICATE`; cualquier otro → se relanza para que termine en 500.

### 4.8 Formato de respuesta

- Éxito: `{ "data": ... }` con estado 200 (o 201 al crear). Listas: `{ "data": [...], "meta": { "total": n } }`.
- Error: `{ "error": { "code": "EVENT_FULL", "message": "texto en español", "details"?: [...] } }`.
- `204` sin cuerpo solo para `DELETE` exitosos.

## 5. Correo

- `mail/mailer.js` crea un único transporte Nodemailer (`secure: true` con puerto 465) y exporta
  `sendMail({ to, subject, html, text })`.
- Si el envío falla, **no** se rompe la petición del usuario: se registra en `notifications.error` y se sigue.
- Plantillas en español, con el nombre de la marca, colores turquesa `#14B8A6` y azul `#0D1B2A`, HTML simple
  con estilos en línea, y siempre una versión `text`.
- En pruebas (`NODE_ENV=test`) `sendMail` no envía nada: se mockea con `vi.mock`.

## 6. Cron de recordatorios — `jobs/reminders.job.js`

- Se registra en `server.js` solo si `env.CRON_ENABLED === 'true'`. Expresión: `*/15 * * * *`, zona `America/Bogota`.
- Lógica exacta en `docs/specs/api.md` §5. Debe ser **idempotente**: los índices únicos de `notifications`
  impiden enviar dos veces el mismo recordatorio; inserta la fila primero y envía después.

## 7. Pruebas

- Vitest + Supertest contra `app.js`. Los repositorios se mockean con `vi.mock` en pruebas de services y rutas.
- `vitest.config.js` define variables **falsas** en `test.env` (`NODE_ENV: 'test'`, `SUPABASE_URL: 'http://localhost:54321'`,
  `SUPABASE_SECRET_KEY: 'test'`, SMTP de mentira, `CRON_ENABLED: 'false'`, etc.) y excluye `tests/integration/**`.
  Así `env.js` no falla y el CI corre sin secretos.
- La prueba de concurrencia de cupos (S2-03) es la única que golpea Supabase real. Vive en `tests/integration/`,
  usa `vitest.integration.config.js` (incluye solo esa carpeta y carga el `.env` real con
  `env: loadEnv('', process.cwd(), '')` importando `loadEnv` de `vite`) y se ejecuta con
  `"test:integration": "vitest run --config vitest.integration.config.js"`. Nunca corre en `npm test` ni en CI.
- Cada service crítico (events, attendance) cubre: caso feliz, cada código de error de la spec y permisos.
