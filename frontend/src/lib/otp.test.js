import { describe, it, expect } from 'vitest';
import {
  OTP_LENGTH,
  arrowTarget,
  backspaceAt,
  digitsOnly,
  emptyDigits,
  enterText,
  isComplete,
  secondsLeft,
  toCode,
  toDigits,
} from './otp.js';

const filled = (code) => toDigits(code);

describe('escribir', () => {
  it('un dígito avanza a la casilla siguiente', () => {
    const { digits, focus } = enterText(emptyDigits(), 0, '4');
    expect(toCode(digits)).toBe('4');
    expect(focus).toBe(1);
  });

  it('ignora lo que no es un dígito', () => {
    const { digits, focus } = enterText(emptyDigits(), 2, 'a');
    expect(toCode(digits)).toBe('');
    expect(focus).toBe(2);
  });

  it('en la última casilla el foco se queda ahí', () => expect(enterText(filled('12345'), 5, '6').focus).toBe(5));

  it('sobrescribe la casilla al escribir sobre un dígito existente', () =>
    expect(toCode(enterText(filled('123456'), 2, '9').digits)).toBe('129456'));
});

describe('pegar', () => {
  it('pegar el código completo lo reparte en las 6 casillas', () => {
    const { digits, focus } = enterText(emptyDigits(), 0, '123456');
    expect(toCode(digits)).toBe('123456');
    expect(isComplete(digits)).toBe(true);
    expect(focus).toBe(OTP_LENGTH - 1);
  });

  it('pegarlo estando en otra casilla igual lo pone entero desde la primera', () =>
    expect(toCode(enterText(emptyDigits(), 3, '654321').digits)).toBe('654321'));

  it('limpia espacios y guiones ("123 456", "123-456")', () => {
    expect(toCode(enterText(emptyDigits(), 0, '123 456').digits)).toBe('123456');
    expect(toCode(enterText(emptyDigits(), 0, '123-456').digits)).toBe('123456');
  });

  it('el autocompletado que mete el código en una sola casilla también funciona', () =>
    expect(toCode(enterText(emptyDigits(), 4, '987654').digits)).toBe('987654'));

  it('un pedazo corto se reparte desde la casilla actual', () =>
    expect(toCode(enterText(filled('12'), 2, '34').digits)).toBe('1234'));

  it('descarta lo que sobra de 6 dígitos', () =>
    expect(toCode(enterText(emptyDigits(), 0, '12345678').digits)).toBe('123456'));
});

describe('retroceso', () => {
  it('borra el dígito de la casilla actual y se queda', () => {
    const { digits, focus } = backspaceAt(filled('1234'), 3);
    expect(toCode(digits)).toBe('123');
    expect(focus).toBe(3);
  });

  it('si la casilla ya está vacía, retrocede y borra la anterior', () => {
    const { digits, focus } = backspaceAt(filled('123'), 3);
    expect(toCode(digits)).toBe('12');
    expect(focus).toBe(2);
  });

  it('en la primera casilla vacía no pasa nada', () =>
    expect(backspaceAt(emptyDigits(), 0)).toEqual({ digits: emptyDigits(), focus: 0 }));
});

describe('flechas', () => {
  it('se mueven sin salirse del campo', () => {
    expect(arrowTarget('ArrowLeft', 0)).toBe(0);
    expect(arrowTarget('ArrowLeft', 3)).toBe(2);
    expect(arrowTarget('ArrowRight', 5)).toBe(5);
    expect(arrowTarget('ArrowRight', 1)).toBe(2);
    expect(arrowTarget('a', 1)).toBeNull();
  });
});

describe('utilidades', () => {
  it('digitsOnly', () => expect(digitsOnly('1a2 3-4')).toBe('1234'));
  it('toDigits recorta y rellena a 6', () => {
    expect(toDigits('12')).toEqual(['1', '2', '', '', '', '']);
    expect(toDigits('1234567')).toHaveLength(6);
  });
  it('cuenta regresiva: redondea hacia arriba y no baja de cero', () => {
    expect(secondsLeft(60_000, 0)).toBe(60);
    expect(secondsLeft(60_000, 59_100)).toBe(1);
    expect(secondsLeft(60_000, 70_000)).toBe(0);
  });
});
