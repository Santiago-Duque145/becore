# Be Core · Plan de trabajo para Santiago

**Fecha:** 2026-10-12 · **Para:** Santiago Duque Gallego · **De:** Felipe (preparado con Claude)
**Hitos:** congelamiento de código **29 oct** · partido de validación **31 oct** · sustentación **3–6 nov**

---

## 0. Dónde quedamos (lee esto primero)

Entre el 11 y el 12 de octubre se hizo el **rediseño completo del frontend** en 10 sesiones de Claude Code (R0–R9), todas con **Opus 5.5**:

| Sesión | Resultado |
|---|---|
| R0 | Auditoría del frontend → `docs/specs/rediseno-auditoria.md` |
| R1 | Sistema de diseño: tokens, componentes en `components/ui/`, íconos propios, layouts por rol |
| R2 | Backend: migración de onboarding aplicada en Supabase, `GET /me`, `PUT /me/onboarding`, `PUT /me/preferences` |
| R3 | Login idéntico al mockup, registro, **Google**, recuperar contraseña, guards |
| R4 | Onboarding de 5 pasos (rol, gustos, horarios, motivación, zona) |
| R5 | Descubre + "Para ti" por reglas (`GET /api/v1/events/recommended`) |
| R6 | Detalle de evento con confirmación y cupo en vivo |
| R7 | Mis eventos, Avisos, Perfil (editar gustos) |
| R8 | Panel del organizador, crear/editar evento, check-in, citas |
| R9 | Pulido: Lighthouse Accesibilidad 100, PWA, carga diferida por ruta |

Informe completo: `docs/progreso/04_2026-10-12_rediseno-frontend.md`.

**Configuración ya hecha (no la repitas):**
- Supabase: proveedor Google activo, URLs de redirección, SMTP propio con la cuenta de Gmail del proyecto, "Confirm email" desactivado.
- Google Cloud: cliente OAuth creado, app en modo prueba.
- `backend/.env`: SMTP con contraseña de aplicación y `GEMINI_API_KEY`.

**Este plan** también debe quedar en el repo como `docs/PLAN-santiago.md`; las sesiones de IA lo leen desde ahí.

**Documentos clave del repo:**
- `CLAUDE.md`, `frontend/CLAUDE.md`, `backend/CLAUDE.md`: reglas para Claude Code.
- `.claude/skills/becore-ui/SKILL.md`: sistema de diseño (obligatorio para todo lo visual).
- `docs/specs/`: `backlog.md`, `api.md`, `auth-onboarding.md`, `rediseno-auditoria.md`.
- `docs/mockups/`: las 6 pantallas de referencia.
- `docs/PROMPTS-rediseno.md`: los prompts usados en R0–R9, sirven de ejemplo de formato.

---

## 1. Preparar tu máquina (30 min)

1. `git checkout develop && git pull`.
2. `npm install` en la raíz (workspaces).
3. **`backend/.env`**: pídele a Felipe los valores **por un canal privado**, nunca por el repo ni pegados en un chat de IA. Compara con `backend/.env.example` que no falte ninguna variable (incluida `GEMINI_API_KEY`).
4. Revisa que `.claude/settings.json` bloquee la lectura de `.env`. Claude Code no debe leerlo.
5. Libera el puerto 5173 y levanta todo con `npm run dev`. Frontend en `http://localhost:5173`, backend en 3000.
6. **Prueba rápida del login**. Si algo falla, anota el mensaje exacto.

| # | Prueba | Esperado |
|---|---|---|
| 1 | `/login` | Igual a `docs/mockups/mobile-login.html` + botón de Google |
| 2 | Entrar con usuario del seed | Va a Descubre o Panel según rol, sin onboarding |
| 3 | Registro con correo nuevo | Entra directo a `/bienvenida` |
| 4 | Onboarding eligiendo "Organizar" | Termina en Panel como organizador |
| 5 | "Continuar con Google" (tu correo debe estar en *Test users* de Google Cloud) | Vuelve a la app y pasa por `/bienvenida` |
| 6 | "¿Olvidaste tu contraseña?" | Llega correo de la cuenta de Be Core y deja cambiarla |
| 7 | Desde el celular: `http://IP-del-portátil:5173` | Funciona y se puede "Agregar a pantalla de inicio" |

---

## 2. Cómo trabajamos con Claude Code

- **Modelo: Opus 5.5.** Una sesión por prompt y `/clear` entre sesiones.
- **Modo plan** (Shift+Tab dos veces) antes de pegar el prompt. Lee el plan y corrígelo antes de aprobarlo.
- **Una rama por sesión**, desde `develop`: `feature/<fase>-<n>`. PR hacia `develop`; Felipe revisa y hace merge. Haz push al terminar cada sesión, no acumules ramas locales.
- **Seguridad:**
  - Nunca pegues tokens (`sbp_…`, API keys, contraseñas) en el chat de Claude Code ni en Claude.ai.
  - Si Claude Code pide un secreto, configúralo tú en `.env` o en el dashboard.
- **Cuando una sesión termine**, pega su resumen en el proyecto **"BeCore - ProyectoGrado - Pipe"** de Claude.ai. Allí se revisa y se prepara el siguiente prompt ajustado al código real.
- **Cada avance** deja su informe en `docs/progreso/NN_YYYY-MM-DD_titulo.md`.

---

## 3. Fase 1 · Estado real de los sprints (1 sesión, hoy)

Antes de programar más, hay que saber qué falta de S2 (asistencia, citas, correo) y S3 (paneles, pruebas). Rama `feature/estado-sprints`:

```
Sesión de estado (NO cambies código). Lee CLAUDE.md, docs/specs/backlog.md, docs/specs/api.md y docs/progreso/.

1. Compara cada tarea del backlog (y cada RF-01 a RF-19) contra el código actual y clasifícala: Hecha y probada / Hecha sin pruebas / Parcial / No empezada. Para Parcial y No empezada di en 1 línea qué falta.
2. Corre npm test con cobertura y reporta la cobertura de los servicios de eventos, cupos y asistencia (el objetivo es ≥ 70 %).
3. Revisa los correos: ¿el cron de recordatorios cada 15 min y los avisos de cambio/cancelación funcionan con el SMTP actual? Si puedes, dispara un recordatorio de prueba a mi correo y confírmalo.
4. Para la integración de IA que viene: describe el módulo de recomendaciones de R5 (archivos, funciones, contrato de GET /api/v1/events/recommended), confirma si la extensión pgvector está disponible en el proyecto Supabase (sin instalarla) y lista las variables de backend/.env.example (solo los nombres, nunca los valores).
5. Escribe todo en docs/progreso/05_2026-10-12_estado-sprints.md y dame un resumen corto con lo pendiente ordenado por prioridad para la sustentación (código congelado el 29 de octubre).
```

**Entregable:** el informe `05_…`. Pégalo en el proyecto de Claude.ai para recibir los prompts exactos de la Fase 2.

---

## 4. Fase 2 · Cerrar los sprints (13 – 18 oct)

Los prompts exactos salen del informe de la Fase 1. Prioridad, de mayor a menor:

1. **Asistencia y cupo**: confirmación atómica bajo concurrencia, cancelación, check-in. Es el corazón de la demo.
2. **Correos**: recordatorio automático antes del evento y aviso de cambio o cancelación. Se muestra en vivo en la sustentación.
3. **Citas y disponibilidad** (RF de citas).
4. **Pruebas**: cobertura ≥ 70 % en eventos, cupos y asistencia.
5. **README de instalación** reproducible para ambos computadores (RNF de disponibilidad).

Regla: mejor un módulo al 100 % que tres al 60 %.

---

## 5. Fase 3 · Inteligencia artificial con Gemini — opción híbrida (19 – 26 oct)

> ⚠️ **Antes de empezar:** el CLAUDE.md (§8) dice que la IA está **fuera de alcance**. Hay que hablarlo con el director (Victor Daniel Gil Vera) y dejar la decisión registrada en `docs/progreso/` y en CLAUDE.md. Sin eso no se empieza.

### Qué vamos a construir

```
Evento publicado/editado ──► Gemini etiqueta (gustos del onboarding) ──► embedding del evento (pgvector)
Usuario guarda gustos    ──► embedding del perfil (pgvector)

GET /api/v1/events/recommended
  1. Candidatos por reglas (publicados, futuros, con cupo, no confirmados)  ← ya existe (R5)
  2. Puntaje híbrido = 0.5 · similitud de embeddings + 0.5 · puntaje por reglas
  3. Top 15 → Gemini re-ordena los 6 mejores y escribe la razón en español (JSON validado con Zod)
  4. Caché por usuario; si Gemini falla o tarda > 3 s → se usa el puntaje híbrido sin LLM
```

En la sustentación se presenta como **sistema de recomendación híbrido**: filtrado por contenido con embeddings + reglas de negocio + re-ranking con un modelo de lenguaje. Se valida con una **prueba A/B en el partido del 31**.

### Reglas para toda la fase
- La `GEMINI_API_KEY` solo vive en `backend/.env`. El frontend nunca llama a Gemini.
- A Gemini **nunca** se le manda nombre, correo ni IDs de usuario: solo gustos y datos de eventos.
- Toda llamada a Gemini tiene timeout, respaldo sin IA y salida validada con Zod. La app nunca se rompe por la IA.
- Los modelos se configuran por variable de entorno (`GEMINI_MODEL`, `GEMINI_EMBEDDING_MODEL`); Opus debe confirmar los nombres vigentes en la documentación oficial de Gemini antes de usarlos.
- Capa gratuita de Gemini: Google puede usar esos datos para mejorar sus productos. Por eso el onboarding debe decir "Usamos IA para recomendarte eventos".

### Sesiones (rama `feature/ia-N` cada una)

**IA0 · Spec y decisión** (solo documentos)
```
Lee CLAUDE.md, docs/progreso/05_*, el módulo de recomendaciones de R5 y la sección "Fase 3" de docs/PLAN-santiago.md.
Escribe docs/specs/ai.md con: arquitectura híbrida, migración propuesta, contratos de API, prompts exactos para Gemini (en español, salida JSON con esquema), manejo de errores y respaldo, privacidad, plan de pruebas con Gemini simulado y diseño de la prueba A/B. Confirma en la documentación oficial de Gemini los nombres vigentes del modelo de texto barato (Flash-Lite o Flash) y del modelo de embeddings, y si el SDK oficial para Node es @google/genai. Actualiza CLAUDE.md §8 y §3 para registrar que la IA entra al alcance con aprobación del director (fecha y nota) y que se usa la API de Gemini. No escribas código.
```

**IA1 · Base de datos e infraestructura**
```
Lee docs/specs/ai.md.
1. Migración supabase/migrations/2026101XXXXXXX_ai_recommendations.sql: activar extensión vector; events.tags text[] (con check contra la lista de INTERESTS) y events.embedding vector(768); user_preferences.embedding vector(768); tabla ai_recommendations (user_id, items jsonb [{eventId, score, reason}], variant text, generated_at, expires_at); tabla recommendation_events (user_id, event_id, variant, action in ('shown','clicked','confirmed'), created_at). Índice HNSW sobre events.embedding. RLS como el resto (lectura propia, escritura solo Express). Pruébala primero en una transacción revertida y luego aplícala.
2. backend/src/services/ai/geminiClient.js: cliente único con timeout, reintento 1 vez, logs sin datos personales, y funciones embedText(text) y generateJson(prompt, schema).
3. Variables nuevas en backend/.env.example (sin valores): GEMINI_MODEL, GEMINI_EMBEDDING_MODEL, AI_ENABLED.
4. Tests con el cliente simulado.
```

**IA2 · Etiquetado y embeddings de eventos y perfiles**
```
Lee docs/specs/ai.md.
1. Al publicar o editar un evento: Gemini devuelve tags (solo slugs de la lista INTERESTS, máx. 4) a partir de título, descripción y categoría; luego se calcula el embedding de "título + descripción + tags". Todo en segundo plano: la API responde sin esperar a Gemini.
2. Al guardar gustos (onboarding o perfil): embedding del perfil a partir de un texto armado con intereses, horarios, motivación y zona (sin nombre).
3. Script npm run ai:backfill para etiquetar y vectorizar eventos y perfiles existentes, con pausa entre llamadas para no pasar el límite gratuito.
4. Muestra los tags en el detalle del evento como chips (skill becore-ui).
5. Tests con Gemini simulado.
```

**IA3 · Recomendaciones híbridas con re-ranking**
```
Lee docs/specs/ai.md y el módulo de recomendaciones de R5.
1. Sin cambiar el contrato de GET /api/v1/events/recommended: candidatos por reglas → puntaje híbrido (similitud coseno con pgvector + puntaje por reglas normalizado) → top 15 → Gemini re-ordena y devuelve los 6 mejores con reason en español (JSON validado con Zod; descartar IDs que no estén en los candidatos).
2. Caché en ai_recommendations por 6 horas; se invalida al cambiar gustos o al publicarse un evento nuevo.
3. Respaldo: si AI_ENABLED=false, Gemini falla o tarda > 3 s, usar el puntaje híbrido con reasons de reglas.
4. Respuesta en < 2 s con caché (RNF de rendimiento). Mide y reporta.
5. Tests: casos de respaldo, IDs inventados por el modelo, JSON inválido, caché.
```

**IA4 · Prueba A/B y métricas para la sustentación**
```
Lee docs/specs/ai.md.
1. Variante por usuario determinista (hash del user_id): "rules" (solo reglas, R5) o "ai" (híbrido IA3). Guardar la variante en la respuesta.
2. Registrar en recommendation_events: shown (al mostrar "Para ti"), clicked (al abrir un evento desde "Para ti"), confirmed (al confirmar asistencia de un evento que vino de "Para ti").
3. Endpoint solo para organizadores GET /api/v1/admin/ai-metrics con, por variante: usuarios, mostrados, CTR y tasa de confirmación.
4. Tarjeta "Recomendaciones IA vs reglas" en el panel del organizador con esos números (skill becore-ui).
5. Agrega al onboarding el aviso "Usamos IA para recomendarte eventos" (paso final).
```

**IA5 · Opcional, si sobra tiempo: "Escribir con IA"**
```
En el formulario de crear evento, botón "Escribir con IA" que genera una descripción atractiva a partir de título, categoría, lugar y fecha. El organizador la puede editar antes de guardar. Respaldo si falla. Máx. 600 caracteres, tono de la skill.
```

---

## 6. Fase 4 · Congelamiento y validación (27 oct – 1 nov)

| Fecha | Qué |
|---|---|
| 27–28 oct | Solo bugs. Ensayo completo de la demo en ambos computadores. |
| **29 oct** | **Congelamiento v1.0**: tag `v1.0` en `main`. Desde aquí, nada nuevo. |
| 30 oct | Preparar el partido: crear el evento real, agregar los correos de los amigos en *Test users* de Google, revisar la IP del portátil en la red que se usará. |
| **31 oct** | **Partido de validación**: registro + onboarding, confirmación, recordatorio por correo, check-in en la cancha, A/B de recomendaciones, cuestionario SUS (agregar la pregunta "¿Las recomendaciones de 'Para ti' te parecieron acertadas?"). |
| 1 nov | Consolidar resultados (SUS, métricas A/B, capturas) en `docs/progreso/` para la presentación. |

**Para el partido:** el portátil debe tener los servidores corriendo y estar en la misma red que los celulares (hotspot o red compartida). Los datos móviles de cada celular no llegan al portátil.

---

## 7. Checklist rápido

- [ ] Máquina lista y las 7 pruebas del login pasan
- [ ] Fase 1: informe `05_…` hecho y pegado en Claude.ai
- [ ] Fase 2: sprints cerrados, cobertura ≥ 70 %
- [ ] Aprobación del director para la IA registrada
- [ ] IA0 → IA4 terminadas (IA5 opcional)
- [ ] `v1.0` el 29 de octubre
- [ ] Partido del 31 con resultados guardados
