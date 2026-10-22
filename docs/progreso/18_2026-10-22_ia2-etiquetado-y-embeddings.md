# 18 · IA2 Etiquetado y embeddings

Fecha: 2026-10-22 · Rama: `feature/ia-2` (sale de `feature/ia-1`) · Estado: **código listo y probado con datos reales.
Los 8 perfiles con gustos ya tienen embedding; 1 de 10 eventos está etiquetado, porque se agotó el cupo diario del
modelo de texto. Hay una decisión abierta sobre ese cupo antes de IA3 (§4).**

## Qué se hizo

1. **Al publicar o editar un evento** (`services/ai/indexing.service.js`, llamado desde `events.service.js`):
   - Gemini devuelve hasta 4 etiquetas, solo slugs de `INTERESTS`, desde título, descripción y categoría.
   - Después se calcula el embedding de "título + descripción + etiquetas" y los dos se guardan en `event_ai`.
   - Se dispara al crear un evento ya publicado, al publicar un borrador y al editar título, descripción o categoría
     (no por cupo, fecha ni lugar). Los borradores y los cancelados no se etiquetan.
   - **En segundo plano** (`setImmediate`): la API responde sin esperar a Gemini. Timeout de 20 s y 1 reintento.
   - Si falla el etiquetado no se escribe nada. Si falla solo el embedding, se guardan las etiquetas. En los dos casos
     el backfill lo completa.
2. **Al guardar gustos** (onboarding, reenvío y edición desde Perfil, `me.service.js`): embedding del perfil en `user_ai`
   con gustos, días, franjas, motivaciones y zona. **Sin nombre, correo, IDs, sexo ni edad.**
3. **Prompts y textos** (`services/ai/prompts.js`, funciones puras): los prompts exactos de la spec §5.1 y §5.2.
   - Los datos del evento van entre `<datos>`, se quita cualquier `</datos>` que traiga el usuario y el sistema
     pide no seguir instrucciones de ahí.
   - La salida se valida con Zod: solo los 18 slugs, máximo 4, sin duplicados.
   - Prefijos de `gemini-embedding-2`: `title: … | text: …` para eventos y `task: search result | query: …` para
     perfiles.
4. **`npm run ai:backfill -w backend [-- --pause ms]`** (`scripts/ai-backfill.js`): completa los eventos publicados,
   en curso o finalizados sin embedding (los finalizados alimentan el bonus por calificaciones de IA3) y los perfiles
   con gustos sin embedding. Hace una pausa entre llamadas. Imprime títulos de eventos y conteos, nunca datos de usuarios.
   Necesita `AI_ENABLED=true`.
5. **Etiquetas en el detalle del evento:**
   - `GET /events/:id` devuelve `tags` (lee `event_ai`; nunca el embedding). Está documentado en `docs/specs/api.md`.
   - `components/events/EventTags.jsx` muestra los gustos en español como chips de solo lectura, debajo de la
     descripción, en una lista con `aria-label="Gustos de este evento"`. No son `<Chip>`, porque esos son botones
     seleccionables. Sin etiquetas no se pinta nada.
6. **Repositorio** `repositories/ai.repository.js`: escribe en `event_ai` y `user_ai` (el vector viaja como texto
   `[…]` por PostgREST) y lee solo las etiquetas.
7. **Cliente de Gemini, mejoras tras probar con datos reales:**
   - el cortacircuito ahora es **por modelo**: un 429 del modelo de texto pausaba también los embeddings, que tienen
     su propio cupo;
   - el cupo diario agotado (429 con cuota `PerDay`) es un error propio, `AI_QUOTA_EXHAUSTED`: no se reintenta y
     pausa ese modelo 1 h;
   - el backfill, al quedarse sin cupo de texto, deja los eventos que falten para otra corrida y sigue con los
     perfiles.

## Prueba con datos reales

`AI_ENABLED=true` solo para el comando (sin tocar `backend/.env`):

| Corrida | Resultado |
|---|---|
| 1.ª (4 s entre llamadas) | 1 evento etiquetado y con embedding («Torneo de ajedrez relámpago» → `board_games`). Luego 429 en el modelo de texto. El cortacircuito, que entonces era global, apagó también los embeddings: 0 perfiles |
| Diagnóstico | `gemini-3.6-flash` y `gemini-3.5-flash`: cuota `GenerateRequestsPerDayPerProjectPerModel-FreeTier`, **límite 20 por día**, reintentar en ~15,6 h. El cupo se había gastado en las mediciones de latencia de IA1. `gemini-embedding-2` seguía respondiendo |
| 2.ª (con las mejoras) | El texto se detiene en el primer evento (`AI_QUOTA_EXHAUSTED`): 8 eventos pendientes. **8 de 8 perfiles con embedding** |

**En la base** (solo conteos y etiquetas, nunca vectores):
- `user_ai`: 8 filas, todas de 768 dimensiones;
- `event_ai`: 1 fila («Torneo de ajedrez relámpago», `{board_games}`, con embedding).

**En la app** (backend nuevo en un puerto aparte, Edge a 390 y 1440 px): el detalle del torneo de ajedrez muestra el
chip "Juegos de mesa", sin scroll horizontal ni errores en consola. Un evento sin etiquetas no pinta la lista.
Capturas en `capturas-18/`.

**Pendiente:** correr `npm run ai:backfill -w backend` cuando se reinicie el cupo (medianoche, hora del Pacífico) para
etiquetar los 8 eventos que faltan.

## Pruebas

- `tests/ai-indexing.test.js` (14):
  - **privacidad:** con un perfil y un organizador que traen nombre, correo, UUID, sexo, edad y fecha de
    consentimiento, ninguno aparece en el prompt de etiquetado ni en los textos de embedding;
  - `<datos>` e instrucción anti-inyección;
  - textos exactos;
  - Zod de las etiquetas;
  - guardado de etiquetas y embedding, y casos de fallo;
  - qué estados se programan;
  - el error en segundo plano no sale hacia la API;
  - qué ediciones re-etiquetan.
- `tests/gemini-client.test.js`: cortacircuito por modelo y cupo diario (`AI_QUOTA_EXHAUSTED`, sin reintento, 1 h).
- `tests/events.service.test.js`: `getEvent` trae `tags` y no `embedding`.
- `frontend/.../EventTags.test.jsx`: chips en español, sin botones, ignora slugs desconocidos.
- `tests/setup.js` simula `ai.repository` en todas las pruebas: ninguna toca la base ni Gemini.

## Verificación

| Qué | Resultado |
|---|---|
| `npm run lint` | sin errores |
| `npm test` | backend 357/357, frontend 318/318 |
| `npm run build -w frontend` | compila |

## 4. Decisión abierta: el cupo del modelo de texto

Con **20 peticiones al día por modelo** no alcanza para etiquetar los eventos nuevos y además re-ordenar "Para ti"
cada 6 h por usuario (el día del partido serían decenas de usuarios). Las opciones están en `docs/specs/ai.md` §13:
etiquetas con embeddings, cadena de modelos de respaldo, facturación solo para texto, o re-ordenado más espaciado y
solo en la variante `ai`. Se decide antes de IA3.

## 5. Cambio en IA3: etiquetas con embeddings, sin el modelo de texto (rama `feature/ia-3`)

Decisión del usuario (22 oct) para no gastar el cupo de texto: las etiquetas salen de comparar el embedding del evento
con el de cada uno de los 18 gustos. Ya no hay prompt de etiquetado ni llamada al modelo de texto al publicar un evento.

**Cómo funciona:**
- **Cada gusto como búsqueda:** se describe en `INTEREST_QUERIES` (`ai/prompts.js`), por ejemplo
  `task: search result | query: Juegos de mesa: ajedrez, cartas, parqués y noches de juegos`.
- **Caché de los 18 embeddings:** se calculan una vez y quedan en memoria y en
  `backend/.cache/interest-embeddings.json`, fuera de git. La clave depende del modelo y de los textos, así que si
  cambian se recalculan.
- **Embedding del evento:** pasa a ser `title: … | text: {categoría}. {descripción}`, sin etiquetas, porque ahora
  las etiquetas salen de él.

**Cómo se eligió el umbral:**
1. Se armaron 32 eventos con sus gustos esperados puestos a mano:
   - los 10 reales (por ejemplo, "previa verdolaga" → fútbol y "Clase trabajo de Grado" → ninguno);
   - 22 ficticios que cubren los 18 gustos, con 3 que no encajan en ninguno: feria de emprendimiento, junta de
     acción comunal y vacunación de mascotas.
2. Se calcularon con `gemini-embedding-2` las similitudes de cada evento con los 18 gustos (50 llamadas al modelo de
   embeddings, ninguna al de texto):
   - gustos correctos: mín. 0,623 · mediana 0,732 · máx. 0,809;
   - gustos incorrectos: mediana 0,611 · p95 0,664 · máx. 0,703.
3. Se probaron umbrales de 0,30 a 0,70 combinados con márgenes respecto al mejor gusto (0,02–0,10 o sin margen), con
   un máximo de 4 etiquetas.

| Umbral | Margen | Precisión | Recall | F1 | Exactos |
|---|---|---|---|---|---|
| **0,68** (elegido) | **0,04** | **1,00** | **0,78** | **0,875** | **24 / 32** |
| 0,66 | 0,02 | 0,91 | 0,83 | 0,870 | 24 / 32 |
| 0,67 | 0,04 | 0,97 | 0,78 | 0,862 | 24 / 32 |
| 0,69 | 0,04 | 1,00 | 0,75 | 0,857 | 24 / 32 |

Se eligió 0,68 con margen 0,04:
- **Mejor F1 y ninguna etiqueta equivocada.** En las recomendaciones es peor un gusto mal asignado que uno que falte.
- **Estable:** entre 0,66 y 0,69 el F1 se mantiene sobre 0,85, así que no depende de un valor exacto.

**Dónde falla, siempre por omisión:**
- "Torneo de ajedrez relámpago": juegos de mesa sacó 0,666, justo bajo el umbral. Antes, el modelo de texto sí lo
  etiquetaba.
- "previa verdolaga": hay que saber que "verdolaga" es de fútbol.
- Segundas etiquetas que faltan, como "aire libre" en el cine o el voleibol de playa, o "música" en la clase de salsa.

**Límite:** son pocos eventos; hay que revisar el umbral cuando haya más eventos reales.

**Backfill con datos reales** (`npm run ai:backfill -- --all`, solo modelo de embeddings, el 22 oct):
- 10 de 10 eventos recalculados;
- 7 con etiquetas: 5v5 → fútbol, baloncesto → baloncesto, cine al aire libre → cine, ciclopaseo → ciclismo, danza
  urbana → danza, "Polas y fútbol" → fútbol, Avengers → cine;
- 3 sin etiquetas: el ajedrez, la clase y "previa verdolaga".

El resultado es igual al del experimento. No se gastó cupo de texto.
