# Sprint 1 — Usuarios y eventos
**Sprint:** S1 · **Fecha:** 2026-10-11 · **Responsables:** Santiago / Felipe · **Estado:** Completado (con una nota sobre datos de demo, ver §6)

## 1. Objetivo

"Un organizador se registra, crea un evento con cupo y un participante lo encuentra en Descubre."

## 2. Qué se hizo (tareas y RF cubiertos)

| Tarea | Estado | RF |
|---|---|---|
| S1-03 API de eventos (listar, crear, ver, editar, cancelar, publicar) | ✅ | RF-04 a RF-09 |
| S1-01 Registro e inicio de sesión (`/registro`, `/ingresar`, `AuthContext`); se eliminó `/salud` | ✅ | RF-01, RF-02 |
| S1-02 Permisos por rol: navbar por rol, `RoleRoute` con 403 amable, `/perfil` (`PATCH /me`) | ✅ | RF-03 |
| S1-06 Formulario compartido de crear/editar evento | ✅ | RF-04, RF-05, RF-09 |
| S1-04 Descubre: pestañas, chips de categoría, filtro de fechas, "Ver más" | ✅ | RF-07 |
| S1-05 Detalle de evento con acciones del dueño (botón de asistencia deshabilitado hasta S2-02) | ✅ | RF-08 |
| Fix S0-06: el seed publica los eventos y cuenta las asistencias reales | ✅ | — |

## 3. Decisiones técnicas (autónomas)

1. **Estados del evento (D-01).** Las specs dicen `scheduled`; la BD real manda: `draft → published | cancelled`,
   `published → in_progress | finished | cancelled`, `in_progress → finished | cancelled`. Se usan los 5 estados.
2. **Crear y publicar.** `api.md` no habla de publicar, así que se implementaron ambas vías: `POST /events` acepta
   `status: 'draft' | 'published'` (defecto `draft`) y existe `POST /events/:id/publish` (solo dueño, solo desde `draft`).
   El formulario de la interfaz crea con `status: 'published'` (toast "Evento publicado.").
3. **Borradores.** Solo los ve su organizador: en el listado no aparecen (salvo `organizer=me`) y en `GET /events/:id`
   un ajeno recibe 404 `EVENT_NOT_FOUND`.
4. **Listado público.** Solo `published` e `in_progress` (próximos) y `published`/`in_progress`/`finished` (pasados).
   Un evento `in_progress` se considera "próximo" aunque su hora de inicio ya pasó. Los cancelados solo salen con `organizer=me`.
5. **Código de transición inválida.** `api.md` no define uno: se usa 409 `INVALID_EVENT_TRANSITION` (el mismo código del trigger
   de la BD, que `db-errors.js` también traduce junto con `INVALID_INITIAL_STATUS`). Publicar algo ya publicado → ese código;
   publicar/editar/cancelar un evento cancelado o finalizado → 409 `EVENT_NOT_ACTIVE` (regla 3 de `api.md`).
6. **Cancelar** aplica las reglas 1–4 de editar (incluye `EVENT_STARTED` si ya empezó), tal como dice `api.md`.
7. **`db-errors.js`** ahora también reconoce `events_confirmed_within_capacity` en `error.message`, porque PostgREST no
   siempre devuelve `constraint_name`.
8. **`myAttendance`** se resuelve en `attendance.repository.js` (`findUserAttendances`), que S2-01 ampliará con las RPC.
9. **Rutas del front con 403**: `/eventos/nuevo`, `/eventos/:id/editar` y `/eventos/:id/asistentes` van dentro de `RoleRoute`.
   La edición además verifica en pantalla que el usuario sea el dueño (el backend es la validación real).
10. **Edición y `endsAt`.** El `PATCH` no permite borrar un fin ya guardado (el esquema exige una fecha ISO); el formulario solo envía `endsAt` si tiene valor.
11. **Diseño.** El contenido va sobre fondo claro (`ui.md` §3) y la navbar/encabezados en `navy-900`. En móvil se añadió una barra superior con `safe-area-inset-top` porque la barra de estado es translúcida.
12. **AuthContext.** Se usa solo `onAuthStateChange` (`INITIAL_SESSION`) y el perfil se pide fuera del callback (con `setTimeout`) para evitar bloqueos del cliente de Auth; `signIn`/`signUp` esperan al perfil antes de navegar, así la navbar y `RoleRoute` no parpadean.

## 4. Cómo reproducir

```bash
git checkout feature/sprint-1 && npm install
npm run dev                 # http://localhost:5173 (backend :3000)
npm test                    # 41 pruebas backend + 4 frontend
npm run build -w frontend
```

## 5. KPIs del sprint

| KPI | Resultado |
|---|---|
| `npm run lint` | ✅ 0 errores (backend y frontend) |
| `npm test` | ✅ backend 41 (health, perfil, servicio y rutas de eventos); frontend 4 (conversión de fechas Bogotá) |
| `npm run build -w frontend` | ✅ sin errores (aviso de chunk > 500 kB, sin impacto en MVP local) |
| Verificación contra Supabase real | 14 de 16 casos OK; 2 fallan por datos del seed vencidos, no por código (ver abajo) |
| Cobertura / p90 | No medidos (S3-05) |

### Verificación real (API local + Supabase, usuarios del seed)

| Caso | Esperado | Obtenido | |
|---|---|---|---|
| a1 `GET /events` con todo en borrador | 200, total 0 | 200, total 0 | ✅ |
| a2 publicar borradores del seed como dueño | publica | solo 1 publicado (los otros 5 ya empezaron: `EVENT_STARTED`) | ⚠️ |
| a3 `GET /events` lista eventos del seed | total ≥ 6 | total 1 | ❌ datos vencidos |
| a4 filtro `category=culture` | solo culturales | 0 eventos (los 2 culturales ya pasaron) | ❌ datos vencidos |
| b organizador crea evento | 201 | 201 | ✅ |
| c participante crea evento | 403 | 403 `FORBIDDEN` | ✅ |
| c2 cupo 0 | 400 | 400 `VALIDATION_ERROR` | ✅ |
| d participante ve borrador ajeno | 404 y ausente de la lista | 404, ausente | ✅ |
| d2 el dueño ve su borrador | 200 | 200 | ✅ |
| d3 editar evento ajeno | 403 | 403 | ✅ |
| e0 `confirm_attendance` ×2 (RPC) | OK | OK (confirmed_count 1 y 2) | ✅ |
| e bajar cupo bajo confirmados | 409 `CAPACITY_BELOW_CONFIRMED` | 409 `CAPACITY_BELOW_CONFIRMED` | ✅ |
| e2 `myAttendance` de jugador1 | confirmed | `{status: confirmed, checkedIn: false}` | ✅ |
| f0 publicar un evento ya publicado | 409 | 409 `INVALID_EVENT_TRANSITION` | ✅ |
| f1 dueño cancela su evento | 200 cancelled | 200 cancelled | ✅ |
| f2 publicar el cancelado | error | 409 `EVENT_NOT_ACTIVE` | ✅ |

Los eventos de prueba se borraron al terminar. Los 6 eventos del seed se crearon el 1 de oct con fechas de +72 h a +192 h:
a 8 de oct solo "Torneo de ajedrez relámpago" (9 oct) sigue en el futuro y quedó **publicado**; los otros 5 siguen en `draft` y ya pasaron,
así que ni la API ni Descubre pueden mostrarlos.

## 6. Pendientes y riesgos

### Pendientes de BD
- Ninguno: no hizo falta cambiar el esquema.
- Las specs (`database.md`, `api.md`, `ui.md`) todavía nombran el estado `scheduled`; hay que actualizarlas a los 5 estados de D-01.
  La migración `20261001043003_event_lifecycle_and_notification_inbox` está aplicada en Supabase pero **no está en el repo** (riesgo para el compañero: `db push` / clonado desde cero).

### Para una persona
1. **Refrescar los datos de demo**: con el seed corregido (`npm run seed -w backend`) los 6 eventos nacen publicados con fechas futuras y con asistencias reales. No se ejecutó de nuevo porque estaba prohibido en esta corrida.
2. Probar a mano en navegador y en iPhone (ver resumen de la sesión).
3. Revisar el PR hacia `develop` (lo aprueba y fusiona Felipe).

### Riesgos
- `feature/sprint-1` incluye todo el Sprint 0 porque `feature/sprint-0` no se había fusionado.
- Los íconos PNG de la app instalable siguen pendientes (`icon-192`, `icon-512`, `icon-512-maskable`, `apple-touch-icon`).
- Correos de cancelación/edición: solo hay `// TODO S2-05` en `events.service.js`.
- El botón "Confirmar asistencia" del detalle es un placeholder deshabilitado hasta S2-02.
