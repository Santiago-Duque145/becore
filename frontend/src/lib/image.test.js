import { describe, it, expect } from 'vitest';
import { fitWithin, MAX_ORIGINAL_BYTES, validateImageFile } from './image.js';

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
  it('reduce a 1024 px de lado manteniendo la proporción', () => {
    expect(fitWithin(4000, 2000)).toEqual({ width: 1024, height: 512 });
    expect(fitWithin(1500, 3000)).toEqual({ width: 512, height: 1024 });
  });

  it('no agranda las pequeñas', () => {
    expect(fitWithin(300, 200)).toEqual({ width: 300, height: 200 });
  });
});
