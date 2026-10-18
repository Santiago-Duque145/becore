# 10 · Ajustes al ciclo de vida del evento

Fecha: 2026-10-18 · Rama: `feature/fin-evento` (sale de `feature/profe-3`) · Estado: **código y pruebas automáticas
listas; falta recorrerlo a mano** (evento en curso → Finalizar → aviso de calificación).

## Qué se hizo

1. **Finalizar evento.** `POST /events/:id/finish` (solo organizadores). Solo el organizador del evento (403 si es
   otro) y solo si está `in_progress` (409 `EVENT_NOT_IN_PROGRESS`). Hace `status = 'finished'` por la misma
   transición `in_progress → finished` de la máquina de estados; el trigger `enforce_event_transition` fija
   `finished_at = now()`. Después pide la calificación a quienes hicieron check-in con
   `services/rating-requests.service.js` (el mismo código que usa el cron). Si ese aviso falla, el evento queda
   finalizado y el cron lo reintenta durante la hora siguiente (el índice único evita duplicados).
   Frontend: botón "Finalizar evento" en el detalle (`OwnerActions`) y en el panel (tabla y tarjetas), con diálogo:
   "¿Terminó el evento? Los asistentes con check-in podrán calificarlo."
2. **Hora de fin** (`lib/event-time.js`). Sin `ends_at`: "Termina aprox. HH:MM (2 h por defecto)"; con `ends_at`:
   "Termina HH:MM"; en curso: "En curso · termina aprox. HH:MM" / "En curso · termina HH:MM". Se ve en el detalle y
   en las tarjetas; no aparece en borradores, cancelados ni finalizados.
3. **Ayuda en el formulario**, bajo la duración: "Si no la defines, el evento termina 2 horas después de empezar.
   Igual puedes finalizarlo cuando quieras."
4. **Bloque de cupo** (`lib/capacity.js`, usado por `CapacityBar` y el panel): "Confirmados 1 de 5" y aparte
   "4 cupos disponibles" / "1 cupo disponible" / "Cupo lleno". Tarjetas, detalle y panel usan el mismo texto.
   Los badges de estado "Lleno" / "Casi lleno" del panel no cambian: son estados, no el bloque de cupo.

## 5. Qué pasa los eventos a `in_progress` y `finished`

- **Quién:** la función SQL `refresh_event_statuses()` (migración `20261001043003`), llamada por el job
  `event-status.job.js` desde `node-cron` **cada minuto** (`* * * * *`, zona America/Bogota).
- **Regla de `finished`:** `status in ('published','in_progress') and coalesce(ends_at, starts_at + 2 horas) <= now()`.
  O sea, con `ends_at` si existe y con `starts_at + 2 h` si no. Se aplica primero; después `published → in_progress`
  cuando `starts_at <= now()`. Un evento publicado cuyo fin ya pasó (por ejemplo, con el backend apagado) salta
  directo a `finished`.
- **Ojo:** el cron vive dentro del proceso del backend y solo arranca con `CRON_ENABLED=true` (el valor por defecto
  es `false`). Con el backend apagado o esa variable en `false`, los estados no avanzan. Para la demo, confirmar que
  `backend/.env` la tenga en `true`.

## Verificación

| Qué | Resultado |
|---|---|
| `npm run lint` | sin errores |
| `npm test` | backend 265/265, frontend 171/171 |
| `npm run build -w frontend` | compila |
| Finalizar: organizador dueño ok, otro organizador 403, estados distintos de en curso 409, evento inexistente 404, falla del aviso | `events.service.test.js` |
| Ruta: sin token 401, participante 403, id inválido 400, 200 y 409 | `finish-event.routes.test.js` |
| Cálculo de la hora de fin y textos | `event-time.test.js`; textos de cupo en `capacity.test.js` |

## Pendiente

- Recorrido manual a 390 y 1440 px: evento en curso → Finalizar (detalle y panel) → aviso en la campana del asistente.
