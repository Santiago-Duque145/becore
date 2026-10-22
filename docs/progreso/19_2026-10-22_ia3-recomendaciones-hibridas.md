# 19 · IA3 Recomendaciones híbridas con re-ordenado en segundo plano

Fecha: 2026-10-22 · Rama: `feature/ia-3` (sale de `feature/ia-2`) · Estado: **terminado y probado de punta a punta con
Gemini real. Migración `20261022170000_recommendation_source.sql` probada en una transacción revertida y aplicada.**

Decisión del usuario (22 oct), sin facturación, por el cupo de 20 peticiones al día por modelo de texto
(`docs/progreso/18_*`):
- **Etiquetas con embeddings**, sin el modelo de texto (informe 18 §5).
- **Re-ordenado solo en la variante "ai"**, con caché de 24 h, calculado al abrir la app y en segundo plano.
- **Cadena de modelos** de texto.

## Qué se hizo

1. **Variante A/B** (`recommendations/variant.js`): `sha256(user_id + AB_SALT)`, primer byte par → `rules`, impar →
   `ai`. Fija por usuario, se reparte ~50 % (prueba con 2.000 ids). `AB_SALT` en `.env` (defecto `becore-ab-2026`).
2. **Variante "rules":** R5 tal cual (mismas reglas, orden y frases).
3. **Variante "ai"** (`recommendations/index.js`):
   - **Puntaje híbrido** (`hybrid.js`): 0,5 · similitud + 0,5 · reglas/6 + 0,1 si le gustó algo parecido (eventos que
     calificó con ≥ 4).
     - La similitud se reescala entre 0,58 y 0,72, calibrado con 80 pares reales (§3).
     - Entra todo lo que R5 mostraría y además lo que llegue a 0,25 solo por similitud. Así nunca muestra menos que la
       variante de reglas, ni siquiera sin embeddings.
   - **Con caché vigente (24 h):** orden y frases de Gemini. Se quita lo que ya no es candidato (lleno, confirmado,
     cancelado) y se completa con el orden híbrido.
   - **Sin caché:** responde **ya** con el orden híbrido y frase por plantilla, y programa en segundo plano **una sola
     petición** a Gemini con el top 15. La respuesta (orden y frase de 6) se guarda 24 h. No hay cron: solo cuando el
     usuario abre la app y no tiene caché válida, y un solo re-ordenado a la vez por usuario.
   - La caché se borra al guardar gustos y al calificar. Publicar un evento no la borra (re-ordenaría a todos y
     gastaría el cupo); los eventos nuevos entran por el relleno híbrido.
4. **Re-ordenado** (`rerank.js`): el prompt de la spec §5.3.
   - A Gemini le llegan los gustos de la persona (sin nada que la identifique) y los eventos con alias `c1…c15`, nunca
     sus UUID.
   - La respuesta se valida con Zod (frase de 3 a 80 caracteres, máx. 6).
   - Los alias inventados o repetidos se descartan.
5. **Cadena de modelos** (`GEMINI_TEXT_MODELS`, por defecto `gemini-3.6-flash,gemini-3-flash-preview,gemini-3.5-flash`).
   - Si uno da 429, cupo agotado, 503, timeout o JSON inválido, o está en pausa, se usa el siguiente.
   - El freno sigue siendo por modelo: 3 fallos en 60 s → 5 min; cupo diario → 1 h.
   - `generateJson` devuelve `{ data, model }` y el servidor registra `[ai] re-ordenado listo con <modelo>`, sin datos
     del usuario.
6. **Frase por plantilla** (`reasons.js`), cuando no hay respuesta de Gemini. Se arma con lo que coincide entre el
   evento y la persona:
   - gusto (etiqueta del evento entre sus gustos, o si no la categoría) + día de la semana + franja: "Porque te gusta
     el fútbol y es un sábado en la tarde";
   - si no: "Porque te gusta…", "Encaja con tu horario: es un sábado", "Es en tu zona" o "Parecido a lo que te gusta".
   - Nunca queda vacía, y `GET /events/recommended` nunca devuelve un error por culpa de Gemini.
7. **Origen de cada recomendación mostrada:** cada tarjeta se registra en `recommendation_events` (`shown`) con su
   variante y su origen: `gemini`, `template` o `rules`.
   - El registro no se espera: si falla, el usuario igual recibe su lista.
   - Migración `20261022170000_recommendation_source.sql`: columna `source` obligatoria con esos tres valores e índice
     `(variant, source, action)`.
8. **`/privacidad`:** dice que se usa la capa gratuita de Gemini, en la que Google puede usar lo que se le envía para
   mejorar sus productos, y que por eso solo se envían los gustos (planes, días, horarios, qué busca y zona) y los
   textos de los eventos (título, descripción y lugar). Nunca nombre, correo, sexo ni edad.
9. **Spec** `docs/specs/ai.md` actualizada: §3, §5.1, §5.2, §5.6, §6, §7, §10, §12 y §13.

**Contrato de `GET /events/recommended`:** sin cambios, sigue siendo `(Event & { reason })[]`.

## Migración `20261022170000_recommendation_source.sql`

Mismo procedimiento que la de IA1:

| Paso | Resultado |
|---|---|
| `db push --dry-run` | solo `20261022170000_recommendation_source.sql` |
| Prueba en transacción revertida (bloque `DO` que termina con `raise exception`) | 0 filas antes; columna `text`, `NOT NULL`; índice creado; `gemini`/`template`/`rules` se insertan; un origen inválido y uno vacío se rechazan |
| Base después de la prueba | sin la columna, 0 filas |
| `db push` | "Applying migration 20261022170000_recommendation_source.sql" |
| `migration list` | `20261022170000` en local y en remoto |

Se aplicó sin volver a preguntar, igual que la de IA1, porque la prueba salió limpia: es una columna nueva en una tabla
que estaba vacía.

## Prueba con datos reales

**Calibración de la similitud:** 8 perfiles × 10 eventos (80 pares). El coseno va de 0,565 a 0,720 (mediana 0,647).
- Pares en que el evento tiene una etiqueta entre los gustos de la persona: mediana 0,657.
- El resto: mediana 0,627.

La similitud separa poco porque los perfiles tienen muchos gustos. Por eso el reescalado va de 0,58 a 0,72, y para
entrar solo por similitud hace falta superar ~0,65.

**De punta a punta con Gemini real:**
- **Montaje:**
  - backend aparte en el 3001, con `AI_ENABLED=true` solo para ese proceso (sin tocar `backend/.env` ni el
    servidor del usuario);
  - `jugador1@becore.test`, que con la sal real cae en "rules", forzado a "ai" con una sal de prueba solo para ese
    proceso.

| Visita | Tiempo | Resultado |
|---|---|---|
| 1.ª (sin caché) | 2,1 s | "Polas y fútbol" → "Porque te gusta el fútbol" (plantilla); re-ordenado programado |
| ~25 s después | — | caché guardada: variante `ai`, 24 h, frase de Gemini, origen `gemini` |
| 2.ª | 2,4 s | "Polas y fútbol" → "Porque te gusta el fútbol y es para divertirte." (Gemini, desde la caché) |

- **En la base:** dos `shown` de la variante `ai`, uno con origen `template` y otro con `gemini`.
- **Sin errores `[ai]` en el servidor.** Esta prueba es anterior al log de qué modelo respondió, así que no quedó
  registrado si fue `gemini-3.6-flash` o el respaldo.
- **Limpieza:** esas 2 filas de `recommendation_events` y la caché salieron de la prueba con una sal distinta a la
  real, así que se borraron para no contaminar el análisis del partido. Las dos tablas quedaron en 0 filas.
- **Latencia:** los ~2 s de cada visita son del backend (varias consultas a Supabase), no de Gemini, que nunca está en
  el camino. Es el pendiente de latencia del backend del informe 15.

## Pruebas

- **`tests/recommendations.ai.test.js` (nuevo, 35):**
  - variante estable y ~50 %;
  - plantilla en todos sus casos, sin frase vacía;
  - puntaje y reescalado;
  - un evento entra por similitud y puede ir primero;
  - prompt con alias, sin UUID, nombres, correos, sexo ni edad (perfil "envenenado");
  - descarte de alias inventados y repetidos;
  - Zod de la frase;
  - caché + relleno;
  - `refreshAiCache` guarda primero lo de Gemini y luego el top 15 por 24 h, y no guarda nada si la cadena falla;
  - variante "ai" sin caché (responde con plantilla, programa y registra `template`) y con caché (frases de Gemini,
    no programa y registra `gemini`);
  - IA apagada, sin errores;
  - variante "rules" (origen `rules`, no toca la caché);
  - si falla el registro, igual hay lista.
- **`tests/gemini-client.test.js` (15):**
  - cadena de modelos (429, cupo, 503, timeout y JSON inválido pasan al siguiente; toda la cadena falla);
  - freno por modelo (cupo 1 h, 3 fallos 5 min);
  - el cupo de texto no frena los embeddings;
  - lista de modelos;
  - logs sin datos.
- **`tests/ai-indexing.test.js` (18):** etiquetas por similitud (umbral, margen, máximo 4, sin etiquetas bajo el
  umbral), caché de los 18 gustos (una vez, archivo, otro modelo, reintento si falla) y que el etiquetado nunca llama
  al modelo de texto.
- **Invalidación de la caché:** al guardar gustos (`me.service.test.js`) y al calificar (`ratings.service.test.js`).
- **`ai-migration.test.js`:** la columna `source`.
- **`recommendations.service.test.js`:** fija la variante "rules" de forma explícita.

## Verificación

| Qué | Resultado |
|---|---|
| `npm run lint` | sin errores |
| `npm test` | backend 400/400, frontend 318/318 |
| `npm run build -w frontend` | compila |

## Para el usuario

- **`backend/.env`:** la variable final es **`GEMINI_TEXT_MODELS`** (plural, separada por comas), por ejemplo
  `GEMINI_TEXT_MODELS=gemini-3.6-flash,gemini-3-flash-preview,gemini-3.5-flash`. Si queda vacía usa ese mismo valor.
  `GEMINI_TEXT_MODEL` (singular) ya no se lee y se puede borrar. Opcional: `AB_SALT`.
- **Para activar la IA** en el servidor: `AI_ENABLED=true` y reiniciarlo.

## Pendiente

- IA4: clics y confirmados (`clicked` / `confirmed`), métricas por variante y origen, y aviso en el onboarding.
- Revisar el umbral de etiquetas y el reescalado de la similitud cuando haya más eventos y usuarios reales.
- Latencia del backend en `/events/recommended` (~2 s), ya anotada como pendiente.
