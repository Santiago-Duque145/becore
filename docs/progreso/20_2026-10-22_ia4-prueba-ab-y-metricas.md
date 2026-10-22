# 20 · IA4 Prueba A/B y métricas (y ajustes previos: sal obligatoria, eventos de demostración, "Para ti" vacío)

Fecha: 2026-10-22 · Rama: `feature/ia-4` (sale de `feature/ia-3`) · Estado: **terminado. Sin migraciones nuevas.**

## 0. Ajustes antes de IA4 (primeros commits de la rama)

### Sal de la prueba A/B obligatoria
- Se quitó el valor por defecto de `AB_SALT` del código: una sal conocida permitiría saber de antemano la variante de
  cada cuenta.
- Con `AI_ENABLED=true` y sin `AB_SALT`, el backend no arranca y dice `falta AB_SALT (obligatoria con AI_ENABLED=true)`.
- Sin sal y con la IA apagada no hay prueba A/B: todos ven "rules".
- Pruebas en `tests/env.test.js`.
- Con la sal del usuario (calculado dentro del backend, sin imprimirla), caen en "ai" `jugador2`, `3`, `7`, `8`, `10` y
  `11` (6 de 12). Ninguna tiene gustos guardados: para mostrar "Para ti" con una de ellas, primero se guardan gustos en
  Perfil.

### Eventos de demostración (`npm run seed:demo -w backend`)
- **Qué crea:** 10 eventos publicados del 25 oct al 15 nov, en distintos días y franjas (mañana, tarde y noche):
  - 4 de deporte, 3 de cultura, 2 de recreación y 1 de otro;
  - en lugares reales de Medellín, Envigado, Sabaneta y Santa Elena, con coordenadas aproximadas, cupos y descripciones
    creíbles.
- **Organizador:** una cuenta creada solo para esto, "Barrio Activo" (`organizador.demo@becore.test`). Esa cuenta es
  la marca: las métricas excluyen sus eventos, y `--remove --apply` borra sus eventos (con asistencias y registros en
  cascada) y la cuenta.
- **Ninguno cae el 31 de octubre:** el torneo de baloncesto se movió al 7 de noviembre.
- **Uso:** por defecto solo muestra el plan; escribe con `--apply`. Al aplicar solo crea los eventos que sigan siendo
  futuros. Reaplicar no duplica: la cuenta se busca por correo y los eventos por título.
- **Sin efectos hacia usuarios reales:**
  - se insertan con la secret key, sin pasar por la API: no hay correos ni avisos;
  - en `events` solo corre el trigger que marca la fecha;
  - el frontend solo escucha `UPDATE` de `events` filtrado por id u organizador;
  - no hay recordatorios porque no hay confirmados.
  - Verificado en la base: 0 notificaciones y 0 filas de `activity_log` sobre ellos.
- **Etiquetas:** con embeddings (10 llamadas al modelo de embeddings, ninguna al de texto). 9 de 10 etiquetados
  correctamente; la feria de emprendimiento, sin etiqueta (no encaja en ningún gusto).
- **Aplicado el 22 oct.** La segunda corrida de `--apply` omitió los 10 eventos ("ya existe"): 1 cuenta, 10 eventos,
  0 títulos repetidos, 0 eventos el 31.
- **En la app** (Edge, 390 px): los 10 aparecen en la lista de Descubre y como pines en el mapa, con el color de su
  categoría, y el detalle de 9 de ellos muestra su gusto. El "Para ti" de `jugador1` pasó de vacío a 6 tarjetas.
  Capturas `demo-*.png` en `capturas-20/`.
- **Procedimiento** en `docs/specs/plan-validacion.md`:
  - **noche del 30:** `npm run seed:demo -w backend -- --remove --apply`;
  - **1 de noviembre:** volver a aplicar, y solo se crean los que sigan siendo futuros.
  - Como el 31 no existen eventos de demo, el análisis del partido no tiene nada que excluir.

### "Para ti" vacío
- `GET /events/recommended` agrega `meta.emptyReason` solo cuando la lista viene vacía: `no_preferences`, `no_events`,
  `all_confirmed` o `no_matches`. Es aditivo: `data` sigue siendo el mismo arreglo.
- **Si ya confirmó todo lo que tiene cupo:** la sección no desaparece. Muestra un `EmptyState` compacto (prop nueva
  `size="sm"`): "Ya estás en todo lo que encaja contigo. Explora más abajo: puede que encuentres un plan nuevo.", con el
  botón "Ver mis eventos".
- **Si nada encaja:** "Aún no hay eventos que encajen con tus gustos.", con el botón "Ajustar mis gustos".
- **Sin gustos o sin eventos:** no se muestra.
- Revisado a 390 y 1440 px. Capturas `para-ti-vacio-*.png`.

## 1. IA4

1. **Variante determinista:** ya estaba desde IA3 (`sha256(user_id + AB_SALT)`).
2. **Registro de abiertos y confirmados** (`services/recommendations/feedback.js`):
   - **Abiertos:** `POST /recommendations/feedback` con `{ eventId, action: 'clicked' }`. El frontend lo manda al
     abrir una tarjeta de "Para ti", sin esperar y sin avisar si falla.
   - **Confirmados:** confirmar asistencia (`attendance.service.js`) registra el "confirmado" sin esperar. Si el
     registro falla, la confirmación no se entera.
   - Los dos solo cuentan si ese evento se le mostró en "Para ti" en los **últimos 7 días**, y heredan la variante y el
     origen (`gemini`, `template` o `rules`) de ese "mostrado".
   - El índice único (de IA1) evita contar dos veces el mismo par usuario-evento; un duplicado no es un error.
3. **`GET /admin/ai-metrics`** (solo organizadores; un participante recibe 403):
   - por variante: personas, mostrados, abiertos, confirmados, CTR, tasa de confirmación y calificación promedio de
     los eventos confirmados desde "Para ti";
   - dentro de "ai", lo mismo **por origen** (Gemini o plantilla);
   - se cuentan pares distintos (usuario, evento), porque "mostrado" se repite en cada visita;
   - excluye los eventos de la cuenta de demostración.
4. **Tarjeta "Recomendaciones IA vs reglas"** en el panel del organizador (`components/organizer/AiMetricsPanel.jsx`):
   - tabla accesible (con `caption` y `th scope`) de reglas frente a IA;
   - línea con lo que vino de Gemini y lo que salió de la plantilla;
   - aviso de "muestra pequeña (menos de 30 personas por variante): léelo como un estudio exploratorio";
   - estados de carga, error y vacío ("Aún no hay datos de la prueba. Aparecen cuando la gente abre “Para ti” en
     Descubre.").
   - Revisada a 390 y 1440 px con datos simulados (capturas `ia4-tarjeta-*.png`) y con los datos reales de hoy.
5. **Aviso en el paso final del onboarding** ("¿Por dónde te mueves?"): "Usamos IA para recomendarte eventos: solo con
   tus gustos, nunca con tus datos personales.", con el enlace "Cómo usamos tus datos" a `/privacidad`. Captura
   `ia4-onboarding-390.png`.

**Datos reales hoy:** 1 persona por variante con 1 evento mostrado cada una. Los "mostrados" que generó la verificación
de los eventos de demo con `jugador1` no cuentan: son eventos de demo, quedan excluidos de las métricas y se borrarán
con `--remove`.

## Verificación

| Qué | Resultado |
|---|---|
| `npm run lint` | sin errores |
| `npm test` | backend 420/420, frontend 327/327 |
| `npm run build -w frontend` | compila |

**Pruebas nuevas:**
- `env.test.js`: la sal es obligatoria con la IA activa.
- `recommendations.feedback.test.js`:
  - atribución a 7 días, herencia de variante y origen, duplicados y errores;
  - métricas por pares, por origen, sin demo y en null sin datos;
  - rutas (204, 400, 403 y 200).
- `attendance.service.test.js`: confirmar registra sin bloquear.
- `recommendations.ai.test.js`: motivos de `explainEmpty`.
- `recommendations.routes.test.js`: `meta` solo cuando la lista viene vacía.
- Frontend: `ParaTiCarousel.test.jsx`, `ai-metrics.test.js` y `AiMetricsPanel.test.jsx`.

## Pendiente

- La noche del 30: `npm run seed:demo -w backend -- --remove --apply`. El 1 de nov: volver a aplicarlo.
- Para la demo de la variante "ai": guardar gustos a una de `jugador2/3/7/8/10/11` en Perfil.
- IA6 (resumen de reseñas), si hay tiempo.
