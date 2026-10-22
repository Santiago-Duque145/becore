import { describe, it, expect } from 'vitest';
import { MAX_ZOOM, centered, clampState, cropRect, initialState, keyAction, moveBy, resizeFrame, scaleOf, zoomTo } from './crop.js';

// Foto horizontal 3000×2000 en un marco 2:1 de 400×200
const image = { iw: 3000, ih: 2000 };
const frame = { fw: 400, fh: 200 };
const start = initialState(image, frame);

describe('editor de encuadre: geometría', () => {
  it('al empezar la imagen cubre el marco, centrada, y el recorte es el centro 2:1 más grande posible', () => {
    expect(scaleOf(start)).toBeCloseTo(400 / 3000);
    expect(cropRect(start)).toEqual({ x: 0, y: 250, width: 3000, height: 1500 });
  });

  it('nunca deja huecos: el desplazamiento se limita al sobrante', () => {
    const moved = moveBy(start, 500, 500);
    expect(moved.x).toBe(0); // a zoom 1 el ancho calza justo: no hay sobrante horizontal
    expect(moved.y).toBeCloseTo((2000 * (400 / 3000) - 200) / 2);
    expect(cropRect(moved).y).toBeCloseTo(0);
  });

  it('el zoom se queda entre 1 y 4 y mantiene fijo el punto del cursor', () => {
    expect(zoomTo(start, 10).zoom).toBe(MAX_ZOOM);
    expect(zoomTo(start, 0.2).zoom).toBe(1);
    const z = zoomTo(start, 2, 100, 0); // acercar hacia la derecha del marco
    const before = 1500 + (100 - start.x) / scaleOf(start); // px de imagen bajo el cursor
    const after = 1500 + (100 - z.x) / scaleOf(z);
    expect(after).toBeCloseTo(before);
    expect(cropRect(z).width).toBeCloseTo(1500);
  });

  it('el recorte siempre tiene la proporción del marco y queda dentro de la imagen', () => {
    for (const s of [zoomTo(start, 2.7, -150, 60), moveBy(zoomTo(start, 3), -999, 999)]) {
      const r = cropRect(s);
      expect(r.width / r.height).toBeCloseTo(2);
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.width).toBeLessThanOrEqual(3000 + 1e-6);
      expect(r.y + r.height).toBeLessThanOrEqual(2000 + 1e-6);
    }
  });

  it('teclado: flechas mueven (Shift ×4), +/− zoom, 0 centra; otras teclas no son del editor', () => {
    const z = zoomTo(start, 2);
    expect(keyAction(z, 'ArrowRight').x).toBe(z.x + 10);
    expect(keyAction(z, 'ArrowUp', true).y).toBe(z.y - 40);
    expect(keyAction(z, '+').zoom).toBeCloseTo(2.1);
    expect(keyAction(z, '-').zoom).toBeCloseTo(1.9);
    expect(keyAction(moveBy(z, 30, 30), '0')).toEqual(centered(z));
    expect(keyAction(z, 'a')).toBeNull();
  });

  it('marco circular (cuadrado) con foto vertical y cambio de tamaño del marco', () => {
    const avatar = initialState({ iw: 1000, ih: 1500 }, { fw: 280, fh: 280 });
    const r = cropRect(avatar);
    for (const [key, value] of Object.entries({ x: 0, y: 250, width: 1000, height: 1000 })) expect(r[key]).toBeCloseTo(value);
    const resized = resizeFrame(moveBy(avatar, 0, 50), { fw: 200, fh: 200 });
    expect(cropRect(resized).y).toBeCloseTo(cropRect(moveBy(avatar, 0, 50)).y);
    expect(clampState({ ...avatar, zoom: 0 }).zoom).toBe(1);
  });
});
