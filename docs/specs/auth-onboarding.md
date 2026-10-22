# Spec · Login, Google y onboarding de gustos

**Ubicación en el repo:** `docs/specs/auth-onboarding.md`
**Fecha:** 2026-10-11 · **Sprint:** S2 (frontend) · **RF:** RF-01 (registro), RF-02 (login), RF-03 (roles) · **Skill obligatoria:** `.claude/skills/becore-ui/SKILL.md`

---

## 1. Objetivo

1. Que el login se vea **igual al mockup** `docs/mockups/mobile-login.html`.
2. Agregar **"Continuar con Google"** (Supabase Auth OAuth).
3. Al crear cuenta, un **cuestionario corto de gustos** (≤ 60 s, se puede omitir) que guarda preferencias para recomendar eventos.
4. Mostrar una sección **"Para ti"** en Descubre con recomendaciones por afinidad (reglas, sin IA — ver §9).

## 2. Decisiones tomadas (para la sustentación)

| Tema | Decisión | Por qué |
|---|---|---|
| Botones "Organizador / Participante" del mockup bajo "o continúa como" | Se reemplazan por **un botón "Continuar con Google"** bajo el divisor "o continúa con". El rol se elige en el **paso 1 del onboarding**. | En el login el rol no sirve de nada: ya está guardado en `profiles`. Elegirlo al iniciar sesión confunde. Así todo lo demás queda idéntico al mockup. |
| Formulario de registro | Solo **nombre, correo y contraseña**. Sin rol. | Menos campos = más registros completos. El rol pasa al onboarding, igual para correo y Google. |
| Usuarios de Google | El trigger los crea como `participant`; pueden cambiar a `organizer` en el onboarding. | Google no envía rol; el trigger actual lanzaba `INVALID_ROLE` y **el login con Google habría fallado**. Ya corregido en la migración. |
| Cambio de rol | Solo permitido mientras `profiles.onboarding_completed_at IS NULL`. | Evita que alguien se vuelva organizador después a escondidas. |
| Recomendaciones | Puntaje de afinidad por reglas en el backend. | Dentro del alcance aprobado y demostrable. La IA está fuera de alcance (CLAUDE.md §8). |

## 3. Base de datos

Migración ya escrita y probada contra el Supabase real (en transacción revertida):
`supabase/migrations/20261011120000_onboarding_preferences.sql`

- `profiles.onboarding_completed_at timestamptz` (NULL = pendiente). Los perfiles existentes quedan marcados como completados.
- Tabla `public.user_preferences` (1 fila por usuario): `categories event_category[]`, `interests text[]`, `days text[]`, `time_slots text[]`, `motivations text[]`, `zone text`. Con `check` de listas cerradas. RLS: el usuario solo lee la suya; escritura solo por Express.
- `handle_new_user()` ya no exige `role`: si falta → `participant`; nombre desde `full_name` o `name` (Google); si no hay nombre válido → "Nuevo usuario".

## 4. Pantalla Login (`/login`) — valores exactos del mockup

Viewport de referencia 390 × 844. Fondo `#0B1420`. Fuentes Poppins (títulos) e Inter (UI).

**Hero** (alto 300 px, no se encoge): fondo `radial-gradient(circle at 30% 20%, rgba(20,184,166,0.25), transparent 60%), linear-gradient(160deg, #0D1B2A, #0B1420)`; centrado vertical y horizontal, `gap 14px`:
- `BrandMark` 52 px (cuadro `#0D1B2A` radio 9 + "B" con degradado `#14B8A6 → #FFFFFF`).
- "Be **Core**": Poppins 700, 24 px, blanco; "Core" en `#14B8A6`.
- "Tu comunidad en movimiento": 12.5 px, `#94A3B8`.

**Hoja** (`flex:1`): fondo `#101B29`, radio `28px 28px 0 0`, padding `30px 26px`, columna.
- h1 "Bienvenido de nuevo": Poppins 600, 20 px, margen inferior 6 px.
- Subtítulo "Inicia sesión para ver tus eventos y citas": 13 px, `#94A3B8`, margen inferior 24 px.
- Label "Correo electrónico" (12 px, 600, `#94A3B8`, mb 7) + input placeholder `nombre@correo.com`.
- Label "Contraseña" + `PasswordInput` placeholder `••••••••`.
- Inputs: fondo `#172436`, borde `1px rgba(255,255,255,0.08)`, radio 12, padding `14px 16px`, 14 px, mb 16. Placeholder `#8291A6` (`ink-faint`; único ajuste por accesibilidad, 4.9:1 sobre el campo).
- Fila a la derecha, margen `-6px 0 20px`: enlace "¿Olvidaste tu contraseña?" 12 px, 600, `#14B8A6` → `/recuperar`.
- Botón "Iniciar sesión": fondo `#14B8A6`, texto `#04241F`, sin borde, radio 12, padding 16, 14.5 px, 700, ancho completo.
- Divisor "o continúa con": 11.5 px, líneas `rgba(255,255,255,0.08)`, margen `22px 0`.
- `GoogleButton` "Continuar con Google" (ancho completo, ver skill).
- Pie (`margin-top:auto`, centrado, 13 px, `#94A3B8`, pt 10): "¿No tienes cuenta? **Crear cuenta**" (en `#14B8A6`, 600) → `/registro`.

En escritorio (≥ 768 px): la misma tarjeta centrada, ancho máx. 420 px, hero arriba dentro de la tarjeta; fondo de página `#0B1420` con el mismo radial.

**Comportamiento**
- `supabase.auth.signInWithPassword`. Errores: credenciales → "Correo o contraseña incorrectos." bajo el formulario; red → "No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo."
- Tras iniciar sesión: `GET /api/v1/me` → si `onboardingCompleted=false` → `/bienvenida`; si no → `/descubre` (o la ruta de la que venía).
- Google: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: \`${window.location.origin}/auth/callback\` } })`. Usar `window.location.origin` hace que funcione tanto en `localhost:5173` como en `http://192.168.x.x:5173` desde el celular.
- `/auth/callback`: muestra "Entrando…" con spinner, espera la sesión (`onAuthStateChange`) y aplica la misma regla de redirección. Si falla → vuelve a `/login` con toast de error.

## 5. Pantalla Crear cuenta (`/registro`)

Mismo hero y hoja del login. Textos: h1 "Crea tu cuenta", sub "Únete y encuentra planes en tu comunidad".
Campos: **Nombre** (`autoComplete="name"`, 2–80), **Correo**, **Contraseña** (`new-password`, mín. 8) con indicador simple de fuerza (débil / buena / fuerte en `danger` / `action` / `success` + texto).
Botón "Crear cuenta" → `supabase.auth.signUp({ email, password, options: { data: { full_name } } })` (sin `role`).
Divisor + `GoogleButton`. Pie: "¿Ya tienes cuenta? **Inicia sesión**".
Errores: correo existente → "Ese correo ya tiene cuenta. ¿Quieres iniciar sesión?" (con enlace).
Si Supabase pide confirmación de correo: pantalla "Revisa tu correo para activar la cuenta" con botón "Ya lo confirmé". Si no la pide: ir directo a `/bienvenida`.

> **Actualización 2026-10-21 (pedido del director, 2026-10-17):** el onboarding pasa a **6 pasos**: después del rol va
> "Cuéntanos un poco de ti" (sexo y rango de edad, opcionales, elección única; tocar la elegida la quita). Los pasos de
> abajo se numeran desde el 3 (gustos = 3, disponibilidad = 4, motivación = 5, zona = 6). Sexo y edad solo alimentan
> estadísticas agregadas: **no** entran en `scoreEvent` ni se envían a IA. Además, `/registro` exige la casilla
> "Acepto la política de tratamiento de datos personales" (enlace a `/privacidad`); el consentimiento es **obligatorio para todos**, sin "Ahora no": quien entra por Google (onboarding pendiente, sin
> `data_consent_at`) lo acepta en el **primer paso de /bienvenida** (7 pasos); una cuenta vieja (onboarding completo) ve un
> **diálogo modal** cuya única salida es aceptar o "Salir" (cierra sesión); el diálogo nunca aparece con el onboarding
> pendiente. El paso "Cuéntanos un poco de ti" se precarga con `gender` y `age_range` si ya existen.
> Detalle en `docs/progreso/05_*`.

## 6. Onboarding (`/bienvenida`) — 6 pasos (los 5 originales + datos opcionales)

Pantalla completa en `bg`. Arriba: botón atrás (desde el paso 2), `ProgressSteps` de 5 y "Omitir" (enlace pequeño a la derecha). Abajo fijo (con safe-area): botón primario "Continuar" (en el último: "Ver mis eventos"). Transición entre pasos: fade + 8 px de desplazamiento, 200 ms. El estado vive en un solo `useReducer`; volver atrás no borra nada. Ningún paso es obligatorio salvo el 1.

**Paso 1 — "¿Cómo quieres usar Be Core?"** (selección única, `OptionCard`)
- "Quiero participar" · "Encontrar eventos y apuntarme" → `participant`
- "Quiero organizar" · "Crear eventos y manejar cupos" → `organizer`
Preseleccionado el rol actual. Saludo arriba del título: "¡Hola, {primer nombre}!" (Poppins 600, 22 px).

**Paso 2 — "¿Qué te mueve?"** · sub "Elige todo lo que te guste. Mínimo uno para recomendarte mejor." (chips multiselección, agrupados con subtítulo)

| Grupo (category) | Chips (slug → texto) |
|---|---|
| Deporte (`sport`) | football Fútbol · basketball Baloncesto · volleyball Voleibol · running Correr · cycling Ciclismo · swimming Natación · martial_arts Artes marciales · fitness Yoga y funcional |
| Cultura (`culture`) | music Música y conciertos · theater Teatro · dance Danza · cinema Cine · art_workshops Arte y talleres · reading Lectura |
| Recreación (`recreation`) | board_games Juegos de mesa · hiking Caminatas · outdoor_plans Planes al aire libre · video_games Videojuegos |

**Paso 3 — "¿Cuándo tienes tiempo?"** (dos grupos de chips)
- Días: weekdays "Entre semana" · weekends "Fines de semana"
- Franja: morning "Mañana" · afternoon "Tarde" · evening "Noche"

**Paso 4 — "¿Qué buscas en un evento?"** (chips, máx. 2)
fun "Divertirme" · compete "Competir" · learn "Aprender algo nuevo" · meet_people "Conocer gente" · health "Cuidar mi salud"

**Paso 5 — "¿Por dónde te mueves?"** · sub "Así te mostramos planes cerca. Es opcional."
Input de texto "Barrio o zona" (placeholder "Ej.: Belén, Laureles, Envigado"), máx. 80. Sin GPS.

**Final:** pantalla breve "¡Listo, {nombre}! Ya tenemos planes para ti" con check animado y confeti en CSS (24 piezas con los colores de la marca, 1.5 s; P1), y a los 1.6 s → `/descubre` (1.2 s y sin confeti con `prefers-reduced-motion`).
**Omitir** (en cualquier paso): guarda lo que haya + rol, y marca el onboarding como completado.

## 7. API (Express, validación Zod, errores con el formato de `docs/specs/api.md`)

| Método y ruta | Uso |
|---|---|
| `GET /api/v1/me` | Agrega `onboardingCompleted: boolean` y `preferences` (o `null`) a la respuesta actual. |
| `PUT /api/v1/me/onboarding` | Body: `{ role, interests[], days[], timeSlots[], motivations[], zone? }`. Valida listas cerradas (mismas constantes que la migración, en `backend/src/constants/preferences.js`). Calcula `categories` desde `interests`. Hace upsert en `user_preferences`; actualiza `role` **solo si** `onboarding_completed_at IS NULL` (si no, `409 ONBOARDING_ALREADY_COMPLETED` cuando el rol cambia); pone `onboarding_completed_at = now()`. Devuelve el perfil actualizado. |
| `GET /api/v1/events/recommended?limit=6` | Ver §8. Requiere sesión. |

Frontend: ruta protegida `RequireOnboarding` → si `onboardingCompleted=false`, redirige a `/bienvenida` (excepto `/bienvenida` y `/auth/callback`).

## 8. "Para ti" — recomendación por afinidad (sin IA)

Eventos candidatos: `status = 'published'`, `starts_at > now()`, `confirmed_count < capacity`, que el usuario no tenga confirmados y que no organice él. Puntaje (hora de `America/Bogota`):

| Señal | Puntos |
|---|---|
| `events.category` ∈ `preferences.categories` | +3 |
| Día del evento coincide con `days` (lun–vie = weekdays, sáb–dom = weekends) | +1 |
| Franja coincide con `time_slots` (morning < 12:00 ≤ afternoon < 18:00 ≤ evening) | +1 |
| `zone` no vacía y aparece (sin tildes, minúsculas) en `events.location` | +1 |

Orden: puntaje desc, luego `starts_at` asc. Se excluyen puntaje 0. Cada evento trae `reason` en texto: la señal más fuerte ("Porque te gusta el deporte", "Es en tu zona", "Encaja con tus fines de semana").
UI en Descubre: carrusel horizontal "Para ti" encima del listado, tarjetas como las del mockup + `reason` en 11.5 px `accent-soft`. Sin preferencias o sin resultados: no mostrar la sección (no un vacío).

Pruebas (Vitest): función pura `scoreEvent(event, prefs)` con casos de cada señal y del desempate.

## 9. Alcance: inteligencia artificial

El CLAUDE.md del proyecto (§8) deja **IA fuera del alcance** del MVP y dice que Be Core no usa API de OpenAI. Este cuestionario **no** introduce IA: guarda datos estructurados y el "Para ti" es por reglas. Esos mismos datos son la base si después se aprueba un recomendador con IA. Pasarlo a IA de verdad exige: decisión con el director, sacarlo de "fuera de alcance" en CLAUDE.md, y un registro en `docs/progreso/`.

## 10. Configuración manual de Google (la hace el equipo, no Claude Code)

1. Google Cloud Console → crear proyecto "Be Core" → Pantalla de consentimiento OAuth (externo, en modo prueba, agregar los correos del equipo y de los amigos del partido del 31 oct como usuarios de prueba).
2. Credenciales → ID de cliente OAuth (Aplicación web). URI de redirección autorizada: `https://netomeswlgsahvgqowdq.supabase.co/auth/v1/callback`.
3. Supabase → Authentication → Sign In / Providers → Google: pegar Client ID y Client Secret, activar.
4. Supabase → Authentication → URL Configuration: Site URL `http://localhost:5173`; Redirect URLs: `http://localhost:5173/**` y `http://192.168.*.*:5173/**` (o la IP fija del portátil).
5. Nunca subir el Client Secret al repo (vive solo en Supabase).

## 11. Criterios de aceptación

- [ ] A 390 px, `/login` coincide con el mockup (comparación lado a lado), salvo el bloque de Google.
- [ ] Iniciar sesión con correo funciona y redirige según `onboardingCompleted`.
- [ ] "Continuar con Google" crea el usuario (perfil `participant`, nombre de Google) y lleva a `/bienvenida`, en `localhost` y desde un celular por la Wi-Fi.
- [ ] Registro con correo no envía `role` y lleva a `/bienvenida`.
- [ ] Onboarding: 5 pasos, atrás conserva respuestas, "Omitir" funciona en cualquier paso, todo navegable con teclado.
- [ ] `PUT /me/onboarding` rechaza valores fuera de lista (400) y el cambio de rol después de completado (409).
- [ ] Usuarios existentes no ven el onboarding.
- [ ] "Para ti" muestra eventos ordenados por puntaje con su `reason`; tests de `scoreEvent` en verde.
- [ ] Checklist de la skill `becore-ui` (§7) cumplido en las 4 pantallas nuevas.

---

## 12. Prompts

Los prompts para ejecutar esta spec están en `docs/PROMPTS-rediseno.md` (sesiones R2, R3 y R4), escritos para Claude Code con Opus 5.5.
