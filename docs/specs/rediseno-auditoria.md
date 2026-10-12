# Auditoría del frontend para el rediseño (R0)

**Fecha:** 2026-10-11 · **Rama base:** `main` @ `38f65e8` (cierre del sprint 2) · **Autor:** Claude Code (Opus 5.5)
**Fuentes revisadas:** `CLAUDE.md`, `frontend/CLAUDE.md`, `backend/CLAUDE.md`, `.claude/skills/becore-ui/SKILL.md`,
`docs/specs/ui.md`, `docs/specs/auth-onboarding.md`, `docs/specs/api.md` (§3), `docs/specs/backlog.md` (S3),
los 6 archivos de `docs/mockups/` y todo `frontend/src/` (44 archivos, ~2 400 líneas).

En esta sesión no se modificó código de la app. La migración `20261011120000_onboarding_preferences.sql` no se aplicó (se aplica en R2).

---

## 0. Inventario de `frontend/src`

### Rutas (`router.jsx`)

Las rutas autenticadas cuelgan de `ProtectedRoute` → `AppShell` (un `Navbar` y un `<Outlet>` en un contenedor de `max-w-5xl`).
Las rutas solo para organizador se envuelven en `RoleRoute role="organizer"`.

| Ruta | Página | Guardas |
|---|---|---|
| `/` | `<Navigate to="/eventos">` | — |
| `/ingresar` | `IngresarPage` | pública (redirige a `/eventos` si hay sesión) |
| `/registro` | `RegistroPage` | pública (ídem) |
| `/eventos` | `EventosPage` | sesión |
| `/eventos/nuevo` | `eventos/NuevoEventoPage` | organizador |
| `/eventos/:id` | `eventos/DetalleEventoPage` | sesión |
| `/eventos/:id/editar` | `eventos/EditarEventoPage` | organizador (y dueño, comprobado en la página) |
| `/eventos/:id/asistentes` | `eventos/AsistentesPage` | organizador (y dueño, comprobado en la página) |
| `/panel` | `PanelPage` | sesión. **Es un stub de 3 líneas** |
| `/citas` | `CitasPage` | sesión |
| `/citas/nueva` | `NuevaCitaPage` | organizador |
| `/disponibilidad` | `DisponibilidadPage` | organizador |
| `/perfil` | `PerfilPage` | sesión |
| `*` | `NotFoundPage` | — |

### Componentes

| Carpeta | Archivos | Notas |
|---|---|---|
| `components/ui/` | `Button.jsx` (`Button`, `LinkButton`), `Field.jsx` (`Input`, `Textarea`, `Select` con label integrado), `Feedback.jsx` (`Spinner`, `Skeleton`, `EmptyState`, `ErrorState`), `Modal.jsx` | Tema claro (`bg-white`, `text-navy-900`). Sin `forwardRef` en `Button`. Sin prop `loading`. |
| `components/layout/` | `AppShell`, `AuthLayout`, `Navbar`, `ProtectedRoute`, `RoleRoute` | `Navbar` agrupa 3 barras: superior de escritorio, superior de móvil e inferior de móvil con un "+" central para el organizador. |
| `components/events/` | `AttendanceButton`, `CapacityBar`, `EventBadges` (`CategoryChip`, `StatusBadges`, `CATEGORY_BORDERS`), `EventCard` (+ `EventCardSkeleton`), `EventForm` | |

### Datos

| Capa | Archivos |
|---|---|
| Servicios (`services/`) | `events.api.js`, `attendance.api.js` (incluye `listActivity`, **sin uso**), `appointments.api.js`, `profile.api.js` |
| Hooks (`hooks/`) | `useEvents` (infinite query), `useEvent` (+ mutaciones crear/editar/cancelar/publicar), `useAttendance` (confirmar/cancelar con actualización optimista), `useAttendees` (+ check-in optimista), `useAppointments` (disponibilidad, citas, búsqueda con debounce) |
| `lib/` | `api.js`, `supabase.js`, `format.js` (fechas, `CATEGORY_LABELS`), `query-keys.js` (`eventActivity` y `dashboard` **sin uso**), esquemas Zod (`auth-`, `event-`, `appointment-schemas.js`) |
| Contexto | `AuthContext.jsx` (sesión, perfil, `signUp` con `role`, traducción de errores) |
| Pruebas | `useAttendance.test.js`, `format.test.js` (solo lógica pura) |

**No existe en el frontend:** ninguna suscripción a Supabase Realtime, ni `ActivityTicker`, `useRealtimeEvent`, `/dashboard`, notificaciones o avisos. Todo eso es S3 y está pendiente.

### Estilos globales (`index.css`, `index.html`)

- `@theme` con los tokens **viejos** de `ui.md` §3: `navy-900`, `navy-800`, `graphite`, `gray-500`, `gray-200`, `teal-500`, `teal-600`, `emerald-500`, `orange-500`, `yellow-400`.
- `body { background-color: #0D1B2A; font-family: "Inter"… }`: un hex suelto y la fuente repetida (ya está en `--font-sans`).
- `index.html` carga Inter 400/500/600. La skill pide 300–700.
- `theme-color`/manifest en `#0D1B2A`.

### Colores y estilos sueltos

- **Hex en componentes:** ninguno fuera de `index.css`. El problema es otro: todo el frontend está en **tema claro**.
- `bg-white` como superficie de tarjeta, formulario o modal en **21 lugares de 15 archivos** (componentes `ui/`, `layout/`, `events/` y casi todas las páginas).
- La receta de tarjeta `rounded-2xl bg-white p-5 shadow-sm` está copiada (con variantes `p-4`/`p-5`) en **7 lugares**.
- `style={{ … env(safe-area-inset-*) }}` en línea en `AuthLayout`, `Navbar` ×3 y `Modal`. Funciona, pero se repite.
- El título de página `font-display text-2xl font-bold text-navy-900` aparece en 9 páginas. La skill pide `text-xl font-semibold`.
- Clases arbitrarias: `min-h-[44px]` en 13 sitios y `z-[60]` en `Modal`.

---

## a) Ruta → página → mockup → estado actual

"Lejos" significa que hay que rehacer layout y estilos. "Media" significa que la estructura sirve y solo cambian tokens y componentes.

| Ruta actual → ruta nueva | Página | Mockup | Estado actual (distancia al mockup) |
|---|---|---|---|
| `/ingresar` → **`/login`** | `IngresarPage` | `mobile-login.html` | **Lejos.** Tarjeta blanca sobre fondo navy, sin hero ni hoja inferior, sin `PasswordInput`, sin "¿Olvidaste tu contraseña?" ni Google, y textos distintos ("Inicia sesión"/"Ingresar"). |
| `/registro` | `RegistroPage` | `mobile-login.html` (según `auth-onboarding.md` §5) | **Lejos.** Tiene selector de rol y "Confirmar contraseña", que la spec elimina. Le falta el indicador de fuerza. Tema claro. |
| — → **`/recuperar`**, **`/nueva-contrasena`**, **`/auth/callback`** | no existen | `mobile-login.html` (mismo `AuthLayout`) | **No existen.** Se crean en R3. |
| — → **`/bienvenida`** | no existe | sin mockup (spec §6) | **No existe.** Se crea en R4. |
| `/eventos` → **`/descubre`** | `EventosPage` + `EventCard` | `mobile-descubre.html`, `desktop-descubre.html` | **Lejos.** Faltan saludo, buscador, ticker en vivo, portada por categoría y píldora de cupo. Las tarjetas son blancas con borde lateral. Tiene pestañas Próximos/Pasados y filtros de fecha que el mockup no trae. |
| `/eventos/:id` | `DetalleEventoPage` | `mobile-detalle-evento.html` | **Lejos.** Faltan portada con "atrás", filas de información con ícono en caja, bloque de cupo "en vivo" y barra inferior fija. Las acciones del organizador están sueltas al final. |
| `/eventos/nuevo`, `/eventos/:id/editar` | `NuevoEventoPage`, `EditarEventoPage` + `EventForm` | sin mockup | **Media.** El formulario funciona, pero en tema claro, con `<select>` en lugar de `OptionCard` y sin "Guardar borrador" ni vista previa (R8). |
| `/eventos/:id/asistentes` | `AsistentesPage` | sin mockup | **Media.** Ya tiene switch accesible, buscador y contador. Solo cambian tokens. |
| — → **`/mis-eventos`** | no existe (`ui.md` lo ponía en `/panel` para participante) | `mobile-mis-eventos.html` | **No existe.** Depende de `GET /dashboard/participant` (S3-03, sin backend). |
| — → **`/avisos`** | no existe | sin mockup (pestaña en `mobile-*`) | **No existe.** Tampoco hay endpoint de lectura de notificaciones (R7). |
| `/panel` | `PanelPage` | `desktop-panel-organizador.html` (organizador) | **Todo por hacer.** Es un `<h1>Panel</h1>` y `GET /dashboard/organizer` (S3-01) no existe en el backend. |
| `/citas` | `CitasPage` | sin mockup (el escritorio de Descubre muestra "Próximas citas" a un lado) | **Media.** Lógica completa; pestañas propias y tema claro. |
| `/citas/nueva` | `NuevaCitaPage` | sin mockup | **Media.** Funciona. Es el archivo más grande (175 líneas, ver riesgos). |
| `/disponibilidad` | `DisponibilidadPage` | sin mockup | **Media.** |
| `/perfil` | `PerfilPage` | sin mockup | **Media.** Faltan avatar con iniciales y "Tus gustos" (R7). |
| `*` | `NotFoundPage` | sin mockup | **Cerca.** Ya es oscura (fuera de `AppShell`). Hay que cambiar el enlace a `/descubre` y usar `EmptyState`. |
| (layout) | `AppShell`, `Navbar`, `AuthLayout` | barras de `mobile-descubre`, `desktop-descubre` y `desktop-panel-organizador` | **Lejos.** Las pestañas son otras (Eventos, Panel, Citas, Perfil y "+"), falta la barra lateral del organizador y el contenido va sobre `gray-200/40` claro. |

---

## b) Componentes repetidos o inconsistentes → `components/ui/`

| Patrón repetido hoy | Dónde | Unificar en |
|---|---|---|
| Píldora seleccionable (`chipClass`, pestañas, bloques de disponibilidad, invitados elegidos) | `EventosPage` (categorías **y** Próximos/Pasados), `CitasPage` (pestañas con `rounded-xl` y otro estilo), `NuevaCitaPage` (bloques y píldoras de invitado) | **`Chip`** (skill §3). Para Próximos/Pasados se necesita una variante con `role="tab"`; ver d) n.º 21. |
| Insignia/píldora de estado (`Pill` privado, "Cancelada", "Vas a ir" ×2) | `EventBadges`, `CitasPage`, `EventCard`, `AttendanceButton` | **`Badge`** con variantes por categoría y por estado (R1). |
| Superficie de tarjeta `rounded-2xl bg-white p-5 shadow-sm` | 7 lugares | **`Card`**: la lista de `frontend/CLAUDE.md` §1 lo incluye, la skill no. Es `bg-panel border-line rounded-card`. |
| Enlace "← Volver a …" | `DetalleEventoPage`, `AsistentesPage`, `NuevaCitaPage` | **`BackButton`**: botón de 36 px como en `mobile-detalle-evento`, con `aria-label`. |
| Diálogo de confirmación (`Modal` + párrafo + 2 botones `flex-col-reverse`) | `AttendanceButton`, `DetalleEventoPage`, `CitasPage`, `DisponibilidadPage` | **`ConfirmDialog`** sobre `Modal`. |
| `isPending ? 'Guardando…' : label` | ~9 botones | Prop **`loading`** de `Button` (skill §3: spinner + `aria-busy`). |
| Switch de check-in | `AsistentesPage` (privado) | **`Switch`**, para reutilizar en Perfil y en R8. |
| Input con label integrado (`Field.jsx` exporta `Input`/`Textarea`/`Select` con `label`) | todos los formularios | **`Field`** + **`Input`** separados (skill). Ojo: cambia la API de **todos** los formularios (ver riesgos). |
| `Spinner`, `Skeleton`, `EmptyState` y `ErrorState` en un solo archivo | `Feedback.jsx` | Un archivo por componente (R1). `ErrorState` no está en la skill: propongo `EmptyState variant="error"` con "Reintentar". |
| Pantallas 403/404/"solo el organizador…" con estilos propios | `RoleRoute`, `NotFoundPage`, `AsistentesPage`, `EditarEventoPage` | **`EmptyState`**. |
| Wordmark "Be Core" en texto plano | `AuthLayout`, `Navbar` ×2 | **`BrandMark`** (SVG del mockup + "Be **Core**"). |
| Título de página `h1` | 9 páginas | Clase de la skill §2, o un `PageHeader` con título, subtítulo y acción. |
| Buscador | `AsistentesPage`, `NuevaCitaPage` y luego Descubre | **`Input`** con ícono de lupa (variante `search`). |
| `CapacityBar` | `components/events/` | Pasa a **`ui/CapacityBar`** (R1) con el texto "24 / 40" y el estado "Lleno". |
| Padding de safe-area en línea | `AuthLayout`, `Navbar` ×3, `Modal` | Utilidades en `index.css` (`.pt-safe`, `.pb-safe`) o variables de Tailwind 4 (`@utility`). |

---

## c) Riesgos

1. **Tokens con el mismo nombre que la paleta de Tailwind.** `gray-500` y `gray-200` sobrescriben los grises por defecto. Si en R1 se reemplaza el `@theme` sin borrar sus usos, `text-gray-500` **vuelve en silencio** a `#6B7280` de Tailwind y `bg-gray-200` a `#E5E7EB`. No falla el build ni el lint. *Mitigación:* en el commit de tokens, `grep` de `navy-|teal-|gray-|emerald-|orange-|yellow-|graphite|bg-white|text-white` y migrar todo en el mismo bloque.
2. **Cambio de tema claro → oscuro en todo el frontend.** No es "cambiar colores": ~25 archivos asumen texto oscuro sobre blanco (`text-navy-900`, `shadow-sm`, `divide-gray-200`). R1 pide reemplazar sin rediseñar el layout. Mientras R5–R8 no lleguen, algunas pantallas quedarán a medio camino.
3. **Realtime no existe todavía.** `PROMPTS-rediseno.md` dice "Realtime … ya existente: reutilízalo" en R5, R6 y R8, pero en el frontend no hay ninguna suscripción (S3-02 está pendiente). La publicación de `events`, `activity_log` y `notifications` sí existe en las migraciones. Esas sesiones tienen que **crear** `useRealtimeEvent`/`useRealtimeActivity` siguiendo `frontend/CLAUDE.md` §4.5, no reutilizarlos.
4. **Endpoints de los que dependen los mockups y no existen.** `GET /dashboard/organizer` (R8, S3-01), `GET /dashboard/participant` (`/mis-eventos` y la columna de citas de Descubre en R5 y R7, S3-03), lectura/marcado de notificaciones (R7) y un **feed global de actividad** para el ticker de Descubre: solo existe `GET /events/:id/activity`, por evento, y no está en `api.md`. R5 dice "no cambies la API". Hay que decidir si el ticker global hace la carga inicial con Realtime y nada más, o si se agrega `GET /activity` a `api.md`.
5. **Datos del mockup que la API no da.** Avatares de asistentes y "+21 van", "9 van en camino", "En espera", dirección secundaria ("Cra. 45 #12-30"), etiquetas de métricas ("+22 hoy", "3 esta semana", "2 eventos casi llenos"), duración ("8:00 a.m. — 11:00 a.m." sí sale de `endsAt`). La regla es omitirlos y no inventar datos. Hay que avisarlo en cada sesión para que el mockup no se "complete" con datos falsos.
6. **Renombrar rutas** (`/ingresar` → `/login`, `/eventos` → `/descubre`). Hay rutas escritas a mano en 15 sitios (`Navigate`, `navigate()`, `LinkButton to`, `NotFoundPage`, `RoleRoute`, `PerfilPage`). Las plantillas de correo no tienen enlaces, así que ahí no hay riesgo. *Mitigación:* dejar `/ingresar` y `/eventos` como `<Navigate replace>` hacia las nuevas, y centralizar las rutas en `lib/routes.js`.
7. **Lógica mezclada con la vista.** Al restilizar se puede romper:
   - `AttendanceButton`: `resolveState` (regla de negocio), 2 mutaciones, toasts, modal y render en un componente con prop `compact`. R6 cambia sus textos y estados. *Antes:* mover `resolveState` a `lib/attendance-state.js` con pruebas.
   - `DetalleEventoPage`: calcula `isOwner`, `isActive` y `canModify` en línea, con 2 mutaciones y un modal.
   - `AsistentesPage`: duplica en el cliente la regla "check-in se abre 2 h antes" (`CHECKIN_OPENS_MS`), que también vive en el backend. Si una cambia, la otra miente.
   - `NuevaCitaPage` (175 líneas): `ParticipantPicker` interno, formulario y mapeo de errores de la API a campos.
   - `EventosPage`: estado de 4 filtros, paginación y 3 estados de vista en un solo componente. Descubre va a crecer (saludo, ticker, "Para ti", columna lateral) y puede pasar de las 250 líneas.
8. **Cambio de API de `Field`/`Input`.** Hoy `<Input label=… error=…>` funciona en todos los formularios. Si R1 separa `Field` de `Input` sin compatibilidad, rompe Ingresar, Registro, EventForm, Citas, Disponibilidad, Perfil y Asistentes a la vez. *Mitigación:* que `Input` siga aceptando `label` (envolviéndose en `Field`) durante la migración.
9. **`AuthContext` asume el flujo viejo.** `signUp` envía `role` y falla si no hay sesión inmediata. `translateAuthError` todavía tiene el mensaje de `INVALID_ROLE` y no sabe de `onboardingCompleted`. R3 lo cambia. Que no se toque en R1.
10. **`sonner` está configurado en claro** (`richColors`, `top-center`). La skill pide los avisos abajo, en `bg-panel`, 4 s y `role="status"`.
11. **Pocas pruebas de UI.** Solo hay 2 pruebas de lógica pura. Una regresión visual o de flujo no se detecta en CI. Propongo: pruebas de las funciones que se extraigan (n.º 7) y una lista de verificación manual a 390/1440 px en cada PR.
12. **Carpeta de layouts.** R1 dice `frontend/src/layouts/`, pero `frontend/CLAUDE.md` §1 y el código usan `components/layout/`. Ver d) n.º 20.
13. **Estado del repo.** `CLAUDE.md` §10 dice "Sprint actual: S1", pero `main` ya tiene el cierre de S2. Según `CLAUDE.md` §8 el PR va a `develop`, y esa rama no aparece en el remoto (solo `main` y `feature/sprint-*`).

---

## d) Contradicciones entre la skill, `ui.md`, los mockups y otros documentos

**Orden de precedencia propuesto** (de mayor a menor):
1. `CLAUDE.md`: alcance (§9), librerías permitidas (§2) y seguridad (§7).
2. `docs/specs/auth-onboarding.md`, solo para auth y onboarding (decisiones ya tomadas).
3. Skill `becore-ui`, incluidas sus excepciones explícitas al mockup.
4. Mockups (`docs/mockups/`): medidas, layout y textos.
5. `docs/specs/ui.md`: rutas ↔ RF, formatos de fecha, textos fijos y estados de negocio que los anteriores no cubren.

| # | Tema | Qué dice cada uno | Propuesta (manda) |
|---|---|---|---|
| 1 | Tema | `ui.md` §3: fondo blanco/`gray-200`, encabezados navy. Skill y mockups: oscuro (`#0B1420`). | **Skill.** Tema oscuro y nada de tema claro. |
| 2 | Tokens | `ui.md` §3: `navy-*`, `teal-*`, `gray-*`… Skill §1: `bg`, `sheet`, `panel`, `field`, `ink*`, `accent*`, etc. | **Skill.** Se borran todos los tokens viejos; `ui.md` §3 queda obsoleta. |
| 3 | Rutas | `ui.md` §2: `/ingresar`, `/eventos` (Descubre), `/panel` también para participante ("Mis eventos"). Skill: `/login`, `/descubre`, `/mis-eventos`, `/avisos`, `/panel` solo para organizador. | **Skill**, con redirecciones desde las rutas viejas. Actualizar la tabla de `ui.md` §2 en R1. |
| 4 | Navegación móvil | `ui.md` §2: Eventos, Panel, Citas, Perfil y un "+" central para el organizador. Skill: Inicio, Mis eventos, Avisos, Perfil. | **Skill.** Quedan dos huecos **que debe decidir el equipo**: (a) en móvil, ¿dónde quedan **Citas** y **Disponibilidad**? Propuesta: un enlace desde Perfil y una tarjeta "Próximas citas" en Inicio. (b) ¿Cómo crea evento el organizador en móvil? Propuesta: el botón "+ Crear evento" del mockup en la cabecera de `/panel`, sin "+" en la barra. |
| 5 | Íconos | `CLAUDE.md` §2 y `frontend/CLAUDE.md` §5 permiten y piden `lucide-react` (ya instalado y en uso). La skill §6 pide "SVG inline (trazo 2 px, 24×24, `currentColor`)". R1 pide crear `components/icons/` "sin librerías de íconos". | **`lucide-react`.** Dibuja SVG inline de trazo 2 px, 24×24 y `currentColor`, así que cumple la regla de la skill y evita mantener 16 íconos a mano. Solo `BrandMark` y la "G" de Google van como SVG propio. Esto anularía el paso 3 de R1; **lo confirma el equipo**. |
| 6 | Toasts | `CLAUDE.md` §2 y `frontend/CLAUDE.md` §4.4: `sonner`. Skill §3: `Toast` propio. R1: `Toast` + `ToastProvider` + `useToast`. | **`sonner` con estilo de la skill** (`position="bottom-center"`, `toastOptions` con `bg-panel border-line`, `duration: 4000`, íconos por tipo) y un `ui/toast.js` que lo envuelva. Ya está en todas las páginas y no hace falta un provider nuevo. **Lo confirma el equipo.** |
| 7 | Nombres de categoría | `format.js`/`ui.md`: Deportivo, Cultural, Recreativo, Otro. Mockup (filtros): Deportivos, Culturales, "Cerca de ti". R5: "Deporte, Cultura, Recreación". Onboarding: grupos "Deporte, Cultura, Recreación". | En la **píldora** de la tarjeta, singular (`ui.md`, como el mockup). En los **filtros**, "Todos · Deportivos · Culturales · Recreativos" (estilo del mockup, sin "Cerca de ti" por estar fuera de alcance; "Otros" solo si hay eventos de esa categoría). En el **onboarding**, lo que dice la spec. Hay que corregir el texto de R5. |
| 8 | Color por categoría | Los mockups varían el color de portada sin regla: un cultural en amarillo, azul o morado; un deportivo naranja; el ícono de fútbol en naranja en el panel. La skill §1 fija sport → turquesa, culture → amarillo, recreation → verde, other → gris. | **Skill.** La portada usa siempre el degradado de su categoría. |
| 9 | Barra de cupo | `ui.md` §4: turquesa < 80 %, naranja ≥ 80 %, `navy-800` lleno, texto "9 de 12 confirmados". Panel del mockup: color por categoría. Detalle del mockup: turquesa y "24 / 40". R1: "24 / 40" y "Lleno". | Umbrales de **`ui.md`** con tokens de la skill: `accent` < 80 %, `action` ≥ 80 % con texto "Casi lleno", `ink-faint` lleno con texto "Lleno". El texto visible es "24 / 40" (mockup) y el `aria-label` dice "24 de 40 cupos ocupados". |
| 10 | Botón de asistencia | `ui.md` §4: "Vas a ir", "Sin cupos" y cancelar como enlace. R6 y el mockup de escritorio: "Confirmado ✓", "Cupo lleno" y cancelar como botón secundario. | **R6/mockup.** "Confirmado" lleva el ícono `Check`, no el carácter ✓ (skill §6: nada de emoji o símbolo como ícono). |
| 11 | Un solo botón turquesa por vista | La skill §1 lo exige. `desktop-descubre` tiene un "Confirmar" turquesa en cada tarjeta y un botón **amarillo** "Casi lleno". | En listas se permite la acción por tarjeta en tamaño pequeño (como el mockup), que no cuenta como "la acción principal". "Casi lleno" es un **`Badge`** y no un botón: un estado no es una acción y no se mezclan dos acentos. |
| 12 | Login: bloque inferior | El mockup tiene "o continúa como" + Organizador/Participante. `auth-onboarding.md` §2 tiene "o continúa con" + Google. | **auth-onboarding** (ya decidido). |
| 13 | Gris de placeholders | Mockups: `#475569` en placeholders, divisor del login y pestañas inactivas de la barra. Skill: `ink-faint` `#64748B` solo para placeholders. | **Skill**, extendida: `#475569` tampoco cumple contraste en el divisor ni en las pestañas inactivas, así que todo eso usa `ink-faint` (o `ink-muted` en la barra). Proponer en la skill que sea "el único cambio de color" en vez de "solo placeholders". |
| 14 | Emoji en el saludo | `mobile-descubre`: "Camila 👋". La skill §6 prohíbe emojis en la interfaz. | **Skill.** Sin emoji. |
| 15 | Estados de "Mis eventos" | El mockup muestra "En espera" (no existe lista de espera en la base) y un aviso "Cambio de horario". R7: Confirmado, Asistió, Cancelado, Evento cancelado. | **R7.** "En espera" se omite. El aviso naranja se muestra **solo** si hay una notificación `event_updated` sin leer (el tipo existe en `notification_type`). |
| 16 | Detalle: barra inferior | El mockup tiene "Confirmar asistencia" + botón de chat (con contador) + botón de mapa. | **Skill** (fuera de alcance): se quitan chat y mapa y el botón principal ocupa todo el ancho. Igual con "Ver ruta", "1.8 km" y "van en camino". |
| 17 | Métricas del panel | Mockup: 4 tarjetas (Eventos activos, Cupos confirmados, Cupos disponibles, Cancelaciones). `ui.md` §4: 5 `StatCard` (Próximos eventos, Confirmados, Cancelados, Llegaron, Ocupación). `api.md` `totals`: `upcomingEvents`, `confirmed`, `cancelled`, `checkedIn`, `occupancyRate`. R8: otras 4. | **Layout del mockup (4 tarjetas) con los datos que da `api.md`:** Próximos eventos, Confirmados, Cancelados, Ocupación %. "Llegaron" va como columna de la tabla. Se omiten las etiquetas "+22 hoy" y similares porque no hay datos. Hay que corregir R8 para que coincida. |
| 18 | Fuentes | `ui.md` y `index.html`: Inter 400/500/600. Skill: Inter 300–700. | **Skill**, aunque la propia skill pide "máximo 2 pesos por pantalla además del título". Basta con 400/500/600/700. |
| 19 | Tamaños | `frontend/CLAUDE.md` §6: toques ≥ 44 px, `h1` actual `text-2xl bold`. Skill: botón ≥ 48 px y `h1` `text-xl semibold`. Mockups de escritorio: `h1` de 22 px. | **Skill** (48 px cumple ≥ 44). `h1` en `text-xl` en móvil y `md:text-[22px]` en escritorio, como el mockup. |
| 20 | Carpeta de layouts | R1: `frontend/src/layouts/`. `frontend/CLAUDE.md` §1 y el código: `components/layout/`. | **`components/layout/`.** Evita mover archivos y contradecir `frontend/CLAUDE.md`. Hay que corregir R1. |
| 21 | Pestañas Próximos/Pasados | Mockup de "Mis eventos": píldoras sin contador. R7: "con contador". La skill no define `Tabs`. | Píldoras del mockup con el **componente `Chip`** en modo `role="tab"`. El contador es opcional y sin mezclar estilos. |
| 22 | Color de error | `ui.md` §1 y el código: errores y destructivo en **naranja**. Skill: `danger` `#F87171` (rojo) para errores; `action` (naranja) para alertas activas. | **Skill.** |
| 23 | Mensajes de error de auth | `ui.md` §5 (sin punto final, con el error de rol). `auth-onboarding.md` §4 y §5 (otros textos, sin el error de rol). | **auth-onboarding** en las pantallas de auth. `ui.md` §5 se actualiza en R3. |
| 24 | Colores de la PWA | `frontend/CLAUDE.md` §6: `#0D1B2A`. R9: `#0B1420`. | **R9** (coincide con `bg`). Actualizar `frontend/CLAUDE.md` §6 en R9. |
| 25 | Referencias rotas | La skill y `auth-onboarding.md` §2/§9 citan "CLAUDE.md §8" para lo fuera de alcance, que es **§9**. R9 cita "plantilla de CLAUDE.md §12", que **no existe**: la plantilla está al final de `docs/specs/backlog.md`. | Corregir las referencias en R1. Esta sesión no tocó los archivos del kit. |
| 26 | Escritorio del participante | Skill: barra superior con Descubre, Mis eventos, Citas, Notificaciones. En móvil no hay pestaña de Citas. | Coherente con el n.º 4: en escritorio Citas tiene entrada propia y en móvil se llega desde Perfil o Inicio. |

### Decisiones que necesitan al equipo antes de R1

- n.º 4: dónde quedan Citas/Disponibilidad y "Crear evento" en móvil.
- n.º 5: `lucide-react` o íconos propios.
- n.º 6: `sonner` estilizado o `Toast` propio.
- Riesgo n.º 4: ticker global de Descubre (solo Realtime o un nuevo `GET /activity` en `api.md`).
- Riesgo n.º 4: quién hace los endpoints `/dashboard/*` (S3-01 y S3-03) antes de R5, R7 y R8.
