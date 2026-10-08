# Especificación de interfaz — Be Core

Referencia visual: mockups publicados del proyecto (9 pantallas) e identidad gráfica del equipo.
Tagline: "Tu comunidad en movimiento". Tono cercano, activo y comunitario; tutea al usuario.

## 1. Principios

- Se usa en iPhone como app instalada (PWA, ver frontend/CLAUDE.md §6): nada puede quedar bajo la muesca ni bajo la barra de gestos.
- Mobile-first (390 px), escritorio hasta 1440 px.
- Una acción principal por pantalla, en turquesa. Acciones destructivas en texto rojo/naranja, nunca como botón principal.
- Todo listado tiene estado de carga (skeleton), vacío (con acción sugerida) y error.
- Confirmar asistencia en 3 toques o menos desde "Descubre".

## 2. Rutas

| Ruta | Acceso | Pantalla | RF |
|---|---|---|---|
| `/` | — | Redirige a `/eventos` si hay sesión, si no a `/ingresar` | — |
| `/ingresar` | público | Inicio de sesión | RF-02 |
| `/registro` | público | Crear cuenta con selector de rol | RF-01 |
| `/eventos` | todos | Descubre eventos: tarjetas, filtros por categoría y fecha, pestañas Próximos / Pasados | RF-07 |
| `/eventos/nuevo` | org | Formulario crear evento | RF-04, RF-09 |
| `/eventos/:id` | todos | Detalle: datos, barra de cupo, botón confirmar/cancelar (part), acciones de organizador (dueño), ticker de actividad | RF-08, RF-11, RF-12 |
| `/eventos/:id/editar` | dueño | Formulario editar | RF-05 |
| `/eventos/:id/asistentes` | dueño | Lista de confirmados con switch de check-in | RF-13 |
| `/panel` | todos | Organizador: panel con totales y tabla de eventos. Participante: "Mis eventos" (próximos / pasados) y próximas citas | RF-18, RF-19 |
| `/citas` | todos | Mis citas (próximas / pasadas) | RF-14 |
| `/citas/nueva` | org | Crear cita: datos + buscador de participantes + bloques de disponibilidad como sugerencia | RF-14 |
| `/disponibilidad` | org | Mis bloques de disponibilidad: crear y borrar | RF-15 |
| `/perfil` | todos | Nombre editable, correo y rol de solo lectura, cerrar sesión | — |
| `*` | — | 404 con enlace a `/eventos` | — |

`ProtectedRoute` redirige a `/ingresar` sin sesión. `RoleRoute role="organizer"` muestra 403 amable si el rol no coincide.

Navegación: barra inferior fija en móvil (Eventos, Panel, Citas, Perfil; el organizador ve además un botón
"+" central para crear evento). En escritorio, barra superior con las mismas entradas.

## 3. Tokens de marca (Tailwind 4) — `src/index.css`

```css
@import "tailwindcss";

@theme {
  --color-navy-900: #0D1B2A;   /* fondo oscuro, encabezados */
  --color-navy-800: #1E293B;   /* superficies oscuras */
  --color-graphite: #2D3640;
  --color-gray-500: #6B7280;   /* texto secundario */
  --color-gray-200: #E5E7EB;   /* bordes, fondos claros */
  --color-teal-500: #14B8A6;   /* acento principal: botones, enlaces, foco */
  --color-teal-600: #0E9F92;   /* hover del acento */
  --color-emerald-500: #10B981;/* éxito, "Confirmado" */
  --color-orange-500: #F97316; /* acción secundaria, avisos, "Cancelado" */
  --color-yellow-400: #FACC15; /* categoría cultural, destacados */

  --font-display: "Poppins", ui-sans-serif, system-ui, sans-serif;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
}
```

Fuentes desde Google Fonts en `index.html`: Poppins 500/600/700 e Inter 400/500/600.
Títulos con `font-display`, todo lo demás con `font-sans`. Fondo de la app: blanco / `gray-200` muy suave;
encabezados y navbar en `navy-900`.

Color por categoría (chip y borde de tarjeta):
| Categoría | Etiqueta | Color |
|---|---|---|
| `sport` | Deportivo | `teal-500` |
| `culture` | Cultural | `yellow-400` |
| `recreation` | Recreativo | `emerald-500` |
| `other` | Otro | `gray-500` |

Etiquetas de estado del evento: `draft` Borrador, `published` Publicado, `in_progress` En curso,
`finished` Finalizado, `cancelled` Cancelado.

Estados: Confirmado = `emerald-500`; Cancelado = `orange-500`; Lleno = `navy-800` con texto blanco;
Pasado = `gray-500`.

## 4. Componentes clave

- **EventCard**: chip de categoría, título, fecha corta ("sáb 31 oct · 3:00 p. m."), lugar, barra de cupo
  ("9 de 12 confirmados"), estado propio si existe. Toda la tarjeta es un enlace al detalle.
- **CapacityBar**: barra con porcentaje; turquesa < 80 %, naranja ≥ 80 %, `navy-800` lleno. Se actualiza por Realtime.
- **AttendanceButton** (detalle, rol participante):
  - Sin asistencia o cancelada, con cupo → "Confirmar asistencia" (principal).
  - Confirmado → insignia "Vas a ir" + enlace "Cancelar asistencia" que abre un `Modal` de confirmación.
  - Lleno → botón deshabilitado "Sin cupos".
  - Evento pasado o cancelado → sin botón, solo el estado.
- **ActivityTicker**: últimas 5 acciones ("María confirmó hace 2 min"), carga inicial desde
  `GET /events/:id/activity` y nuevas filas por Realtime (`INSERT` en `activity_log` filtrado por `event_id`).
- **StatCard** del panel del organizador: Próximos eventos, Confirmados, Cancelados, Llegaron, Ocupación.

## 5. Textos

Fechas: `Intl.DateTimeFormat('es-CO', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' })`.
Tiempo relativo del ticker: `Intl.RelativeTimeFormat('es', { numeric: 'auto' })`.

Errores de Supabase Auth → mensaje en español:
| Mensaje original (contiene) | Mostrar |
|---|---|
| `Invalid login credentials` | Correo o contraseña incorrectos |
| `User already registered` | Ese correo ya tiene una cuenta. Inicia sesión |
| `Password should be at least` | La contraseña debe tener al menos 8 caracteres |
| `Unable to validate email address` | Escribe un correo válido |
| `INVALID_ROLE` / `Database error saving new user` | Elige si eres organizador o participante |
| cualquier otro | No pudimos completar la acción, intenta de nuevo |

Textos fijos:
- Vacío en Descubre: "Todavía no hay eventos próximos." + (organizador) botón "Crear el primero".
- Vacío en Mis eventos: "Aún no te has apuntado a nada. Mira lo que se viene." + enlace a `/eventos`.
- Éxito al confirmar: "¡Listo! Tienes tu cupo." Al cancelar: "Cancelaste tu asistencia. Liberaste un cupo."
- Éxito al crear evento: "Evento publicado."
- Registro, selector de rol: "Quiero organizar eventos" / "Quiero participar en eventos".
