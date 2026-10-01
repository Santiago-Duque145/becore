# Backlog por sprint — Be Core

Fechas 2026. Sustentación: primera semana de noviembre (el lunes 2 es festivo).
Dueños: **S** = Santiago, **F** = Felipe. Cada tarea es una rama y un PR.
Una tarea está **terminada** cuando cumple todos sus criterios, `npm run lint` y `npm test` pasan, y el
compañero aprobó el PR.

| Sprint | Fechas | Objetivo |
|---|---|---|
| S0 | 1 – 4 oct | Cimientos: repo, base de datos, esqueletos conectados |
| S1 | 5 – 11 oct | Registro, roles y eventos |
| S2 | 12 – 18 oct | Asistencia sin sobrecupo, citas y correos |
| S3 | 19 – 25 oct | Paneles, tiempo real, pruebas y pulido |
| S4 | 26 oct – 1 nov | Partido real con amigos, correcciones, presentación |
| — | 2 – 6 nov | Ensayo y sustentación |

---

## S0 · Cimientos (1 – 4 oct)

### S0-00 · Configuración manual (ambos, fuera de Claude Code)
No es código; lo hacen ustedes en los paneles web:
1. ✅ Hecho: proyecto `becore` creado en Supabase (ref `netomeswlgsahvgqowdq`, región São Paulo `sa-east-1`). Guarden la contraseña de la base.
2. Authentication → Sign In / Providers → Email: **desactivar "Confirm email"**; longitud mínima de contraseña **8**.
3. Project Settings → API Keys: copiar la **publishable key** y la **secret key** (no la compartan por WhatsApp; usen un gestor o mensaje que se borre).
4. Gmail: crear `becore.app@gmail.com` (o similar), activar verificación en dos pasos y generar una **contraseña de aplicación**.
5. GitHub: proteger `main` y `develop` (PR obligatorio, 1 aprobación). Agregar a ambos como colaboradores.
6. Instalar en ambos equipos: Node 22 LTS, Git, VS Code, Claude Code.

### S0-01 · Monorepo y herramientas (S)
- Crear `package.json` raíz con `"workspaces": ["backend", "frontend"]` y scripts `dev` (con `concurrently`,
  prefijos `api` y `web`), `lint`, `test`.
- `.gitignore` (node_modules, .env, dist, coverage), `.editorconfig`, Prettier (`singleQuote`, `semi`, `printWidth: 100`).
- ESLint 9 flat config en cada paquete.
- `.github/workflows/ci.yml`: Node 22, `npm ci`, `npm run lint`, `npm test` en cada PR a `develop` y `main`.
- `.github/pull_request_template.md` con: Tarea (ID), RF, Qué cambia, Cómo probar, Capturas.

**Acepta si:** `npm install` en la raíz instala todo; el CI corre en un PR de prueba.

### S0-02 · Esqueleto del backend (S)
- Estructura de `backend/CLAUDE.md` §1 (carpetas vacías con lo mínimo).
- `config/env.js`, `config/supabase.js`, `utils/app-error.js`, `utils/db-errors.js`, middlewares `validate`,
  `not-found`, `error-handler` exactamente como en `backend/CLAUDE.md` §4.
- `app.js` con `helmet`, `cors({ origin: env.FRONTEND_URL })`, `express.json()`, `morgan('dev')`, rutas bajo `/api/v1`.
- `GET /api/v1/health`.
- Prueba: `tests/health.test.js` (200 y forma `{ data: { status: 'ok' } }`) y una prueba de ruta inexistente (404 con `NOT_FOUND`).

**Acepta si:** `npm run dev -w backend` arranca; falta una variable en `.env` → el proceso termina con un mensaje que dice cuál.

### S0-03 · Migración inicial en Supabase (F)
- Instalar Supabase CLI como dependencia de desarrollo de la raíz (`npm i -D supabase`), `npx supabase login`,
  `npx supabase init`, `npx supabase link --project-ref <ref>`.
- La migración `supabase/migrations/20261001024930_initial_schema.sql` **ya está aplicada** en el proyecto
  (se aplicó el 2026-09-30 desde Claude con el conector de Supabase). **No** ejecutar `db push` para ella.
- Verificar que el CLI la reconoce: `npx supabase migration list` debe mostrarla en las columnas *Local* y *Remote*.
  Si aparece solo en *Remote*, el archivo no está en `supabase/migrations/` con ese nombre exacto.

**Acepta si:** registrar un usuario de prueba desde el panel de Auth con metadata `{"full_name":"Prueba","role":"participant"}` crea su fila en `profiles`.

### S0-04 · Autenticación en el backend (S)
- `repositories/profiles.repository.js` con `findProfileById(id)` → `{ id, email, fullName, role, createdAt }` o `null`.
- Middlewares `require-auth.js` y `require-role.js` exactamente como en `backend/CLAUDE.md` §4.3–4.4.
- `GET /me` y `PATCH /me` (`docs/specs/api.md` §3).
- Pruebas con `vi.mock` de `supabaseAdmin.auth.getClaims` y del repositorio: sin token → 401; token inválido → 401; válido → 200 con perfil; `PATCH /me` con nombre de 1 letra → 400.

**Acepta si:** con un token real (copiado del navegador en S0-05) `GET /me` responde el perfil.
Nota: si `auth.getClaims(token)` no existe en la versión instalada de supabase-js, usar `auth.getUser(token)`
(`data.user.id` en lugar de `data.claims.sub`) y avisar en el resumen.

### S0-05 · Esqueleto del frontend (F)
- Instalación exacta de `frontend/CLAUDE.md` §3 y `vite.config.js` de §2.
- `index.css` con tokens de `ui.md` §3, fuentes en `index.html`.
- `lib/supabase.js`, `lib/api.js` (patrones de `frontend/CLAUDE.md` §4), `main.jsx` con `QueryClientProvider` y `Toaster`.
- `router.jsx` con todas las rutas de `ui.md` §2 apuntando a páginas *placeholder* (título y nada más).
- `AppShell` con navbar (móvil abajo, escritorio arriba) usando la marca.
- Página `/salud` temporal que muestre el resultado de `GET /health` (se borra en S1).
- App instalable en iPhone (PWA) según `frontend/CLAUDE.md` §6.

**Acepta si:** `npm run dev` en la raíz abre `http://localhost:5173`, se ve la navbar con la marca y `/salud` dice "ok".
Desde un iPhone en la misma Wi-Fi, "Agregar a pantalla de inicio" muestra el ícono y el nombre Be Core, y la navbar inferior no queda tapada por la barra de gestos.

### S0-06 · Datos de demo (F)
- `backend/scripts/seed.js`: crea con `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name, role } })`
  2 organizadores (`santiago@becore.test`, `felipe@becore.test`) y 12 participantes (`jugador1@becore.test` …),
  todos con contraseña `BeCore2026!`. Si el usuario ya existe, lo reutiliza.
- Crea 6 eventos futuros en Medellín (fútbol, baloncesto, cine al aire libre, ciclopaseo, taller de danza, torneo de ajedrez) con cupos entre 8 y 30, y confirma algunas asistencias llamando a `confirm_attendance` por RPC.
- Script `npm run seed -w backend`. Debe poder correrse varias veces sin duplicar eventos (borra antes los eventos de los organizadores de demo).

**Acepta si:** tras correrlo, el panel de Supabase muestra 14 perfiles y 6 eventos con `confirmed_count` coherente.

---

## S1 · Usuarios y eventos (5 – 11 oct)

### S1-01 · Registro e inicio de sesión (S) · RF-01, RF-02
- `AuthContext` (`frontend/CLAUDE.md` §4.3), `ProtectedRoute`, `RoleRoute`.
- Páginas `/registro` (nombre, correo, contraseña, confirmar contraseña, selector de rol con dos tarjetas) y `/ingresar`.
- Errores traducidos (`ui.md` §5). Tras registrarse o ingresar → `/eventos`.

**Acepta si:** un usuario nuevo se registra como participante, cierra sesión, vuelve a entrar; con contraseña errada ve "Correo o contraseña incorrectos".

### S1-02 · Permisos por rol (S) · RF-03
- Navbar distinta por rol (`ui.md` §2). `RoleRoute` en rutas de organizador.
- Página `/perfil` con edición de nombre (`PATCH /me`) y cerrar sesión.
- Pruebas de backend: un participante que llama a `POST /events` recibe 403 (se completa cuando exista S1-03).

**Acepta si:** un participante que escribe `/eventos/nuevo` en la barra ve el aviso 403 y no el formulario.

### S1-03 · API de eventos (F) · RF-04, RF-05, RF-06, RF-07, RF-08, RF-09
- `schemas/events.schemas.js`, `repositories/events.repository.js`, `services/events.service.js`,
  `controllers/events.controller.js`, `routes/events.routes.js` según `api.md` §3 "Eventos".
- Incluye `myAttendance` consultando `attendances` del usuario para los ids de la página.
- Cancelar y editar **todavía sin correo**: deja un `// TODO S2-05` donde va el envío.
- Pruebas del service: crear (feliz y validación), editar no dueño (403), editar evento cancelado (409),
  bajar cupo por debajo de confirmados (409), cancelar, filtros `scope` y `category`.

**Acepta si:** todas las rutas responden lo que dice `api.md` con datos del seed.

### S1-04 · Descubre eventos (F) · RF-07
- `/eventos`: pestañas Próximos/Pasados, chips de categoría, filtro de fecha (desde/hasta), `EventCard`, paginación "Ver más".
- Estados de carga, vacío y error.

**Acepta si:** con el seed se ven 6 tarjetas; filtrar "Cultural" deja solo las culturales.

### S1-05 · Detalle de evento (F) · RF-08
- `/eventos/:id` con todos los datos, `CapacityBar`, organizador, estado. Para el dueño: botones Editar, Ver asistentes, Cancelar evento (con `Modal`).
- El botón de asistencia queda como placeholder deshabilitado hasta S2-02.

**Acepta si:** el dueño ve sus acciones y un participante no.

### S1-06 · Crear y editar evento (S) · RF-04, RF-05, RF-09
- Formulario compartido para `/eventos/nuevo` y `/eventos/:id/editar` con `react-hook-form` + Zod (mismos límites que la API).
- Fecha y hora con `<input type="datetime-local">`, convertir a ISO con zona de Bogotá antes de enviar.
- Errores de la API por campo (`details`) bajo cada input.

**Acepta si:** crear un evento lleva al detalle con toast "Evento publicado"; editar con cupo menor que confirmados muestra el error en el campo cupo.

### S1-07 · Avance de sprint (ambos)
`docs/progreso/01_2026-10-11_usuarios-y-eventos.md` con la plantilla de la sección "Plantilla de avance" al final de este archivo. Release `v0.1` (tag en `develop` → merge a `main`).

---

## S2 · Asistencia, citas y correo (12 – 18 oct) · lunes 12 festivo

### S2-01 · API de asistencia (S) · RF-10, RF-11, RF-12
- `repositories/attendance.repository.js` (RPC `confirm_attendance` / `cancel_attendance`, ver `database.md` §4),
  service, controller y rutas `POST`/`DELETE /events/:id/attendance` (rol participante).
- `utils/db-errors.js` traduce todos los códigos de `api.md` §2.
- Pruebas del service con el repositorio mockeado: feliz, `EVENT_FULL`, `ALREADY_CONFIRMED`, `NOT_CONFIRMED`, `EVENT_STARTED`, organizador intentando confirmar (403).

### S2-02 · Botón de asistencia (S) · RF-11, RF-12
- `AttendanceButton` según `ui.md` §4, con mutaciones de TanStack Query, actualización optimista del contador y `Modal` para cancelar.
- También en `EventCard`: insignia "Vas a ir" cuando `myAttendance.status === 'confirmed'`.

**Acepta si:** desde `/eventos` se confirma en 2 toques (tarjeta → Confirmar). Con el evento lleno, el botón dice "Sin cupos".

### S2-03 · Prueba de concurrencia (S) · KPI sobrecupo = 0
- `tests/integration/capacity.test.js` + script `test:integration`: crea un evento con cupo 10 y 30 usuarios del seed, dispara 30 RPC en paralelo con `Promise.allSettled`, verifica `confirmed_count === 10`, 10 éxitos y 20 `EVENT_FULL`. Limpia lo que creó.

### S2-04 · Check-in y asistentes (S) · RF-13
- `GET /events/:id/attendees`, `PATCH /events/:id/attendees/:userId`, `GET /events/:id/activity` (`api.md`).
- Página `/eventos/:id/asistentes`: lista con switch por persona, contador "Llegaron X de Y", búsqueda por nombre.

### S2-05 · Correo y avisos de cambios (F) · RF-17
- `mail/mailer.js`, plantillas de `api.md` §4 para `event_updated` y `event_cancelled`.
- Completar los `TODO S2-05` del service de eventos: registrar en `notifications` y enviar a los confirmados.
- Pruebas: editar lugar dispara envío a confirmados (mailer mockeado); editar solo la descripción no envía.

### S2-06 · Recordatorios automáticos (F) · RF-16
- `jobs/reminders.job.js` exactamente como `api.md` §5, registrado en `server.js`.
- Script `npm run reminders -w backend` que ejecuta `runRemindersOnce()` una vez (para la demo).
- Prueba de `runRemindersOnce` con repositorios mockeados: envía a confirmados, omite duplicados (`23505`).

### S2-07 · Disponibilidad y citas (F) · RF-14, RF-15
- API completa de disponibilidad y citas (`api.md`), incluido `GET /users/participants`.
- Páginas `/disponibilidad`, `/citas`, `/citas/nueva` (buscador de participantes con chips seleccionados).
- Correos `appointment_created` y `appointment_cancelled`; recordatorio de cita ya cubierto por S2-06.

### S2-08 · Avance y release (ambos)
`docs/progreso/02_2026-10-18_asistencia-y-notificaciones.md`. Release `v0.2`. Empezar a coordinar con los amigos la fecha del partido.

---

## S3 · Paneles, tiempo real y pruebas (19 – 25 oct)

### S3-01 · Panel del organizador (S) · RF-18
- `GET /dashboard/organizer` (`api.md`) + página `/panel` para organizador: 5 `StatCard`, tabla de eventos (móvil: lista de tarjetas) con confirmados, cancelados y llegaron, enlace a asistentes.

### S3-02 · Tiempo real (S)
- Hook `useRealtimeEvent(eventId)` (patrón de `frontend/CLAUDE.md` §4.5) en el detalle y en el panel.
- `ActivityTicker` en el detalle del evento (`ui.md` §4).

**Acepta si:** con dos navegadores abiertos, confirmar en uno mueve la barra de cupo y el ticker del otro sin recargar.

### S3-03 · Panel del participante (F) · RF-19
- `GET /dashboard/participant` + `/panel` para participante: Próximos, Pasados, Próximas citas.

### S3-04 · Pulido responsive (F)
- Revisar todas las pantallas a 390 px y 1440 px contra los mockups; foco visible; textos de `ui.md` §5.

### S3-05 · Cobertura y rendimiento (S) · RNF-03, RNF-05
- Cobertura ≥ 70 % en `events.service`, `attendance.service` (`vitest --coverage`, agregar `@vitest/coverage-v8` como dependencia de desarrollo).
- Medir con `npx autocannon -c 20 -d 15` `GET /events` y registrar p90 en el avance (meta < 2 s).

### S3-06 · Guía de instalación (F) · RNF-06
- `README.md` raíz: requisitos, clonar, `.env` desde `.env.example`, `npm install`, `npx supabase db push`, `npm run seed -w backend`, `npm run dev`, cómo entrar desde el celular en la misma Wi-Fi, usuarios de demo.
- El compañero lo sigue desde cero en su equipo y anota lo que falle.

### S3-07 · Plan de validación (F)
- Guion para el partido: tareas (registrarse, confirmar, cancelar y volver a confirmar, recibir recordatorio, check-in en la cancha), cuestionario SUS en Google Forms, preguntas abiertas.

### S3-08 · Avance y release (ambos)
`docs/progreso/03_2026-10-25_paneles-y-tiempo-real.md`. Release candidata `v0.9`.

---

## S4 · Validación y cierre (26 oct – 1 nov)

| Día | Qué pasa |
|---|---|
| lun 26 – mar 27 | Corrección de bugs pendientes. Último cambio de funcionalidad |
| mié 28 | Organizador crea el evento real del partido; amigos se registran y confirman |
| **jue 29** | **Congelamiento de código.** Release `v1.0` en `main`. Solo arreglos críticos con PR |
| vie 30 | Llega el recordatorio automático a los confirmados |
| sáb 31 | Partido: check-in en la cancha desde el celular del organizador, cuestionario SUS |
| dom 1 | Análisis de resultados, capturas y datos reales para la presentación |

### S4-01 · Correcciones (ambos) — issues etiquetados `critical` primero.
### S4-02 · Ejecución de la validación (ambos) — ver S3-07.
### S4-03 · Presentación (F) — diapositivas: problema, RSL en una lámina, arquitectura, demo, resultados del partido (SUS, asistencia real vs confirmada), conclusiones.
### S4-04 · Demo y respaldo (S) — guion de 5 minutos con el seed, video de respaldo de 3 minutos, checklist del día (portátil cargado, `npm run dev` probado, datos sembrados).
### S4-05 · Avance final (ambos) — `docs/progreso/04_2026-11-01_validacion-y-cierre.md`.

---

## Plantilla de avance (`docs/progreso/NN_YYYY-MM-DD_titulo.md`)

```markdown
# [Título]
**Sprint:** N · **Fecha:** YYYY-MM-DD · **Responsables:** Santiago / Felipe · **Estado:** Completado | En curso | Bloqueado

## 1. Objetivo
## 2. Qué se hizo (tareas y RF cubiertos)
## 3. Decisiones técnicas (contexto, opciones, decisión, por qué)
## 4. Cómo reproducir
## 5. KPIs del sprint (puntos, cobertura, p90, bugs abiertos)
## 6. Pendientes y riesgos
```
