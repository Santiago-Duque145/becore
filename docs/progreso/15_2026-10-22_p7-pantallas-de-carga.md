# 15 · P7 Pantallas de carga entretenidas

Fecha: 2026-10-22 · Rama: `feature/profe-7` (sale de `feature/p6-fixes`) · Estado: **código y pruebas listos; falta
verlo en un celular real y correr Lighthouse** (ver Pendiente).

## Qué se hizo

1. **`BrandLoader`** (`components/ui/BrandLoader.jsx`): el isotipo del `BrandMark` animado solo con SVG + CSS. La "B" se
   dibuja con trazo y se rellena, cuatro líneas de movimiento (turquesa, verde, naranja, amarillo) cruzan por detrás y
   tres puntos aparecen y se conectan. Bucle de 1,8 s. Tamaños `sm`/`md`/`lg` = 32/52/72 px.
2. **Frases rotativas** cada 1,8 s con fundido, en `constants/loading.js`, alternando deporte y cultura. El lector de
   pantalla solo oye "Cargando" una vez (`role="status"`, `aria-live="polite"`); las frases van `aria-hidden`.
3. **Variantes por categoría** (`category`): balón que rebota (deporte, ícono nuevo `BallIcon`), nota que vibra
   (cultura), árbol que se mece (recreación; es el mismo ícono de la categoría en tarjetas y formulario) y chispa que late
   (otros). Se usan en:
   - **detalle**: la tarjeta pasa la categoría al abrir el evento (`state` del enlace) y la portada del skeleton toma su
     degradado y el ícono animado. Si se entra por enlace directo, queda el bloque con barrido;
   - **tarjetas**: mientras baja una portada subida, el ícono animado de la categoría; la foto entra con fundido.
4. **Dónde se usa el loader de pantalla completa** (`FullScreenLoader`):
   - arranque: `index.html` trae el isotipo dentro de `#root` (aparece a los 300 ms, antes de que cargue el JS) y luego
     `ProtectedRoute` muestra el `FullScreenLoader` mientras valida la sesión;
   - `/auth/callback`;
   - rutas diferidas de pantalla completa (auth, onboarding: `PageFallback` variante `screen`);
   - guardado del onboarding (capa encima del formulario).
   Las listas y tarjetas **siguen con Skeleton**, ahora con un barrido diagonal turquesa en lugar del pulso gris
   (`skeleton-sweep`). Los botones en loading muestran tres puntos que rebotan (`LoadingDots`), también el de Google.
   `Spinner` (esperas cortas con texto fijo: verificar código, consentimiento) es ahora el `BrandLoader` pequeño.
5. **Reglas para no estorbar** (`lib/loader-timing.js` + `hooks/useLoaderTiming.js`):
   - aparece solo si la espera pasa de **300 ms** y, una vez visible, se queda **mínimo 500 ms**
     (`useLoaderVisibility`, en arranque, callback y onboarding);
   - a los **8 s** cambia a "Esto está tardando más de lo normal…" con **Reintentar** (recarga la página; en el onboarding
     reenvía el guardado). En `/auth/callback` no aparece, porque esa pantalla ya vuelve sola al login con el error a los
     10 s;
   - con `prefers-reduced-motion`: logo quieto (la "B" completa con sus puntos), frases sin fundido y skeleton sin barrido.
     Comprobado en Edge: con movimiento reducido no queda ninguna animación corriendo.
6. **"Sin conexión"** (`public/offline.html`): el balón quieto y "Parece que se fue la señal. Revisa tu conexión."
   El service worker sube a `v2` para que los celulares descarguen la página nueva.
7. **`/dev/ui`**: sección "Cargadores de marca (P7)" (`pages/dev/LoadersDemo.jsx`) con los tres tamaños, las cuatro
   variantes, botones en loading, skeletons y el loader de pantalla completa normal y en estado "tardando".
8. **Skill `becore-ui`** actualizada: `Button` (puntos), `Skeleton` (barrido), filas nuevas de `BrandLoader` y
   `FullScreenLoader`, y los cargadores como excepción al "nada decorativo en bucle".

Sin librerías nuevas. La entrada del bundle no cambia (174,6 kB, 56,7 gz).

## Verificación

| Qué | Resultado |
|---|---|
| `npm run lint` | sin errores |
| `npm test` | backend 321/321, frontend 304/304 (nuevas: `loader-timing.test.js`, `loaders.test.jsx`) |
| `npm run build -w frontend` | compila sin avisos |
| Edge 390 y 1440 px, `/dev/ui` | sin scroll horizontal; capturas en `capturas-15/` |
| Edge, animaciones en curso | solo las de P7 + `enter` y `pulse` del punto en vivo; con movimiento reducido, ninguna |
| Arranque con red lenta (1,2 s por petición) | el isotipo de `index.html` aparece y luego el loader de React |
| Detalle con la API colgada (interceptada) | portada con degradado e ícono de la categoría (cultura: la nota) |

Una prueba revisa que los keyframes de los loaders solo animen `transform` y `opacity`.

## Diferencias con el plan

- El trazo de la "B" anima `stroke-dashoffset`, no solo `transform`/`opacity`. Es la misma técnica de `animate-draw`
  y un SVG de 72 px como máximo; el resto (líneas, puntos, íconos, frases, barrido, puntos de botón) es solo
  `transform`/`opacity`.
- Dentro del AppShell, la carga diferida de una ruta sigue mostrando el skeleton con la forma de la página (se percibe
  más rápido); el `BrandLoader` va en las rutas de pantalla completa. Como ese fallback de `Suspense` desaparece en cuanto
  llega el código, ahí solo aplican los 300 ms, no los 500 ms mínimos.
- Recreación usa el árbol (el ícono de la categoría en toda la app) en vez de una hoja o brújula.

## Pendiente

- **Lighthouse:** no se corrió. No está instalado y no está en la lista de herramientas de `CLAUDE.md` §2; hay que
  correrlo desde Chrome DevTools en `/login` y `/descubre` y compararlo con P6.
- **Celular real a 390 px:** confirmar que la animación no se ve entrecortada (en Edge emulado va fluida).
- `docs/PLAN.md` §checklist: marcar P7 cuando se pruebe en el celular.
