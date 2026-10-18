import { describe, it, expect } from 'vitest';
import { escapeHtml, logoUrl, paragraph, renderEmail } from '../src/mail/layout.js';
import { TEMPLATES } from '../src/mail/templates.js';

describe('renderEmail', () => {
  const html = renderEmail({
    title: 'Título <b>',
    preheader: 'Resumen',
    bodyHtml: paragraph('Hola & adiós'),
    cta: { label: 'Abrir', url: 'https://x.test/a?b=1&c=2' },
  });

  it('usa la identidad de la marca: cabecera azul profundo, logo PNG, botón turquesa y pie', () => {
    expect(html).toContain('#0D1B2A');
    expect(html).toContain('#14B8A6');
    expect(html).toContain(logoUrl());
    expect(logoUrl()).toMatch(/\/storage\/v1\/object\/public\/brand\/logo\.png$/);
    expect(html).toContain('Tu comunidad en movimiento');
    expect(html).toContain('Universidad Católica Luis Amigó');
    expect(html).toContain('Si no fuiste tú, ignora este correo.');
  });

  it('es HTML de correo: tablas, ancho máx. 600, sin scripts ni SVG ni fuentes externas', () => {
    expect(html).toContain('max-width:600px');
    expect(html).toContain('<table');
    expect(html).not.toMatch(/<script|<svg|@import|fonts\.googleapis|<link /i);
    expect(html).toContain('Arial');
  });

  it('escapa el título y la URL del botón', () => {
    expect(html).toContain('Título &lt;b&gt;');
    expect(html).toContain('href="https://x.test/a?b=1&amp;c=2"');
    expect(html).toContain('Hola &amp; adiós');
  });

  it('lleva el preheader oculto', () => expect(html).toMatch(/display:none[^>]*>Resumen</));
  it('escapeHtml cubre comillas', () => expect(escapeHtml(`"'`)).toBe('&quot;&#39;'));
});

describe('todos los correos del backend comparten el diseño y traen texto plano', () => {
  const event = { id: 'e1', title: 'Partido', startsAt: '2026-10-31T20:00:00.000Z', location: 'Cancha' };
  const appointment = { title: 'Reunión', startsAt: '2026-10-31T20:00:00.000Z', location: '', notes: '' };
  for (const [type, build] of Object.entries(TEMPLATES)) {
    it(type, () => {
      const out = build(type.startsWith('event') ? event : appointment);
      expect(out.html).toContain('Universidad Católica Luis Amigó');
      expect(out.html).toContain(logoUrl());
      expect(out.text).toContain('Proyecto de grado');
      expect(out.text).toContain('Si no fuiste tú');
    });
  }
});

describe('plantillas de Supabase (supabase/templates)', () => {
  const dir = new URL('../../supabase/templates/', import.meta.url);

  for (const file of ['confirm-signup.html', 'reset-password.html', 'email-change.html']) {
    it(`${file}: solo código, con la marca y sin enlace de confirmación`, async () => {
      const { readFile } = await import('node:fs/promises');
      const html = await readFile(new URL(file, dir), 'utf8');
      expect(html.match(/\{\{ \.Token \}\}/g)).toHaveLength(1); // solo en el cuerpo, no en el comentario
      expect(html).not.toContain('ConfirmationURL');
      expect(html).toContain('{{ if .Data.full_name }}');
      expect(html).toContain('Vence en 10 minutos');
      expect(html).toContain('/storage/v1/object/public/brand/logo.png');
      expect(html).toContain('Asunto sugerido:');
      expect(html).not.toMatch(/<script|<svg|@import|fonts\.googleapis/i);
    });
  }
});
