import { env } from '../config/env.js';

// Diseño único de los correos de Be Core (P5): el mismo que usan las plantillas de Supabase (supabase/templates/).
// HTML de correo compatible con Gmail, Outlook y Apple Mail: tablas, estilos en línea, ancho máx. 600 px,
// sin JS, sin SVG y sin fuentes externas (Poppins/Inter con respaldo Arial). Cabecera azul profundo y cuerpo
// claro, para que se lea bien también en clientes que alteran el modo oscuro.

export const BRAND = {
  navy: '#0D1B2A',
  accent: '#14B8A6',
  onAccent: '#04241F',
  text: '#0D1B2A',
  muted: '#475569',
  page: '#F1F5F9',
  card: '#FFFFFF',
  font: "Poppins, Inter, Arial, Helvetica, sans-serif",
};

// Logo en PNG en el bucket público "brand" de Supabase Storage (los clientes de correo no cargan SVG)
export const logoUrl = () => `${env.SUPABASE_URL.replace(/\/+$/, '')}/storage/v1/object/public/brand/logo.png`;

export const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function ctaButton({ label, url }) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0"><tr><td bgcolor="${BRAND.accent}" style="border-radius:10px"><a href="${escapeHtml(url)}" style="display:inline-block;padding:13px 22px;font-family:${BRAND.font};font-size:15px;font-weight:bold;color:${BRAND.onAccent};text-decoration:none;border-radius:10px">${escapeHtml(label)}</a></td></tr></table>`;
}

// renderEmail({ title, preheader, bodyHtml, cta? }) → HTML completo.
// bodyHtml debe venir ya escapado por quien llama (suele armarse con paragraph()).
export function renderEmail({ title, preheader = '', bodyHtml, cta }) {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.page}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;color:${BRAND.page}">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.page}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:${BRAND.card};border-radius:14px;overflow:hidden">
<tr><td bgcolor="${BRAND.navy}" style="padding:18px 24px"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="padding-right:12px"><img src="${escapeHtml(logoUrl())}" width="40" height="40" alt="Be Core" style="display:block;border-radius:10px;border:0"></td>
<td style="font-family:${BRAND.font};font-size:20px;font-weight:bold;color:${BRAND.accent}">Be Core<br><span style="font-size:12px;font-weight:normal;color:#CBD5E1">Tu comunidad en movimiento</span></td>
</tr></table></td></tr>
<tr><td style="padding:28px 24px 8px;font-family:${BRAND.font}">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${BRAND.text}">${escapeHtml(title)}</h1>
${bodyHtml}${cta ? ctaButton(cta) : ''}
</td></tr>
<tr><td style="padding:20px 24px 26px;font-family:${BRAND.font};font-size:12px;line-height:1.5;color:${BRAND.muted}">
<hr style="border:0;border-top:1px solid #E2E8F0;margin:0 0 14px">
Si no fuiste tú, ignora este correo.<br>Proyecto de grado · Universidad Católica Luis Amigó
</td></tr>
</table></td></tr></table></body></html>`;
}

// Párrafo del cuerpo ya escapado
export const paragraph = (text) =>
  `<p style="margin:0 0 12px;font-family:${BRAND.font};font-size:16px;line-height:1.55;color:${BRAND.text}">${escapeHtml(text)}</p>`;
