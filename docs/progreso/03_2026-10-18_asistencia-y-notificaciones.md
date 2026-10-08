# Sprint 2 — Asistencia, check-in y notificaciones
**Sprint:** S2 · **Fecha:** 2026-10-18 · **Responsables:** Santiago / Felipe · **Estado:** Completado (correo real y campana pendientes para S3)

## 1. Objetivo

"Confirmar sin sobrecupo, cancelar liberando cupo, check-in y correos automáticos."

## 2. Qué se hizo (tareas y RF cubiertos)

| Tarea | Estado | RF |
|---|---|---|
| Fase 0 · Auditoría y cierre del Sprint 1 (ver §4) | ✅ | — |
| S2-01 API de asistencia: `POST/DELETE /events/:id/attendance` vía RPC | ✅ | RF-10, RF-11, RF-12 |
| S2-03 Prueba de concurrencia (30 RPC en paralelo, cupo 10) | ✅ | KPI sobrecupo = 0 |
| S2-02 `AttendanceButton` con actualización optimista, insignia "Vas a ir" en `EventCard` | ✅ | RF-11, RF-12 |
| S2-04 Check-in, `GET attendees`, `GET activity` y página `/eventos/:id/asistentes` | ✅ | RF-13 |
| S2-05 Mailer, plantillas, bitácora `notifications`, avisos al editar/cancelar evento | ✅ (sin envío real, falta SMTP) | RF-17 |
| S2-06 Recordatorios (`runRemindersOnce`), refresco de estados y registro del cron | ✅ | RF-16 |
| S2-07 Disponibilidad y citas (API + `/disponibilidad`, `/citas`, `/citas/nueva`) | ✅ | RF-14, RF-15 |

## 3. Decisiones técnicas (autónomas)

1. **Correos a `@becore.test`.** `sendMail` lanza `DEMO_ADDRESS_SKIPPED` sin tocar el transporte, antes incluso de comprobar el SMTP:
   así nunca se envía nada a direcciones falsas desde el Gmail del proyecto y la bitácora lo deja registrado en `notifications.error`.
2. **Sin SMTP configurado** `sendMail` lanza `SMTP_NOT_CONFIGURED` (en lugar de solo advertir como decía `backend/CLAUDE.md` §3); la fila queda con `error`.
3. **Compensación al crear una cita.** Se inserta la cita, luego los invitados; si lo segundo falla se borra la cita y se relanza el error.
4. **Avisos sin bloquear.** `notify` nunca lanza: usa `Promise.allSettled` y registra con `console.error`. Se espera (`await`) antes de responder para que la bitácora quede escrita.
5. **"Cambió el horario o lugar"** se decide comparando el `PATCH` con el evento guardado (fechas por instante, no por texto): reenviar el mismo lugar no avisa.
6. **Check-in.** Aplica con eventos `published` o `in_progress` (`EVENT_NOT_ACTIVE` en otro caso); `CHECKIN_NOT_OPEN` se evalúa antes de `NOT_CONFIRMED`, como pide el prompt. Marcar `false` no escribe en `activity_log`.
7. **`GET /events/:id/attendees`** devuelve confirmados y cancelados (el campo `status` lo diferencia), confirmados primero y luego por nombre (`localeCompare('es')`).
8. **`GET /appointments`**: `upcoming` = `starts_at >= ahora` (ascendente), `past` = anteriores (descendente); incluye las canceladas con su estado.
9. **`GET /users/participants`** sin `q` devuelve los primeros 20 participantes por nombre; con `q` de menos de 2 letras responde 400. Se quitan `, ( ) % * \` del texto antes de armar el filtro `ilike` de PostgREST.
10. **Invitados repetidos** en `participantIds` se deduplican antes de validar e insertar.
11. **Cron.** `server.js` registra `*/15 * * * *` (recordatorios) y `* * * * *` (estados) solo si `CRON_ENABLED === 'true'` y `NODE_ENV !== 'test'`. Se añadió `NODE_ENV` al esquema de `env.js` (con defecto `development`) para no leer `process.env` fuera de ahí.
12. **Cancelar asistencia desde la tarjeta** no se ofrece (la tarjeta solo muestra la insignia "Vas a ir"); cancelar se hace en el detalle con su Modal. Así la tarjeta no tiene controles anidados: enlace y botón son hermanos.
13. **Rutas del front.** `/disponibilidad` pasó a `RoleRoute organizer` (ui.md §2 la marca "org"). Desde `/citas` el organizador llega a "Mi disponibilidad" y "Nueva cita" sin tocar la navbar.
14. **`backend/CLAUDE.md` §4.3** sigue mostrando `auth.getClaims` aunque el código usa `auth.getUser`; solo se corrigió `CLAUDE.md` raíz, como pedía el encargo.
15. **`CLAUDE.md` §10** (línea de sprint actual) no se tocó en esta corrida; queda pendiente `docs: avanzar a sprint 3`.
16. **Vitest de integración** carga `backend/.env` con `loadEnv` de `vite` (sin imprimir nada); crea y borra 18 usuarios `carga01…18@becore.test` y se limpia aunque falle.

## 4. Fase 0 — cierre del Sprint 1

| Paso | Resultado | Evidencia | Commit |
|---|---|---|---|
| 0.1 Rama y estado | ✅ `feature/sprint-1` limpia y al día con origin | `git status` sin cambios (solo la carpeta no versionada `Claude outputs/`) | — |
| 0.2 Línea base | ✅ | lint 0 errores · 41 + 4 pruebas · build OK | — |
| 0.3 Migración faltante | ✅ versionada, no ejecutada | `supabase/migrations/20261001043003_…sql` idéntica al texto del encargo | `6208660` |
| 0.4 `db-errors` | ✅ | `EVENT_NOT_FOUND` 404 y `FORBIDDEN` 403; código por prefijo antes de `:`; 17 pruebas nuevas | `a2653ef` |
| 0.5 Specs al día | ✅ | `api.md`, `database.md`, `ui.md` y `CLAUDE.md` (`getUser`) | `ba15d14` |
| 0.6 Seed fresco | ✅ | 14 perfiles (2 org, 12 part) · 6 eventos `published` futuros · `confirmed_count` = asistencias confirmadas en los 6 | sin cambios |
| 0.7 a–i contra la API real | ✅ 19 comprobaciones OK | ver detalle abajo | — |
| 0.8 Revisión estática | ✅ sin hallazgos | `supabaseAdmin` solo en `config/`, `repositories/` y `middleware/require-auth.js` (patrón de `backend/CLAUDE.md` §4.3); sin `supabase` ni `req/res` en services/controllers; sin `console.log`; sin `/salud`; 2 `TODO S2-05` (editar y cancelar); formularios con RHF + Zod y los mismos límites; rutas de organizador en `RoleRoute` | — |
| 0.9 Puerta de salida | ✅ | lint 0 · 58 + 4 pruebas · build OK; `feature/sprint-1` subida a origin | — |

0.7: `organizer=me` como jugador1 devuelve **200 con lista vacía** (coincide con el código y con la nota del avance S1; no es 400).
Publicar un evento cancelado devuelve `EVENT_NOT_ACTIVE`, como dice el avance S1. Todo lo creado se borró por id (quedaron los 6 eventos del seed).

## 5. Cómo reproducir

```bash
git checkout feature/sprint-2 && npm install
npm run dev                          # backend :3000 y frontend :5173
npm test                             # 124 backend + 6 frontend
npm run test:integration -w backend  # prueba de concurrencia contra Supabase real
npm run reminders -w backend         # recordatorios una vez (demo)
npm run build -w frontend
```

## 6. KPIs del sprint

| KPI | Resultado |
|---|---|
| `npm run lint` | ✅ 0 errores (backend y frontend) |
| `npm test` | ✅ backend 124 (8 archivos nuevos o ampliados) · frontend 6 |
| `npm run build -w frontend` | ✅ sin errores (aviso de chunk > 500 kB, sin impacto en MVP local) |
| `npm run test:integration -w backend` | ✅ 30 llamadas en paralelo sobre cupo 10 → **10 confirmadas, 20 `EVENT_FULL`**, `confirmed_count` = 10 = asistencias confirmadas. **Sobrecupo = 0** |
| Cobertura / p90 | No medidos (S3-05) |

### Verificación real del Sprint 2 (API local + Supabase, cron desactivado durante la prueba)

| Caso | Esperado | Obtenido | |
|---|---|---|---|
| 1 jugador1 confirma evento del seed; repite | 201 y +1; 409 `ALREADY_CONFIRMED` | 201 (3); 409 `ALREADY_CONFIRMED` | ✅ |
| 2 santiago confirma | 403 | 403 `FORBIDDEN` | ✅ |
| 3 jugador1 cancela; repite | 200 y −1; 409 `NOT_CONFIRMED` | 200 (2); 409 `NOT_CONFIRMED` | ✅ |
| 4 cupo 1: jugador1 y jugador2 | 201 y 409 `EVENT_FULL` | 201 y 409 `EVENT_FULL` | ✅ |
| 5a check-in (evento en 90 min) | 200 `checkedIn: true` | 200 `true` | ✅ |
| 5b `GET attendees` | jugador1 `checkedIn: true` | `true` | ✅ |
| 5c `GET activity` | `checked_in` y `confirmed` | `checked_in, confirmed` | ✅ |
| 5d felipe hace check-in | 403 | 403 | ✅ |
| 5e evento del seed (en días) | 409 `CHECKIN_NOT_OPEN` | 409 `CHECKIN_NOT_OPEN` | ✅ |
| 5f `activity?limit=0` | 400 | 400 | ✅ |
| 6a PATCH `location` con 2 confirmados | 2 `event_updated` con `DEMO_ADDRESS_SKIPPED` | 2 | ✅ |
| 6b PATCH solo `description` | 0 filas nuevas | 0 | ✅ |
| 6c cancelar el evento | 2 `event_cancelled` | 2 | ✅ |
| 7a `npm run reminders` con evento en 3 h | 1 `event_reminder` | 1 | ✅ |
| 7b repetir | omitidos ≥ 1, 0 filas nuevas | `omitidos=2`, 0 nuevas | ✅ |
| 8 evento `published` empezado hace 1 min + `refresh_event_statuses` | `in_progress` | `in_progress` (el insert directo como `published` funcionó) | ✅ |
| 9 disponibilidad: crear / listar / felipe borra / dueño borra | 201 / aparece / 403 / 204 | 201 / sí / 403 / 204 | ✅ |
| 10a `GET /users/participants?q=jug` | ≤ 20, todos participant | 12, todos participant | ✅ |
| 10a2 `q` de 1 letra | 400 | 400 | ✅ |
| 10b cita con jugador1 y jugador2 | 201 y 2 `appointment_created` | 201 y 2 | ✅ |
| 10c jugador1 la ve en `GET /appointments` | sí | sí | ✅ |
| 10d invitado con el id de felipe | 400 `VALIDATION_ERROR` con details | 400 con 1 detalle | ✅ |
| 10e cancelar la cita | 200 y 2 `appointment_cancelled` | 200 y 2 | ✅ |
| 10f cancelar otra vez | 409 `APPOINTMENT_NOT_ACTIVE` | 409 | ✅ |
| 10g felipe cancela cita ajena | 403 | 403 | ✅ |
| 11 filas de los pasos 6, 7 y 10 | `sent_at` NULL y `DEMO_ADDRESS_SKIPPED` | 9 de 9 | ✅ |

`mail:test` **no** se ejecutó (sin credenciales SMTP). Al terminar se borró todo lo creado y se volvió a correr el seed (14 perfiles, 6 eventos, `confirmed_count` coherente).

## 7. Pendientes y riesgos

### Pendientes de BD
- Ninguno: no se cambió el esquema ni se tocó la base remota salvo datos de prueba (borrados) y el seed.

### Para una persona
1. **Credenciales SMTP** en `backend/.env` (`SMTP_USER`, `SMTP_PASS` de aplicación de Gmail, `MAIL_FROM`) y luego `npm run mail:test -w backend`. Mientras tanto todos los avisos quedan con `error` en `notifications`.
2. **Probar a mano** en navegador y en iPhone (pasos en el resumen de la sesión).
3. **Revisar el PR** `feature/sprint-2` → `develop` (lo aprueba y fusiona Felipe). Incluye S0, S1 y S2 porque `feature/sprint-0` y `feature/sprint-1` no se han fusionado.
4. **Tags `v0.1` y `v0.2`**: no se crearon (requieren `develop`); se crean después de fusionar.
5. Actualizar `CLAUDE.md` §10 a Sprint 3 (`docs: avanzar a sprint 3`).

### Riesgos
- Con `CRON_ENABLED=true` en `backend/.env`, `npm run dev` ejecuta los jobs contra la base real: cada minuto refresca estados y cada 15 min envía recordatorios (a `@becore.test` se omiten).
- Los íconos PNG de la app instalable siguen pendientes (`icon-192`, `icon-512`, `icon-512-maskable`, `apple-touch-icon`).
- La campana de notificaciones (S3): las filas de `notifications` ya se escriben con `message`, falta la API de lectura y el componente.
- `backend/CLAUDE.md` menciona `auth.getClaims`; el código usa `auth.getUser`.
