import { describe, it, expect, vi } from 'vitest';
import {
  dialogKeyAction,
  firstName,
  restoreFocus,
  shouldCloseOnSwipe,
  SWIPE_CLOSE_PX,
  toPreviewPerson,
  zoomFrom,
} from './avatar-preview.js';

describe('toPreviewPerson (privacidad)', () => {
  it('solo conserva nombre de pila, rol y la imagen; descarta correo, apellidos e ids', () => {
    const person = toPreviewPerson({
      name: 'Ana María Gómez',
      role: 'organizer',
      src: 'https://cdn.test/a.webp',
      email: 'ana@correo.com',
      id: 'uuid-1',
      gender: 'female',
    });
    expect(person).toEqual({ firstName: 'Ana', roleLabel: 'Organizador', src: 'https://cdn.test/a.webp', preset: null, action: null });
    expect(JSON.stringify(person)).not.toMatch(/correo|Gómez|uuid|female/);
  });

  it('sin foto muestra el avatar predefinido; sin nada, las iniciales (sin src ni preset)', () => {
    expect(toPreviewPerson({ name: 'Luis', role: 'participant', preset: 'goleador' })).toMatchObject({ src: null, preset: 'goleador', roleLabel: 'Participante' });
    expect(toPreviewPerson({ name: 'Luis' })).toMatchObject({ src: null, preset: null, roleLabel: 'Participante' });
  });

  it('la foto manda sobre el avatar predefinido', () =>
    expect(toPreviewPerson({ name: 'Luis', src: 'a.webp', preset: 'goleador' })).toMatchObject({ src: 'a.webp', preset: null }));

  it('conserva solo etiqueta y acción del botón "Cambiar foto"', () => {
    const onClick = () => {};
    expect(toPreviewPerson({ name: 'Luis', action: { label: 'Cambiar foto', onClick, extra: 1 } }).action).toEqual({ label: 'Cambiar foto', onClick });
  });
});

describe('firstName', () => {
  it('toma la primera palabra', () => expect(firstName('  María  José Ruiz ')).toBe('María'));
  it('vacío no rompe', () => expect(firstName(undefined)).toBe(''));
});

describe('teclado del diálogo', () => {
  it('Escape cierra', () => expect(dialogKeyAction({ key: 'Escape', count: 2, current: 0 })).toEqual({ type: 'close' }));
  it('Tab da la vuelta entre los enfocables', () => {
    expect(dialogKeyAction({ key: 'Tab', count: 2, current: 0 })).toEqual({ type: 'focus', index: 1 });
    expect(dialogKeyAction({ key: 'Tab', count: 2, current: 1 })).toEqual({ type: 'focus', index: 0 });
    expect(dialogKeyAction({ key: 'Tab', shiftKey: true, count: 2, current: 0 })).toEqual({ type: 'focus', index: 1 });
  });
  it('otras teclas no hacen nada', () => expect(dialogKeyAction({ key: 'a', count: 2, current: 0 })).toBeNull());
});

describe('restoreFocus', () => {
  it('devuelve el foco al avatar que abrió la vista previa', () => {
    const trigger = { isConnected: true, focus: vi.fn() };
    expect(restoreFocus(trigger)).toBe(true);
    expect(trigger.focus).toHaveBeenCalledOnce();
  });
  it('si el avatar ya no está en pantalla, no falla', () => {
    expect(restoreFocus({ isConnected: false, focus: vi.fn() })).toBe(false);
    expect(restoreFocus(null)).toBe(false);
  });
});

describe('deslizar para cerrar', () => {
  it('cierra a partir del umbral', () => {
    expect(shouldCloseOnSwipe(SWIPE_CLOSE_PX - 1)).toBe(false);
    expect(shouldCloseOnSwipe(SWIPE_CLOSE_PX)).toBe(true);
  });
});

describe('zoomFrom', () => {
  it('lleva la imagen grande hasta el centro del avatar con su escala', () => {
    const from = { left: 10, top: 20, width: 40, height: 40 }; // centro (30, 40)
    const to = { left: 100, top: 100, width: 320, height: 320 }; // centro (260, 260)
    expect(zoomFrom(from, to)).toEqual({ scale: 0.125, x: -230, y: -220 });
  });
});
