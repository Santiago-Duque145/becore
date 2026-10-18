# Correos de Be Core (P5)

Hay dos grupos de correos y los dos comparten la misma identidad (cabecera azul profundo `#0D1B2A` con el logo,
cuerpo claro, botón o código turquesa `#14B8A6`, pie "Proyecto de grado · Universidad Católica Luis Amigó").

| Grupo | Quién los envía | Dónde viven |
|---|---|---|
| Autenticación (confirmar cuenta, recuperar contraseña, cambiar correo) | Supabase Auth, por el SMTP configurado en el dashboard | `supabase/templates/*.html` (se pegan **a mano** en el dashboard) |
| Eventos y citas (recordatorios, cambios, cancelaciones, solicitud de calificación) | El backend con Nodemailer | `backend/src/mail/layout.js` y `templates.js` |

Todo es por **código de 6 dígitos**: ya no hay enlaces de confirmación ni de recuperación.

## 1. Antes de pegar las plantillas (a mano, en el dashboard)

Authentication → Sign In / Providers → **Email**:

- **Confirm email**: activado.
- **Email OTP Length**: 6.
- **Email OTP Expiration**: 600 segundos (10 minutos).

Authentication → **Rate Limits**: correos por hora ≥ 30.

> Si "Confirm email" queda desactivado, la app sigue funcionando: `signUp` devuelve sesión y se va directo a
> `/bienvenida`. Es el plan B del día del partido si los correos tardan.

## 2. Pegar cada plantilla

Authentication → **Emails** → **Templates**. Para cada una: abrir el archivo, copiar **todo** su contenido y
pegarlo en el editor "Message body" (el comentario del inicio puede quedarse; no se ve en el correo). Poner el
asunto en "Subject heading" y guardar.

| Plantilla del dashboard | Archivo | Asunto |
|---|---|---|
| Confirm sign up | `supabase/templates/confirm-signup.html` | Tu código para entrar a Be Core |
| Reset password | `supabase/templates/reset-password.html` | Tu código para cambiar la contraseña |
| Change email address | `supabase/templates/email-change.html` | Tu código para cambiar el correo de Be Core |

Las demás plantillas (Invite user, Magic link, Reauthentication) no se usan en Be Core.

## 3. Logo

Los clientes de correo no cargan SVG, así que el logo es un PNG público en Supabase Storage (bucket `brand`,
migración `20261022140000_brand_bucket.sql`):

`https://netomeswlgsahvgqowdq.supabase.co/storage/v1/object/public/brand/logo.png`

Para cambiarlo: subir otro PNG con el mismo nombre
(`npx supabase storage cp ruta/logo.png ss:///brand/logo.png --linked --experimental`). Las plantillas de
Supabase llevan la URL escrita; las del backend la arman con `SUPABASE_URL`.

## 4. Variables que usan las plantillas

- `{{ .Token }}`: el código de 6 dígitos.
- `{{ .Data.full_name }}`: el nombre que la persona escribió al registrarse. Si no existe (recuperación de una
  cuenta de Google, por ejemplo) el saludo cae a "¡Hola!".
- **No** se usa `{{ .ConfirmationURL }}`. Una prueba (`backend/tests/mail-layout.test.js`) falla si aparece.

## 5. Correos del backend

`renderEmail({ title, preheader, bodyHtml, cta? })` en `backend/src/mail/layout.js` arma el HTML; `templates.js`
lo usa para los siete tipos y siempre entrega también la versión de texto plano. El botón apunta a `APP_URL` (o
`FRONTEND_URL` si no está), que en la demo es el túnel HTTPS.

## 6. Cómo probar

1. Registrar una cuenta nueva con un correo de Gmail y otra con Outlook/Hotmail.
2. Comprobar que el correo llegue a la bandeja de entrada (no a spam), se vea bien en el celular y que el
   código funcione en `/verificar`.
3. Pedir "Olvidé mi contraseña" y completar el flujo con el código.
4. Guardar una captura de cada correo en `docs/progreso/`.
