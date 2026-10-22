# 17 · IA1 Base de datos e infraestructura de IA (y arreglo del mapa sobre los modales)

Fecha: 2026-10-22 · Rama: `feature/ia-1` (sale de `feature/ia-0`) · Estado: **terminado. Migración probada en una
transacción revertida y aplicada en Supabase el 2026-10-22.**

## 0. Arreglo previo: el mapa tapaba los modales (`fix(mapa)`, primer commit de la rama)

**Bug:** en `/eventos/:id`, al abrir la vista previa del avatar de un inscrito, el mini mapa quedaba encima del modal.

**Causa:** el contenedor común de los mapas (`MapBase`) no creaba su propio contexto de apilamiento. Los z-index
internos de Leaflet y MapLibre (paneles 200–700, controles 800–1000) competían con los de la página y le ganaban a los
modales (z-60/70), a la barra de acción fija del detalle (z-30) y a las cabeceras pegajosas (z-40).

**Arreglo:**
- `MapBase` lleva `isolate` (`isolation: isolate`). Los cuatro mapas pasan por él: detalle, Descubre en modo Mapa,
  Mapa en vivo y el selector de ubicación.
- `Modal` (que usan todos los diálogos: compartir, calendario, asistencia, finalizar, consentimiento, lista de
  inscritos, citas), la vista previa del avatar y los toasts se dibujan en `<body>` con `BodyPortal`, como ya lo hacía
  la barra inferior. No hay menús desplegables propios: todo pasa por `Modal`.
- **Prueba** (`frontend/src/lib/map.test.js`):
  - el contenedor de `MapBase` tiene `relative isolate`;
  - nadie más usa `<MapContainer>`;
  - `Modal`, `AvatarPreview` y `ToastProvider` usan `BodyPortal`.

**Verificación en Edge** (390 px, `elementFromPoint` sobre el centro del mapa):

| Pantalla | Qué se comprobó | Resultado |
|---|---|---|
| Detalle de "Polas y fútbol" | Lista de inscritos (`Modal`) y vista previa del avatar de un inscrito | Los dos quedan encima del mapa y cuelgan de `<body>` |
| Detalle | Barra de acción fija sobre el mapa al desplazar | La barra queda encima |
| Descubre en modo Mapa | Overlay de prueba con el z-index de `Modal`; cabecera pegajosa | Los dos quedan encima |
| Mapa en vivo y selector de ubicación | Overlay de prueba con el z-index de `Modal` | Queda encima |

En las cuatro el contenedor tiene `isolation: isolate`. Captura: `capturas-17/detalle-vista-previa-avatar-sobre-mapa-390.png`.

## 1. Documentos

- **`CLAUDE.md` §9:** el visto bueno del director quedó como "solicitado por correo el 22 oct 2026, pendiente".
  IA5 pasa a trabajo futuro.
- **IA5 (portada generada con IA) a trabajo futuro** en `docs/specs/ai.md` §14 y `docs/PLAN.md`: no se activa
  facturación y las portadas siguen subiéndolas los usuarios. El cliente no tiene `generateImage`.
  `GEMINI_IMAGE_MODEL` y `AI_IMAGES_ENABLED` quedan en `.env.example` como reservadas.
- **`/privacidad`:** dice que, con la versión gratuita de Gemini, Google puede usar los gustos y los eventos (sin nada
  que identifique a la persona) para mejorar sus productos.

## 2. Gemini: llamadas reales, elección del modelo y decisión de diseño

Con la clave del proyecto (el script la lee de `backend/.env` y nunca la imprime), solo con textos de prueba.

**Embeddings:** `gemini-embedding-2` existe (también `-preview`; se usa el estable). Devuelve 768 dimensiones con norma
1,0000 en ~0,5 s.

**Modelo de texto:** queda en la variable `GEMINI_TEXT_MODEL` (antes `GEMINI_MODEL`). Si en tu `backend/.env` está la
línea vieja `GEMINI_MODEL=`, se puede borrar.

Se listaron con `models.list` los 14 modelos de texto flash y flash-lite que ve la clave, y se midió cada uno con el
prompt de etiquetado (evento ficticio, salida JSON con `responseJsonSchema`), 1,5–2 s entre llamadas, timeout de 20 s:

| Modelo | Llamadas bien | Mediana | p90 / máx. | Errores |
|---|---|---|---|---|
| **`gemini-3.6-flash`** (elegido) | **12 / 15** | **~1,0–1,2 s** | 3,4 s / 19,2 s | 429 × 3 (límite por minuto) |
| `gemini-3-flash-preview` | 12 / 15 | ~1,0 s | 1,1 s / 1,5 s | 503 × 1, timeout × 2 · es preliminar |
| `gemini-3.5-flash` | 11 / 15 | ~1,1–1,5 s | 1,5 s / 3,4 s | 429 × 4 |
| `gemini-3.5-flash-lite` | 4 / 5 | 5,6 s | 7,5 s | timeout × 1 (antes: 5–12 s y 503) |
| `gemini-3.1-flash-lite` | 4 / 15 | 1,6–7,9 s | — | 503 × 11 |
| `gemini-flash-lite-latest` | 3 / 5 | 7,0 s | 16,8 s | timeout × 2 |
| `gemini-3.8-flash` | 0 / 11 | — | — | 400 con `thinkingLevel: MINIMAL`; 503 y 429 sin él o con `LOW` |
| `gemini-3.7-flash` | 0 / 11 | — | — | ídem |
| `gemini-flash-latest` | 0 / 5 | — | — | 503 × 5 |
| `gemini-2.5-flash`, `gemini-2.5-flash-lite` | 0 / 5 | — | — | 404: la clave no tiene acceso |
| `gemini-omni-1.1-flash`, `gemini-omni-flash-preview` | 0 / 5 | — | — | 429 × 5 |
| `gemini-3.1-flash-lite-preview` | 0 / 5 | — | — | 503 × 4, timeout × 1 |

Todos los que respondieron devolvieron las mismas etiquetas (`football, music`).

**Elección:** `gemini-3.6-flash` es estable (no preliminar), el más rápido y el que más respondió. Sus fallos fueron 429,
que el reintento en segundo plano cubre. El valor por defecto pasa a ser ese; se cambia en `.env` sin tocar código.

**Decisión de diseño:** el plan esperaba a Gemini hasta 3 s dentro de `GET /events/recommended`. Aun con el modelo más
rápido hay respuestas de 19 s y errores 429 o 503. La petición **nunca espera a Gemini** (aprobado por el usuario el
22 oct): responde con caché o con el orden híbrido, y el re-ordenado se calcula en segundo plano y queda en caché para la
siguiente visita. Está en `docs/specs/ai.md` §2, §3 y §7, y se implementa en IA3.

## 3. Código

- **`@google/genai` 2.30.0** en el backend (permitido en `CLAUDE.md` §2). npm no corrió el `postinstall` de
  `protobufjs`, que solo revisa versiones.
- **`backend/src/config/env.js`:** `GEMINI_API_KEY`, `GEMINI_TEXT_MODEL` (defecto `gemini-3.6-flash`, elegido por medición, §2),
  `GEMINI_EMBEDDING_MODEL` (defecto `gemini-embedding-2`) y `AI_ENABLED` (defecto `false`). Una variable vacía en `.env`
  toma el defecto.
- **`backend/src/services/ai/geminiClient.js`:** cliente único con `embedText` y `generateJson`.
  - Llama a `generateContent` con `systemInstruction`, `responseMimeType` JSON, `responseJsonSchema`,
    `thinkingLevel: 'MINIMAL'` y `abortSignal` (timeout).
  - La salida se valida con Zod.
  - 1 reintento solo si se pide (segundo plano), ante timeout, 429, 503 o red.
  - Cortacircuito: 3 fallos en 60 s pausan la IA 5 min.
  - Errores con código propio (`AI_DISABLED`, `AI_TIMEOUT`, `AI_RATE_LIMITED`, `AI_OVERLOADED`, `AI_INVALID_OUTPUT`…).
  - Logs con operación, modelo, código y duración, **nunca** el prompt ni el mensaje de Google.
  - Con `AI_ENABLED=false` o sin clave queda apagado. Con el SDK real, un timeout de 1 ms se traduce a `AI_TIMEOUT`.
- **Pruebas sin internet:** `tests/setup.js` reemplaza la instancia por una apagada y `vitest.config.js` fija
  `AI_ENABLED=false`. `tests/gemini-client.test.js` (12 pruebas) usa un SDK falso. `tests/ai-migration.test.js`
  comprueba:
  - que el check de `event_ai.tags` tiene exactamente `INTEREST_SLUGS`;
  - que los dos `vector(768)` viven en `event_ai` y `user_ai`, con índice HNSW por coseno en `event_ai`;
  - que no se toca `events` ni `user_preferences`;
  - que `event_ai` y `user_ai` tienen RLS sin políticas y sin permisos para `anon`/`authenticated`;
  - que la caché y la A/B solo tienen políticas de lectura propia;
  - que nada entra a Realtime ni toca sexo, edad o consentimiento.

## 4. Migración `20261022160000_ai_recommendations.sql` (aplicada)

### Primera versión, descartada antes de aplicar

La primera versión agregaba `tags` y `embedding` a `events` y `embedding` a `user_preferences`. Pasó el `dry-run` y la
prueba revertida, y la base quedó intacta, pero **no se aplicó**:
- `events` está en la publicación de Realtime (junto con `notifications` y `activity_log`; consultado en
  `pg_publication_tables`). Cada confirmación de asistencia habría mandado ~10 KB de vector a cada pantalla suscrita.
- `user_preferences` no está en Realtime, pero tiene una política de lectura propia desde el navegador: el embedding
  habría quedado al alcance del frontend.

### Versión aplicada: tablas aparte (decisión del usuario, 22 oct)

- **`event_ai`:** `event_id` (PK y FK a `events`, `on delete cascade`), `tags` (check: los 18 gustos, máx. 4),
  `embedding vector(768)` y `updated_at` con trigger. Índice HNSW por coseno.
- **`user_ai`:** `user_id` (PK y FK a `profiles`, `on delete cascade`), `embedding vector(768) not null` y `updated_at`
  con trigger.
- **Acceso:** las dos tienen RLS activado **sin ninguna política** y `revoke all` a `anon` y `authenticated`. Solo el
  backend las lee y escribe, y los embeddings no salen nunca al frontend. No están en Realtime.
- **`ai_recommendations` (caché) y `recommendation_events` (A/B):** sin cambios frente a la primera versión, con
  lectura propia y sin políticas de escritura.
- **No se toca** ninguna tabla existente.

**1. `npx supabase db push --dry-run`:** solo `20261022160000_ai_recommendations.sql`.

**2. Prueba en una transacción revertida** (`npx supabase db query --linked -f …`). La migración y las comprobaciones
van en un bloque `DO` que termina **siempre** con `raise exception` y lleva el resultado en el mensaje, así que
Postgres revierte todo.

| Comprobación | Resultado |
|---|---|
| Extensión | `vector` 0.8.2 en `extensions` |
| Tablas nuevas | `ai_recommendations`, `event_ai`, `recommendation_events`, `user_ai`, las cuatro con RLS |
| Columnas nuevas en `events` / `user_preferences` | 0 |
| Tablas nuevas en Realtime | 0 |
| Políticas | solo `ai_recommendations SELECT` y `recommendation_events SELECT`; ninguna en `event_ai` ni `user_ai` |
| Permiso `select` de `authenticated` | `event_ai`: no · `user_ai`: no · `ai_recommendations`: sí (con RLS propia) |
| Leer `event_ai` / `user_ai` como `authenticated` (`set local role`) | permiso denegado en las dos |
| Índice | `CREATE INDEX event_ai_embedding_hnsw ON public.event_ai USING hnsw (embedding vector_cosine_ops)` |
| Datos actuales | 14 eventos, 8 perfiles con gustos (sin cambios) |
| `tags = {football, music}` + vector de 768 | aceptados; distancia coseno consigo mismo 0,000000 |
| `tags = {golf}` | rechazada por `event_ai_tags_valid` |
| 5 etiquetas | rechazadas (máx. 4) |
| Vector de 3 dimensiones | rechazado: "expected 768 dimensions, not 3" |
| `updated_at` | se actualiza solo al editar |
| `user_ai` con vector / sin vector | aceptado (similitud con el evento 1,0000) / rechazado |
| Caché válida / inválida | se inserta / se rechaza |
| Segundo "clicked" del mismo usuario y evento | rechazado (único) |
| Borrar el evento | borra su fila de `event_ai` y de `recommendation_events` (cascada) |

**3. Base intacta después de la prueba:** 0 tablas nuevas, sin extensión `vector`, sin índice, 14 eventos.

**4. Aplicada** con `npx supabase db push`, que respondió "Applying migration 20261022160000_ai_recommendations.sql".
`npx supabase migration list` muestra `20261022160000` en local y en remoto. Estado después:
- las 4 tablas existen;
- `vector` 0.8.2;
- índice HNSW presente;
- `authenticated` no puede leer `event_ai`;
- 0 tablas nuevas en Realtime;
- 14 eventos.

## Verificación

| Qué | Resultado |
|---|---|
| `npm run lint` | sin errores |
| `npm test` | backend 340/340, frontend 316/316 |
| `npm run build -w frontend` | compila |
