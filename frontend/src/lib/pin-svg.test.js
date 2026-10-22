import { describe, it, expect } from 'vitest';
import { PIN_PATH, PIN_SIZE, PIN_STROKE, pinSvg } from './pin-svg.js';

describe('pin SVG', () => {
  it('es la gota del mockup (.mt-pin), con el path tal cual', async () => {
    expect(PIN_PATH).toBe('M17 0C7.6 0 0 7.6 0 17c0 12.7 17 27 17 27s17-14.3 17-27C34 7.6 26.4 0 17 0z');
    const { readFile } = await import('node:fs/promises');
    const mockup = await readFile(new URL('../../../docs/mockups/desktop-panel-organizador.html', import.meta.url), 'utf8');
    expect(mockup).toContain(PIN_PATH);
  });

  it('lleva el color de su categoría: los mismos que las insignias de las tarjetas', () => {
    expect(pinSvg('sport')).toContain('fill="var(--color-accent)"'); // turquesa
    expect(pinSvg('culture')).toContain('fill="var(--color-culture)"'); // amarillo
    expect(pinSvg('recreation')).toContain('fill="var(--color-success)"'); // verde
    expect(pinSvg('other')).toContain('fill="var(--color-ink-muted)"'); // #94A3B8
    expect(pinSvg('lo-que-sea')).toContain('fill="var(--color-ink-muted)"');
  });

  it('tiene un borde oscuro sutil y es decorativo (el nombre accesible lo pone el marcador)', () => {
    const svg = pinSvg('sport');
    expect(svg).toContain(`stroke="${PIN_STROKE}"`);
    expect(svg).toContain('aria-hidden="true"');
  });

  it('el seleccionado es más grande y con borde claro', () => {
    expect(PIN_SIZE.selected[0]).toBeGreaterThan(PIN_SIZE.normal[0]);
    expect(pinSvg('sport', true)).toContain('stroke="var(--color-ink)"');
    expect(pinSvg('sport', true)).toContain('data-selected="true"');
  });
});
