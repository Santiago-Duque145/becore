---
name: becore-ui
description: Sistema de diseño y reglas de UX de Be Core. Úsala SIEMPRE antes de crear o modificar cualquier pantalla, componente, estilo o texto visible en frontend/ (React + Tailwind 4). Cubre tokens de marca, componentes base, estados (carga, vacío, error, éxito), formularios, accesibilidad, microinteracciones y tono de los textos.
---

# Be Core · Skill de UX/UI

Be Core es una app **mobile-first, en tema oscuro**, para organizar eventos deportivos y culturales comunitarios. Tagline: *"Tu comunidad en movimiento"*. La fuente de verdad visual son los mockups de `docs/mockups/` y esta skill. Si una pantalla tiene mockup, se replica **tal cual** (medidas, colores, radios, textos); esta skill rellena lo que el mockup no dice.

| Mockup | Pantalla real |
|---|---|
| `mobile-login.html` | `/login`, `/registro` (ver `docs/specs/auth-onboarding.md`) |
| `mobile-descubre.html` · `desktop-descubre.html` | `/descubre` |
| `mobile-detalle-evento.html` | `/eventos/:id` |
| `mobile-mis-eventos.html` | `/mis-eventos` |
| `desktop-panel-organizador.html` | `/panel` (organizador) |

**Del mockup se omite siempre** (fuera de alcance, CLAUDE.md §9): el acceso al chat y la "estela convergente" del mapa. Desde P6 **sí** entran la distancia "a x km" (solo si el usuario toca "Cerca de mí"), "Cómo llegar", el mini-mapa del detalle, el modo mapa de Descubre y el "Mapa en vivo" del organizador, con Leaflet (sin Google Maps API).

**Navegación**
- Móvil (< 768 px): barra inferior de 4 pestañas como `mobile-descubre.html` → Inicio (`/descubre` o `/panel` si es organizador), Mis eventos, Avisos (`/avisos`, punto naranja si hay no leídas), Perfil.
- Escritorio participante: barra superior como `desktop-descubre.html` → Descubre, Mis eventos, Citas, Notificaciones (con "Mapa" como modo de Descubre, desde P6).
- Escritorio organizador: barra lateral como `desktop-panel-organizador.html` → Panel, Eventos, Citas, Notificaciones, Perfil (con "Mapa en vivo" desde P6; "Participantes" y "Configuración" solo si la página existe).

## 0. Antes de escribir código

1. Lee la spec de la pantalla en `docs/specs/` (p. ej. `auth-onboarding.md`, `ui.md`).
2. Revisa si ya existe el componente en `frontend/src/components/ui/`. **Reutiliza antes de crear.** Nunca dupliques un botón o input con estilos sueltos.
3. Diseña los 4 estados de cada vista antes de la vista "feliz": **cargando, vacío, error, éxito**.
4. Prueba a 390 px de ancho (iPhone 12–15) y a 1440 px. Nada de scroll horizontal.

## 1. Tokens (Tailwind 4 · `frontend/src/index.css`)

Todos los colores, radios y sombras salen de aquí. **Prohibido** escribir hex sueltos en componentes (`bg-[#14B8A6]`): usa la clase del token (`bg-accent`).

```css
@import "tailwindcss";

@theme {
  /* Superficies (de más profundo a más elevado) */
  --color-bg:          #0B1420; /* fondo de pantalla */
  --color-bg-deep:     #0D1B2A; /* azul profundo de marca, heros */
  --color-sheet:       #101B29; /* hoja inferior (login), modales */
  --color-panel:       #14202E; /* tarjetas, paneles */
  --color-field:       #172436; /* inputs, chips inactivos, icon-buttons */
  --color-line:        rgb(255 255 255 / 0.08); /* bordes */

  /* Texto */
  --color-ink:         #F1F5F9; /* texto principal */
  --color-ink-muted:   #94A3B8; /* labels, subtítulos */
  --color-ink-faint:   #8291A6; /* placeholders, metadatos (ver nota a11y) */

  /* Acentos de marca */
  --color-accent:      #14B8A6; /* turquesa — CTA y foco */
  --color-accent-soft: #5EEAD4; /* hover de enlaces, texto sobre fondos accent/10 */
  --color-on-accent:   #04241F; /* texto sobre turquesa */
  --color-success:     #10B981;
  --color-action:      #F97316; /* naranja — badges, alertas activas */
  --color-culture:     #FACC15; /* amarillo — categoría cultura */
  --color-danger:      #F87171;

  /* Tipografía */
  --font-display: "Poppins", system-ui, sans-serif; /* títulos */
  --font-sans:    "Inter", system-ui, sans-serif;   /* UI y texto */

  /* Radios */
  --radius-field: 12px;
  --radius-card:  16px;
  --radius-sheet: 28px;

  /* Animación */
  --ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1);
}
```

Fuentes en `index.html` (una sola petición):
`https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@300;400;500;600;700&display=swap`

### Reglas de color
- **Turquesa = la acción principal de la pantalla.** Un solo botón turquesa sólido por vista. Lo secundario va en `bg-field` con borde `border-line`.
- Naranja, amarillo y verde se usan **puntualmente** (badge, categoría, confirmación). Nunca dos acentos en el mismo elemento.
- Categorías de evento: `sport` → turquesa, `culture` → amarillo, `recreation` → verde, `other` → gris `ink-muted`.
- Fondos tintados: `bg-accent/10 border border-accent/20 text-accent-soft` (como el ticker en vivo).

### Accesibilidad de color
- Texto normal ≥ 4.5:1. `ink` y `ink-muted` sobre `bg`/`sheet`/`field` cumplen.
- El mockup usa `#475569` para placeholders; sobre `#172436` da ~2.3:1 y **no cumple**. Usa `ink-faint` (#8291A6), que cumple 4.5:1 en todas las superficies (4.9:1 sobre `field`, 5.1 sobre `panel`, 5.4 sobre `sheet` y 5.8 sobre `bg`). Es el único cambio permitido frente al mockup.
- Nunca transmitas estado solo con color: acompaña con ícono o texto ("Lleno", "Confirmado").

## 2. Tipografía

| Uso | Clase |
|---|---|
| Marca "Be **Core**" | `font-display font-bold text-2xl` + `<span class="text-accent">Core</span>` |
| Título de pantalla (h1) | `font-display font-semibold text-xl` (20 px) |
| Título de tarjeta | `font-sans font-semibold text-[14.5px]` |
| Texto | `text-sm` (14 px) |
| Label de campo | `text-xs font-semibold text-ink-muted` (12 px) |
| Metadatos | `text-xs text-ink-muted` |

Máximo 2 pesos por pantalla además del título. Nada de texto < 11 px.

## 3. Componentes base (`frontend/src/components/ui/`)

Crea/usa estos y solo estos para lo básico. Todos aceptan `className` para ajustes y reenvían `ref`.

| Componente | Especificación |
|---|---|
| `Button` | Variantes `primary` (`bg-accent text-on-accent font-bold`), `secondary` (`bg-field border border-line text-ink`), `ghost`, `danger`. Alto mínimo 48 px en móvil, `rounded-field`, `py-4 text-[14.5px]`. Prop `loading` → tres puntos que rebotan (`LoadingDots`, P7) + `aria-busy` + deshabilitado. `active:scale-[0.98]` con `transition`. |
| `Input` | `bg-field border border-line rounded-field px-4 py-3.5 text-base md:text-sm text-ink placeholder:text-ink-faint` (16 px en móvil para que iOS no haga zoom al enfocar). Foco: `focus:border-accent focus:ring-2 focus:ring-accent/30 outline-none`. Error: borde `danger` + mensaje debajo con `role="alert"`. Siempre con `<label>` asociado. |
| `PasswordInput` | `Input` + botón de ojo para mostrar/ocultar (`aria-label="Mostrar contraseña"`). |
| `Field` | Envuelve label + input + ayuda/error. `mb-4`. |
| `GoogleButton` | Fondo blanco `#FFFFFF`, texto `#1F1F1F`, logo "G" oficial a color en SVG inline (18 px), `rounded-field`, mismo alto que `Button`. Texto: "Continuar con Google". Sigue las guías de marca de Google: no recolorear el logo. |
| `Chip` | Seleccionable (`aria-pressed`). Inactivo `border border-line text-ink-muted`; activo `bg-accent text-on-accent border-accent`. `rounded-full px-4 py-2 text-xs font-semibold`. Con ícono opcional a la izquierda. |
| `OptionCard` | Tarjeta seleccionable grande (onboarding, rol). `bg-panel border border-line rounded-card p-4`; seleccionada `border-accent bg-accent/10` + check. Es un `<button aria-pressed>`. |
| `ProgressSteps` | Barra segmentada (n segmentos, 4 px de alto, `gap-1.5`). Completados `bg-accent`, actual `bg-accent/60`, pendientes `bg-line`. Incluye texto "Paso 2 de 5" para lectores de pantalla. |
| `Divider` | Línea – texto – línea (`text-[11.5px] text-ink-muted`), como "o continúa con" del login. |
| `Toast` | Esquina inferior, `bg-panel border border-line`, ícono por tipo, se cierra solo a los 4 s, `role="status"`. |
| `Skeleton` | Bloques `bg-field rounded-card` con la forma del contenido real y el barrido de marca `skeleton-sweep` (turquesa muy suave; quieto con movimiento reducido). Nada de `animate-pulse`. |
| `EmptyState` | Ícono + título + una frase + 1 acción. Nunca una pantalla en blanco. |
| `BrandMark` | Isotipo SVG del mockup (cuadro `#0D1B2A` + "B" con degradado turquesa→blanco) + wordmark. Tamaños 28 / 52 px. |
| `BrandLoader` | P7. Isotipo animado (la "B" se dibuja, líneas de color detrás, puntos que se conectan) en `sm`/`md`/`lg` (32/52/72 px) con frases rotativas de `constants/loading.js`. `category` → ícono animado de la categoría. `role="status"` anuncia "Cargando" una vez. `Spinner` es su versión pequeña con texto fijo. |
| `FullScreenLoader` | P7. Espera de pantalla completa: aparece a los 300 ms, dura mínimo 500 ms (con `useLoaderVisibility`) y a los 8 s pasa a "Esto está tardando más de lo normal…" con Reintentar. Solo para arranque, `/auth/callback`, rutas diferidas de pantalla completa y guardado del onboarding. |

## 4. Patrones de UX obligatorios

**Formularios**
- Validación en línea **al salir del campo** (`onBlur`), no en cada tecla. Revalida en vivo después del primer error.
- El botón de envío no se deshabilita para "obligar" a llenar; se envía y se muestran los errores. Solo se deshabilita mientras `loading`.
- Mensajes de error humanos y accionables: "Ese correo ya tiene cuenta. ¿Quieres iniciar sesión?" (con enlace), no "Error 409".
- `autoComplete` correcto: `email`, `current-password`, `new-password`, `name`. `inputMode="email"` en correo.
- Enter envía. El foco va al primer campo con error tras enviar.
- `Field` trae `mb-4`. Cuando el contenedor ya separa los campos (`flex gap-*`), usa la prop `flush`; no pases `mb-0` para pisar `mb-4`: en Tailwind gana el orden del CSS generado, no el del atributo `class`. Lo mismo para cualquier componente de `ui/`: ajústalo con sus props, no con clases que contradigan las suyas.

**Carga y feedback**
- Toda acción de red: estado `loading` en el botón que la disparó. `FullScreenLoader` solo en los casos de su fila (§3).
- Listas: `Skeleton` en la primera carga; en recargas, mantener datos viejos (TanStack Query `placeholderData: keepPreviousData`).
- Éxito: `Toast` breve o cambio visible en el mismo elemento (p. ej. botón pasa a "Confirmado ✓" en verde).
- Errores de red: mensaje + botón "Reintentar".

**Navegación móvil**
- Objetivos táctiles ≥ 44 × 44 px.
- Respeta `env(safe-area-inset-bottom)` en barras inferiores.
- Botón "Atrás" visible en flujos de varios pasos; el progreso no se pierde al volver.

**Movimiento**
- Transiciones de 150–250 ms con `ease-out-soft`. Entrada de pantallas: `opacity` + `translate-y-2`.
- Todo lo animado se apaga con `motion-reduce:` (`motion-reduce:transition-none motion-reduce:animate-none`).
- Las animaciones comunican algo (llegó un dato, cambió un estado). Nada decorativo en bucle salvo el punto "en vivo", el hero de auth (P1) y los cargadores mientras se espera (P7).

**Accesibilidad**
- Un `h1` por pantalla. Orden de foco lógico. Foco siempre visible (`focus-visible:ring-2 ring-accent`).
- Íconos solos llevan `aria-label`. Imágenes decorativas `alt=""`.
- Los grupos de chips/tarjetas seleccionables: `role="group"` + `aria-labelledby` con la pregunta.

## 5. Tono de los textos

Cercano, activo, comunitario, en español de Colombia, tuteo. Frases cortas.
- ✅ "¡Listo! Ya estás dentro." · "Aún no hay eventos por aquí. ¡Crea el primero!" · "Bienvenido de nuevo"
- ❌ "Operación realizada exitosamente." · "No se encontraron registros."
- Botones con verbo: "Iniciar sesión", "Crear cuenta", "Confirmar asistencia", "Continuar".

## 6. Lo que NO se hace

- No instalar librerías de UI (MUI, Chakra, shadcn, etc.) ni de animación sin justificarlo antes según `CLAUDE.md` del repo. Tailwind + componentes propios alcanzan.
- No usar `supabase.from(...)` en el frontend. Datos siempre por `/api/v1`. (Solo `supabase.auth.*` y Realtime de lectura.)
- No implementar el chat ni la "estela convergente" (fuera de alcance). El mapa, la distancia y "Cómo llegar" se implementan con Leaflet, sin Google Maps API (P6).
- No usar emojis como íconos de interfaz; usa SVG inline (estilo trazo 2 px, 24×24, `currentColor`).
- No tema claro por ahora: la app es oscura.

## 7. Checklist antes de dar por terminada una pantalla

- [ ] Coincide con el mockup a 390 px (si lo hay).
- [ ] Usa solo tokens y componentes de `ui/`.
- [ ] Tiene estados de carga, vacío, error y éxito.
- [ ] Navegable con teclado y foco visible.
- [ ] Contraste ≥ 4.5:1 en texto.
- [ ] Textos en el tono de la sección 5.
- [ ] Sin warnings en consola ni scroll horizontal.
