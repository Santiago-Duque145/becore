# Estado de los sprints (Fase 1)
**Fecha:** 2026-10-17 · **Rama:** `feature/estado-sprints` · **Estado:** Completado · Sesión de solo lectura sobre la app (lo único que cambió en código fue el arreglo del consentimiento, ver §1)

> El `05_` es el informe de demográficos y consentimiento. `docs/PLAN.md` §3 todavía llama `05_…estado-sprints.md` a este informe: el nombre correcto es `06_…`.

## 1. Cambios de esta sesión (antes del estado)

| Commit | Qué |
|---|---|
| `8e210bd` | Sexo, rango de edad y consentimiento de datos (migración, API, registro, `/privacidad`, onboarding de 6 pasos, Perfil) |
| `274203a` | Arreglo del login: `findProfileById` propaga errores de base; el interceptor solo cierra sesión con 401 `UNAUTHENTICATED` |
| `1cf3f8f` | Consentimiento obligatorio para todos, sin "Ahora no": primer paso de `/bienvenida` para quien entra por Google; diálogo modal accesible (foco atrapado, sin cierre por Escape ni clic afuera, salida "Salir") para cuentas viejas; precarga de sexo y edad |
| `6db2d65` | `docs/PLAN.md` reemplaza a `docs/PLAN-santiago.md` |

Verificación: backend 215 pruebas, frontend 82, `eslint` y `vite build` sin errores. El paso de consentimiento, el diálogo modal y la sección "Sobre ti" **no se vieron en pantalla** (piden sesión real): probarlos a mano.

## 2. Backlog tarea por tarea

Criterio: **Hecha y probada** = pruebas automáticas o verificación real; **Hecha sin pruebas** = funciona según el informe de su sprint pero sin prueba automática; **Parcial** / **No empezada**.

| Tarea | Estado | Qué falta |
|---|---|---|
| S0-00 Configuración manual | Hecha | — (Supabase, Gmail, Google OAuth configurados; "Confirm email" cambia con P5) |
| S0-01 Monorepo y herramientas | Hecha y probada | — (`ci.yml` existe; no verifiqué una corrida en GitHub) |
| S0-02 Esqueleto backend | Hecha y probada | — |
| S0-03 Migración inicial | Hecha y probada | — (4 migraciones iguales en local y remoto) |
| S0-04 Autenticación backend | Hecha y probada | — (usa `getUser`; `backend/CLAUDE.md` §4.3 aún muestra `getClaims`) |
| S0-05 Esqueleto frontend + PWA | Hecha y probada | — (rediseñado en R1–R9) |
| S0-06 Datos de demo | Hecha y probada | — (seed vigente: 14 cuentas `@becore.test`) |
| S1-01 Registro e inicio de sesión | Hecha y probada | — (cambió por spec: registro sin rol, `/ingresar` redirige a `/login`) |
| S1-02 Permisos por rol | Hecha y probada | — |
| S1-03 API de eventos | Hecha y probada | — |
| S1-04 Descubre eventos | Hecha y probada | — (rediseñada en R5) |
| S1-05 Detalle de evento | Hecha sin pruebas | Solo verificación manual de la página (R6) |
| S1-06 Crear y editar evento | Hecha y probada | — (`event-schema` con pruebas) |
| S1-07 Avance y release `v0.1` | Parcial | **No hay ningún tag en Git** (`git tag` vacío) |
| S2-01 API de asistencia | Hecha y probada | — |
| S2-02 Botón de asistencia | Hecha y probada | — (`useAttendance` con pruebas; UI manual) |
| S2-03 Prueba de concurrencia | Hecha y probada | — (30 en paralelo, cupo 10 → 10 y 20 `EVENT_FULL`; no la volví a correr hoy) |
| S2-04 Check-in y asistentes | Hecha y probada | — |
| S2-05 Correo y avisos de cambios | Hecha y probada | — (envío real verificado hoy, §4) |
| S2-06 Recordatorios automáticos | Hecha y probada | — (corrida real verificada hoy; el cron de 15 min no lo observé disparar solo) |
| S2-07 Disponibilidad y citas | Hecha y probada (API) | Interfaz sin probar de punta a punta (§5) |
| S2-08 Avance y release `v0.2` | Parcial | Informe hecho (`03_…`); **sin tag `v0.2`** |
| S3-01 Panel del organizador | Hecha y probada | — (R8; servicio con pruebas) |
| S3-02 Tiempo real | Hecha sin pruebas | Solo manual: `useRealtimeEvent` y ticker |
| S3-03 Panel del participante | Hecha y probada | — |
| S3-04 Pulido responsive | Hecha | — (R9: Lighthouse Accesibilidad 100 según el informe 04) |
| S3-05 Cobertura y rendimiento | Parcial | Cobertura cumplida (§3). Falta medir el **p90 de `GET /events`** con `autocannon` (meta < 2 s) |
| S3-06 Guía de instalación (README) | **No empezada** | `README.md` tiene 2 líneas |
| S3-07 Plan de validación | **No empezada** | Falta el guion del partido y el cuestionario SUS |
| S3-08 Avance y release `v0.9` | **No empezada** | Informe del sprint 3 y tag |
| S4-01 a S4-05 | **No empezada** | Correcciones, validación (31 oct), presentación, guion de demo y video de respaldo, informe final |

Desfase de documentos: `CLAUDE.md` §10 sigue en "Sprint actual: S1" (se pidió `docs: avanzar a sprint N`).

## 3. RF-01 a RF-19

| RF | Qué | Estado |
|---|---|---|
| RF-01 | Registro | Hecha y probada |
| RF-02 | Login, Google y recuperación | Hecha y probada (7 pruebas manuales del login + login real hoy) |
| RF-03 | Roles | Hecha y probada |
| RF-04 | Crear evento | Hecha y probada |
| RF-05 | Editar evento | Hecha y probada |
| RF-06 | Cancelar evento (con aviso) | Hecha y probada |
| RF-07 | Descubrir y "Para ti" | Hecha y probada |
| RF-08 | Detalle de evento | Hecha (API probada; página solo manual) |
| RF-09 | Validación del formulario | Hecha y probada |
| RF-10 | Sin sobrecupo | Hecha y probada (integración contra Supabase real) |
| RF-11 | Confirmar asistencia | Hecha y probada |
| RF-12 | Cancelar asistencia | Hecha y probada |
| RF-13 | Check-in | Hecha y probada |
| RF-14 | Citas | **Parcial**: API probada hoy (18/18); falta recorrer la interfaz |
| RF-15 | Disponibilidad | **Parcial**: API probada hoy; falta recorrer la interfaz |
| RF-16 | Recordatorios | Hecha y probada |
| RF-17 | Avisos de cambio o cancelación | Hecha y probada |
| RF-18 | Panel del organizador | Hecha y probada |
| RF-19 | Panel del participante | Hecha y probada |

Ningún RF está "No empezado". Pendiente transversal: las páginas de React no tienen pruebas automáticas (las 82 pruebas del frontend cubren `lib/`, reducers, constantes y hooks).

### Cobertura (`vitest --coverage`, backend, 215 pruebas)

| Archivo | Líneas | Ramas |
|---|---|---|
| `events.service.js` | 100 % | 94,4 % |
| `attendance.service.js` | 100 % | 100 % |
| `appointments.service.js` | 93,5 % | 100 % |
| `availability.service.js` | 100 % | 100 % |
| `notifications.service.js` | 95,5 % | 75 % |
| `reminders.job.js` | 92,6 % | 25 % |
| **Total del backend** | **75,3 %** | 59,4 % |

Objetivo ≥ 70 % en eventos, cupos y asistencia: **cumplido** (la lógica de cupos vive en la función SQL `confirm_attendance`, cubierta por la prueba de integración, que no entra en `npm test`). Los repositorios (15 %) y `server.js`/`schedule.js` (0 %) no tienen prueba unitaria.

## 4. Correos con el SMTP actual

Prueba real con el código del backend: evento `[PRUEBA]` que empezaba en 2 h, creado por un organizador de demo, con **un participante real** confirmado (`fe***@gmail.com`, elegido porque fue el último ingreso; el correo `scalytics.co@gmail.com` no tiene perfil).

| Tipo | Resultado |
|---|---|
| `event_reminder` (`runRemindersOnce`, el mismo código del cron) | enviados=1, omitidos=0, fallidos=0 |
| `event_updated` (cambio de lugar) | `sent_at` marcado, sin error |
| `event_cancelled` | `sent_at` marcado, sin error |

El SMTP aceptó los 3 envíos. **No confirmé la llegada a la bandeja ni que no cayeran en spam** (no tengo acceso a ese buzón): hay que mirarla. Evento, asistencia y avisos de prueba se borraron (0 eventos `[PRUEBA]` restantes). Los correos a `@becore.test` se omiten por diseño (`DEMO_ADDRESS_SKIPPED`). El cron está registrado cuando `CRON_ENABLED=true`; no lo vi dispararse solo.

## 5. Citas y disponibilidad

Prueba por la API real (organizador y participante de demo): **18/18 OK**, incluidos permisos y validaciones.

| Prueba | Resultado |
|---|---|
| Crear disponibilidad; > 8 h → 400; listar; participante → 403 | OK |
| Buscar participantes; 1 letra → 400 | OK |
| Crear cita con 2 invitados; participante → 403; sin invitados → 400; en el pasado → 400 | OK |
| Organizador e invitado ven la cita en `upcoming` | OK |
| Aviso `appointment_created` por invitado (omitido por ser `@becore.test`) y `appointment_cancelled` registrados | OK |
| Cancelar; participante → 403; cancelar dos veces → `APPOINTMENT_NOT_ACTIVE` | OK |
| Borrar disponibilidad | OK |

Limpieza: la tabla quedó en 0 citas. **Interfaz: no probada.** Solo revisé que `services/appointments.api.js` apunta a las mismas rutas y que las fechas pasan por `bogotaInputToIso`. Falta recorrer `/disponibilidad`, `/citas` y `/citas/nueva` en el navegador (no hay automatización de navegador instalada).

## 6. Para la IA (Fase 3)

**Módulo "Para ti" (R5)**, `backend/src/services/recommendations/`:

| Archivo | Función |
|---|---|
| `index.js` | `getCandidates(user)` (publicados, futuros, con cupo, no confirmados ni propios) y `getRecommendations(user, limit)` |
| `score.js` | `scoreEvent(event, prefs)` → `{ score, reason }` (función pura), `rankScored(scored, limit)`, `bogotaDayAndSlot`, `normalizeText` |
| `repositories/events.repository.js` | `listRecommendationCandidates({ excludeOrganizerId, max = 200 })` |
| `repositories/preferences.repository.js` | `findPreferencesByUserId` |
| `controllers/events.controller.js` | `listRecommended` |

Puntaje: categoría +3; día, franja y zona +1 cada uno (hora de Bogotá). Se excluye puntaje 0; orden por puntaje desc, `startsAt` asc, `id`. `index.js` ya documenta el enganche para un re-ranking con IA y el comentario de privacidad (sexo y edad no entran).

**Contrato `GET /api/v1/events/recommended?limit=6`** (`limit` 1–20, defecto 6; exige sesión): `{ data: Event[] }` donde cada `Event` trae además `reason` (texto en español). Sin gustos guardados devuelve `[]`. Va antes de `/events/:id` en el router. Frontend: `useRecommendedEvents()` y `pages/descubre/ParaTiCarousel.jsx`.

**pgvector:** disponible (`default_version` 0.8.2) y **no instalado** (`installed_version` NULL). No se instaló.

**Variables de `backend/.env.example`** (solo nombres): `PORT`, `FRONTEND_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `REMINDER_HOURS_BEFORE`, `CRON_ENABLED`. **Frontend:** `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. Faltan en `.env.example` (y en `env.js`) las que pide `PLAN.md`: `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_EMBEDDING_MODEL`, `GEMINI_IMAGE_MODEL`, `AI_ENABLED`, `AI_IMAGES_ENABLED` y `APP_URL`. No leí ningún `.env`.

## 7. Cruce con la sesión P0 (`PLAN.md` §5)

| Punto de P0 | Estado |
|---|---|
| 1. Nota de alcance | Hecha, en `CLAUDE.md` **§9** (el plan dice §8, pero §8 es Git) |
| 2. Migración `…demographics_consent` | Hecha y aplicada en Supabase (`20261021120000`) |
| 3. Casilla en registro y Google, `/privacidad`, API guarda `data_consent_at` | Hecha; Google ahora acepta en el primer paso de `/bienvenida` |
| 4. Paso "Cuéntanos un poco de ti", 6 pasos, edición en Perfil | Hecha (7 pasos si falta el consentimiento) |
| 5. Diálogo para usuarios existentes | Hecha, **cambiada por decisión**: modal obligatorio con "Salir", no "una sola vez sin bloquear" |
| 6. Comentario "sexo y edad no van a Gemini" | Hecha |
| 7. Pruebas | Hechas |
| Verificación a 390 y 1440 px | **Parcial**: `/registro` y `/privacidad`; falta el paso nuevo, el diálogo y Perfil |
| Informe en `docs/progreso/` | Hecho (`05_…`) |

## 8. Pendientes por prioridad

**Crítico antes del 29 oct (congelamiento)**
1. Probar a mano el flujo de consentimiento (Google nuevo, correo nuevo, cuenta vieja) y "Sobre ti" en Perfil, a 390 y 1440 px.
2. Confirmar que los 3 correos de prueba llegaron a la bandeja (no a spam).
3. Recorrer la interfaz de citas y disponibilidad (RF-14/15); hoy solo la API está probada.
4. Decisión del director sobre IA **antes del 24** (`PLAN.md` §1); sin ella la Fase 3 no arranca.
5. Confirmar el correo de solicitudes de datos que muestra `/privacidad` (hoy sale de `.env.example`).

**Importante**
6. Fase 2 (18–20): README reproducible en ambos equipos (S3-06) y medir el p90 de `GET /events` (S3-05).
7. P0–P5 del 21 al 23 de oct (calificación, avatares, correos con código…) según `PLAN.md`.
8. Tags `v0.1` y `v0.2` nunca se crearon; `CLAUDE.md` §10 sigue en S1.
9. Plan de validación del partido y cuestionario SUS (S3-07).
10. Agregar a `.env.example` y `env.js` las variables de IA y `APP_URL`.

**Después**
11. Pruebas automáticas de páginas React y de repositorios (15 % de cobertura); probar el cron de 15 min en vivo.
12. `backend/CLAUDE.md` §4.3 aún muestra `getClaims` (el código usa `getUser`).
