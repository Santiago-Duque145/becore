import { sendMail } from '../src/mail/mailer.js';
import { env } from '../src/config/env.js';

// Envía un correo de prueba al propio buzón del proyecto. Imprime solo "OK" o el mensaje de error.
try {
  if (!env.SMTP_USER) throw new Error('SMTP_NOT_CONFIGURED');
  await sendMail({
    to: env.SMTP_USER,
    subject: 'Prueba de correo – Be Core',
    html: '<p>Si lees esto, el correo de Be Core funciona.</p>',
    text: 'Si lees esto, el correo de Be Core funciona.',
  });
  console.info('OK');
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
