# 12 · Vista previa de avatar

Fecha: 2026-10-18 · Rama: `feature/avatar-preview` (sale de `feature/profe-4`) · Estado: **código y pruebas
automáticas listas; falta recorrerlo a mano a 390 y 1440 px** (zoom, deslizar para cerrar y foco real).

## Qué se hizo

- **Vista previa** (`components/ui/AvatarPreview.jsx` + `contexts/AvatarPreviewContext.jsx`, una sola para toda la
  app): modal a pantalla completa en móvil y centrado en escritorio, scrim con desenfoque, imagen redonda de máx.
  320 px (móvil) / 400 px (escritorio), con Skeleton redondo mientras carga la misma URL ya comprimida. Sin foto
  muestra el avatar predefinido o las iniciales en grande. Debajo, **solo nombre de pila y rol**.
- **Animación:** zoom desde el avatar tocado (técnica FLIP con la Web Animations API, solo `transform` y `opacity`);
  no se anima con `prefers-reduced-motion`.
- **Cierre:** botón X (`aria-label="Cerrar"`), Escape, tocar fuera de la imagen y deslizar hacia abajo (umbral
  90 px). El foco vuelve al avatar que lo abrió.
- **Accesibilidad:** `role="dialog"`, `aria-modal`, `aria-label="Foto de {nombre}"`, foco atrapado con Tab, y el
  avatar clicable es un `<button aria-label="Ver foto de {nombre}">` (`PreviewableAvatar`).
- **Dónde:** barra lateral y superior (propio), Perfil (propio, con **"Cambiar foto"**, que cierra la vista y
  lleva al selector de "Tu foto"), organizador en el detalle, lista de asistentes del organizador y "quiénes van".
- **"Quiénes van":** la fila de avatares solapados + "+N" ahora es un botón que abre una lista con todos los
  confirmados (avatar + nombre de pila); tocar uno abre su vista previa. En las tarjetas la fila salió del enlace
  al detalle para no anidar controles interactivos.
- **Backend:** `GET /events/:id/confirmed` (solo nombre de pila y foto, solo eventos visibles para el usuario);
  `Event.organizer` y los asistentes suman `avatarUrl` y `avatarPreset`. Sin migraciones.

## Decisión sobre las pruebas

El frontend no tiene jsdom ni Testing Library y `CLAUDE.md` pide preguntar antes de instalar librerías. Por eso la
lógica se separó en funciones puras (`lib/avatar-preview.js`: teclado, foco, deslizar, zoom, qué datos se muestran)
y el marcado se prueba con `react-dom/server`. Los eventos reales de teclado y de puntero no se simulan en un
navegador; si se quiere, se puede agregar `jsdom` + `@testing-library/react` como dependencias de desarrollo.

## Verificación

| Qué | Resultado |
|---|---|
| `npm run lint` | sin errores |
| `npm test` | backend 268/268, frontend 203/203 |
| `npm run build -w frontend` | compila |
| Solo nombre de pila y rol (descarta correo, apellidos, ids), foto sobre avatar, "Cambiar foto" opcional | `avatar-preview.test.js`, `AvatarPreview.test.jsx` |
| Escape cierra, Tab da la vuelta, foco vuelve al avatar, umbral de deslizar, zoom | `avatar-preview.test.js` |
| `aria-*`, botón X y skeleton en el marcado | `AvatarPreview.test.jsx` |
| Lista de confirmados: solo nombre de pila y foto, borrador ajeno 404 | `events.service.test.js` |

## Pendiente

- Probar a mano: abrir/cerrar con teclado y toque, deslizar en un celular, el zoom desde el avatar, y que el foco
  vuelva al avatar (también tras elegir a alguien de la lista de "quiénes van").
