# CLAUDE.md — Be Core (raíz del repositorio)

Este archivo lo lee Claude Code al iniciar cada sesión. Es la fuente de verdad para trabajar en este repo.
`backend/CLAUDE.md` y `frontend/CLAUDE.md` amplían estas reglas para cada carpeta. Las especificaciones
detalladas viven en `docs/specs/` y **se leen antes de escribir código**.

## 1. Qué es Be Core

Plataforma web para organizar eventos deportivos y culturales comunitarios (partidos, torneos de barrio,
cine al aire libre). Un **organizador** crea eventos con cupo máximo; los **participantes** confirman o
cancelan su asistencia; el sistema impide el sobrecupo, envía recordatorios por correo y muestra paneles.

- Trabajo de grado, Ingeniería de Sistemas, Universidad Católica Luis Amigó (Medellín).
- Equipo: Santiago Duque Gallego y Jheitson Felipe Jaramillo Vélez.
- Entrega: MVP corriendo **en local** para la sustentación (primera semana de noviembre de 2026).
- No hay despliegue. No hay app móvil nativa: es web responsive, mobile-first.
- Asistente de código: **Claude Code con Opus 5.5**.
- Cualquier mención a "BeTrayn" en documentos viejos es un error: el proyecto es Be Core.

## 2. Stack (decidido, no proponer alternativas)

| Capa | Tecnología |
|---|---|
| Runtime | Node.js 22 LTS, ES Modules (`"type": "module"`), **JavaScript** (no TypeScript) |
| Backend | Express 5, Zod 4 (validación), `@supabase/supabase-js` v2 con **secret key** |
| Base de datos | Supabase (PostgreSQL) en la nube, un solo proyecto compartido por ambos desarrolladores |
| Autenticación | Supabase Auth (correo + contraseña). El backend verifica el JWT con `auth.getUser(token)` |
| Correo | Nodemailer por SMTP de Gmail (contraseña de aplicación) |
| Tareas programadas | `node-cron` dentro del proceso del backend |
| Frontend | React **18.3.1** + Vite, React Router 7, TanStack Query 5, Axios, Tailwind CSS 4 |
| Tiempo real | Supabase Realtime (solo lectura desde el frontend) |
| Pruebas | Vitest + Supertest (backend), Vitest + Testing Library (frontend, solo si sobra tiempo) |
| Calidad | ESLint 9 (flat config) + Prettier |
| Repositorio | GitHub, ramas `main` / `develop` / `feature/*` |

Librerías **permitidas** además de las anteriores: `cors`, `helmet`, `morgan`, `nodemailer`, `node-cron`,
`concurrently`, `react-hook-form`, `@hookform/resolvers`, `lucide-react`, `sonner`, `leaflet`, `react-leaflet`,
`maplibre-gl` y `@maplibre/maplibre-gl-leaflet` (mapa vectorial con los colores de la marca; se cargan en diferido,
solo al abrir un mapa).
Herramientas de desarrollo permitidas: `vitest`, `supertest`, `@vitest/coverage-v8`, `eslint`, `prettier`,
`supabase` (CLI), `autocannon` (solo con `npx`).
**No instales ninguna otra librería sin preguntar primero** y explicar en una frase por qué hace falta.

## 3. Estructura del repositorio

```
becore/
├── CLAUDE.md                  ← este archivo
├── package.json               ← workspaces + scripts raíz (dev, lint, test)
├── backend/                   ← API REST Express (ver backend/CLAUDE.md)
├── frontend/                  ← React + Vite (ver frontend/CLAUDE.md)
├── supabase/
│   └── migrations/            ← SQL versionado. Fuente de verdad del esquema
├── docs/
│   ├── specs/
│   │   ├── database.md        ← tablas, funciones, reglas de cupos, RLS
│   │   ├── api.md             ← contrato de cada endpoint (request, response, errores)
│   │   ├── ui.md              ← rutas, pantallas, textos (lo visual queda bajo la skill becore-ui, ver §5.1)
│   │   ├── auth-onboarding.md ← login, Google, onboarding de gustos y "Para ti"
│   │   ├── rediseno-auditoria.md ← estado del frontend frente a los mockups y contradicciones resueltas
│   │   └── backlog.md         ← tareas por sprint con criterios de aceptación
│   ├── mockups/               ← 6 pantallas HTML estáticas de referencia visual
│   ├── PROMPTS.md             ← cómo pedirle tareas a Claude Code
│   ├── PROMPTS-rediseno.md    ← sesiones R0–R9 del rediseño del frontend
│   └── progreso/              ← un .md por avance: NN_YYYY-MM-DD_titulo.md
└── .claude/
    ├── settings.json          ← permisos de Claude Code
    └── skills/becore-ui/      ← skill de UX/UI, obligatoria para todo lo visual
```

## 4. Comandos

```bash
npm install                 # en la raíz: instala backend y frontend (workspaces)
npm run dev                 # levanta backend (:3000) y frontend (:5173) a la vez
npm run lint                # ESLint en ambos paquetes
npm test                    # Vitest en ambos paquetes
npm run seed -w backend     # crea usuarios y eventos de demo en Supabase
npm run reminders -w backend           # ejecuta una vez el envío de recordatorios (demo)
npm run test:integration -w backend    # prueba de concurrencia contra Supabase real
npx supabase db push        # aplica migraciones nuevas al proyecto Supabase
```

Puertos: frontend `5173`, backend `3000`. Prefijo de la API: `/api/v1`. El frontend la llama por ruta
relativa y el proxy de Vite la reenvía al backend.

## 5. Forma de trabajar (obligatoria)

Cada tarea del backlog tiene un ID (ej. `S1-04`). Para cada tarea:

1. **Lee** la tarea en `docs/specs/backlog.md` y las secciones de spec que cita. No leas specs completas que no necesitas.
2. **Planea antes de codificar**: lista los archivos que vas a crear o modificar y continúa sin esperar aprobación. Solo te detienes si necesitas cambiar el esquema de la base o instalar una librería fuera de la lista de §2; en esos casos pregunta.
3. **Implementa solo lo que pide la tarea.** No refactorices código ajeno, no agregues funcionalidades "de paso", no cambies nombres existentes.
4. **Verifica**: `npm run lint` y `npm test` sin errores. Si la tarea tiene pantalla, di exactamente cómo probarla a mano.
5. **Resume** al final: archivos cambiados, cómo probar, pendientes. Propón el mensaje de commit.
6. Si algo de la spec es ambiguo o contradictorio, **pregunta**. No inventes columnas, endpoints, rutas ni códigos de error que no estén en `docs/specs/`.

### 5.1 Tareas visuales

Toda tarea que cree o modifique una pantalla, un componente, un estilo o un texto visible en `frontend/`:

1. **Carga la skill `becore-ui`** (`.claude/skills/becore-ui/SKILL.md`) antes de escribir código.
2. **Compara contra `docs/mockups/`**: si la pantalla tiene mockup, ábrelo y revisa el resultado a 390 px (y a 1440 px si hay versión de escritorio). Al terminar, lista las diferencias que queden.
3. Revisa `docs/specs/rediseno-auditoria.md` §d antes de decidir entre fuentes que se contradicen.

Precedencia cuando las fuentes chocan: este `CLAUDE.md` (alcance, librerías, seguridad) → `docs/specs/auth-onboarding.md`
(solo auth y onboarding) → skill `becore-ui` → mockups → `docs/specs/ui.md`. Es decir, **la parte de UI de `ui.md`
(principios visuales, tokens §3, colores y estilos de componentes §4) queda subordinada a la skill** cuando se
contradigan; `ui.md` sigue mandando en lo que la skill no cubre (rutas ↔ RF, formatos de fecha, textos fijos).

## 6. Reglas globales de código

- Nombres de código en **inglés** (variables, funciones, archivos, columnas). Textos de interfaz, comentarios y commits en **español**.
- Archivos en `kebab-case` en el backend (`events.service.js`); componentes React en `PascalCase.jsx`.
- Funciones pequeñas, una responsabilidad. Nada de archivos de más de ~250 líneas.
- Sin `console.log` olvidados. El backend registra con `morgan` y errores con `console.error` en el manejador central.
- Fechas: en la base todo es `timestamptz` (UTC). El frontend envía ISO 8601 con zona y muestra en `America/Bogota` con `Intl.DateTimeFormat('es-CO', ...)`.
- Nunca confíes en el cliente: toda validación de negocio ocurre en el backend.

## 7. Seguridad (no negociable)

- `SUPABASE_SECRET_KEY` (`sb_secret_...`) **solo** en `backend/.env`. Jamás en el frontend ni en el repo.
- El frontend usa únicamente `VITE_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_...`) para Auth y Realtime.
- El frontend **nunca** lee ni escribe tablas directamente con supabase-js. Todo dato pasa por la API Express.
  Única excepción: suscripciones de Realtime de solo lectura a `events` y `activity_log`.
- El rol del usuario se lee de `public.profiles` en el backend, **nunca** de `user_metadata` del JWT (el usuario puede editarlo).
- `.env` está en `.gitignore`. Solo se versionan `.env.example`.
- No leas archivos `.env`. Si necesitas saber qué variables existen, lee `.env.example`.

## 8. Git

- Rama por tarea: `feature/S1-04-crear-evento`. Se abre PR hacia `develop`; el otro integrante revisa.
- Conventional Commits en español: `feat(eventos): crear evento con cupo máximo`, `fix(asistencia): ...`,
  `test(cupos): ...`, `docs(progreso): ...`, `chore: ...`, `refactor(...): ...`.
- Agrega al final del mensaje de commit: `Refs: S1-04`.
- Nunca hagas `git push --force`, `git reset --hard` ni commits directos a `main` o `develop`.

## 9. Fuera de alcance

Pagos, IA/chatbot, Google Maps API, chat interno, gamificación, apps nativas, despliegue en la nube y la
"estela convergente" del mapa. El mockup del chat es solo diseño para la sustentación. Si una tarea parece
requerir algo de esta lista, detente y pregunta.

> **Nota 2026-10-17 — ampliación pedida por el director (Víctor Daniel Gil Vera):** agregar (1) sexo y rango de
> edad opcionales en el onboarding, (2) calificación de eventos finalizados, (3) imagen del evento (subida o
> generada con IA), (4) avatares y (5) más interactividad en el login. Cada punto entra al desarrollo cuando se
> especifique en `docs/specs/`; el punto 3 (imagen generada con IA) requiere además cerrar la decisión sobre
> "IA/chatbot" de esta sección. Lo demás del alcance no cambia. Primer punto implementado: sexo, rango de edad y
> consentimiento de datos (`docs/progreso/05_*`).

> **Nota 2026-10-17 — mapa de eventos, pedido por el director:** el mapa de eventos entra al alcance con **Leaflet +
> teselas libres** (sin Google Maps API; la ruta se abre en Google Maps o Waze con un enlace). La ubicación del
> dispositivo se usa **solo para calcular distancias en el navegador**: nunca se envía al backend ni se guarda.
> La búsqueda de direcciones usa Nominatim (OpenStreetMap) llamada desde el backend. Siguen fuera: Google Maps API
> y la "estela convergente". Detalle en `docs/PLAN.md` (P6).

## 10. Estado actual

- Sprints 1 y 2 cerrados (tags `v0.1` y `v0.2`); sprint 3 casi cerrado (README, plan de validación, p90 y citas hechos). En curso: `docs/PLAN.md` (Fase 2b: M1, P0–P6; Fase 3: IA). Congelamiento `v1.0` el 29 oct. Ver `docs/specs/backlog.md`.
- Al terminar cada sprint, actualiza esta línea en un commit `docs: avanzar a sprint N`.
