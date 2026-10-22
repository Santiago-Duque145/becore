import { describe, it, expect } from 'vitest';
import { cropOutputSize, fitWithin, IMAGE_PRESETS, MAX_ORIGINAL_BYTES, originalUrlFor, validateImageFile, WEBP_QUALITY } from './image.js';

describe('validateImageFile', () => {
  it('rechaza lo que no es imagen', () => {
    expect(validateImageFile({ type: 'application/pdf', size: 100 })).toMatch(/imagen/);
    expect(validateImageFile({ type: '', size: 100 })).toMatch(/imagen/);
    expect(validateImageFile(null)).toBeTruthy();
  });

  it('rechaza originales de más de 8 MB', () => {
    expect(validateImageFile({ type: 'image/png', size: MAX_ORIGINAL_BYTES + 1 })).toMatch(/8 MB/);
  });

  it('acepta una imagen normal', () => {
    expect(validateImageFile({ type: 'image/jpeg', size: 2_000_000 })).toBeNull();
  });
});

describe('fitWithin', () => {
  const { cover, avatar } = IMAGE_PRESETS;

  it('portada: máximo 1200 px de ancho, manteniendo la proporción', () => {
    expect(fitWithin(4000, 2000, cover)).toEqual({ width: 1200, height: 600 });
    expect(fitWithin(1920, 1080, cover)).toEqual({ width: 1200, height: 675 });
  });

  it('portada vertical: el alto tampoco pasa de 1200 px', () => {
    expect(fitWithin(1500, 3000, cover)).toEqual({ width: 600, height: 1200 });
  });

  it('avatar: máximo 256 px de lado', () => {
    expect(fitWithin(1024, 1024, avatar)).toEqual({ width: 256, height: 256 });
    expect(fitWithin(3000, 2000, avatar)).toEqual({ width: 256, height: 171 });
  });

  it('no agranda las pequeñas', () => {
    expect(fitWithin(300, 200, cover)).toEqual({ width: 300, height: 200 });
    expect(fitWithin(120, 120, avatar)).toEqual({ width: 120, height: 120 });
  });

  it('WebP con calidad 0,8', () => expect(WEBP_QUALITY).toBe(0.8));
});

describe('encuadre (P8)', () => {
  it('portada 2:1 a máximo 1200 × 600 y avatar a 256, sin agrandar recortes pequeños', () => {
    expect(cropOutputSize({ width: 3000, height: 1500 }, 'cover')).toEqual({ width: 1200, height: 600 });
    expect(cropOutputSize({ width: 800, height: 400 }, 'cover')).toEqual({ width: 800, height: 400 });
    expect(cropOutputSize({ width: 1000, height: 1000 }, 'avatar')).toEqual({ width: 256, height: 256 });
    expect(cropOutputSize({ width: 120, height: 120 }, 'avatar')).toEqual({ width: 120, height: 120 });
  });

  it('el original se guarda a ≤ 2400 px con calidad 0,85', () => {
    expect(fitWithin(6000, 4000, IMAGE_PRESETS.original)).toEqual({ width: 2400, height: 1600 });
    expect(IMAGE_PRESETS.original.quality).toBe(0.85);
  });

  it('la URL del original sale de la de la portada', () => {
    expect(originalUrlFor('https://x.supabase.co/storage/v1/object/public/event-covers/u/abc.webp')).toBe(
      'https://x.supabase.co/storage/v1/object/public/event-covers/u/abc-original.webp',
    );
    expect(originalUrlFor('https://x/u/abc.jpg?v=2')).toBe('https://x/u/abc-original.jpg');
    expect(originalUrlFor(null)).toBeNull();
  });
});
