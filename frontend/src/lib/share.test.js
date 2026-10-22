import { describe, expect, it } from 'vitest';
import { eventUrl, isLocalHost, shareText, shareWarning, whatsappUrl } from './share.js';

describe('shareWarning', () => {
  it('avisa que el QR de localhost solo sirve en el portátil', () => {
    expect(isLocalHost('localhost')).toBe(true);
    expect(isLocalHost('127.0.0.1')).toBe(true);
    expect(isLocalHost('[::1]')).toBe(true);
    expect(shareWarning({ hostname: 'localhost', isSecure: true })).toBe('local');
  });

  it('avisa de las limitaciones por HTTP en la IP de la Wi-Fi', () => {
    expect(shareWarning({ hostname: '192.168.1.37', isSecure: false })).toBe('insecure');
  });

  it('no avisa nada con HTTPS real (modo demo)', () => {
    expect(shareWarning({ hostname: 'quiet-river.trycloudflare.com', isSecure: true })).toBeNull();
  });
});

describe('compartir evento', () => {
  const event = { id: 'e1', title: 'Partido 5v5', startsAt: '2026-10-31T20:00:00.000Z', location: 'Cancha norte' };

  it('el enlace usa el origen actual', () => expect(eventUrl(event, 'https://x.trycloudflare.com')).toBe('https://x.trycloudflare.com/eventos/e1'));

  it('el texto trae evento, fecha, lugar y enlace', () => {
    const text = shareText(event, 'https://x.test/eventos/e1');
    expect(text).toContain('¡Vamos a Partido 5v5!');
    expect(text).toContain('en Cancha norte. Confirma aquí: https://x.test/eventos/e1');
    expect(text).toContain('octubre');
  });

  it('WhatsApp recibe el texto codificado', () => {
    const url = whatsappUrl('Hola & chao');
    expect(url).toBe('https://wa.me/?text=Hola%20%26%20chao');
  });
});
