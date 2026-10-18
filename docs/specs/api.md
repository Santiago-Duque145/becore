# Contrato de la API — Be Core

Base: `http://localhost:3000/api/v1`. JSON en camelCase. Todas las rutas exigen
`Authorization: Bearer <access_token de Supabase>` salvo `GET /health` y `GET /public/stats`.

Registro, inicio y cierre de sesión **no** pasan por esta API: el frontend los hace con Supabase Auth
(ver `frontend/CLAUDE.md` §4.3). La API solo verifica el token.

## 1. Objetos

### Profile
```json
{
  "id": "uuid", "email": "ana@correo.com", "fullName": "Ana Gómez", "role": "organizer", "createdAt": "ISO",
  "onboardingCompleted": true,
  "dataConsentAccepted": true, "gender": "female", "ageRange": "25-34",
  "preferences": {
    "categories": ["sport", "culture"], "interests": ["football", "cinema"], "days": ["weekends"],
    "timeSlots": ["evening"], "motivations": ["fun"], "zone": "Belén", "updatedAt": "ISO"
  }
}
```
`preferences` es `null` si el usuario nunca respondió el cuestionario. `categories` lo calcula el backend a partir de
`interests` (`backend/src/constants/preferences.js`); el cliente no lo envía. Listas cerradas: `auth-onboarding.md` §6.

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
| `EVENT_NOT_FINISHED` | 409 | Solo puedes calificar eventos que ya terminaron |
| `NOT_ATTENDED` | 403 | Solo califican quienes hicieron check-in en el evento |
| `RATING_WINDOW_CLOSED` | 409 | El plazo para calificar (7 días) ya terminó |
| `RATING_NOT_FOUND` | 404 | Aún no calificaste este evento |
| `APPOINTMENT_NOT_ACTIVE` | 409 | La cita fue cancelada |
| `SLOT_OVERLAP` | 409 | Ese horario se cruza con otra de tus franjas. Elige otro o borra primero la que se cruza |
| `APPOINTMENT_OUTSIDE_SLOT` | 409 | La cita debe quedar dentro de una de tus franjas de disponibilidad |
| `APPOINTMENT_OVERLAP` | 409 | Ese horario se cruza con otra de tus citas. Elige otro horario |
| `ONBOARDING_ALREADY_COMPLETED` | 409 | Ya completaste tu bienvenida; tu rol ya no se puede cambiar |
| `DUPLICATE`, `CONSTRAINT_VIOLATION` | 409 | Ese registro ya existe / Los datos no cumplen las reglas |
| `INTERNAL_ERROR` | 500 | Algo salió mal, intenta de nuevo |

## 3. Endpoints

Leyenda de acceso: **todos** = cualquier usuario autenticado; **org** = rol `organizer`;
**part** = rol `participant`; **dueño** = el organizador que creó el recurso (si no lo es → 403).

### Sistema y perfil

| Método | Ruta | Acceso | Body / Query | Respuesta |
|---|---|---|---|---|
| GET | `/health` | público | — | `{ data: { status: "ok" } }` |
| GET | `/public/stats` | público | — | `{ data: { eventsThisWeek, confirmedPeople } }` |
| GET | `/me` | todos | — | `Profile` |
| PATCH | `/me` | todos | `{ fullName? (2–80), gender?, ageRange? }`; al menos un campo. `null` borra sexo o edad | `Profile` |
| PUT | `/me/onboarding` | todos | `{ role, consent? (solo `true`), gender?, ageRange?, interests[], days[], timeSlots[], motivations[] (≤ 2), zone? (≤ 80) }`; listas opcionales (vacías por defecto) | `Profile` |
| PUT | `/me/preferences` | todos | lo mismo sin `role`, `gender` ni `ageRange` (si llegan, se ignoran) | `Profile` |
| PUT | `/me/consent` | todos | `{ gender?, ageRange? }` (ambos opcionales) | `Profile` |

`gender`: `female` · `male` · `other` · `prefer_not_to_say`. `ageRange`: `18-24` · `25-34` · `35-44` · `45-54` · `55+`
(`backend/src/constants/demographics.js`). Son opcionales y **solo para estadísticas agregadas**: no se usan en
recomendaciones ni se envían a ninguna IA. `PUT /me/consent` guarda `profiles.data_consent_at = now()` la primera vez
(reenviar no la mueve) y, si vienen, sexo y edad. `consent: true` en `PUT /me/onboarding` hace lo mismo desde el primer paso de /bienvenida. El perfil expone `dataConsentAccepted` (boolean), nunca la fecha.

`GET /public/stats` (P1, hero del login): solo dos conteos agregados, **sin datos personales**. `eventsThisWeek` = eventos
`published`, `in_progress` o `finished` (sin borradores ni cancelados) que empiezan en la semana actual, de lunes 00:00 a
lunes 00:00 en hora de Bogotá. `confirmedPeople` = personas distintas con asistencia `confirmed` en esos eventos. El
resultado se guarda **5 minutos en memoria** (las peticiones simultáneas comparten una consulta) y la respuesta lleva
`Cache-Control: public, max-age=300`. Un error de base responde 500 `INTERNAL_ERROR` y no se guarda. El frontend no
muestra nada si falla o si algún conteo es 0.

`PUT /me/onboarding`: guarda las respuestas (upsert en `user_preferences`) y, si el onboarding estaba pendiente, fija
`role` y `onboarding_completed_at = now()`. Si ya estaba completo: mismo rol → solo actualiza los gustos; otro rol →
409 `ONBOARDING_ALREADY_COMPLETED` sin escribir nada. `PUT /me/preferences` nunca cambia `role` ni
`onboarding_completed_at` (edición desde Perfil).

### Eventos (RF-04 a RF-09)

| Método | Ruta | Acceso | Body / Query | Respuesta |
|---|---|---|---|---|
| GET | `/events` | todos | ver "Filtros" | `{ data: Event[], meta: { total, page, pageSize } }` |
| GET | `/events/recommended` | todos | query `limit` 1–20 (defecto 6) | `(Event & { reason })[]` "Para ti", ver abajo |
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

**"Para ti" — `GET /events/recommended`** (`auth-onboarding.md` §8, `services/recommendations/`):
sin preferencias guardadas devuelve `[]`. Candidatos: `published`, `starts_at > now()`, con cupo, que el usuario no organiza
ni tiene confirmados. Puntaje por reglas en hora de Bogotá (categoría +3; día, franja y zona +1 cada uno); se
excluyen los de puntaje 0 y se ordena por puntaje desc y luego `startsAt` asc. `reason` es la señal más fuerte
("Porque te gusta el deporte", "Es en tu zona", "Encaja con tus fines de semana"…). Va antes de `/events/:id` en el router.

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

### Calificación de eventos (P2)

Solo califica un participante con `checked_in = true` en un evento `finished`, dentro de los 7 días posteriores a
`finishedAt`. Una calificación por usuario y evento; dentro del plazo se puede editar.

- `POST /events/:id/rating` (participante) → 201 `{ data: Rating }`. Body: `{ stars: 1–5, tags?: string[], comment?: string ≤ 500 }`.
  `tags` ⊂ `well_organized, punctual, good_vibe, would_repeat, good_venue, needs_improvement`.
- `PUT /events/:id/rating` (participante) → 200 `{ data: Rating }`. Mismo body; crea o reemplaza.
- `GET /events/:id/rating/me` (participante) → `{ data: Rating }` o 404 `RATING_NOT_FOUND`.
- `GET /events/:id/ratings/summary` (autenticado) → `{ data: { average, total, byStars: {1..5}, byTag, comments? } }`.
  `comments` (anónimos, ≤ 20) solo si quien consulta es el organizador del evento; `average` es `null` sin votos.
- Al pasar un evento a `finished`, el cron de estados envía el aviso `event_rating_request` (campana y correo, enlace
  `/eventos/:id/calificar`) a quienes hicieron check-in. Una sola vez por usuario y evento.
- `Event` incluye ahora `finishedAt` (ISO o `null`).

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
Implementado en R8: cada fila trae además `category` y `location` (los usa la tabla del panel). `upcomingEvents` cuenta
los próximos o en curso sin cancelados ni borradores; `confirmed` suma los no cancelados; `cancelled` y `checkedIn` suman todos.

**`GET /dashboard/participant`** (todos) →
```json
{ "upcomingEvents": [Event], "pastEvents": [Event], "upcomingAppointments": [Appointment] }
```
Eventos donde el usuario tiene asistencia, **confirmada o cancelada** (R7: "Mis eventos" muestra el estado
"Cancelado"); cada uno con su `myAttendance`. Sin borradores. Próximos: `startsAt` futuro o `in_progress`, orden
ascendente. `pastEvents`: los 10 más recientes. `upcomingAppointments`: igual que `GET /appointments?scope=upcoming`.

### Avisos de la app (campana, RF-16/RF-17)

Leen la tabla `notifications` (`message`, `read_at`) del usuario. El envío por correo no cambia (§4).

| Método | Ruta | Acceso | Body / Query | Respuesta |
|---|---|---|---|---|
| GET | `/notifications` | todos | query `limit` 1–50 (defecto 30) | `{ data: Notification[], meta: { unread } }` más reciente primero |
| GET | `/notifications/unread-count` | todos | — | `{ count }` |
| POST | `/notifications/:id/read` | dueño | — | `Notification`; si es de otro o no existe → 404 `NOT_FOUND`; si ya estaba leída conserva `readAt` |
| POST | `/notifications/read-all` | todos | — | `{ updated }` |

`Notification`: `{ id, type, subject, message, eventId, appointmentId, readAt, createdAt }` (`type` = `notification_type`).

### Disponibilidad (RF-15)

| Método | Ruta | Acceso | Body | Respuesta |
|---|---|---|---|---|
| GET | `/availability/mine` | org | — | bloques futuros, orden ascendente |
| POST | `/availability` | org | `{ startsAt, endsAt }` futuro, `endsAt > startsAt`, duración máx. 8 h | 201 bloque |
| DELETE | `/availability/:id` | dueño | — | 204 |

Una franja no puede cruzarse con otra del mismo organizador → 409 `SLOT_OVERLAP`. Las que solo se tocan
(una termina 5:00 p. m. y la otra empieza 5:00 p. m.) no se cruzan. Lo impone la base (`database.md` §2), también
con dos peticiones simultáneas. Borrar una franja no toca las citas ya agendadas dentro de ella.

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

Reglas de horario (las impone la base, `database.md` §2, también con dos peticiones simultáneas):
la cita debe quedar **completa dentro de una sola franja** del organizador → si no, 409 `APPOINTMENT_OUTSIDE_SLOT`;
y no puede cruzarse con otra cita **programada** del mismo organizador → 409 `APPOINTMENT_OVERLAP`
(las canceladas no bloquean). En ambos casos no se crea la cita ni se avisa a nadie.

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
