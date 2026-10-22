# Be Core · Plan de trabajo hasta la sustentación

**Actualizado:** 2026-10-17 · **Responsables:** Felipe y Santiago · **Asistente:** Claude Code con **Opus 5.5**
**Hitos:** congelamiento de código **29 oct** · partido de validación **31 oct** · sustentación **3–6 nov**

> Reemplaza a `docs/PLAN-santiago.md` (2026-10-12). Ubicación en el repo: `docs/PLAN.md`.

---

## 0. Dónde estamos

**Hecho (11–12 oct):** rediseño completo del frontend en 10 sesiones (R0–R9), fusionado en `main` con el PR #6. Informe: `docs/progreso/04_2026-10-12_rediseno-frontend.md`.

| Sesión | Resultado |
|---|---|
| R0 | Auditoría → `docs/specs/rediseno-auditoria.md` |
| R1 | Sistema de diseño: tokens, `components/ui/`, íconos, layouts por rol |
| R2 | Migración de onboarding aplicada, `GET /me`, `PUT /me/onboarding`, `PUT /me/preferences` |
| R3 | Login idéntico al mockup, registro, Google, recuperar contraseña, guards |
| R4 | Onboarding de 5 pasos |
| R5 | Descubre + "Para ti" por reglas (`GET /api/v1/events/recommended`) |
| R6 | Detalle de evento con confirmación y cupo en vivo |
| R7 | Mis eventos, Avisos, Perfil |
| R8 | Panel del organizador, crear/editar evento, check-in, citas |
| R9 | Pulido: Lighthouse Accesibilidad 100, PWA, carga diferida |

**Configuración hecha:** Google OAuth (modo prueba), URLs de redirección, SMTP propio con Gmail, "Confirm email" desactivado, `GEMINI_API_KEY` en `backend/.env`. Las 7 pruebas del login pasaron.

**Estado de Supabase (17 oct):** 3 migraciones aplicadas; 19 perfiles (5 con gustos), 10 eventos, 14 notificaciones, **0 citas** (el módulo de citas no se ha probado de punta a punta); **pgvector disponible, sin instalar**.

**Nuevos requisitos del profesor (17 oct):** preguntar el sexo en el onboarding, más interactividad en el login, calificar eventos finalizados, imagen del evento (subida o generada con IA) y avatares. Entran al alcance por pedido del director; se registran en CLAUDE.md §8 (sesión P0).

---

## 1. Calendario

| Días | Fase | Qué |
|---|---|---|
| **17 oct** | 1 | Estado real del código e higiene de Git ✅ (informe `06_2026-10-17_estado-sprints.md`; P0 hecho) |
| **18** | 2 | Cerrar los sprints: interfaz de citas (F2-1) y README, validación, p90 y tags (F2-2) |
| **18 – 19** | 2b | **M1: la app en el celular con HTTPS** (base para ubicación, QR e instalación) |
| **19 – 22** | 2b | Pedidos del profesor P1–P4, mapa con distancia (P6) y correos con marca + código (P5) |
| **22 – 27** | 3 | IA con Gemini: IA0–IA4, búsqueda en lenguaje natural (IA7) y asistente para crear eventos (IA8); IA6 si sobra tiempo |
| **28** | — | Solo bugs, extras si sobra tiempo, ensayo de la demo |
| **29** | 4 | **Congelamiento `v1.0`** |
| **30 – 31** | 4 | Preparar y hacer el partido de validación |
| **1 nov** | 4 | Consolidar resultados para la presentación |

**Si hay que recortar**, en este orden: extras del día 28 → IA6 → IA8 → IA7.  IA5 (portada con IA) pasó a trabajo futuro: no se activa facturación. Lo último en salir es la calificación (P2) y la recomendación híbrida (IA3).

**Pendiente del director:** visto bueno a la integración de IA **antes del 24** (solicitado por correo el 22 oct; ver `CLAUDE.md` §9). Si no aprueba, la Fase 3 se reduce a mantener el "Para ti" por reglas (`AI_ENABLED=false`).

---

## 2. Cómo trabajamos

- **Ramas:** `develop` es la rama de integración. Cada sesión sale de `develop` en `feature/<fase>-<n>`, termina con push y PR hacia `develop`. El 29 se fusiona `develop` → `main` y se crea el tag `v1.0`.
- **Sesiones:** una por prompt, `/clear` entre sesiones, **modo plan** (Shift+Tab dos veces) y revisión del plan antes de aprobar.
- **Seguridad:**
  - Ningún token o clave se pega en un chat (Claude Code o Claude.ai).
  - `.env` nunca se versiona ni lo lee Claude Code.
- **Al terminar cada sesión:** su resumen se pega en el proyecto "BeCore - ProyectoGrado - Pipe" de Claude.ai para revisar y preparar el siguiente prompt.
- **Informe por avance:** `docs/progreso/NN_YYYY-MM-DD_titulo.md`.
- **Lo visual siempre** con la skill `.claude/skills/becore-ui/SKILL.md` y comparando con `docs/mockups/`.

### Modelo recomendado por sesión

En Claude Code se cambia con `/model` al iniciar cada sesión. Fable 5.1 solo si su plan lo incluye; si no, usen Opus 5.5 en su lugar.

| Sesión | Modelo | Por qué |
|---|---|---|
| Fase 1 · estado | Opus 5.5 | Leer todo el repo y juzgar qué falta |
| Fase 2 · asistencia, concurrencia, citas, correos | Opus 5.5 | Lógica de negocio delicada y depuración |
| Fase 2 · subir cobertura de pruebas | Sonnet 5.5 | Trabajo repetitivo y bien acotado |
| Fase 2 · README | Sonnet 5.5 | Documentación directa |
| P0 · consentimiento y demografía | Opus 5.5 | Migración + texto legal + cambios en varias capas |
| P1 · login interactivo | Opus 5.5 | Calidad visual y animación fina sin romper el mockup |
| P2 · calificación | Opus 5.5 | Reglas de elegibilidad, notificaciones y UI |
| P3 · avatares y portadas | Opus 5.5 | Seguridad de las subidas y diseño de los 12 avatares |
| P4 · compartir y calendario | Sonnet 5.5 | Sencillo y acotado |
| P5 · correos y código | Opus 5.5 | Flujos de autenticación; un error deja usuarios por fuera |
| IA0 · spec de IA | **Fable 5.1** (o Opus 5.5) | Decisiones de arquitectura que defienden ante el jurado |
| IA1 · base de datos e infraestructura | Opus 5.5 | pgvector, migración y cliente robusto |
| IA2 · etiquetado y embeddings | Opus 5.5 | Prompts y procesos en segundo plano |
| IA3 · recomendación híbrida | **Fable 5.1** (o Opus 5.5) | La pieza más compleja y la más evaluada |
| IA4 · prueba A/B y métricas | Opus 5.5 | Medición correcta para la sustentación |
| IA7 · búsqueda en lenguaje natural | Opus 5.5 | Toca búsqueda, embeddings y UI del buscador |
| IA8 · asistente para crear eventos | Opus 5.5 | Prompt con JSON validado, cupo y UX del formulario |
| IA6 · resumen de reseñas | Sonnet 5.5 | Una función acotada |
| Día 28 · bugs y ensayo | Opus 5.5 | Depuración entre capas |
| Revisión de cada PR | Opus 5.5 en sesión nueva | Una sesión que no escribió el código revisa mejor |

Haiku 5.5 no se recomienda para estas sesiones: el código ya es grande y las tareas cruzan varias capas.

---

## 3. Fase 1 · Estado e higiene de Git (17 oct)

La sesión de estado ya está corriendo y produce `docs/progreso/05_2026-10-17_estado-sprints.md`. Hallazgo de Git: `develop` quedó 66 commits atrás porque los PR #5 y #6 se fusionaron directo a `main`. Arreglo: avance rápido de `develop` a `origin/main`, `main` local al día y borrar las ramas locales `feature/rediseno-r0` … `r8`, que ya están en `main`.

**Entregable:** el informe `05_…` → prompts exactos de la Fase 2.

---

## 4. Fase 2 · Cerrar los sprints (18 oct)

Según el informe 06: los 19 RF están hechos salvo RF-14 y RF-15 (citas y disponibilidad), a los que les falta la interfaz. La cobertura del backend es 75,3 % (eventos y asistencia al 100 %). Los correos de recordatorio, cambio y cancelación salen por SMTP. Pendientes del backlog: S3-06 (README), S3-07 (plan de validación), S3-05 (p90), tags v0.1 y v0.2, y variables faltantes en `.env.example`.

### F2-1 · Interfaz de citas y disponibilidad (Opus 5.5)

```
Lee la skill becore-ui, docs/specs/backlog.md (RF-14, RF-15), docs/specs/api.md y docs/progreso/06_2026-10-17_estado-sprints.md. La API de citas y disponibilidad ya existe y pasa 18/18 pruebas; NO cambies su contrato salvo que encuentres un error real (dímelo antes).

1. Organizador, /citas:
   - Disponibilidad: lista de franjas y formulario para crear y borrar (fecha, hora inicio, hora fin; validación de cruces con mensaje claro).
   - Nueva cita: título, fecha y hora dentro de una franja disponible, lugar y notas opcionales, y selección de participantes con buscador (por nombre, entre usuarios que han asistido a sus eventos o todos los participantes si la API lo permite).
   - Lista de citas próximas y pasadas con estado; cancelar con diálogo de confirmación accesible.
2. Participante: "Mis citas" (pestaña o sección en Mis eventos) con próximas y pasadas, detalle y estado.
3. Las notificaciones y correos de cita (creada, recordatorio, cancelada) deben dispararse. Verifica que aparezcan en Avisos.
4. Estados de carga, vacío y error; móvil y escritorio según la skill.
5. Recorre el flujo completo en el navegador con un organizador y un participante del seed: crear franja → agendar cita con ese participante → el participante la ve y recibe aviso → cancelar → el participante ve el cambio. Captura y deja todo lo creado borrado al final.
6. Actualiza el informe 06 marcando RF-14 y RF-15 como hechos y probados.
```

### F2-2 · Documentación, rendimiento y versiones (Sonnet 5.5)

```
Lee docs/progreso/06_2026-10-17_estado-sprints.md y docs/specs/backlog.md.
1. README.md raíz: requisitos (Node 22, npm), clonar, npm install, crear backend/.env y frontend/.env desde los .example (qué es cada variable, sin valores), configuración manual de Supabase y Google (enlaza docs/specs/auth-onboarding.md §10), npm run dev, pruebas, acceso desde el celular por la IP y solución de problemas comunes (puerto 5173 ocupado, migración sin aplicar, firewall de Windows). Debe permitir a Santiago levantar todo desde cero.
2. backend/.env.example: agrega las variables que faltan (GEMINI_*, AI_*, APP_URL y cualquier otra que use el código), sin valores y con un comentario por línea.
3. S3-05: script backend/scripts/measure-p90.js (sin librerías nuevas, solo fetch) que hace 200 peticiones a GET /api/v1/events con un token de prueba pasado por variable de entorno y reporta p50, p90 y p99. Córrelo y deja el resultado en el informe (objetivo RNF: < 2 s en el 90 %).
4. S3-07: docs/specs/plan-validacion.md con el guion del partido del 31 de octubre: preparación (red, hotspot, IP, Test users de Google), paso a paso para los participantes, qué medir (tiempos, errores, confirmaciones, check-ins, calificaciones), cuestionario SUS en español (10 ítems estándar) + 2 preguntas propias ("¿Las recomendaciones de 'Para ti' te parecieron acertadas?", "¿Calificar el evento fue fácil?") y cómo calcular el puntaje SUS.
5. Tags: identifica los commits de cierre de sprint 1 y sprint 2 en main y propón los tags v0.1 y v0.2 (no los crees sin mostrarme los commits).
```

---

## 5. Fase 2b · Pedidos del profesor (21 – 23 oct)

Rama `feature/profe-N` por sesión. Todas usan la skill `becore-ui`, validación con Zod en backend y errores según `docs/specs/api.md`. Cada migración se prueba primero en una transacción revertida y luego se aplica.

### P0 · Alcance, datos personales y onboarding demográfico

```
Lee CLAUDE.md, docs/PLAN.md (§5), docs/specs/auth-onboarding.md y la skill becore-ui.

1. Alcance: en CLAUDE.md §8 registra que el 2026-10-17 el director pidió agregar: sexo/edad en el onboarding, calificación de eventos finalizados, imagen del evento (subida o generada con IA), avatares y más interactividad en el login. Agrega una nota con fecha. No cambies nada más del alcance.
2. Migración supabase/migrations/20261021XXXXXX_demographics_consent.sql:
   - tipo gender_identity ('female','male','other','prefer_not_to_say');
   - profiles.gender gender_identity NULL;
   - profiles.age_range text NULL con check in ('18-24','25-34','35-44','45-54','55+');
   - profiles.data_consent_at timestamptz NULL.
   Los perfiles existentes quedan con data_consent_at = NULL (se les pide al entrar, ver punto 5).
3. Registro (/registro) y primera entrada con Google: casilla obligatoria "Acepto la política de tratamiento de datos personales" con enlace a /privacidad. Crea /privacidad con un texto corto en el tono de la skill: qué datos se recogen (nombre, correo, gustos, sexo y rango de edad opcionales, calificaciones), para qué (organizar eventos, recomendaciones y estadísticas anónimas del proyecto de grado), que usamos IA (Gemini) para recomendar sin enviar nombre ni correo, cómo pedir que se borren (correo del proyecto) y que es un proyecto académico de la Universidad Católica Luis Amigó (Ley 1581 de 2012). La API guarda data_consent_at.
4. Onboarding: nuevo paso "Cuéntanos un poco de ti" después del paso de rol, con dos grupos opcionales de OptionCard/Chip: "¿Con qué te identificas?" (Mujer, Hombre, Otro, Prefiero no decirlo) y "Rango de edad". Ajusta ProgressSteps (ahora 6 pasos), el reducer y PUT /api/v1/me/onboarding (Zod con los mismos valores). Edición posterior desde Perfil.
5. Usuarios existentes sin data_consent_at: al entrar ven un diálogo accesible de una sola vez para aceptar (y opcionalmente completar sexo y edad). No se bloquea el login.
6. IMPORTANTE: gender y age_range NO se usan en recomendaciones ni se envían a Gemini. Solo para estadísticas agregadas. Déjalo como comentario en el servicio de recomendaciones.
7. Tests: Zod de onboarding con los nuevos campos, consentimiento obligatorio en el registro.
Verificación a 390 y 1440 px. Informe en docs/progreso/.
```

### P1 · Login y onboarding más interactivos

```
Lee la skill becore-ui y docs/mockups/mobile-login.html.

1. Hero de AuthLayout animado sin cambiar medidas ni posiciones del mockup: un SVG detrás del BrandMark con las "líneas de movimiento" (barras diagonales en turquesa, verde, naranja y amarillo de la marca) que se desplazan suavemente y puntos que se conectan con líneas finas en bucle (8–12 s). Solo CSS/SVG, sin librerías. Opacidad baja para no competir con el logo.
2. Dato en vivo bajo el tagline: "12 eventos esta semana · 48 personas confirmadas". Endpoint público GET /api/v1/public/stats que devuelve solo esos dos conteos (sin datos personales), con caché de 5 min en memoria. Si falla o devuelve 0, no se muestra nada.
3. Onboarding: chips con pequeño rebote al seleccionar, barra de progreso animada, transición entre pasos ya existente, y pantalla final con confeti en CSS (20–30 piezas con los colores de la marca, 1.5 s) además del check.
4. Todo se apaga con prefers-reduced-motion. Lighthouse de /login debe seguir con Accesibilidad 100 y Rendimiento ≥ 85.
```

### P2 · Calificación de eventos finalizados

```
Lee la skill becore-ui, docs/specs/api.md y el módulo de asistencia y notificaciones.

1. Migración supabase/migrations/20261022XXXXXX_event_ratings.sql:
   - tabla event_ratings (id, event_id → events, user_id → profiles, stars smallint check 1–5, tags text[] check contra la lista RATING_TAGS, comment text check ≤ 500, created_at, updated_at, unique(event_id, user_id));
   - RLS: lectura de las propias; escritura solo por Express;
   - agrega 'event_rating_request' al enum notification_type.
   RATING_TAGS: well_organized, punctual, good_vibe, would_repeat, good_venue, needs_improvement (con labels en español en backend/src/constants/).
2. Reglas: solo puede calificar quien tiene asistencia con checked_in = true en un evento en estado finished, dentro de los 7 días siguientes. Puede editar su calificación en ese plazo.
3. API: POST/PUT /api/v1/events/:id/rating, GET /api/v1/events/:id/rating/me, GET /api/v1/events/:id/ratings/summary (promedio, total, conteo por estrellas y por tag; comentarios solo para el organizador del evento).
4. Cuando un evento pasa a finished: notificación in-app y correo "¿Cómo estuvo {evento}?" con enlace directo a /eventos/:id/calificar a quienes hicieron check-in.
5. Frontend:
   - /eventos/:id/calificar: 5 estrellas grandes accesibles (radiogroup, teclado), chips de tags, comentario opcional y botón "Enviar calificación"; pantalla de gracias.
   - Banner "¿Cómo estuvo? Califica" en el detalle del evento finalizado y en Mis eventos (pestaña Pasados).
   - ★ 4,6 (12) en las tarjetas de eventos finalizados y en el detalle.
   - Panel del organizador: promedio general y por evento, distribución de estrellas y últimos comentarios.
6. Tests: reglas de elegibilidad (sin check-in, evento no finalizado, fuera de plazo, duplicado), resumen.
```

### P3 · Avatares e imagen del evento

```
Lee la skill becore-ui y CLAUDE.md (toda escritura pasa por la API; el frontend no usa supabase.from).

1. Storage: buckets "avatars" y "event-covers" en Supabase (públicos de lectura). Las subidas se hacen con URLs firmadas: el backend valida permisos y devuelve createSignedUploadUrl; el frontend sube el archivo directo a esa URL; luego confirma a la API, que guarda la ruta. Sin librerías nuevas.
2. Migración: profiles.avatar_url text NULL, profiles.avatar_preset text NULL (check contra la lista de presets), events.cover_url text NULL.
3. Compresión en el navegador antes de subir (canvas, sin librerías): máx. 1024 px de lado, WebP calidad 0.8, rechazar originales > 8 MB y tipos que no sean imagen.
4. Avatares, en este orden de prioridad para mostrar: foto subida → foto de Google (user_metadata.avatar_url, se copia a profiles.avatar_url la primera vez si no hay otra) → preset elegido → iniciales.
   - Crea 12 avatares preset propios en SVG con la paleta de la marca (personas estilizadas y diversas, deportivas y culturales, estilo plano coherente con el logo), en frontend/src/assets/avatars/.
   - Selector en Perfil y opcional en el último paso del onboarding.
   - Componente Avatar actualizado para usar esta prioridad.
5. "Quiénes van": en tarjetas y detalle, fila de hasta 3 avatares solapados + "+N", como en los mockups. Amplía la respuesta de eventos con confirmedPreview: [{ name, avatarUrl }] (máx. 3, solo nombre de pila).
6. Portada del evento: en el formulario de crear/editar, zona para subir imagen con vista previa y "Quitar". Si no hay, se mantiene la portada por categoría. Las tarjetas y el detalle usan cover_url si existe. Deja preparado un botón deshabilitado "Generar con IA" (se activa en IA5).
7. Tests: permisos de subida (solo el organizador del evento sube su portada; cada usuario su avatar), validación de tipos.
```

### P3b · Vista previa de fotos de perfil (Sonnet 5.5)

```
Lee la skill becore-ui y el componente Avatar actual (P3).

1. Al tocar cualquier avatar (el propio en Perfil y la barra, el del organizador en el detalle, y los de "quiénes van"), se abre una vista previa:
   - diálogo modal a pantalla completa en móvil y centrado en escritorio, fondo oscuro con scrim y desenfoque;
   - la imagen grande (máx. 320 px en móvil, 400 px en escritorio, redonda), con animación de zoom desde el avatar tocado (solo transform y opacity; sin animación con prefers-reduced-motion);
   - debajo, solo el nombre de pila y el rol (Organizador / Participante). Nunca correo ni otros datos.
   - Si el usuario no tiene foto, se muestra su avatar preset o sus iniciales en grande.
2. Se cierra con: botón X (con aria-label), tecla Escape, toque fuera de la imagen y, en móvil, deslizando hacia abajo. Al cerrar, el foco vuelve al avatar que lo abrió.
3. Accesible: role="dialog", aria-modal, aria-label "Foto de {nombre}", foco atrapado, el avatar clicable es un <button> con aria-label "Ver foto de {nombre}".
4. En la fila de "quiénes van" (avatares solapados + "+N"): tocarla abre una hoja/lista con todos los confirmados (avatar + nombre de pila); tocar uno abre la vista previa. Respeta la privacidad: solo nombre de pila y foto, y solo para eventos que el usuario puede ver.
5. En Perfil, la vista previa de la foto propia incluye el botón "Cambiar foto" que lleva al selector de P3.
6. La imagen grande usa la misma URL ya comprimida (sin pedir otra versión) y muestra un Skeleton redondo mientras carga.
7. Tests: abre/cierra con teclado y Escape, devuelve el foco, no expone datos además del nombre de pila y el rol.
```

### P4 · Compartir y agregar al calendario

```
Lee la skill becore-ui.

1. Botón "Compartir" en el detalle del evento: Web Share API si existe; si no, menú con "WhatsApp" (wa.me con texto "¡Vamos a {evento}! {fecha} en {lugar}. Confirma aquí: {enlace}") y "Copiar enlace". El enlace usa window.location.origin.
2. Botón "Agregar a mi calendario" visible al confirmar asistencia: opciones Google Calendar (URL de render con fechas en UTC) y archivo .ics generado en el navegador (VEVENT con zona horaria America/Bogota, sin librerías).
3. Si un usuario sin sesión abre un enlace compartido, tras el login vuelve al evento (el guard ya conserva la ruta).
```

### M1 · La app en el celular con HTTPS real (Opus 5.5) — hacer primero

**Problema:** por `http://192.168.x.x` los navegadores del celular bloquean todo lo que exige "contexto seguro": ubicación (distancia, "cerca de mí"), cámara (QR), instalación completa como app (service worker) y notificaciones push. Además, celulares y portátil deben estar en la misma Wi-Fi.

**Solución:** un túnel de **Cloudflare** (gratis, sin cuenta) que publica el portátil en una dirección `https://algo.trycloudflare.com` con certificado válido. El sistema sigue corriendo en el portátil (no es despliegue, se respeta CLAUDE.md §3), pero los celulares entran desde cualquier red, incluso con datos móviles.

**Antes de la sesión (a mano):**
- En el portátil: `winget install Cloudflare.cloudflared`.
- Supabase → Authentication → URL Configuration → Redirect URLs: agregar `https://*.trycloudflare.com/**`.
- Google Cloud no cambia (su callback es el de Supabase).

```
Lee CLAUDE.md, frontend/CLAUDE.md, backend/CLAUDE.md y la skill becore-ui.

Objetivo: que Be Core funcione completo en celulares por HTTPS real usando un túnel rápido de Cloudflare (cloudflared ya está instalado en el portátil), sin desplegar en la nube.

1. Modo demo optimizado: script npm run demo en la raíz que
   a) construye el frontend (vite build);
   b) arranca el backend;
   c) sirve el build con vite preview en el puerto 4173 con el mismo proxy /api → 3000 que el modo dev;
   d) arranca "cloudflared tunnel --url http://localhost:4173", captura la URL https://*.trycloudflare.com de su salida y la imprime grande en la terminal;
   e) pasa esa URL al backend como APP_URL para los enlaces de los correos.
   Funciona en Windows (es el sistema del portátil). Sin librerías nuevas para orquestar si se puede hacer con Node; si necesitas una, justifícala.
2. Vite: permite los hosts .trycloudflare.com en server.allowedHosts y preview.allowedHosts.
3. Página /compartir (solo organizadores): muestra un QR grande de window.location.origin y el enlace, para que los participantes escaneen en la cancha. Librería de QR pequeña (justifícala) o una implementación propia.
4. PWA completa: agrega un service worker propio y mínimo (sin librerías) que cachee el shell de la app (HTML, JS, CSS, íconos) y muestre una pantalla "Sin conexión" en el tono de la skill si no hay red. Nunca cachea /api ni Supabase. Solo se registra en contexto seguro. Prueba que Chrome Android ofrezca "Instalar app" y que iPhone (Safari → Compartir → Agregar a inicio) abra a pantalla completa.
5. Hook useGeolocation preparado para P6: solo pide la ubicación cuando el usuario toca un botón ("Ver eventos cerca de mí"), maneja permiso denegado y no disponible, y oculta el botón si window.isSecureContext es falso. La ubicación NUNCA se envía al backend ni se guarda: la distancia se calcula en el navegador (haversine). Actualiza /privacidad con una línea sobre esto.
6. Documenta en README el modo demo: comandos, la URL cambia en cada arranque, el QR, y qué hacer si cloudflared no conecta (plan B: modo por IP en la misma Wi-Fi, sin ubicación ni instalación completa).
7. Verificación real con mi celular por datos móviles (no Wi-Fi): login con correo y con Google, onboarding, confirmar asistencia, instalar la app, abrir sin conexión y ver la pantalla offline. Deja la lista de lo probado en el informe.
```

> El día del partido el portátil necesita internet (por ejemplo, el hotspot de un celular). Los participantes entran con sus propios datos móviles escaneando el QR; ya no hace falta que estén en la misma Wi-Fi.

### P6 · Mapa de eventos (Opus 5.5)

Pedido del 17 oct: llevar a la app el mapa de los mockups. Se hace **sin Google Maps API**, con Leaflet y mapas libres; la ruta se abre en Google Maps o Waze con un enlace, sin costo. Se registra en CLAUDE.md §8: el mapa sale de "fuera de alcance" por pedido del director; la geolocalización del dispositivo sigue fuera.

```
Lee la skill becore-ui, docs/mockups/desktop-panel-organizador.html, docs/mockups/desktop-descubre.html, docs/mockups/mobile-detalle-evento.html y CLAUDE.md §8.

0. Alcance: en CLAUDE.md §8 registra (fecha 2026-10-1X) que, por pedido del director, el mapa de eventos entra al alcance con Leaflet + teselas libres, y la ubicación del dispositivo solo para calcular distancias en el navegador (nunca se envía ni se guarda). Siguen fuera: Google Maps API y la "estela convergente".
0b. Distancia (usa el hook useGeolocation de M1): botón "Cerca de mí" en Descubre; al aceptar, las tarjetas muestran "a 1,8 km" y se puede ordenar por cercanía; en el modo mapa aparece un punto con "Tú estás aquí". Si se niega el permiso o no hay HTTPS, todo funciona igual sin distancias.
1. Librerías (justifícalas en el informe): leaflet y react-leaflet. Todas las vistas con mapa se cargan de forma diferida (React.lazy) para no inflar el bundle inicial. Comprueba el tamaño antes y después.
2. Mapa base (estado actual, `feature/p6-fixes`): **mapa vectorial de OpenFreeMap con MapLibre GL** dentro de Leaflet (`@maplibre/maplibre-gl-leaflet`), con estilo propio en los colores de la marca (`lib/mapStyle.js`) y carga diferida. Respaldo raster: OpenStreetMap estándar oscurecido con un filtro CSS solo en la capa de teselas, si no hay WebGL2 o el estilo no carga en 10 s. Atribución visible "© OpenFreeMap © OpenStreetMap contributors". El contenedor común (`MapBase`) lleva `isolation: isolate` para que el mapa no tape modales. Sin CARTO (pide clave) ni `VITE_MAP_TILES_URL`.
3. Migración: events.latitude y events.longitude numeric NULL, con checks de rango (lat −90..90, lng −180..180) y ambos nulos o ambos con valor. Pruébala en transacción revertida, aplícala y dilo en el PR.
4. Crear/editar evento: además del texto de "lugar", un selector de ubicación en mapa centrado en Medellín. El organizador hace clic o arrastra el pin. Buscador opcional con Nominatim (OpenStreetMap) llamado desde el BACKEND (GET /api/v1/geocode?q=…, máximo 1 petición por segundo, User-Agent con el nombre del proyecto y caché en memoria), limitado a Colombia. La ubicación es opcional.
5. Detalle del evento: mini mapa con el pin (no interactivo en móvil hasta tocarlo) y botón "Cómo llegar" con dos opciones: Google Maps (https://www.google.com/maps/dir/?api=1&destination=lat,lng) y Waze (https://waze.com/ul?ll=lat,lng&navigate=yes). Si el evento no tiene coordenadas, no se muestra.
6. Descubre: conmutador "Lista / Mapa". En modo mapa, pines con el color de su categoría (turquesa deporte, amarillo cultura, verde recreación, gris otros); al tocar un pin, una tarjeta resumida con cupo y botón al detalle. Respeta los filtros de categoría.
7. Organizador: página "Mapa en vivo" (ítem en la barra lateral, como en el mockup) con sus eventos activos como pines y cupo actualizado en tiempo real (Realtime de events ya existente); lista lateral filtrable y ficha del evento seleccionado. Sin la estela convergente.
8. Accesibilidad: todo lo del mapa también está disponible como lista; los pines tienen nombre accesible; el mapa no atrapa el scroll de la página en móvil.
9. Seed: agrega coordenadas reales de Medellín a los eventos de prueba existentes para que el mapa no salga vacío.
10. Tests: validación de coordenadas (Zod), endpoint de geocodificación con Nominatim simulado y caché.
Verificación a 390 y 1440 px.
```

> Para el partido: el mapa necesita internet en los celulares para cargar las teselas. Si la red local de la cancha no tiene salida a internet, el mapa no carga, pero el resto de la app sí funciona.

### P7 · Pantallas de carga entretenidas (Opus 5.5)

```
Lee la skill becore-ui (§3 Skeleton, §4 Carga y feedback, Movimiento) y el BrandMark actual.

Objetivo: que esperar en Be Core sea parte de la marca, sin hacer la app más lenta ni romper la accesibilidad.

1. Componente BrandLoader (components/ui/): animación propia en SVG + CSS (sin librerías ni Lottie) del isotipo: la "B" se dibuja con trazo, las líneas de movimiento de colores (turquesa, verde, naranja, amarillo) pasan detrás y los puntos se conectan como comunidad. Bucle de 1,6–2 s, suave. Tamaños sm/md/lg.
2. Frases rotativas debajo (cada 1,8 s, con fundido), en el tono de la skill y alternando deporte y cultura: "Calentando motores…", "Inflando el balón…", "Afinando la guitarra…", "Reuniendo a la comunidad…", "Marcando la cancha…", "Preparando el escenario…", "Contando los cupos…". Lista en un archivo de constantes. El lector de pantalla solo anuncia una vez "Cargando" (aria-live polite, role="status"), no cada frase.
3. Variantes por contexto: en detalle y tarjetas de un evento, el loader usa el ícono de su categoría (balón que rebota para deporte, nota musical que vibra para cultura, hoja/brújula para recreación).
4. Dónde se usa:
   - pantalla completa: arranque de la app, /auth/callback, carga diferida de rutas (Suspense) y guardado del onboarding;
   - las listas y tarjetas SIGUEN usando Skeleton (se perciben más rápidas), pero con brillo de marca: un barrido diagonal turquesa muy suave en lugar del pulso gris;
   - botones en loading: tres puntos que rebotan en lugar del spinner.
5. Reglas para no estorbar:
   - el loader de pantalla completa solo aparece si la espera supera 300 ms (evita parpadeos) y, una vez visible, se queda mínimo 500 ms;
   - si una carga pasa de 8 s, cambia a "Esto está tardando más de lo normal…" con botón Reintentar;
   - con prefers-reduced-motion: logo estático, frases sin fundido y skeleton sin barrido.
6. Pantalla "Sin conexión" (si M1 ya existe) con el mismo estilo: el balón quieto y "Parece que se fue la señal. Revisa tu conexión."
7. Añade BrandLoader y las variantes a /dev/ui. Verifica en móvil (390 px) que la animación no se vea entrecortada (solo transform y opacity) y que Lighthouse no baje.
```

### P5 · Correos con la marca y verificación por código

Pedido del 17 oct: todos los correos en HTML con la identidad de Be Core, y confirmación de cuenta y recuperación de contraseña con **código de 6 dígitos** en vez de enlace.

**Antes de la sesión (a mano, en el dashboard de Supabase):**
- Authentication → Sign In / Providers → Email:
  - **activar "Confirm email"**;
  - "Email OTP Length" = 6;
  - "Email OTP Expiration" = 600 s (10 min).
- Authentication → Rate Limits: correos por hora ≥ 30.

```
Lee la skill becore-ui, docs/specs/auth-onboarding.md y el código de /registro, /recuperar, /nueva-contrasena y /auth/callback. Lee también el servicio de correo del backend (Nodemailer).

Contexto: en Supabase ya activamos "Confirm email" con OTP de 6 dígitos y 10 minutos de vigencia. Ya no usaremos enlaces de confirmación ni de recuperación: todo por código.

1. Plantillas HTML de correo con la marca, en supabase/templates/:
   - confirm-signup.html: "Tu código para entrar a Be Core";
   - reset-password.html: "Tu código para cambiar la contraseña";
   - email-change.html.
   Reglas:
   - HTML de correo compatible con Gmail, Outlook y Apple Mail: tablas, estilos inline, ancho máx. 600 px, sin JS, sin SVG y sin fuentes externas (Poppins/Inter con respaldo Arial).
   - Cabecera azul profundo #0D1B2A con el logo en PNG; cuerpo claro (#FFFFFF / #F1F5F9) para que se lea bien también en clientes que alteran el modo oscuro.
   - El código {{ .Token }} grande, centrado, monoespaciado, con espaciado entre dígitos y fondo turquesa suave; debajo "Vence en 10 minutos".
   - Saludo con {{ .Data.full_name }} si existe; si no, "¡Hola!".
   - Pie: "Si no fuiste tú, ignora este correo", tagline "Tu comunidad en movimiento" y "Proyecto de grado · Universidad Católica Luis Amigó".
   - Versión de texto plano equivalente en un comentario al inicio del archivo.
   - Asunto sugerido de cada plantilla en un comentario.
   - NO uses {{ .ConfirmationURL }}.
2. Logo: sube frontend/public/icons/icon-192.png (o el PNG del BrandMark que exista) a un bucket público "brand" de Supabase Storage y usa esa URL absoluta en las plantillas. Dime la URL final.
3. Escribe docs/specs/correos.md con el paso a paso para pegar cada plantilla y su asunto en Supabase → Authentication → Emails → Templates (no puedes hacerlo tú).
4. Correos del backend (recordatorios, cambios, cancelaciones, solicitud de calificación si ya existe): misma identidad. Crea backend/src/services/email/layout.js con una función renderEmail({ title, preheader, bodyHtml, cta? }) que use el mismo diseño, y migra todas las plantillas actuales a ella. Incluye siempre la versión de texto plano en Nodemailer. Botón CTA turquesa con enlace a window.location.origin equivalente (usa una variable APP_URL de backend/.env.example).
5. Frontend, registro: tras signUp sin sesión, ir a /verificar?email=... con:
   - 6 casillas de un dígito (inputMode="numeric", autoComplete="one-time-code", pegar el código completo funciona, avance y retroceso automático, accesible con un único label "Código de verificación");
   - supabase.auth.verifyOtp({ email, token, type: 'email' }); si la versión del SDK requiere 'signup', usa la correcta y documéntalo;
   - "Reenviar código" con cuenta regresiva de 60 s (supabase.auth.resend({ type: 'signup', email }));
   - errores humanos: código incorrecto, código vencido, demasiados intentos;
   - al verificar: /bienvenida.
6. Recuperar contraseña en un solo flujo: /recuperar (correo) → resetPasswordForEmail → paso del código (mismo componente OtpInput) → verifyOtp({ email, token, type: 'recovery' }) → paso de nueva contraseña (updateUser) → login automático y toast. /nueva-contrasena queda solo como redirección al nuevo flujo.
7. Login con correo de una cuenta sin confirmar: mensaje "Tu cuenta aún no está confirmada" con botón "Enviarme un código" que lleva a /verificar.
8. Google no cambia (no necesita código).
9. Tests de OtpInput (pegar, teclado, retroceso) y de los flujos con Supabase simulado.
Verificación real: registro nuevo con un correo de Gmail y otro de Outlook/Hotmail; revisa que el correo llegue a bandeja de entrada (no spam), se vea bien en el celular y el código funcione. Captura de cada correo para docs/progreso/.
```

> Nota para el partido del 31: con la confirmación activa, cada amigo debe recibir y escribir el código. Prueben antes que los correos lleguen rápido con la red de la cancha. Si falla el día del partido, el plan B es desactivar "Confirm email" temporalmente en el dashboard (el código de la app soporta ambos casos).

---

## 6. Fase 3 · Inteligencia artificial con Gemini — híbrida (22 – 27 oct)

> ⚠️ Requiere el visto bueno del director (solicitado el 22 oct, pendiente; `CLAUDE.md` §9). La fuente de verdad del
> diseño es `docs/specs/ai.md`; esta sección resume el estado.

### Arquitectura (estado tras IA4)

```
Evento publicado/editado ──► (segundo plano) embedding del evento ──► etiquetas por similitud con los 18 gustos
                             (solo modelo de embeddings, umbral 0,68) ──► event_ai (tabla aparte, solo backend)
Usuario guarda gustos    ──► (segundo plano) embedding del perfil ──► user_ai (tabla aparte, solo backend)
Calificaciones (P2)      ──► bonus de afinidad (categorías y etiquetas de eventos calificados con ≥ 4)

GET /api/v1/events/recommended   (variante A/B fija por usuario: sha256(user_id + AB_SALT))
  "rules": R5 tal cual
  "ai":    candidatos (R5) → puntaje híbrido (0,5 · similitud + 0,5 · reglas + bonus)
           ├─ caché vigente (24 h) → orden y frases de Gemini
           └─ sin caché → responde YA con orden híbrido y frase por plantilla; en segundo plano, UNA petición a Gemini
              (cadena GEMINI_TEXT_MODELS) con el top 15 → caché 24 h
  Cada tarjeta mostrada → recommendation_events (variante y origen: gemini / template / rules)
```

El usuario **nunca espera a Gemini**. La capa gratuita da **20 peticiones al día por modelo de texto** (medido en
IA2), así que el modelo de texto solo se usa para el re-ordenado de la variante "ai".

En la sustentación se presenta como un **sistema de recomendación híbrido** (embeddings + reglas de negocio + re-ranking con LLM), validado con una **prueba A/B** en el partido.

### Reglas

- `GEMINI_API_KEY` solo en `backend/.env`. El frontend nunca llama a Gemini.
- A Gemini **nunca** se le envía nombre, correo, IDs de usuario, sexo ni edad.
- Timeout, respaldo sin IA y salida validada con Zod en toda llamada.
- Modelos por variable de entorno: `GEMINI_TEXT_MODELS` (cadena separada por comas, por defecto `gemini-3.6-flash,gemini-3-flash-preview,gemini-3.5-flash`; si uno da 429 o se queda sin cupo, se usa el siguiente) y `GEMINI_EMBEDDING_MODEL` (`gemini-embedding-2`, 768 dimensiones). No hay `GEMINI_IMAGE_MODEL` ni `AI_IMAGES_ENABLED` en el código.
- `AB_SALT` solo en `backend/.env`, sin valor por defecto: con `AI_ENABLED=true` y sin ella el backend no arranca.
- Embeddings en tablas aparte (`event_ai`, `user_ai`) con RLS sin políticas: nunca salen al frontend ni van por Realtime.
- Capa gratuita: Google puede usar los datos para mejorar sus productos (se menciona en /privacidad). **La generación de imágenes no tiene capa gratuita**: por eso IA5 es trabajo futuro (no se activa facturación).

### Sesiones (rama `feature/ia-N`)

**IA0 · Spec y decisión** (solo documentos) — ✅ hecho (`feature/ia-0`, informe 16)
```
Lee CLAUDE.md, docs/progreso/05_*, el módulo de recomendaciones de R5, el de calificaciones de P2 y la Fase 3 de docs/PLAN.md.
Escribe docs/specs/ai.md: arquitectura híbrida, migración, contratos de API, prompts exactos para Gemini (en español, salida JSON con esquema), errores y respaldo, privacidad, pruebas con Gemini simulado y diseño de la prueba A/B. Confirma en la documentación oficial de Gemini los nombres vigentes del modelo de texto barato, del de embeddings y del de imágenes, y que el SDK oficial de Node es @google/genai. Actualiza CLAUDE.md §3 y §8: la IA entra al alcance con aprobación del director (fecha) y se usa la API de Gemini. No escribas código.
```

**IA1 · Base de datos e infraestructura** — ✅ hecho (`feature/ia-1`, informe 17; migración `20261022160000` aplicada)
```
Lee docs/specs/ai.md.
1. Migración supabase/migrations/20261022160000_ai_recommendations.sql:
   - activar la extensión vector (esquema extensions);
   - tabla event_ai (event_id PK/FK a events, on delete cascade; tags text[] con check contra INTERESTS y máx. 4;
     embedding vector(768); updated_at) con índice HNSW por coseno — aparte de events, que está en Realtime;
   - tabla user_ai (user_id PK/FK a profiles; embedding vector(768); updated_at) — aparte de user_preferences, que el
     navegador puede leer;
   - event_ai y user_ai: RLS sin políticas y revoke a anon/authenticated (solo backend);
   - tabla ai_recommendations (user_id, items jsonb [{eventId, score, reason, source}], variant, generated_at, expires_at);
   - tabla recommendation_events (user_id, event_id, variant, action in ('shown','clicked','confirmed'), created_at);
     la columna source (gemini/template/rules) llegó en IA3 (migración 20261022170000);
   - RLS de lectura propia en ai_recommendations y recommendation_events; escritura solo Express.
   Pruébala en una transacción revertida, verifica que la base quede intacta y luego aplícala.
2. backend/src/services/ai/geminiClient.js: cliente único con timeout, logs sin datos personales y freno por modelo;
   embedText(text) y generateJson(prompt, schema) con la cadena GEMINI_TEXT_MODELS. (Sin generateImage: IA5 es trabajo futuro.)
3. backend/.env.example (sin valores): GEMINI_TEXT_MODELS, GEMINI_EMBEDDING_MODEL, AI_ENABLED, AB_SALT.
4. Tests con el cliente simulado.
```

**IA2 · Etiquetado y embeddings** — ✅ hecho (`feature/ia-2`, informe 18; etiquetado cambiado a embeddings en IA3)
```
Lee docs/specs/ai.md.
1. Al publicar o editar un evento: embedding de "título + categoría + descripción" y etiquetas por similitud con los
   18 gustos (umbral 0,68, margen 0,04, máx. 4; solo modelo de embeddings, sin cupo de texto), en event_ai. En segundo
   plano: la API no espera a Gemini.
2. Al guardar gustos: embedding del perfil (en user_ai) con intereses, horarios, motivación y zona (sin nombre, sexo ni edad).
3. npm run ai:backfill para eventos y perfiles existentes, con pausa entre llamadas.
4. Tags como chips en el detalle del evento.
5. Tests con Gemini simulado.
```

**IA3 · Recomendaciones híbridas con re-ranking** — ✅ hecho (`feature/ia-3`, informe 19)
```
Lee docs/specs/ai.md y el módulo de recomendaciones de R5.
1. Sin cambiar el contrato de GET /api/v1/events/recommended (solo se agregó meta.emptyReason cuando viene vacío):
   - variante A/B fija por usuario; "rules" = R5 tal cual;
   - "ai": candidatos por reglas → puntaje híbrido (similitud coseno reescalada 0,58–0,72 + reglas normalizadas +
     bonus por eventos calificados con ≥ 4) → entra todo lo que R5 mostraría más lo que pase 0,25 por similitud;
   - con caché vigente, orden y frases de Gemini; sin caché, responde ya con orden híbrido y frase por plantilla y en
     segundo plano UNA petición a Gemini (top 15 con alias, Zod, sin IDs inventados) → caché 24 h.
2. Caché 24 h en ai_recommendations, solo variante "ai", calculada al abrir la app (sin cron); se borra al cambiar
   gustos o calificar (publicar un evento no la borra: entra por el relleno híbrido).
3. Nunca un error ni una tarjeta sin frase: plantilla con gusto, día y franja ("Porque te gusta el fútbol y es un
   sábado en la tarde").
4. recommendation_events.source (gemini/template/rules), migración 20261022170000 aplicada.
5. Tests: respaldo, IDs inventados, JSON inválido, caché, cadena de modelos, privacidad del prompt.
```

**IA4 · Prueba A/B y métricas** — ✅ hecho (`feature/ia-4`, informe 20)
```
Lee docs/specs/ai.md.
1. Variante determinista por hash del user_id con AB_SALT (obligatoria con AI_ENABLED=true): "rules" (R5) o "ai" (IA3).
2. Registrar shown / clicked / confirmed en recommendation_events (clic y confirmado solo si se mostró en 7 días, con
   la variante y el origen de ese "mostrado").
3. GET /api/v1/admin/ai-metrics (solo organizadores), por variante y, en "ai", por origen gemini/plantilla: usuarios, mostrados, CTR, tasa de confirmación y calificación promedio de los eventos recomendados a los que asistieron. Sin eventos de demostración (seed:demo).
4. Tarjeta "Recomendaciones IA vs reglas" en el panel del organizador.
5. Aviso "Usamos IA para recomendarte eventos" en el paso final del onboarding, con enlace a /privacidad.
```

**IA5 · Portada del evento generada con IA** — ❌ trabajo futuro (22 oct: no se activa facturación; las portadas las sube el organizador)
```
Lee docs/specs/ai.md y el trabajo de P3.
1. Activa el botón "Generar con IA" del formulario de evento solo si AI_IMAGES_ENABLED=true.
2. El backend arma el prompt desde título, categoría, lugar y descripción (sin personas reconocibles, sin texto dentro de la imagen, estilo ilustración plana con la paleta de la marca y formato horizontal), genera la imagen, la sube a event-covers y devuelve la URL.
3. El organizador ve la vista previa y elige "Usar esta", "Generar otra" (máx. 3 por evento al día) o "Cancelar". Etiqueta pequeña "Imagen generada con IA" en la portada.
4. Límite y registro de uso para controlar costos. Respaldo: portada por categoría.
```

**IA6 · Resumen de reseñas para el organizador**
```
Con las calificaciones de P2: en el panel del organizador, por evento con ≥ 3 comentarios, botón "Resumir con IA" que devuelve 2–3 frases (qué gustó, qué mejorar). Sin nombres de los participantes en el prompt. Caché hasta que llegue una calificación nueva.
```

**IA7 · Búsqueda en lenguaje natural** (rama `feature/ia-7`, después de IA4)
```
Lee docs/specs/ai.md y CLAUDE.md. Usa la skill becore-ui. Rama feature/ia-7 desde feature/ia-4.
Objetivo: que el buscador de Descubre entienda frases como "algo tranquilo para el domingo con mi familia" o "fútbol cerca de Belén en la noche".
1. Backend: GET /api/v1/events/search?q=... (autenticado, Zod: q de 2 a 200 caracteres).
   - Calcula el embedding de la consulta (solo cupo de embeddings, nunca el de texto) y compara contra event_ai con el índice HNSW, solo eventos publicados y futuros.
   - Puntaje final = similitud del texto + coincidencia literal en título/lugar (para que buscar "Avengers" siga encontrando "Estreno Avengers Doomsdale") + pequeños refuerzos si la frase menciona un día, una franja o una categoría que coincide con el evento (detección por reglas en español, sin LLM).
   - Umbral mínimo calibrado con 15–20 consultas de prueba anotadas a mano (documenta cuáles y los resultados en el informe).
   - Caché de embeddings de consultas normalizadas (minúsculas, sin tildes) por 24 h, y límite por usuario (p. ej. 30 búsquedas/10 min).
   - Respaldo: si Gemini falla, AI_ENABLED=false o se agota el cupo, búsqueda clásica por texto (ILIKE en título, descripción y lugar). Nunca error 500 por la IA.
   - A Gemini solo va el texto de la consulta: si contiene un correo o un número de teléfono, se quita antes de enviarlo.
   - Registra en recommendation_events (o en una tabla search_events) la consulta, el número de resultados, el modo (semantic/classic) y si el usuario abrió algún resultado, sin guardar datos personales.
2. Frontend: el buscador de Descubre (y el de la barra superior en escritorio) usa este endpoint con debounce de 400 ms. Placeholder que invite a escribir natural: "Prueba: fútbol el sábado en la tarde". Etiqueta discreta "Búsqueda inteligente" cuando el modo fue semántico. Estados de carga, vacío ("No encontramos planes así. Prueba con otras palabras.") y error con la skill.
3. Los resultados respetan los filtros de categoría y "Más cerca primero".
4. Pruebas con Gemini simulado: consulta normal, respaldo clásico, limpieza de correo/teléfono, límite por usuario, umbral.
Al terminar: lint, pruebas, build, informe NN, push, sin PR.
```

**IA8 · Asistente para crear eventos** (rama `feature/ia-8`, después de IA7)
```
Lee docs/specs/ai.md y CLAUDE.md. Usa la skill becore-ui. Rama feature/ia-8 desde feature/ia-7.
Objetivo: el organizador escribe una frase ("micro el sábado en la tarde en Belén para 12 personas, nivel principiante") y la IA le propone el borrador del evento.
1. Backend: POST /api/v1/events/draft (solo organizadores, Zod: texto de 10 a 500 caracteres; límite 10 borradores por organizador al día).
   - Una sola llamada al modelo de texto con la cadena GEMINI_TEXT_MODELS, respuesta en JSON validada con Zod: title (≤ 80), description (2–4 frases en español, tono de la marca), category (enum existente), tags (de los 18 gustos, máx. 4), suggested_duration_minutes, suggested_capacity, place_text y date_hint (texto, p. ej. "sábado en la tarde").
   - Fecha: el modelo NO inventa fechas. El backend interpreta date_hint con reglas en español (hoy, mañana, el sábado, el 5 de noviembre, en la tarde/noche) relativo a la fecha actual en America/Bogota y propone fecha y hora; si no se puede, la deja vacía.
   - Lugar: place_text pasa por el geocodificador que ya existe (Nominatim) para proponer coordenadas; el organizador confirma el pin.
   - Al prompt solo va la frase del organizador, limpiando correos y teléfonos. Nunca su nombre ni su ID.
   - Respaldo: sin cupo o con error, responde 200 con { draft: null, reason } y el formulario sigue manual.
   - Registra uso (modelo que respondió, latencia, éxito) sin guardar la frase completa si contiene datos personales.
2. Frontend: en el formulario de crear evento, arriba, una tarjeta "Describe tu evento en una frase" con botón "Crear borrador con IA". Mientras carga, el loader de P7. Al llegar, rellena los campos (resaltados brevemente) y muestra "Revisa antes de publicar: la IA puede equivocarse". Nada se publica solo; el organizador edita todo. Botón "Deshacer" que vuelve a los valores anteriores. Si no hay cupo: "El asistente no está disponible ahora; puedes llenar el formulario normal."
3. Pruebas con Gemini simulado: JSON válido, JSON inválido, categoría inventada, fecha relativa, sin cupo, organizador vs participante, límite diario.
Al terminar: lint, pruebas, build, informe NN, push, sin PR.
```

**Opcional (día 28, si sobra tiempo):** "Escribir con IA" para la descripción del evento, lista de espera cuando el cupo se llena, check-in con QR.

---

## 7. Fase 4 · Congelamiento y validación

| Fecha | Qué |
|---|---|
| 28 oct | Solo bugs. Ensayo completo de la demo en ambos computadores. |
| **29 oct** | Fusionar `develop` → `main` y crear el tag **`v1.0`**. Desde aquí, nada nuevo. |
| 30 oct | Crear el evento real del partido; agregar los correos de los amigos en *Test users* de Google; revisar la IP del portátil en la red que se usará; llevar hotspot. |
| **31 oct** | **Partido:** registro + onboarding, confirmación, recordatorio por correo, check-in, **calificación al terminar**, A/B de recomendaciones y cuestionario SUS. Al SUS se le agregan: "¿Las recomendaciones de 'Para ti' te parecieron acertadas?" y "¿Calificar el evento fue fácil?". |
| 1 nov | Consolidar SUS, métricas A/B, calificaciones (también por sexo y rango de edad, de forma agregada) y capturas en `docs/progreso/`. |

---

## 8. Checklist

- [ ] Fase 1: informe `05_…` y `develop` al día
- [ ] Fase 2: sprints cerrados, cobertura ≥ 70 %, citas probadas
- [ ] Visto bueno del director para la IA (antes del 24; solicitado por correo el 22 oct)
- [ ] P0 consentimiento y demografía · P1 login interactivo · P2 calificación · P3 avatares y portadas · P4 compartir · P5 correos con marca y código · P6 mapa · P7 pantallas de carga
- [ ] M1 HTTPS en el celular: probado por datos móviles, app instalable, QR de acceso
- [x] IA0 → IA4 (ramas `feature/ia-0` … `feature/ia-4`, informes 16–20)
- [ ] IA7 búsqueda en lenguaje natural · IA8 asistente para crear eventos
- [ ] IA6 resumen de reseñas (si sobra tiempo) · IA5 portada con IA → trabajo futuro
- [ ] `v1.0` el 29 de octubre
- [ ] Partido del 31 con resultados guardados
