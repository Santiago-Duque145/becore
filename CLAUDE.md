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
- Cualquier mención a "BeTrayn" en documentos viejos es un error: el proyecto es Be Core.

## 2. Stack (decidido, no proponer alternativas)

| Capa | Tecnología |
|---|---|
| Runtime | Node.js 22 LTS, ES Modules (`"type": "module"`), **JavaScript** (no TypeScript) |
| Backend | Express 5, Zod 4 (validación), `@supabase/supabase-js` v2 con **secret key** |
| Base de datos | Supabase (PostgreSQL) en la nube, un solo proyecto compartido por ambos desarrolladores |
| Autenticación | Supabase Auth (correo + contraseña). El backend verifica el JWT con `auth.getClaims(token)` |
| Correo | Nodemailer por SMTP de Gmail (contraseña de aplicación) |
| Tareas programadas | `node-cron` dentro del proceso del backend |
| Frontend | React **18.3.1** + Vite, React Router 7, TanStack Query 5, Axios, Tailwind CSS 4 |
| Tiempo real | Supabase Realtime (solo lectura desde el frontend) |
| Pruebas | Vitest + Supertest (backend), Vitest + Testing Library (frontend, solo si sobra tiempo) |
| Calidad | ESLint 9 (flat config) + Prettier |
| Repositorio | GitHub, ramas `main` / `develop` / `feature/*` |

Librerías **permitidas** además de las anteriores: `cors`, `helmet`, `morgan`, `nodemailer`, `node-cron`,
`concurrently`, `react-hook-form`, `@hookform/resolvers`, `lucide-react`, `sonner`.
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
│   │   ├── ui.md              ← rutas, pantallas, identidad visual, textos
│   │   └── backlog.md         ← tareas por sprint con criterios de aceptación
│   ├── PROMPTS.md             ← cómo pedirle tareas a Claude Code
│   └── progreso/              ← un .md por avance: NN_YYYY-MM-DD_titulo.md
└── .claude/settings.json      ← permisos de Claude Code
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

Pagos, IA/chatbot, geolocalización real o mapas con API, chat interno, gamificación, apps nativas,
despliegue en la nube. Los mockups de mapa y chat son solo diseño para la sustentación. Si una tarea
parece requerir algo de esta lista, detente y pregunta.

## 10. Estado actual

- Sprint actual: **S1 — Usuarios y eventos** (5 – 11 oct 2026). Ver `docs/specs/backlog.md`.
- Al terminar cada sprint, actualiza esta línea en un commit `docs: avanzar a sprint N`.
