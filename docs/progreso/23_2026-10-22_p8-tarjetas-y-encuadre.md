# 23 · P8 Tarjetas más llamativas y encuadre de imágenes

Fecha: 2026-10-22 · Rama: `feature/p8-tarjetas-encuadre` (sale de `main`) · PR a `main` · Estado: **terminado. Sin
migración ni dependencias nuevas.**

## 1. Mensajes en las tarjetas

### Razón de "Para ti" como insignia

- La razón pasa de una línea de texto a una insignia arriba del título (`ReasonBadge`):
  - turquesa translúcido sobre el panel, con borde degradado sutil (turquesa → `accent-soft`) y texto en negrita;
  - **contraste medido en Edge: 8,97:1** (AA pide 4,5).
- **Ícono:** destello si la frase viene de la variante "ai" (Gemini o su plantilla), check si viene de reglas.
  - `GET /events/recommended` agrega `reasonKind: 'spark' | 'check'`; solo cambia el ícono.
  - La pantalla nunca dice "IA", "Gemini" ni el nombre de la variante (hay una prueba de render que lo comprueba).
  - `jugador1` está en la variante "rules", así que la captura del destello (`p8-para-ti-destello-390.png`) se hizo
    cambiando `reasonKind` en la respuesta dentro del navegador.

### Un mensaje de estado por tarjeta

`lib/card-highlight.js` (pura), con esta prioridad:
1. "Es hoy" / "Es mañana", en hora de Bogotá.
2. "¡Quedan N cupos!" si quedan ≤ 20 % y ≤ 5 (y "¡Queda 1 cupo!" en singular).
3. "Se está llenando" desde el 70 %.
4. "Nuevo" si se creó hace < 48 h.

- **Colores:** naranja para lo urgente y amarillo para "Nuevo". El contraste del mensaje medido fue 7,72:1.
- **Solo datos reales:** nada si el evento está lleno, empezó, está cancelado o es borrador (eso ya lo dicen las
  insignias de estado), y nada de cupos si ya confirmé.
- **"Nuevo" usa `createdAt`:** no existe `published_at`. Un borrador viejo publicado hoy no sale como nuevo: falla
  hacia no mostrar.
- **Dónde aparece:**
  - tarjetas de Descubre y Para ti;
  - ficha del pin y lista del mapa;
  - Mis eventos, solo "Es hoy" / "Es mañana".
- **Hoy casi todas las tarjetas dicen "Nuevo":** los 10 eventos de demo se crearon el 22 oct. Es real y se apaga solo a
  las 48 h. Ejemplo de urgencia real: "Polas y fútbol" muestra "Es hoy".
- **Microinteracción:** insignia y mensaje entran con opacidad y escala (0,92 → 1, 220 ms), una sola vez, apagado con
  movimiento reducido.

### Frases más vivas (máx. 60 caracteres)

`recommendations/phrases.js` arma la frase con lo que coincidió. La usan la plantilla de "ai" y las reglas; el puntaje y
el orden no cambian.

| Antes | Ahora |
|---|---|
| Porque te gusta el fútbol y es un sábado en la tarde | Fútbol el sábado en la tarde, como te gusta |
| Porque te gusta el deporte | Deporte, de lo que más te gusta |
| Encaja con tus noches | En la noche, justo en tu horario |
| Encaja con tus fines de semana | El sábado, justo en tu horario |
| Es en tu zona | Queda en tu zona |

- **Reglas:** ahora juntan todo lo que coincidió ("Recreación el domingo en la mañana, como te gusta"), no solo la señal
  más fuerte.
- **Prompt de Gemini:**
  - cada evento lleva el día de la semana ("sábado, tarde");
  - pide frases cercanas con ejemplos concretos y prohíbe exagerar o prometer ("te va a encantar", "imperdible",
    cupos, precios);
  - una frase de más de 60 caracteres ya no tumba la respuesta entera: ese evento conserva el orden de Gemini y usa
    la frase de la plantilla.
- Una prueba recorre todas las combinaciones (18 gustos y 3 categorías × días × franjas × zona): **la más larga cabe
  en 60** y ninguna menciona IA.
- **Para el análisis A/B:** las frases cambiaron a la vez en las dos variantes y el orden no cambió. El CTR se puede
  comparar antes y después de este despliegue.

## 2. Encuadre de portadas y avatares

- **Sin librería:** se evaluó react-easy-crop 6.2.4 (MIT, compatible con React 18, ~10 KB gzip), pero no trae zoom con
  +/− ni textos en español. Se hizo propio con pointer events. La geometría es pura (`lib/crop.js`) y tiene pruebas.
- **`ImageCropper`:**
  - arrastrar con mouse o dedo, pellizcar con dos dedos, rueda (hacia el cursor), slider "Zoom" y "Centrar";
  - teclado: flechas mueven (Shift ×4), + y − acercan, 0 centra;
  - `role="application"` con instrucciones y el zoom anunciado con `aria-live`;
  - la imagen nunca deja huecos;
  - un arrastre que termina fuera del panel no cierra el editor.
- **Portada:**
  - marco 2:1 (1200 × 600, el tamaño que declara la tarjeta) con la **franja que se ve en la tarjeta** marcada;
  - debajo, vistas previas en vivo de la tarjeta y del detalle en el celular;
  - no hay una sola proporción real: la tarjeta va de ~4:1 a 390 px a ~3:1 en escritorio, y el detalle de ~1,7:1 a
    ~3,5:1;
  - botones "Usar esta imagen", "Cambiar imagen" y "Cancelar";
  - el recorte se hace en canvas: WebP 0,8, o JPEG si el navegador no codifica WebP (Safari).
- **Volver a encuadrar sin perder calidad, y sin migración:**
  - al guardar se sube también el original (≤ 2400 px, WebP 0,85) al lado de la portada: `abc.webp` →
    `abc-original.webp`;
  - `POST /events/cover-upload-url` acepta `withOriginal` y devuelve una segunda URL firmada en la carpeta del
    organizador;
  - al editar, "Encuadrar" abre ese original;
  - si no existe (portadas de antes de P8), encuadra la portada actual con el aviso "Esta imagen se subió antes del
    editor: se puede mover, pero con menos calidad";
  - **no se guarda la posición anterior** (no hay columna sin migración): el editor abre centrado;
  - los originales de portadas reemplazadas quedan en Storage, igual que las portadas reemplazadas hoy.
- **Avatar:** el mismo editor con marco redondo, salida de 256 px y vista previa a los tamaños reales. No se guarda
  original: para cambiar el encuadre se sube otra foto.

## Verificación

| Qué | Resultado |
|---|---|
| `npm run lint` | sin errores |
| `npm test` | backend 480/480, frontend 350/350 |
| `npm run build -w frontend` | compila |

**En Edge** (mis servidores en 3001 y 5180), a 390 y 1440 px:

- **Descubre (`jugador1`):**
  - insignias con check y frases nuevas ("Deporte el sábado, como te gusta");
  - un mensaje por tarjeta;
  - sin scroll horizontal y sin errores en consola.
- **Mapa:** la ficha del pin muestra "Es hoy"; la lista bajo el mapa, 11 mensajes.
- **Mis eventos:** sin mensaje cuando el evento no es hoy ni mañana.
- **Editor de portada (`santiago`)** con una imagen de prueba de 1600 × 1000 hecha en el navegador:

  | Acción | Resultado |
  |---|---|
  | arrastre | se limitó al sobrante vertical (−21 px) |
  | rueda (3 pasos) | zoom 1,33 hacia el cursor |
  | flechas | mueven 10 px cada una |
  | + / − | 1,43 / 1,33 |
  | pellizco con dos dedos | zoom 4,00 (el máximo) |
  | "Centrar" | zoom 1 en el centro |

  - Un arrastre que termina fuera del panel deja el editor abierto.
  - "Usar esta imagen" deja la vista previa en el formulario.
- **Guardado y reencuadre:** se guardó como borrador. "Encuadrar" al editar abrió el original (`…-original.webp`,
  1600 × 1000, sin aviso).
- **Respaldo:** después de borrar el original, "Encuadrar" abrió la portada con el aviso de menos calidad.
- **Avatar (`jugador1`):** + + + ↓ ↓ con el teclado (zoom 130 %, anunciado), vista previa a 52 y 34 px, y subida
  real. Después se volvió al avatar "Corredora" que tenía.
- **Limpieza:** se borraron el borrador de prueba, su portada y su original, y la foto de avatar subida. La carpeta de
  portadas del organizador quedó vacía.
- **"Mostrados" de esta verificación:** "Para ti" de `jugador1` solo mostró eventos de demo. Esos no cuentan en las
  métricas y se borran con `--remove`.
- **Capturas** en `capturas-23/`:
  - tarjetas: `p8-descubre-*`, `p8-para-ti-destello-390`, `p8-mapa-*`, `p8-mis-eventos-390`;
  - portada: `p8-portada-*`;
  - avatar: `p8-avatar-*`.

**Pruebas nuevas:**
- **Backend:**
  - `recommendations.phrases.test.js`;
  - frases y `reasonKind` en `recommendations.{score,ai,service,routes}.test.js`;
  - frase larga de Gemini → plantilla;
  - `withOriginal` en `uploads.test.js`.
- **Frontend:**
  - `card-highlight.test.js`: prioridad, umbrales, medianoche en Bogotá, "Queda 1 cupo", ya confirmado y Mis eventos;
  - `crop.test.js`: cubre siempre, límites, zoom al punto, proporción, teclado y cambio de tamaño del marco;
  - `image.test.js`: tamaños de salida, original y URL del original;
  - `ReasonBadge.test.jsx`.

## Diferencias con el mockup y pendientes

- **Insignia y mensajes:** los mockups solo traen "Casi lleno" en escritorio. La insignia y los mensajes son nuevos y
  siguen los tokens de la skill.
- **Vista previa de la portada en el formulario:** ahora es 2:1 (antes 144 px de alto fijo) para mostrar el recorte
  real.
- **Cambio de tamaño de pantalla:** si se cruza de diseño móvil a escritorio con el editor abierto (por ejemplo, al
  girar una tablet), la app vuelve a montar el formulario y el editor se cierra. Pasa con todo el formulario desde
  antes de P8; no se cambió.
