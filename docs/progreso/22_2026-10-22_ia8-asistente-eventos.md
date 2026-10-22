# 22 · IA8 Asistente para crear eventos

Fecha: 2026-10-22 · Rama: `feature/ia-8` (sale de `main`: `feature/ia-7` ya se había fusionado y borrado) · Estado:
**código, pruebas y documentación listos; falta la prueba manual con Gemini real y la revisión visual (ver Pendiente).**
Sin migración: no hay tablas nuevas.

## Qué cambió para quien usa la app

- En **Crear evento** aparece arriba la tarjeta "Describe tu evento en una frase". Con "Crear borrador con IA" se rellenan
  título, descripción, categoría, fecha y hora, duración, lugar, pin del mapa y cupo. Los campos rellenados se resaltan
  un instante.
- Aviso "Revisa antes de publicar: la IA puede equivocarse." y botón **Deshacer** que devuelve el formulario (y el pin) a
  como estaba. Nada se publica ni se guarda solo.
- Sin IA, sin cupo o con falla: "El asistente no está disponible ahora; puedes llenar el formulario normal." Al pasar
  10 borradores en el día: "Llegaste al límite de borradores de hoy; puedes llenar el formulario normal."
- Solo organizadores y solo al crear (no al editar). `/privacidad` ahora menciona el asistente.

## Cómo funciona

Detalle en `docs/specs/ai.md` §16 y `docs/specs/api.md` (`POST /events/draft`).

- La frase pasa por `scrubQuery` (sin correos ni teléfonos) y va sola a Gemini, con la cadena `GEMINI_TEXT_MODELS`.
- El modelo devuelve JSON (validado con Zod) con título, descripción, categoría, duración, cupo, lugar y una **pista** de
  fecha en texto. **La fecha no la inventa el modelo**: `date-hint.js` la resuelve con reglas en español relativas a
  America/Bogota.
- El lugar pasa por el geocodificador que ya existía (Nominatim) para proponer el pin; el organizador lo confirma.
- Cualquier falla → 200 con `{ draft: null, reason }`.

## Decisiones

- **Rama desde `main`**, no desde `feature/ia-7`, que ya no existe.
- **Sin `tags`:** la spec los pedía, pero el formulario no los tiene y las etiquetas se calculan con embeddings.
- **Límite diario en memoria** (10 por organizador y día de Bogotá) y registro solo en el log del servidor, sin la frase:
  evita una migración. Se reinicia con el backend.
- Categoría inventada por el modelo → `other` (en vez de descartar el borrador); capacidad o duración fuera de rango → vacío.
- Cada modelo de la cadena puede tardar hasta 20 s; en el peor caso (tres modelos fallando por tiempo) el botón espera
  hasta un minuto antes de mostrar el aviso de respaldo. Con 429 o JSON inválido pasa al siguiente de inmediato.

## Archivos

- Backend: `services/drafts/{draft.service,draft-prompt,date-hint}.js`, `schemas/drafts.schemas.js`,
  `controllers/drafts.controller.js`, ruta en `routes/events.routes.js`.
- Frontend: `components/events/{DraftAssistant.jsx,useApplyDraft.js}`, `lib/draft-values.js`, `useEventDraft` en
  `hooks/useEvent.js`, `createEventDraft` en `services/events.api.js`, prop `assistant` en `EventForm.jsx` (queda en 270
  líneas, por encima del tope orientativo de 250: ya tenía 255), animación `draft-fill` en `index.css`.

## Pruebas

- Backend (+24): `date-hint.test.js` (hoy con franja pasada, "el sábado" siendo miércoles, día igual al actual, "mañana"
  vs "en la mañana", hora explícita, fecha explícita, fecha imposible), `drafts.service.test.js` (JSON válido, categoría
  inventada, JSON inválido/fallos de la cadena, IA apagada, límite diario, privacidad del prompt, geocodificador caído)
  y `drafts.routes.test.js` (401, 403 participante, 400, 200, respaldo).
- Frontend (+3): `draft-values.test.js`.
- `npm run lint`, `npm test` (backend 473, frontend 332) y `npm run build -w frontend`: sin errores.

## Pendiente

- **Probar a mano con Gemini real** (`AI_ENABLED=true`) con la frase de ejemplo y 4–5 más; anotar aquí los resultados.
- **Revisión visual** de la tarjeta a 288/390 px y 1440 px, y de los campos resaltados.
- Push de `feature/ia-8` hecho; el PR lo abre el equipo.
