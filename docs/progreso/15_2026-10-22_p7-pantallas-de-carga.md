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
| `npm test` | backend 322/322, frontend 304/304 (nuevas: `loader-timing.test.js`, `loaders.test.jsx`) |
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

Revisado y aprobado el 2026-10-22: el trazo con `stroke-dashoffset`, el skeleton entre rutas dentro del AppShell y
`/auth/callback` sin aviso de "tardando".

## Reintentar del onboarding: el guardado es idempotente

A los 8 s, "Reintentar" reenvía `PUT /me/onboarding` aunque la primera petición siga en curso. Se dejó así porque el
guardado no puede duplicar nada (revisado en `me.service.js` y en los repositorios):

- **Gustos:** `user_preferences` tiene `user_id` como clave primaria y `upsertPreferences` hace `upsert` con
  `onConflict: 'user_id'`: siempre queda una sola fila por usuario, con las respuestas de la última petición (son las
  mismas en las dos).
- **Perfil:** `completeOnboarding` del repositorio hace `update … where onboarding_completed_at is null`. La primera
  petición que llega fija rol y fecha; la segunda no encuentra la fila (devuelve `null`), lee el perfil actual y responde
  con él si el rol coincide (409 si no). Si la segunda llega cuando la primera ya terminó, entra por la rama de
  "onboarding ya completo": solo reescribe los gustos. En ningún caso hay dos `onboarding_completed_at` distintos.
- **Pruebas:** ya cubrían el upsert por `user_id` (`onboarding.repository.test.js`), el filtro `is null` y las dos
  carreras (`me.service.test.js`). Se agregó la del reenvío con el onboarding ya completo: no llama a
  `completeOnboarding` ni a `updateProfile`, solo al upsert de gustos.

## Pendiente

- **Lighthouse:** no se corrió. No está instalado y no está en la lista de herramientas de `CLAUDE.md` §2; hay que
  correrlo desde Chrome DevTools en `/login` y `/descubre` y compararlo con P6.
- **Celular real a 390 px:** confirmar que la animación no se ve entrecortada (en Edge emulado va fluida).
- `docs/PLAN.md` §checklist: marcar P7 cuando se pruebe en el celular.

## Rendimiento de Descubre (rama `feature/perf-descubre`, sale de `feature/profe-7`)

Lighthouse móvil del usuario (build de producción, incógnito) **antes**: `/login` 92 / 100 / 100 / 91. `/descubre`:
Performance **69**, CLS **0,259**, LCP **4,4 s** (FCP 2,3 s, TBT 10 ms, SI 3,1 s). El LCP era la portada de la primera
tarjeta de "Para ti". Meta: CLS < 0,1, LCP < 2,5 s, Performance ≥ 80.

### Cómo se midió aquí

Lighthouse no está instalado. Se usó Edge sin ventana con el build de producción (`vite preview` en otro puerto, para no
pisar el `dist` del usuario), a 390×844, CPU 4× más lenta, 150 ms de latencia y 1,6 Mbps (parecido al perfil móvil de
Lighthouse), con `PerformanceObserver` de `layout-shift` (con sus `sources`) y `largest-contentful-paint`, más los
tiempos de cada petición. Ninguna cuenta de prueba con contraseña tiene recomendaciones ("Polas y fútbol" es de la
categoría "Otro"), así que "Para ti" se simuló interceptando `GET /events/recommended` y respondiendo con los dos eventos
próximos reales, 900 ms después.

### CLS: qué se movía

| Elemento | Antes | Ahora |
|---|---|---|
| Bloque de skeletons de la lista (`div.grid`) | bajó de y = 357 a y = 806 al llegar "Para ti": **0,2725** | 0 |
| Loader de P7 (`FullScreenLoader`, al entrar) | 0,0005 (subpíxel de `animate-enter`) | 0–0,002 |
| Banner "Aquí verás en vivo…", chip "Ver eventos cerca de mí", ícono por categoría de P7 | 0 | 0 |
| **Total** | **0,273** (Lighthouse: 0,259) | **0,000–0,002** en 6 corridas |

Causa: "Para ti" se pedía y pintaba por su cuenta. Si llegaba después que la lista, se insertaba encima y empujaba todo.

- **Descubre espera las dos respuestas** cuando puede haber "Para ti" (sin categoría, búsqueda ni mapa). Mientras tanto
  pinta un skeleton que incluye la fila de "Para ti" (`ParaTiSkeleton`: título y tarjetas de 270/300 px). Al llegar
  todo, se reemplaza de una vez. Si "Para ti" viene vacío, su skeleton desaparece a la vez que llegan las tarjetas
  (son nodos nuevos, no se desplaza nada ya pintado). Con filtro o búsqueda, no se espera nada.
- **`EventCardSkeleton`** copia la estructura de la tarjeta (portada de 84/108 px, título, fecha, fin, lugar, avatares,
  cupo y botón). Medidas: a 390 px, 310 px de skeleton frente a 315 y 343 px de tarjetas reales (la altura real varía:
  línea de fin, insignias y avatares son opcionales). A 1440 px, 336 frente a 368. "Para ti" mide 335/361.
- **Portadas:** el `<img>` lleva `width`/`height` (1200×600) y el espacio lo reserva el **alto fijo del contenedor**
  (84 px móvil / 108 px escritorio, el del mockup), igual en la tarjeta y en el skeleton. No se cambió a `aspect-ratio`:
  con el ancho variable de la tarjeta (270 px en "Para ti", 346 px en la lista, ~300 px en la grilla) la portada cambiaría
  de alto respecto al mockup. El alto fijo reserva lo mismo y la imagen nunca mueve nada.
- El ícono animado por categoría de P7 va en posición absoluta dentro de la portada: no cambia tamaños al cargar la foto.

### LCP

Cadena antes (local, ms): `/me` 320 → 1457 · se monta Descubre · `/events` 1531 → 2784 · portada 2810 → 3890.
La lista solo se pedía después de `/me`, porque la página se monta cuando `ProtectedRoute` termina de validar la sesión.

- **Precarga al arrancar** (`lib/startup-prefetch.js`, llamado en `main.jsx`): si se entra directo a `/descubre` y hay
  una sesión guardada, se empieza a bajar el código de la página y se piden la lista y "Para ti" **en paralelo con
  `/me`**, con las mismas opciones y claves de caché que la página (`eventsQueryOptions`, `recommendedQueryOptions`,
  `descubreRequest`). Sin sesión no se pide nada (un 401 cerraría la sesión). No cambia qué se pide ni qué se muestra.
  Cadena después: `/events` 311 → 1549 en paralelo con `/me` 334 → 943 · portada 1585 → 2664.
- **Primera portada visible** (la de "Para ti" si hay, si no la primera de la lista): `fetchpriority="high"`, sin
  `loading="lazy"` y `decoding="async"`. El resto, `loading="lazy"`.
- **URL de la portada:** ya viene en la misma respuesta de la lista. `cover_url` guarda la URL **pública** del bucket y el
  backend la devuelve en cada evento. La URL firmada solo se usa para **subir**, no para ver. No hay una petición extra.
- **Preconexión** al origen de Supabase (`%VITE_SUPABASE_URL%` en `index.html`; una sin CORS para las imágenes y otra con
  CORS para Auth/Realtime).
- **Fuentes:** solo tenían `preconnect`. Se precargan Poppins 600 (título "Hola, …") e Inter (variable, texto), subconjunto
  latin, con las URL que hoy entrega Google Fonts (`v24`/`v20`). Si Google cambia de versión, la precarga deja de servir y
  el navegador baja la nueva como siempre (no se rompe nada).
- **Compresión al subir** (`lib/image.js`, ya existía desde P3 con un único tope de 1024 px): ahora por uso, portada
  ≤ 1200 px de ancho (y de alto, para que una foto vertical no pese de más), avatar ≤ 256 px, WebP calidad 0,8 con
  canvas. Safari en iPhone no codifica WebP en canvas: ahí sigue cayendo a JPEG con la misma calidad.

**Medición local después** (3 corridas sin la espera artificial de "Para ti"): LCP **2,9–3,0 s** (antes 3,6–4,5 s), CLS 0.
El resto del LCP es la descarga de la portada (~1,1 s): es un **JPEG de 99 KB** y compite con un avatar JPEG de 85 KB.
Eso se resolvió con el reprocesado de abajo (la portada pasó a 27,6 KB y el avatar a 3,3 KB). El backend también pesa: `/me` y `/events` tardan 0,6–1,3 s cada uno y en dos
corridas `/me` llegó a 3,5 s (varias consultas seguidas a Supabase). No se tocó (es lógica del backend).

### Imágenes que ya estaban en Storage: reprocesadas (2026-10-22)

Script `backend/scripts/reprocess-images.js` (`npm run images:reprocess -w backend`), aprobado por el usuario:
- Convierte con el mismo canvas que la app, en un Edge sin ventana controlado con el WebSocket de Node 22 (sin librerías:
  Node no decodifica imágenes).
- Por defecto solo muestra el plan. `--apply` escribe y `--delete-old` borraría los originales. **No se usó
  `--delete-old`:** los originales se conservan hasta después del 31 de octubre.
- Sube el WebP con un nombre nuevo en la misma carpeta y cambia solo `events.cover_url` / `profiles.avatar_url` en las
  filas que usaban el archivo viejo. Al actualizar esas tablas solo corren los disparadores de `updated_at`: no hay
  avisos ni correos.
- El bucket de portadas se llama `event-covers` (el script no acepta `covers`).

Se corrió primero el plan de los dos buckets: tocaba solo estas 4 imágenes y una fila por imagen. Después, `--apply`:

| Bucket | Fila | Antes | Después | Archivo nuevo |
|---|---|---|---|---|
| event-covers | evento "Polas y fútbol" | JPEG 828×817 · **96,9 KB** | WebP 828×817 · **27,6 KB** | `05195682…/64eab873….webp` |
| event-covers | evento "prueba santiago" | WebP 495×619 · **30,0 KB** | WebP 495×619 · **27,1 KB** | `52e9b658…/74883851….webp` |
| avatars | perfil de Santiago Duque Gallego | JPEG 768×1024 · **193,5 KB** | WebP 192×256 · **8,5 KB** | `05195682…/b16bd24e….webp` |
| avatars | perfil de Felipe Jaramillo Vélez | JPEG 576×1024 · **83,2 KB** | WebP 144×256 · **3,3 KB** | `c568c035…/93ae8ba4….webp` |

Ahorro: 72,2 KB en portadas y 265,0 KB en avatares. Las portadas no cambian de tamaño porque ya medían menos de 1200 px.

**Verificación:**
- **Base:** las 2 filas de `events` con portada y las 2 de `profiles` con foto apuntan a los WebP nuevos, y cada URL
  responde 200 `image/webp` con el peso de la tabla. Los 4 originales siguen en Storage y responden 200.
- **App** (Edge, 390 px, `jugador1@becore.test`):
  - en Descubre carga la portada nueva de "Polas y fútbol" (con `fetchpriority="high"`) y el avatar nuevo de Felipe en
    "quiénes van";
  - en el detalle del evento cargan la portada nueva y el avatar nuevo de Santiago;
  - sin errores en la consola.
- **Perfil:** no se pudo abrir el Perfil de esas dos cuentas (no se tienen sus contraseñas). Los mismos archivos cargan
  en la tarjeta y en el detalle; falta que cada dueño entre a su Perfil y confirme que ve su foto.
- **Para volver atrás:** las URL anteriores quedaron anotadas. Basta con volver a escribirlas en esas 4 filas.

### Pendiente: latencia del backend

No se tocó en esta rama, por decisión del usuario. En las mediciones locales `GET /me` y `GET /events` tardan 0,6–1,3 s
cada uno, y en algunas corridas `/me` llegó a 3,5 s y `/events` a 8 s. Las dos hacen varias consultas seguidas a
Supabase (sesión, perfil, gustos; eventos, asistencia y avatares de confirmados). Después de la precarga, es lo que más
pesa en el LCP de Descubre junto con la descarga de la portada. Revisar después del congelamiento: juntar consultas,
pedirlas en paralelo o cachear el perfil.

### Después (Lighthouse del usuario)

| Página | Performance | CLS | LCP | FCP | TBT | SI |
|---|---|---|---|---|---|---|
| `/descubre` antes | 69 | 0,259 | 4,4 s | 2,3 s | 10 ms | 3,1 s |
| `/descubre` después | _pendiente_ | | | | | |
| `/login` antes | 92 / 100 / 100 / 91 | | | | | |
| `/login` después | _pendiente_ | | | | | |

Verificación: `npm run lint` sin errores · `npm test` backend 322/322, frontend 313/313 (nuevas: `startup-prefetch.test.js`,
presets de `image.test.js`) · el build compila sin avisos; la entrada pasa de 174,6 a 177,7 kB (57,7 gz) por la precarga.
