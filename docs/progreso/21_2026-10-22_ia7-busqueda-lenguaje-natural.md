# 21 · IA7 Búsqueda en lenguaje natural

Fecha: 2026-10-22 · Rama: `feature/ia-7` (sale de `feature/ia-4`) · Estado: **terminado. Migración
`20261022180000_ai_search.sql` aplicada en Supabase.**

## Qué cambió para quien usa la app

- El buscador de Descubre (y el de la barra superior en escritorio) entiende frases: "fútbol el sábado en la tarde",
  "algo tranquilo el domingo con mi familia", "leer un libro con otras personas".
- Placeholder "Prueba: fútbol el sábado en la tarde". El buscador de la barra superior pasó de 240 a 288 px para que el
  ejemplo quepa completo.
- Etiqueta discreta "Búsqueda inteligente" cuando la respuesta vino del modo semántico.
- Vacío: "No encontramos planes así. Prueba con otras palabras.", con "Quitar búsqueda".
- Los resultados reemplazan la lista y los pines del mapa; la categoría se aplica en el backend y "Más cerca primero"
  sigue ordenando en el navegador.
- `/privacidad` ahora dice que lo que se escribe en el buscador va a Gemini, sin correos ni teléfonos y sin decir quién lo
  escribió.

## Cómo funciona

Detalle en `docs/specs/ai.md` §15 y `docs/specs/api.md` (`GET /events/search`).

- **Semántica:**
  1. Se limpia la consulta (correos y números de 7 o más dígitos fuera).
  2. Se calcula su embedding (solo cupo de embeddings; el de texto no se toca).
  3. Se compara con `event_ai` por la función `match_event_embeddings` (índice HNSW).
  4. Se puntúa con la similitud reescalada, la coincidencia literal en título o lugar y los refuerzos por día, franja,
     categoría y gusto que la frase menciona (reglas en español, sin LLM).
- **Clásica (respaldo):** la frase o todas sus palabras en título, descripción o lugar, sin tildes. Se usa con la IA
  apagada, si Gemini o la base fallan, o si una persona pasa 30 embeddings nuevos en 10 min. Nunca hay un 500 por la IA.
- **Caché:** consultas normalizadas por 24 h (máx. 500). La misma búsqueda de dos personas pide un solo embedding.
- **Registro:** `search_events` guarda la consulta limpia, el modo, el número de resultados y el primer resultado
  abierto. **Sin `user_id`.**

## Migración `20261022180000_ai_search.sql`

- Función `match_event_embeddings(vector(768), int)`: `security definer`, `search_path = ''`, solo `service_role`.
- Tabla `search_events`: RLS sin políticas y sin permisos para `anon`/`authenticated`.
- **Procedimiento:**
  - `migration list`: local y remoto iguales salvo la nueva.
  - `db push --dry-run`: solo `20261022180000_ai_search.sql`.
  - **Prueba en transacción revertida:** el embedding de un evento contra sí mismo lo devuelve primero con similitud
    1,0000 (5 filas con límite 5); `anon` y `authenticated` sin `execute`, `service_role` con `execute`; 0 políticas;
    inserta, marca la apertura y el check rechaza un modo inválido; `anon` sin `select` sobre la tabla.
  - Después de la prueba la base seguía intacta (ni la función ni la tabla existían).
  - Aplicada con `db push`; `migration list` quedó igual en local y remoto.

## Calibración

**Datos:** 20 consultas anotadas a mano con los eventos que deberían salir, sobre los 12 eventos próximos del 22 oct
(10 de demo y 2 reales). Costó 20 llamadas al modelo de embeddings y ninguna al de texto.

**Similitud coseno cruda:**
- de los esperados: mín. 0,610, mediana 0,680, máx. 0,776;
- de los no esperados: mediana 0,606, p90 0,651, máx. 0,696.

Las dos distribuciones se cruzan, así que la similitud sola no alcanza: por eso la coincidencia literal y los refuerzos.

**Búsqueda en rejilla** (piso, techo, umbral y pesos de los refuerzos) maximizando F1. Elegido:
- piso 0,44, techo 0,80 y umbral 0,75;
- refuerzos: día 0,15, franja 0,1, categoría 0,1 y gusto 0,25;
- coincidencia literal +1.

**Resultado:** precisión 0,81, recall 0,86, F1 0,83. 15 de 20 consultas exactas y las 2 sin respuesta esperada vacías.
Recalculado con el código que se entrega (`services/search/score.js`), con las mismas cifras.

| Consulta | Esperado | Devuelve | Resultado |
|---|---|---|---|
| algo tranquilo para el domingo con mi familia | Caminata al Cerro Nutibara; Taller de acuarela; Feria de emprendimiento | los 3 | exacta |
| fútbol cerca de Belén en la noche | Microfútbol mixto; Polas y fútbol | los 2 | exacta |
| fútbol el sábado en la tarde | Microfútbol mixto; Polas y fútbol | los 2 | exacta |
| Avengers | Estreno Avengers Doomsdale | ese | exacta |
| Arví | Ciclopaseo al Parque Arví | ese | exacta |
| cine | Cine al aire libre; Estreno Avengers | los 2 | exacta |
| película al aire libre | Cine al aire libre | + Estreno Avengers | sobra 1 |
| yoga | Yoga al atardecer | ese | exacta |
| algo para hacer ejercicio | Yoga, Microfútbol, Baloncesto 3×3, Ciclopaseo, Caminata | solo Yoga | faltan 4 |
| plan cultural el jueves en la noche | Cine al aire libre | + Club de lectura, Estreno Avengers, Noche de juegos de mesa | sobran 3 |
| juegos de mesa | Noche de juegos de mesa | ese | exacta |
| leer un libro con otras personas | Club de lectura | ese | exacta |
| baloncesto | Torneo relámpago de baloncesto 3×3 | ese | exacta |
| montar en bicicleta | Ciclopaseo al Parque Arví | ese | exacta |
| pintar | Taller de acuarela en el Jardín Botánico | ese | exacta |
| emprendimiento | Feria de emprendimiento del barrio | ese | exacta |
| clases de piano | (nada) | (nada) | exacta |
| natación | (nada) | (nada) | exacta |
| algo el fin de semana en la mañana | Caminata, Taller de acuarela, Ciclopaseo | + Feria de emprendimiento | sobra 1 |
| Envigado | Cine al aire libre | + Estreno Avengers | sobra 1 |

**Lectura de los fallos:**
- **"Envigado" y "película al aire libre":** el estreno de Avengers es en Viva Envigado y es una película, así que el
  "sobra" es discutible. La anotación fue estricta.
- **"algo para hacer ejercicio":** pide una categoría entera. "Ejercicio" activa el refuerzo de deporte (0,1), pero no
  alcanza sin más similitud. Subirlo metía falsos positivos en otras consultas.
- **"plan cultural el jueves en la noche":** los cuatro devueltos son de noche y tres son de cultura. Solo el cine al
  aire libre cae en jueves, pero los refuerzos de franja y categoría suman lo suficiente.

## Verificación

| Qué | Resultado |
|---|---|
| `npm run lint` | sin errores |
| `npm test` | backend 449/449, frontend 329/329 |
| `npm run build -w frontend` | compila |

**En Edge** (mi backend en el 3001 con la IA activa, Vite en el 5180, cuenta `jugador1`):

| Consulta | 390 px y 1440 px |
|---|---|
| "fútbol el sábado en la tarde" | "Búsqueda inteligente"; Polas y fútbol, Microfútbol mixto |
| "Avengers" | "Búsqueda inteligente"; Estreno Avengers Doomsdale |
| "clases de piano" | vacío "No encontramos planes así. Prueba con otras palabras." |
| mapa con "fútbol el sábado en la tarde" | 2 pines |

- Sin scroll horizontal y sin errores en consola.
- Al escribir en el buscador sale una sola petición (debounce de 400 ms).
- **Modo clásico** (backend con `AI_ENABLED=false`): "Belén" encuentra Microfútbol mixto, sin la etiqueta. La frase
  "fútbol el sábado en la tarde" no encuentra nada, como se espera sin IA.
- Capturas en `capturas-21/`.

**Latencia** (`/events/search`, medida en el log del backend):
- con el embedding en caché: 1,0–1,7 s;
- la primera vez de una consulta: ~2,1 s;
- modo clásico: 0,6–1,1 s.

En la misma corrida, `/events` tardó 1,2 s y `/me` entre 0,6 y 0,9 s: la autenticación pesa igual en todas las rutas (no
se tocó, como se acordó).

Primero tardaba 1,6–4,6 s; se bajó con dos cambios:
- leer solo las etiquetas en vez del vector completo de cada evento (0,48 s → una consulta liviana);
- hacer en paralelo los eventos próximos con el embedding, y la función de similitud con las etiquetas.

**Limpieza:** las filas de `search_events` que generó esta verificación se borraron.

**Pruebas nuevas:**
- `tests/search.test.js` (24):
  - limpieza de correo y teléfono, normalización, detección de día, franja, categoría y gusto;
  - reescalado, coincidencia literal y refuerzos;
  - semántica, "Avengers" literal, umbral sin resultados y caché;
  - categoría, respaldo clásico (IA apagada, error, cupo agotado, falla de la base) y límite por persona;
  - `recordOpen` y la migración.
- `tests/search.routes.test.js` (5): 401, 400 por Zod, que `/events/search` no se confunda con `/events/:id`, y 204/400/401
  de `open`.
- Frontend: `isApiSearch`, el nuevo vacío y que la precarga no pida la lista con `?q=`.

## Pendiente

- Push de `feature/ia-7` hecho; el PR lo abre el equipo. **La migración ya está aplicada.**
- IA8 (asistente para crear eventos) cuando se pida.
- **Día 28 — autenticación (~0,6 s por petición):** cada request consulta a Supabase con `auth.getUser(token)`. Revisar si el
  backend puede verificar el JWT localmente (firma y expiración) en vez de ir a Supabase en cada petición, conservando la lectura
  del rol desde `public.profiles`. Solo anotado; no se ha tocado.
