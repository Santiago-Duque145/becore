# 13 · P5 Correos con la marca y verificación por código

Fecha: 2026-10-18 · Rama: `feature/profe-5` (sale de `feature/avatar-preview`) · Estado: **código, plantillas y logo
listos; faltan los ajustes manuales en el dashboard de Supabase y la prueba real con correos de Gmail y
Outlook** (ver "Pendiente").

## Qué se hizo

**Plantillas de Supabase** (`supabase/templates/`, se pegan a mano; pasos en `docs/specs/correos.md`):
`confirm-signup.html`, `reset-password.html` y `email-change.html`. HTML de correo con tablas y estilos en línea
(ancho máx. 600 px, sin JS, SVG ni fuentes externas; Poppins/Inter con respaldo Arial), cabecera `#0D1B2A` con el
logo, cuerpo claro, código `{{ .Token }}` grande, centrado y monoespaciado sobre turquesa suave, "Vence en 10
minutos", saludo con `{{ .Data.full_name }}` o "¡Hola!", y el pie pedido. Texto plano y asunto sugerido en un
comentario al inicio (sin llaves de plantilla, para que Supabase no las procese). **No usan `{{ .ConfirmationURL }}`**:
una prueba lo vigila.

**Logo:** bucket público `brand` (migración `20261022140000_brand_bucket.sql`, aplicada) con el PNG subido por CLI.
URL final, verificada con `200 image/png`:
`https://netomeswlgsahvgqowdq.supabase.co/storage/v1/object/public/brand/logo.png`

**Correos del backend:** `backend/src/mail/layout.js` con `renderEmail({ title, preheader, bodyHtml, cta? })`. Los
siete correos de `templates.js` (recordatorio, cambios, cancelación, citas, solicitud de calificación) usan ese
mismo diseño y siempre llevan versión de texto plano. El botón apunta a `APP_URL` (o `FRONTEND_URL`).
Desviación del prompt: el archivo está en `mail/` y no en `services/email/`, para respetar la estructura de
`backend/CLAUDE.md`.

**Frontend:**
- `OtpInput`: 6 casillas de un dígito (`inputMode="numeric"`, `autoComplete="one-time-code"`), pegar el código
  completo o el autocompletado del celular funciona, avance y retroceso automáticos, flechas, un único nombre de
  grupo "Código de verificación" y un `aria-label` por dígito.
- `/verificar?email=…`: tras el registro sin sesión. Verifica con `supabase.auth.verifyOtp({ type: 'email' })`; si el
  servidor solo aceptara el tipo histórico `signup`, reintenta una vez con ese. "Reenviar código" con cuenta
  regresiva de 60 s (`auth.resend({ type: 'signup' })`) y errores humanos (código incorrecto o vencido, demasiados
  intentos, correos de más, sin conexión). Al verificar va a `/bienvenida`.
- `/recuperar` en un solo flujo: correo → código (`type: 'recovery'`) → contraseña nueva → ya dentro de la app con
  aviso. `/nueva-contrasena` quedó como redirección a `/recuperar`.
- Login con una cuenta sin confirmar: "Tu cuenta aún no está confirmada" con el botón "Enviarme un código", que
  reenvía el código y lleva a `/verificar`.
- Google no cambia. Se eliminaron `ConfirmEmailNotice` y `NuevaContrasenaPage` (reemplazadas).

## Verificación

| Qué | Resultado |
|---|---|
| `npm run lint` | sin errores |
| `npm test` | backend 283/283, frontend 234/234 |
| `npm run build -w frontend` | compila |
| Layout de correo (marca, tablas, sin scripts/SVG/fuentes externas, escapes, preheader) y los 7 correos | `mail-layout.test.js` |
| Plantillas de Supabase: un solo `{{ .Token }}`, sin `ConfirmationURL`, saludo, logo, asunto | `mail-layout.test.js` |
| Escribir, pegar (completo, con espacios o guiones, autocompletado), retroceso, flechas, cuenta regresiva | `lib/otp.test.js` |
| Marcado accesible del campo de código | `OtpInput.test.jsx` |
| Flujos con Supabase simulado: tipo `email`, reintento `signup`, código malo/vencido, rate limit, red, reenvío, recuperación | `services/auth-otp.test.js` |

## Pendiente (a mano)

1. **Dashboard de Supabase** (no se puede hacer desde el código): Authentication → Sign In / Providers → Email:
   *Confirm email* activado, *Email OTP Length* = 6, *Email OTP Expiration* = 600 s; Rate Limits: correos por hora
   ≥ 30. Sin esto el correo sigue llegando con enlace.
2. **Pegar las tres plantillas** y sus asuntos (Authentication → Emails → Templates). Sin esto, Supabase envía su
   plantilla genérica y el código no aparece.
3. **Prueba real:** registro con un correo de Gmail y otro de Outlook/Hotmail; revisar que llegue a la bandeja (no a
   spam), cómo se ve en el celular y que el código funcione. Guardar una captura de cada correo en `docs/progreso/`.
4. No pude probar `/verificar` ni la recuperación contra Supabase real: las pruebas usan un Supabase simulado. Queda
   por confirmar a mano que `type: 'email'` sirve para la confirmación (si no, entra el reintento con `signup`).

Plan B del partido: si los correos tardan, desactivar *Confirm email* en el dashboard; el código de la app soporta
ambos casos.
