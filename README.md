# Be Core

Plataforma web para organizar eventos deportivos y culturales comunitarios (partidos, torneos de barrio, cine al aire libre). Un organizador crea eventos con cupo máximo; los participantes confirman o cancelan su asistencia; el sistema impide el sobrecupo, envía recordatorios por correo y muestra paneles.

Trabajo de grado de Ingeniería de Sistemas, Universidad Católica Luis Amigó (Medellín). Equipo: Santiago Duque Gallego y Jheitson Felipe Jaramillo Vélez. El MVP corre **en local**; no hay despliegue.

Stack: Node.js 22, Express 5, React 18 + Vite, Supabase (PostgreSQL, Auth, Realtime), Nodemailer. Más detalle en [`CLAUDE.md`](CLAUDE.md).

## 1. Requisitos

- **Node.js 22 LTS** y **npm** (`node -v` debe mostrar `v22.x`).
- **Git**.
- Acceso al proyecto de Supabase del equipo (un solo proyecto compartido): su `SUPABASE_URL`, la *publishable key* y la *secret key*.
- Una cuenta de Gmail con *contraseña de aplicación* para el correo (opcional: sin ella la app funciona, pero no envía correos).

## 2. Instalación desde cero

```bash
git clone https://github.com/Santiago-Duque145/becore.git
cd becore
git checkout develop
npm install            # en la raíz: instala backend y frontend (workspaces)
```

No uses `cd backend && npm install`: el proyecto usa workspaces y se instala siempre desde la raíz.

## 3. Variables de entorno

Los archivos `.env` **no se versionan**. Cópialos desde los ejemplos y complétalos:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

(En PowerShell: `Copy-Item backend/.env.example backend/.env`, y lo mismo para el frontend.)

### `backend/.env`

| Variable | Para qué sirve |
|---|---|
| `PORT` | Puerto del backend (3000). |
| `NODE_ENV` | Entorno (`development`). Opcional. |
| `FRONTEND_URL` | Origen permitido por CORS: `http://localhost:5173`. |
| `APP_URL` | URL pública para los enlaces de los correos. Reservada para la fase de demo con túnel; el código actual aún no la lee. |
| `SUPABASE_URL` | URL del proyecto de Supabase (Settings > API). |
| `SUPABASE_SECRET_KEY` | Secret key (`sb_secret_...`). Solo en este archivo. |
| `SMTP_HOST`, `SMTP_PORT` | Servidor SMTP de Gmail (`smtp.gmail.com`, `465`). |
| `SMTP_USER`, `SMTP_PASS` | Cuenta de Gmail y su contraseña de aplicación. Si falta alguna de las variables de correo, el backend avisa en consola y omite los envíos. |
| `MAIL_FROM` | Remitente visible, p. ej. `"Be Core <cuenta@gmail.com>"`. |
| `REMINDER_HOURS_BEFORE` | Horas antes del evento para el recordatorio (24). |
| `CRON_ENABLED` | `true` activa el cron de recordatorios cada 15 minutos. |
| `GEMINI_*`, `AI_ENABLED`, `AI_IMAGES_ENABLED` | Reservadas para la Fase 3 (IA). El código actual aún no las lee; déjalas vacías. |

### `frontend/.env`

| Variable | Para qué sirve |
|---|---|
| `VITE_API_URL` | Prefijo de la API. Déjalo en `/api/v1`: el proxy de Vite lo reenvía al backend. |
| `VITE_SUPABASE_URL` | La misma URL del proyecto de Supabase. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_...`). **Nunca** pongas aquí la secret key. |

## 4. Supabase y Google (configuración manual)

1. **Migraciones.** Inicia sesión y enlaza la CLI al proyecto, luego aplica el esquema:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref-del-proyecto>
   npx supabase migration list      # local y remoto deben tener las mismas versiones
   npx supabase db push --dry-run   # solo debe aparecer lo que falta
   npx supabase db push
   ```
   Como el proyecto de Supabase es compartido, normalmente **ya está aplicado**; en ese caso solo verifica con `migration list`.
2. **Authentication.** "Confirm email" desactivado y las URLs de redirección del paso siguiente.
3. **Google OAuth** (inicio de sesión con Google): sigue [`docs/specs/auth-onboarding.md` §10](docs/specs/auth-onboarding.md): consentimiento OAuth en modo prueba con los correos del equipo y de los invitados como *Test users*, ID de cliente, redirect URI de Supabase y las URLs `http://localhost:5173/**` y de la IP local.
4. **Gmail.** Activa la verificación en dos pasos en la cuenta y crea una *contraseña de aplicación*; va en `SMTP_PASS`.

## 5. Datos de demostración

```bash
npm run seed -w backend
```

Crea 14 cuentas `@becore.test` (2 organizadores y 12 participantes) y eventos de ejemplo. Si un usuario ya existe, lo respeta.

| Rol | Correo | Contraseña |
|---|---|---|
| Organizador | `santiago@becore.test`, `felipe@becore.test` | `BeCore2026!` |
| Participante | `jugador1@becore.test` a `jugador12@becore.test` | `BeCore2026!` |

Los correos a direcciones `@becore.test` se omiten por diseño (no existen); los avisos sí aparecen dentro de la app.

## 6. Levantar la app

```bash
npm run dev
```

Arranca el backend en `http://localhost:3000` (prefijo `/api/v1`) y el frontend en `http://localhost:5173`. Abre `http://localhost:5173` e ingresa con una cuenta de demo.

Otros comandos útiles:

```bash
npm run reminders -w backend      # ejecuta una vez el envío de recordatorios (demo)
npm run mail:test -w backend      # prueba de envío SMTP
```

## 7. Pruebas y calidad

```bash
npm run lint                          # ESLint en backend y frontend
npm test                              # Vitest en ambos paquetes
npm run test:integration -w backend   # concurrencia de cupos contra Supabase real (usa backend/.env)
```

La prueba de integración golpea la base real: no corre en `npm test`.

### Rendimiento de `GET /events` (p90)

Con el backend corriendo, `backend/scripts/measure-p90.js` hace 200 peticiones y reporta p50, p90 y p99 (objetivo: p90 < 2 s). Necesita el token de acceso (`access_token`) de un usuario de prueba, que se obtiene iniciando sesión contra Supabase Auth:

```bash
# bash; reemplaza <URL> y <PUBLISHABLE_KEY> por los valores de frontend/.env
TOKEN=$(curl -s -X POST "<URL>/auth/v1/token?grant_type=password" \
  -H "apikey: <PUBLISHABLE_KEY>" -H "Content-Type: application/json" \
  -d '{"email":"jugador1@becore.test","password":"BeCore2026!"}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0)).access_token")
BECORE_TOKEN=$TOKEN node backend/scripts/measure-p90.js
```

En PowerShell, obtén el `access_token` con `Invoke-RestMethod` al mismo endpoint y asígnalo a `$env:BECORE_TOKEN`. El token vence en aproximadamente una hora. Variables opcionales: `BECORE_REQUESTS` (200), `BECORE_CONCURRENCY` (1) y `BECORE_API_URL` (`http://localhost:3000/api/v1`).

## 8. Abrir la app desde el celular

Vite escucha en toda la red (`host: true`). Con el portátil y el celular en la **misma Wi-Fi** (o el celular conectado al *hotspot* del portátil):

1. En el portátil obtén la IP local: `ipconfig` (Windows), "Dirección IPv4" (p. ej. `192.168.1.20`).
2. En el celular abre `http://192.168.1.20:5173`.
3. El inicio de sesión con Google solo funciona si esa URL está en las *Redirect URLs* de Supabase (`http://192.168.*.*:5173/**`). Con correo y contraseña no hace falta.

Al ser `http` sin certificado, no hay instalación completa como app ni geolocalización.

## 9. Solución de problemas

| Síntoma | Causa y solución |
|---|---|
| `Port 5173 is already in use` o el frontend arranca en otro puerto | Hay otro Vite abierto. Ciérralo o libera el puerto: `netstat -ano \| findstr :5173` y `taskkill /PID <pid> /F`. En otro puerto, CORS (`FRONTEND_URL`) y el login con Google fallan. |
| `[env] Variables de entorno faltantes o inválidas: ...` | Falta algo en `backend/.env` (`FRONTEND_URL`, `SUPABASE_URL` y `SUPABASE_SECRET_KEY` son obligatorias). Confirma que el archivo esté en `backend/`. |
| Nadie puede entrar; las peticiones dan 500 o 401 | Probable **migración sin aplicar**: el código pide una columna que no existe en Supabase (pasó con `profiles.gender`). Corre `npx supabase migration list` y `npx supabase db push`. |
| El celular no abre `http://<IP>:5173` | **Firewall de Windows**: permite Node.js en redes privadas (Seguridad de Windows > Firewall > Permitir una aplicación) o crea una regla de entrada para el puerto 5173. Verifica que ambos estén en la misma red y que sea de tipo "Privada". |
| Error de red o CORS en el navegador | `FRONTEND_URL` debe ser exactamente el origen desde el que abres la app. Desde el celular, usa el proxy de Vite (`VITE_API_URL=/api/v1`), no `localhost:3000`. |
| No llegan correos | Revisa `SMTP_*` y `MAIL_FROM`; usa contraseña de aplicación, no la normal; mira spam. `npm run mail:test -w backend` ayuda a aislar el problema. Los `@becore.test` nunca reciben correo. |
| Google: `redirect_uri_mismatch` o "acceso bloqueado" | El correo no está como *Test user* en Google Cloud, o falta la URL en Supabase (ver §4). |
| `npm install` falla o usa otra versión de Node | Verifica `node -v` (22.x), borra `node_modules` y reinstala desde la raíz. |

## 10. Documentación

- [`CLAUDE.md`](CLAUDE.md), `backend/CLAUDE.md`, `frontend/CLAUDE.md`: reglas de trabajo y arquitectura.
- [`docs/specs/`](docs/specs): base de datos, API, UI, autenticación y backlog.
- [`docs/specs/plan-validacion.md`](docs/specs/plan-validacion.md): guion del partido de validación y cuestionario SUS.
- [`docs/progreso/`](docs/progreso): informes de avance por sprint.
