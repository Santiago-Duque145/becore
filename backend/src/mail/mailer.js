import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const DEMO_DOMAIN = '@becore.test';
let transport = null;

// Un solo transporte; sin credenciales completas no se crea (el envío falla con SMTP_NOT_CONFIGURED)
function getTransport() {
  if (transport) return transport;
  if (!env.SMTP_USER || !env.SMTP_PASS || !env.MAIL_FROM) return null;
  transport = nodemailer.createTransport({
    host: env.SMTP_HOST ?? 'smtp.gmail.com',
    port: env.SMTP_PORT ?? 465,
    secure: true,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transport;
}

export async function sendMail({ to, subject, html, text }) {
  // Las direcciones de demo no existen: nunca se envía desde el Gmail del proyecto
  if (to.trim().toLowerCase().endsWith(DEMO_DOMAIN)) throw new Error('DEMO_ADDRESS_SKIPPED');
  const transporter = getTransport();
  if (!transporter) throw new Error('SMTP_NOT_CONFIGURED');
  await transporter.sendMail({ from: env.MAIL_FROM, to, subject, html, text });
}
