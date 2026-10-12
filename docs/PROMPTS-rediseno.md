# Prompts · Rediseño total del frontend de Be Core

**Modelo:** Claude Code con **Opus 5.5** · **Fecha:** 2026-10-11 · **Responsables:** Santiago / Felipe

## Cómo usar este archivo

- **Una sesión por prompt**, en orden. Sesión nueva (`/clear`) entre una y otra.
- Activa **modo plan** (Shift+Tab dos veces) antes de pegar el prompt. Lee el plan, corrígelo si hace falta y apruébalo.
- Al terminar cada sesión: prueba tú mismo en el navegador (390 px y 1440 px), haz commit en una rama `feature/rediseno-rN` y abre PR para la revisión cruzada.
- Si una sesión queda a medias, en la siguiente di: *"Continúa la sesión RN desde donde quedó; revisa `git status` y el plan en docs/progreso/"*.
- Todas las sesiones deben respetar `CLAUDE.md`, `frontend/CLAUDE.md` y la skill `.claude/skills/becore-ui/SKILL.md`.

| Sesión | Qué hace | Depende de |
|---|---|---|
| R0 | Instalar el kit y auditar el frontend actual | — |
| R1 | Fundaciones: tokens, componentes base, navegación | R0 |
| R2 | Backend: migración de onboarding y `/me` | R0 |
| R3 | Login, registro, Google, recuperar contraseña | R1, R2 |
| R4 | Onboarding de gustos | R3 |
| R5 | Descubre + "Para ti" por reglas | R1, R2 |
| R6 | Detalle de evento | R1 |
| R7 | Mis eventos, Avisos y Perfil | R1, R4 |
| R8 | Organizador: panel, crear/editar evento y citas | R1 |
| R9 | Pulido final, accesibilidad y PWA | todas |

R2 se puede hacer en paralelo con R1 (uno toma backend y el otro frontend).
La integración con IA (Gemini, opción híbrida) va **después** de R9, en un archivo de prompts aparte.

---

## R0 · Instalar el kit y auditar

```
Contexto: vamos a rediseñar todo el frontend de Be Core. Ya copié en el repo estos archivos nuevos:
- .claude/skills/becore-ui/SKILL.md (skill de UX/UI, obligatoria para todo lo visual)
- docs/specs/auth-onboarding.md
- docs/mockups/*.html (6 pantallas de referencia, estáticas)
- docs/PROMPTS-rediseno.md (este plan)
- supabase/migrations/20261011120000_onboarding_preferences.sql

Tarea (NO cambies código de la app en esta sesión):
1. Lee CLAUDE.md, frontend/CLAUDE.md, backend/CLAUDE.md, la skill becore-ui, docs/specs/ui.md, docs/specs/auth-onboarding.md y abre cada archivo de docs/mockups/.
2. Recorre frontend/src y haz un inventario: rutas, páginas, componentes, hooks de datos, estilos globales y dónde hay colores o estilos sueltos.
3. Escribe docs/specs/rediseno-auditoria.md con:
   a) tabla ruta → componente de página → mockup que le corresponde (o "sin mockup") → estado actual (qué tan lejos está del mockup, en 1 línea);
   b) componentes repetidos o inconsistentes que deben unificarse en components/ui/;
   c) riesgos (lógica mezclada con estilos, componentes gigantes, etc.);
   d) cualquier contradicción entre la skill, ui.md y los mockups, con tu propuesta de cuál manda.
4. Actualiza CLAUDE.md (raíz) y frontend/CLAUDE.md:
   - el asistente de código ahora es Claude Code con Opus 5.5 (reemplaza las menciones a Sonnet);
   - toda tarea visual debe cargar la skill becore-ui y comparar contra docs/mockups/;
   - la sección de UI de docs/specs/ui.md queda subordinada a la skill cuando se contradigan.
5. No toques la migración todavía (se aplica en R2).

Criterio de aceptación: existe docs/specs/rediseno-auditoria.md completo, los CLAUDE.md actualizados, y `git diff` solo muestra archivos .md.
Commit: "docs: auditoría del frontend y kit de rediseño".
```

---

## R1 · Fundaciones del sistema de diseño

```
Lee la skill becore-ui completa, docs/specs/rediseno-auditoria.md y los 6 archivos de docs/mockups/.

Objetivo: dejar la base visual de toda la app. No rediseñes pantallas completas todavía.

1. Tokens: reemplaza el contenido de tema de frontend/src/index.css por el bloque @theme de la skill (Tailwind 4). Agrega las fuentes Poppins e Inter en frontend/index.html con la URL de la skill. Fondo global bg, texto ink, antialiasing, color-scheme: dark.
2. Componentes en frontend/src/components/ui/ (uno por archivo, exportados desde components/ui/index.js), exactamente como los especifica la skill §3:
   Button, Input, PasswordInput, Field, GoogleButton, Chip, OptionCard, ProgressSteps, Divider, Toast (+ ToastProvider y hook useToast), Skeleton, EmptyState, BrandMark, Avatar (iniciales sobre bg-field cuando no hay foto), Badge (variantes por categoría y por estado de evento), CapacityBar (barra de cupo con texto "24 / 40" y estado "Lleno").
   Todos: forwardRef, prop className, accesibles, con estados focus-visible, disabled y loading donde aplique.
3. Íconos: frontend/src/components/icons/ con SVG inline (trazo 2 px, currentColor, 24×24) para los que usan los mockups: home, calendar, bell, user, search, clock, map-pin, users, plus, check, chevron-left, chevron-right, eye, eye-off, log-out, settings. Sin librerías de íconos.
4. Layouts en frontend/src/layouts/:
   - AppShell: decide el layout por rol y ancho (matchMedia 768px).
   - MobileTabBar: 4 pestañas según la skill (Inicio, Mis eventos, Avisos, Perfil), con safe-area, pestaña activa en accent y aria-current.
   - DesktopTopBar (participante) y DesktopSidebar (organizador) copiando la estructura y medidas de desktop-descubre.html y desktop-panel-organizador.html, SIN los ítems de mapa.
   - AuthLayout: hero + hoja inferior de mobile-login.html, reutilizable para login, registro y recuperar contraseña.
   Conecta AppShell en el router para las rutas autenticadas existentes sin cambiar la lógica de las páginas.
5. Página de verificación /dev/ui (solo si import.meta.env.DEV) que muestre todos los componentes en todas sus variantes y estados.
6. Reemplaza en las páginas existentes los colores hex sueltos y botones/inputs ad hoc por los tokens y componentes nuevos, sin rediseñar su layout todavía. Si alguna página es muy grande, anótalo en la auditoría en vez de refactorizarla aquí.

No instales dependencias. No cambies llamadas a la API ni la lógica de datos.
Verificación: npm run build sin errores ni warnings nuevos; /dev/ui se ve correcta a 390 px y 1440 px; navegación funciona en móvil y escritorio para ambos roles.
Commits pequeños por bloque (tokens, componentes, íconos, layouts, migración de páginas). Conventional Commits en español.
```

---

## R2 · Backend del onboarding

```
Lee backend/CLAUDE.md, docs/specs/api.md y docs/specs/auth-onboarding.md (§2, §3 y §7).

1. Aplica al proyecto Supabase la migración supabase/migrations/20261011120000_onboarding_preferences.sql sin modificarla (ya fue probada contra la base real en una transacción revertida). Verifica después: columna profiles.onboarding_completed_at, tabla user_preferences con RLS, y que handle_new_user ya no exige role.
2. Crea backend/src/constants/preferences.js con INTERESTS (slug → category, en el orden de la spec §6), DAYS, TIME_SLOTS y MOTIVATIONS, idénticos a los check de la migración. Exporta también labels en español para reutilizar en correos.
3. GET /api/v1/me: agrega onboardingCompleted (boolean) y preferences (objeto camelCase o null).
4. PUT /api/v1/me/onboarding según §7: Zod con listas cerradas y máximos (motivations ≤ 2, zone ≤ 80), categories derivadas de interests, upsert de user_preferences, cambio de role solo si onboarding_completed_at es NULL (si ya estaba completo y el role cambia → 409 ONBOARDING_ALREADY_COMPLETED), marca onboarding_completed_at = now(). Todo en el orden de capas ruta → controlador → servicio → repositorio.
5. PUT /api/v1/me/preferences: igual que el anterior pero para editar gustos después (desde Perfil); nunca cambia role ni onboarding_completed_at.
6. Tests: Supertest para 200, 400 (valor fuera de lista), 401 y 409; unitarios del servicio para la derivación de categories.

No toques el frontend.
Verificación: npm test en verde y cobertura del módulo nuevo ≥ 70 %.
Commit: "feat(api): onboarding y preferencias de usuario".
```

---

## R3 · Login, registro, Google y recuperar contraseña

```
Lee la skill becore-ui, docs/specs/auth-onboarding.md (§2, §4, §5, §10) y abre docs/mockups/mobile-login.html.

1. /login: rehazla usando AuthLayout con los valores exactos de §4. Debe ser idéntica al mockup a 390 px, salvo el bloque "o continúa con" + GoogleButton, que reemplaza los botones Organizador/Participante.
2. /registro según §5 (sin campo de rol; con indicador de fuerza de contraseña).
3. Google: signInWithOAuth con redirectTo = `${window.location.origin}/auth/callback`. Crea /auth/callback ("Entrando…"), que espera la sesión y redirige según onboardingCompleted de GET /api/v1/me (a /bienvenida o a la ruta de origen / inicio por rol).
4. /recuperar: correo → supabase.auth.resetPasswordForEmail con redirectTo `${origin}/nueva-contrasena`; /nueva-contrasena: supabase.auth.updateUser({ password }). Mismo AuthLayout, mensajes en el tono de la skill.
5. Guard RequireOnboarding: usuarios autenticados con onboardingCompleted=false van a /bienvenida (excepto /bienvenida, /auth/callback y /nueva-contrasena). Usuarios sin sesión → /login conservando la ruta de origen.
6. Mensajes de error humanos para: credenciales inválidas, correo ya registrado, correo sin confirmar, red caída, popup/redirect de Google cancelado.

Antes de programar, revisa si Supabase tiene confirmación de correo activada (lee la config del cliente o pregúntame) y maneja ambos casos como dice §5.
La configuración de Google Cloud y del proveedor en Supabase la hacemos nosotros a mano (§10); si al probar Google falla por configuración, dímelo con el error exacto y sigue con lo demás.
Verificación: login con correo, registro nuevo, recuperar contraseña y (si ya está configurado) Google, desde localhost y desde un celular por la IP de la Wi-Fi. Compara /login lado a lado con el mockup a 390 px y lista cualquier diferencia que quede.
```

---

## R4 · Onboarding de gustos

```
Lee la skill becore-ui y docs/specs/auth-onboarding.md (§6).

1. Crea /bienvenida con los 5 pasos y TODOS los textos exactamente como en §6. Usa Chip, OptionCard y ProgressSteps de components/ui. Estado en un solo useReducer; atrás conserva respuestas; "Omitir" en cualquier paso guarda lo que haya.
2. Las opciones de chips salen de un archivo frontend/src/constants/preferences.js con los mismos slugs que backend/src/constants/preferences.js (agrega un test que compare ambas listas para que no se desincronicen).
3. Guarda con PUT /api/v1/me/onboarding (TanStack Query, mutation con loading en el botón). Al terminar: invalidar la query de /me, pantalla final "¡Listo, {nombre}!" con check animado (motion-reduce respetado) y redirección a inicio según rol a los 1.2 s.
4. Paso 5 (zona): input simple, sin geolocalización.
5. Accesibilidad: cada grupo con role="group" y aria-labelledby; foco al título del paso al cambiar de paso; todo usable solo con teclado.

Verificación: flujo completo con usuario nuevo, flujo "Omitir" desde el paso 1, recargar la página a mitad no rompe nada (empieza de nuevo sin errores), usuarios viejos nunca ven /bienvenida.
```

---

## R5 · Descubre + "Para ti" (reglas)

```
Lee la skill becore-ui, docs/specs/auth-onboarding.md (§8) y abre docs/mockups/mobile-descubre.html y docs/mockups/desktop-descubre.html.

Backend:
1. GET /api/v1/events/recommended?limit=6 según §8: función pura scoreEvent(event, prefs) en backend/src/services/recommendations/, zona horaria America/Bogota, campo reason en español. Tests Vitest de cada señal y del desempate.
   Diseña el módulo para que después se le pueda conectar un re-ranking con IA sin cambiar el contrato: getCandidates(userId) → scoreEvent → rank. Documenta esto en un comentario breve.

Frontend (/descubre):
2. Replica los mockups: saludo con nombre, buscador, ticker "en vivo" (Supabase Realtime de activity_log, ya existente: reutilízalo), chips de categoría (Todos, Deporte, Cultura, Recreación) que filtran, y grid/lista de tarjetas con imagen de cabecera por categoría (degradado + ícono, sin fotos externas), título, fecha/hora, lugar, CapacityBar y botón.
   SIN distancia "x km". Los avatares de asistentes: muestra máximo 3 con iniciales y "+N" solo si la API ya devuelve esos datos; si no, omite la fila (no inventes datos ni cambies la API para esto).
3. Carrusel "Para ti" arriba del listado con reason en accent-soft; oculto si no hay resultados.
4. Estados: Skeleton en la primera carga, EmptyState por filtro sin resultados ("No hay eventos de cultura por ahora. ¡Vuelve pronto!"), error con Reintentar.
5. Escritorio: barra superior y columna lateral derecha del mockup (próximas citas del usuario si la API existe; si no, "Tus próximos eventos").

Verificación: comparación lado a lado con ambos mockups; tests en verde; sin llamadas duplicadas en la pestaña Network.
```

---

## R6 · Detalle de evento

```
Lee la skill becore-ui y abre docs/mockups/mobile-detalle-evento.html.

1. Rehaz /eventos/:id igual al mockup: portada por categoría con botón atrás y Badge de categoría, título, filas de información (fecha y hora, lugar SIN distancia y SIN chip "Ver ruta"), bloque de cupo con CapacityBar actualizada en vivo (Realtime de events, ya existente), organizador, descripción, y barra inferior fija con el botón principal.
2. Botón de asistencia (lógica actual, no la cambies): estados "Confirmar asistencia" → loading → "Confirmado ✓" en success con pequeña animación; si está lleno, "Cupo lleno" deshabilitado; si ya confirmó, botón secundario "Cancelar asistencia" con diálogo de confirmación accesible. Toast en cada resultado. Máximo 3 pasos para confirmar (RNF de usabilidad).
3. Si el usuario es el organizador del evento: en lugar del botón de asistencia, accesos a "Editar", "Ver asistentes / check-in" y "Cancelar evento" (rutas ya existentes).
4. Escritorio: contenido centrado máx. 720 px, barra de acción no fija sino en la columna.
5. Estados: Skeleton, evento no encontrado (EmptyState con volver a Descubre), evento cancelado (banner).

Verificación: comparación con el mockup a 390 px; confirmar y cancelar funcionan y la barra de cupo cambia en otra pestaña abierta en el mismo evento.
```

---

## R7 · Mis eventos, Avisos y Perfil

```
Lee la skill becore-ui y abre docs/mockups/mobile-mis-eventos.html.

1. /mis-eventos igual al mockup: pestañas Próximos / Pasados con contador, tarjetas con fecha destacada, estado (Confirmado, Asistió, Cancelado, Evento cancelado) con Badge + texto, y acceso al detalle. EmptyState por pestaña.
2. /avisos (notificaciones): lista usando la tabla notifications existente (message, read_at), agrupada por Hoy / Esta semana / Antes; marcar como leída al abrir y "Marcar todas como leídas". Punto naranja en la pestaña Avisos si hay no leídas. Si no existe endpoint de lectura/marcado, créalo en el backend siguiendo api.md (es parte de RF de notificaciones).
3. /perfil: avatar con iniciales, nombre editable, correo (solo lectura), rol (solo lectura), sección "Tus gustos" con los mismos chips del onboarding editables y guardado con PUT /api/v1/me/preferences, y botón "Cerrar sesión".

Verificación: comparación de /mis-eventos con el mockup; editar gustos en Perfil cambia lo que muestra "Para ti" en Descubre.
```

---

## R8 · Organizador: panel, crear/editar evento y citas

```
Lee la skill becore-ui y abre docs/mockups/desktop-panel-organizador.html.

1. /panel (organizador) igual al mockup, SIN mini-mapa: tarjetas de métricas (cupos ocupados, confirmados, cancelados, eventos activos), tabla de eventos con estado y CapacityBar, y panel lateral "Actividad en vivo" con Realtime de activity_log. En móvil: métricas en grid 2×2, la tabla se convierte en tarjetas y la actividad pasa debajo.
2. Formulario crear/editar evento rediseñado con Field/Input y validación onBlur: título, categoría (OptionCards con ícono), fecha y hora, duración opcional, lugar, cupo (stepper accesible), descripción con contador. Botones "Guardar borrador" (secundario) y "Publicar" (primario). Vista previa de la tarjeta tal como la verá el participante.
3. Lista de asistentes / check-in: switch accesible por persona, buscador, contador "12 de 20 llegaron".
4. Citas: lista y formulario con el mismo lenguaje visual (no cambies la lógica).

No cambies contratos de API. Verificación: comparación con el mockup a 1440 px; crear, publicar, editar y cancelar un evento de punta a punta.
```

---

## R9 · Pulido final

```
Lee la skill becore-ui (§4, §7) y docs/specs/rediseno-auditoria.md.

1. Recorre TODAS las rutas y aplica el checklist §7 de la skill. Corrige lo que falle y deja una tabla ruta → resultado en la auditoría.
2. Accesibilidad: contraste de todo el texto, foco visible, orden de tabulación, labels, aria en grupos y diálogos, objetivos táctiles ≥ 44 px, prefers-reduced-motion.
3. Consistencia: busca hex sueltos, tamaños de texto fuera de la escala y botones/inputs que no usen components/ui; corrígelos.
4. PWA mínima para el partido del 31 de octubre: manifest.webmanifest (nombre "Be Core", short_name "Be Core", theme_color #0B1420, background_color #0B1420, display standalone, íconos 192 y 512 generados del BrandMark como PNG estáticos en public/), meta theme-color y apple-touch-icon. Sin service worker.
5. Elimina /dev/ui del build de producción (o déjala tras import.meta.env.DEV) y cualquier código muerto del diseño anterior.
6. Crea docs/progreso/NN_2026-10-XX_rediseno-frontend.md con la plantilla de CLAUDE.md §12: qué se hizo por sesión, decisiones (omitir mapa/ruta/chat, rol en onboarding, placeholder #64748B por accesibilidad, layouts por rol), KPIs y pendientes.

Verificación: npm run build y npm test en verde; Lighthouse móvil en /login y /descubre con Accesibilidad ≥ 90; "Agregar a pantalla de inicio" funciona en Android y iPhone desde la IP local (por ser HTTP local queda como acceso directo a pantalla completa, no como instalación PWA completa; es suficiente para la demo).
```
