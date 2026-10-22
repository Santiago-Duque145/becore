# 08 · P2 Calificación de eventos finalizados

Fecha: 2026-10-18 · Rama: `feature/profe-2` (sale de `feature/profe-1`) · Estado: **código y pruebas automáticas
listas; falta recorrerlo a mano en el navegador** (check-in real → evento finalizado → calificar).

## Qué se hizo

**Base de datos** (aplicadas en Supabase el 2026-10-18; `migration list` local = remoto):
- `20261022120000_event_rating_notification_type.sql`: valor `event_rating_request` en `notification_type`
  (archivo aparte: un valor de enum nuevo no se puede usar en la misma transacción).
- `20261022120100_event_ratings.sql`: tabla `event_ratings` (1–5 estrellas, `tags` con check contra la lista,
  comentario ≤ 500, `unique(event_id, user_id)`), RLS de lectura propia, escritura solo por Express, e índice
  único parcial en `notifications` para no repetir el aviso.

**Backend**: `POST/PUT /events/:id/rating`, `GET /events/:id/rating/me`, `GET /events/:id/ratings/summary`
(contrato en `docs/specs/api.md`). Reglas en `services/ratings.service.js`: evento finalizado, check-in y
plazo de 7 días desde `finished_at`. El cron de estados (cada minuto) pide la calificación a quienes hicieron
check-in en eventos finalizados en la última hora (idempotente). `Event` ahora expone `finishedAt`.

**Frontend**: `/eventos/:id/calificar` (estrellas accesibles como `radiogroup`, etiquetas, comentario, pantalla
de gracias, edición), banner "¿Cómo estuvo? Califica" en el detalle y en Mis eventos, `★ 4,6 (12)` en tarjetas
y detalle de eventos finalizados, sección "Calificaciones" en el panel del organizador (promedio general,
distribución, por evento, últimos comentarios) y el aviso de la campana lleva a la pantalla de calificar.

## Verificación

| Qué | Resultado |
|---|---|
| `npm run lint` | sin errores |
| `npm test` | backend 242/242, frontend 148/148 |
| `npm run build -w frontend` | compila |
| Reglas de elegibilidad (sin check-in, no finalizado, fuera de plazo, edición) y resumen | probadas en `ratings.service.test.js` |
| Aviso de calificación idempotente | probado en `reminders.job.test.js` |

## Pendiente

- Recorrido manual a 390 y 1440 px con el seed (un evento finalizado con check-in), comparando con la skill.
- `★ N (M)` en tarjetas hace una consulta de resumen por evento finalizado visible (cacheada 60 s); si molesta
  en listas largas, mover el promedio a la respuesta de eventos.
