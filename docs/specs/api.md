# Contrato de la API — Be Core

Base: `http://localhost:3000/api/v1`. JSON en camelCase. Todas las rutas exigen
`Authorization: Bearer <access_token de Supabase>` salvo `GET /health`.

Registro, inicio y cierre de sesión **no** pasan por esta API: el frontend los hace con Supabase Auth
(ver `frontend/CLAUDE.md` §4.3). La API solo verifica el token.

## 1. Objetos

### Profile
```json
{ "id": "uuid", "email": "ana@correo.com", "fullName": "Ana Gómez", "role": "organizer", "createdAt": "ISO" }
```

### Event
```json
{
  "id": "uuid",
  "title": "Partido 5v5 del sábado",
  "description": "Llevar camiseta oscura",
  "category": "sport",
  "location": "Cancha sintética Estadio, Medellín",
  "startsAt": "2026-10-31T20:00:00.000Z",
  "endsAt": "2026-10-31T21:30:00.000Z",
  "capacity": 12,
  "confirmedCount": 9,
  "availableSpots": 3,
  "isFull": false,
  "isPast": false,
  "status": "published",
  "cancelledAt": null,
  "organizer": { "id": "uuid", "fullName": "Santiago Duque" },
  "myAttendance": { "status": "confirmed", "checkedIn": false },
  "createdAt": "ISO",
  "updatedAt": "ISO"
}
```
`status` es uno de `draft`, `published`, `in_progress`, `finished`, `cancelled` (ver `database.md` §2b).
`availableSpots`, `isFull` e `isPast` se calculan en el service. `myAttendance` es `null` si el usuario
nunca confirmó.

### Appointment
```json
{
  "id": "uuid", "title": "Reunión de capitanes", "notes": "", "location": "Cafetería",
  "startsAt": "ISO", "endsAt": "ISO", "status": "scheduled",
  "organizer": { "id": "uuid", "fullName": "..." },
  "participants": [{ "id": "uuid", "fullName": "...", "email": "..." }]
}
```

## 2. Errores

Formato: `{ "error": { "code": "EVENT_FULL", "message": "El evento ya no tiene cupos", "details"?: [...] } }`

| Código | HTTP | Mensaje para el usuario |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Revisa los datos enviados (con `details` por campo) |
| `UNAUTHENTICATED` | 401 | Debes iniciar sesión / Tu sesión expiró, inicia sesión de nuevo |
| `FORBIDDEN` | 403 | No tienes permiso para esta acción |
| `NOT_FOUND`, `EVENT_NOT_FOUND` | 404 | No encontramos lo que buscas / El evento no existe |
| `EVENT_FULL` | 409 | El evento ya no tiene cupos |
| `ALREADY_CONFIRMED` | 409 | Ya confirmaste tu asistencia a este evento |
| `NOT_CONFIRMED` | 409 | No tienes una asistencia confirmada en este evento |
| `EVENT_NOT_ACTIVE` | 409 | El evento fue cancelado |
| `INVALID_EVENT_TRANSITION` | 409 | Ese cambio de estado no está permitido para el evento |
| `INVALID_INITIAL_STATUS` | 409 | Un evento nuevo no puede crearse en ese estado |
| `EVENT_STARTED` | 409 | El evento ya empezó, no se puede modificar |
| `CAPACITY_BELOW_CONFIRMED` | 409 | El cupo no puede ser menor que los confirmados actuales |
| `CHECKIN_NOT_OPEN` | 409 | El check-in se habilita 2 horas antes del evento |
| `APPOINTMENT_NOT_ACTIVE` | 409 | La cita fue cancelada |
| `DUPLICATE`, `CONSTRAINT_VIOLATION` | 409 | Ese registro ya existe / Los datos no cumplen las reglas |
| `INTERNAL_ERROR` | 500 | Algo salió mal, intenta de nuevo |

## 3. Endpoints

Leyenda de acceso: **todos** = cualquier usuario autenticado; **org** = rol `organizer`;
**part** = rol `participant`; **dueño** = el organizador que creó el recurso (si no lo es → 403).

### Sistema y perfil

| Método | Ruta | Acceso | Body / Query | Respuesta |
|---|---|---|---|---|
| GET | `/health` | público | — | `{ data: { status: "ok" } }` |
| GET | `/me` | todos | — | `Profile` |
| PATCH | `/me` | todos | `{ fullName }` 2–80 | `Profile` |

### Eventos (RF-04 a RF-09)

| Método | Ruta | Acceso | Body / Query | Respuesta |
|---|---|---|---|---|
| GET | `/events` | todos | ver "Filtros" | `{ data: Event[], meta: { total, page, pageSize } }` |
| POST | `/events` | org | ver "Crear" | 201 `Event` |
| GET | `/events/:id` | todos | — | `Event` |
| PATCH | `/events/:id` | dueño | mismos campos de crear, todos opcionales (mínimo uno) | `Event` |
| POST | `/events/:id/publish` | dueño | — | `Event` (solo desde `draft`; si no → 409 `INVALID_EVENT_TRANSITION`) |
| POST | `/events/:id/cancel` | dueño | — | `Event` |

**Filtros de `GET /events`** (query, todos opcionales):
- `scope`: `upcoming` (defecto: `starts_at >= now()`, orden ascendente) o `past` (`starts_at < now()`, orden descendente).
- `category`: uno de los enumerados.
- `from`, `to`: fecha `YYYY-MM-DD` (inclusive, interpretada en `America/Bogota`).
- `organizer`: solo acepta `me` → eventos del usuario actual (incluye cancelados).
- `page` (defecto 1), `pageSize` (defecto 12, máximo 50).
- Sin `organizer=me`, los eventos cancelados **no** aparecen.

**Crear evento — body:**
| Campo | Regla |
|---|---|
| `title` | texto 3–100, recortado |
| `description` | texto 0–2000, opcional (defecto `""`) |
| `category` | `sport` \| `culture` \| `recreation` \| `other` |
| `location` | texto 3–200 |
| `startsAt` | ISO 8601 con zona, en el futuro |
| `endsAt` | opcional, ISO 8601, mayor que `startsAt` |
| `status` | opcional, `draft` (defecto) \| `published` |
| `capacity` | entero 1–1000 |

**Editar (`PATCH`) — reglas del service, en este orden:**
1. No existe → 404 `EVENT_NOT_FOUND`. 2. No es el dueño → 403. 3. Cancelado → 409 `EVENT_NOT_ACTIVE`.
4. Ya empezó → 409 `EVENT_STARTED`. 5. `capacity < confirmedCount` → 409 `CAPACITY_BELOW_CONFIRMED`.
6. Guarda. 7. Si cambió `startsAt`, `endsAt` o `location`, envía correo `event_updated` a los confirmados (RF-17).

**Cancelar:** mismas reglas 1–4, luego `status = 'cancelled'`, `cancelled_at = now()` y correo
`event_cancelled` a los confirmados (RF-06, RF-17).

### Asistencia (RF-10 a RF-13)

| Método | Ruta | Acceso | Body | Respuesta |
|---|---|---|---|---|
| POST | `/events/:id/attendance` | part | — | 201 `{ confirmedCount, myAttendance }` |
| DELETE | `/events/:id/attendance` | part | — | 200 `{ confirmedCount, myAttendance }` |
| GET | `/events/:id/attendees` | dueño | — | `[{ userId, fullName, email, status, checkedIn, confirmedAt }]` confirmados primero, luego por nombre |
| PATCH | `/events/:id/attendees/:userId` | dueño | `{ checkedIn: boolean }` | `{ userId, checkedIn }` |
| GET | `/events/:id/activity` | todos | query `limit` 1–20 (defecto 10) | `[{ id, actorName, action, createdAt }]` más reciente primero |

- Confirmar y cancelar llaman a las funciones SQL `confirm_attendance` / `cancel_attendance`
  (ver `database.md` §4). El backend **no** recalcula cupos por su cuenta.
- Check-in: asistencia debe estar `confirmed` (si no → `NOT_CONFIRMED`), evento `published` o `in_progress`
  (si no → `EVENT_NOT_ACTIVE`) y `now() >= startsAt - 2 horas` (si no → `CHECKIN_NOT_OPEN`).
  Al marcar `true` inserta `activity_log` con `action = 'checked_in'`.

### Paneles (RF-18, RF-19)

**`GET /dashboard/organizer`** (org) → eventos del organizador con `starts_at` desde hace 30 días en adelante:
```json
{
  "totals": { "upcomingEvents": 3, "confirmed": 27, "cancelled": 4, "checkedIn": 9, "occupancyRate": 0.75 },
  "events": [{ "id": "uuid", "title": "...", "startsAt": "ISO", "status": "published", "isPast": false,
               "capacity": 12, "confirmedCount": 9, "cancelledCount": 2, "checkedInCount": 0 }]
}
```
`occupancyRate` = suma de `confirmedCount` ÷ suma de `capacity` de los eventos próximos no cancelados (0 si no hay).

**`GET /dashboard/participant`** (todos) →
```json
{ "upcomingEvents": [Event], "pastEvents": [Event], "upcomingAppointments": [Appointment] }
```
Solo eventos con asistencia `confirmed` del usuario. `pastEvents`: últimos 10.

### Disponibilidad (RF-15)

| Método | Ruta | Acceso | Body | Respuesta |
|---|---|---|---|---|
| GET | `/availability/mine` | org | — | bloques futuros, orden ascendente |
| POST | `/availability` | org | `{ startsAt, endsAt }` futuro, `endsAt > startsAt`, duración máx. 8 h | 201 bloque |
| DELETE | `/availability/:id` | dueño | — | 204 |

No se validan cruces entre bloques (alcance básico, así lo dice RF-15).

### Citas y reuniones (RF-14)

| Método | Ruta | Acceso | Body / Query | Respuesta |
|---|---|---|---|---|
| GET | `/users/participants` | org | `q` (opcional, busca en nombre o correo, mínimo 2 letras) | `[{ id, fullName, email }]` máximo 20 |
| POST | `/appointments` | org | ver abajo | 201 `Appointment` |
| GET | `/appointments` | todos | `scope=upcoming\|past` | `Appointment[]` donde soy organizador o invitado |
| POST | `/appointments/:id/cancel` | dueño | — | `Appointment` |

Crear cita: `title` 3–100, `notes` 0–1000, `location` 0–200, `startsAt` futuro, `endsAt > startsAt`,
`participantIds` arreglo de 1 a 30 uuids de perfiles con rol `participant`. Envía `appointment_created`
a cada invitado. Cancelar envía `appointment_cancelled`; si ya estaba cancelada → `APPOINTMENT_NOT_ACTIVE`.

## 4. Correos (RF-16, RF-17)

| Tipo | Asunto | Cuándo |
|---|---|---|
| `event_reminder` | `Recordatorio: {title} – {fecha y hora}` | Cron, antes del evento |
| `event_updated` | `Cambios en {title}` | PATCH cambia fecha, hora o lugar |
| `event_cancelled` | `Se canceló {title}` | POST cancel |
| `appointment_created` | `Nueva cita: {title}` | POST appointments |
| `appointment_reminder` | `Recordatorio de cita: {title}` | Cron |
| `appointment_cancelled` | `Se canceló la cita: {title}` | POST cancel de cita |

Fechas en el correo: `Intl.DateTimeFormat('es-CO', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Bogota' })`.

Para cada destinatario: inserta una fila en `notifications`, envía, y actualiza `sent_at` o `error`.

## 5. Cron de recordatorios (cada 15 min)

1. `H = REMINDER_HOURS_BEFORE` (defecto 24).
2. Busca eventos `published` con `starts_at` entre `now()` y `now() + H horas`, y sus asistencias `confirmed`.
3. Por cada par (usuario, evento): intenta insertar `notifications` con `type = 'event_reminder'`.
   Si falla por índice único (`23505`), ya se envió → se salta. Si inserta, envía y actualiza `sent_at`/`error`.
4. Repite lo mismo con citas `scheduled` y sus invitados (`appointment_reminder`).
5. Registra en consola un resumen: `[recordatorios] enviados=N omitidos=M fallidos=K`.

Exporta la función `runRemindersOnce()` además del registro del cron, para poder probarla y para
dispararla a mano en la demo.
