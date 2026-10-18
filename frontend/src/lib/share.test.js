import { describe, expect, it } from 'vitest';
import { isLocalHost, shareWarning } from './share.js';

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
