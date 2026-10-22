# 17 · IA1 Base de datos e infraestructura de IA (y arreglo del mapa sobre los modales)

Fecha: 2026-10-22 · Rama: `feature/ia-1` (sale de `feature/ia-0`) · Estado: **código y pruebas listos; migración probada
en una transacción revertida, pendiente del visto bueno del usuario para aplicarla.**

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

## 2. Gemini: llamadas reales y decisión de diseño

Con la clave del proyecto (leída de `backend/.env` por el propio script, nunca impresa), solo con textos de prueba:

| Modelo | Resultado |
|---|---|
| `gemini-embedding-2` | Existe (también `-preview`). 768 dimensiones, norma 1,0000, ~0,5 s |
| `gemini-3.5-flash-lite` | JSON válido con `responseJsonSchema`, pero **5–12 s** aun con `thinkingLevel: 'MINIMAL'`. **503 "high demand"** en 3 de 15 llamadas. `thinkingBudget: 0` → 400 |
| `gemini-3.1-flash-lite` (respaldo) | **503 en las 6 llamadas** |

**Decisión:** el plan esperaba a Gemini hasta 3 s dentro de `GET /events/recommended`. Con estas latencias fallaría casi
siempre. La petición **nunca espera a Gemini**: responde con caché o con el orden híbrido, y el re-ordenado se calcula
en segundo plano y queda en caché para la siguiente visita. Actualizado en `docs/specs/ai.md` §2, §3 y §7. Se implementa
en IA3.

## 3. Código

- **`@google/genai` 2.30.0** en el backend (permitido en `CLAUDE.md` §2). npm no corrió el `postinstall` de
  `protobufjs`, que solo revisa versiones.
- **`backend/src/config/env.js`:** `GEMINI_API_KEY`, `GEMINI_MODEL` (defecto `gemini-3.5-flash-lite`),
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
  - que el check de `events.tags` tiene exactamente `INTEREST_SLUGS`;
  - que hay 2 columnas `vector(768)` e índice HNSW por coseno;
  - que las 2 tablas tienen RLS de solo lectura;
  - que la migración no toca sexo, edad ni consentimiento.

## 4. Migración `20261022160000_ai_recommendations.sql`

Contenido:
- extensión `vector` en el esquema `extensions`;
- `events.tags` (check contra los 18 gustos, máx. 4) y `events.embedding vector(768)`;
- `user_preferences.embedding vector(768)`;
- tablas `ai_recommendations` (caché) y `recommendation_events` (A/B; un solo clic y un solo confirmado por usuario y
  evento);
- índice HNSW por coseno;
- RLS de lectura propia, sin políticas de escritura.

Es aditiva: las filas actuales no cambian.

**1. `npx supabase migration list`:** local = remoto en las 10 anteriores; solo falta `20261022160000`.

**2. `npx supabase db push --dry-run`:** "Would push these migrations: 20261022160000_ai_recommendations.sql".

**3. Prueba en una transacción revertida** (`npx supabase db query --linked -f …`). Toda la migración y las
comprobaciones van dentro de un bloque `DO` que termina **siempre** con `raise exception` y lleva el resultado en el
mensaje. Postgres revierte todo aunque la API haga commit automático.

| Comprobación | Resultado |
|---|---|
| Extensión | `vector` 0.8.2 en `extensions` |
| Columnas | `events.tags` text[], `events.embedding` y `user_preferences.embedding` de tipo `extensions.vector` |
| Filas actuales | 14 eventos, todos con `tags = '{}'` y sin embedding; 8 perfiles con gustos, sin embedding |
| Índice | `CREATE INDEX events_embedding_hnsw ON public.events USING hnsw (embedding vector_cosine_ops)` |
| RLS | activado en las dos tablas nuevas; políticas solo `SELECT` propias |
| `tags = {football, music}` | aceptadas |
| `tags = {golf}` | rechazada por `events_tags_valid` |
| 5 etiquetas | rechazadas (máx. 4) |
| Vector de 768 | se guarda; distancia coseno consigo mismo con `operator(extensions.<=>)`: 0,000000 |
| Vector de 3 dimensiones | rechazado: "expected 768 dimensions, not 3" |
| Caché válida / inválida | se inserta / se rechaza (variante y fechas) |
| Segundo "clicked" del mismo usuario y evento | rechazado (único) |
| "shown" repetido | permitido (2 filas) |

**Después de la prueba** se consultó la base: 0 columnas nuevas, 0 tablas nuevas, sin extensión `vector` y sin el
índice. No quedó nada.

**Pendiente:** el visto bueno del usuario para `npx supabase db push`.

## Verificación

| Qué | Resultado |
|---|---|
| `npm run lint` | sin errores |
| `npm test` | backend 338/338, frontend 316/316 |
| `npm run build -w frontend` | compila |
