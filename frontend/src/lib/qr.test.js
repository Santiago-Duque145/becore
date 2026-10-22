import { describe, expect, it } from 'vitest';
import { encodeQr } from './qr.js';
import { QR_MARGIN, qrPath, qrViewBoxSize } from './qr-svg.js';

// Decodificador de prueba escrito aparte de qr.js a partir de ISO/IEC 18004 (tablas copiadas de la norma,
// no del codificador): lee formato, versión, quita la máscara, recorre el zigzag, separa bloques, comprueba
// Reed-Solomon con síndromes y lee el modo byte. Si todo cuadra, un lector real lo lee igual.

// Cadenas de formato del nivel M para las máscaras 0..7 (tabla C.1 de la norma, ya con XOR 0x5412)
const FORMAT_M = [0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0];
// Información de versión 7..10 (tabla D.1)
const VERSION_INFO = { 7: 0x07c94, 8: 0x085bc, 9: 0x09a99, 10: 0x0a4d3 };
const TOTAL_CODEWORDS = [0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346];
// Nivel M: [EC por bloque, [bloques, datos por bloque]...] (tabla 9)
const BLOCKS = {
  1: [10, [1, 16]],
  2: [16, [1, 28]],
  3: [26, [1, 44]],
  4: [18, [2, 32]],
  5: [24, [2, 43]],
  6: [16, [4, 27]],
  7: [18, [4, 31]],
  8: [22, [2, 38], [2, 39]],
  9: [22, [3, 36], [2, 37]],
  10: [26, [4, 43], [1, 44]],
};
const ALIGN = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50] };
// Máscaras con i = fila, j = columna, tal como las escribe la norma (tabla 10)
const MASK = [
  (i, j) => (i + j) % 2 === 0,
  (i) => i % 2 === 0,
  (_i, j) => j % 3 === 0,
  (i, j) => (i + j) % 3 === 0,
  (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
  (i, j) => ((i * j) % 2) + ((i * j) % 3) === 0,
  (i, j) => (((i * j) % 2) + ((i * j) % 3)) % 2 === 0,
  (i, j) => (((i + j) % 2) + ((i * j) % 3)) % 2 === 0,
];

const dark = (m, x, y) => m[y][x];

function readFormat(m, size) {
  let a = 0;
  let b = 0;
  // Copia 1 alrededor del buscador superior izquierdo (bit 14 primero)
  const first = [[0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [7, 8], [8, 8], [8, 7], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0]];
  for (const [x, y] of first) a = (a << 1) | (dark(m, x, y) ? 1 : 0);
  // Copia 2 repartida entre el inferior izquierdo y el superior derecho
  for (let i = 0; i < 7; i++) b = (b << 1) | (dark(m, 8, size - 1 - i) ? 1 : 0);
  for (let i = 0; i < 8; i++) b = (b << 1) | (dark(m, size - 8 + i, 8) ? 1 : 0);
  return { a, b };
}

function functionMask(size, version) {
  const f = Array.from({ length: size }, () => new Array(size).fill(false));
  const fill = (x0, y0, w, h) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (x >= 0 && y >= 0 && x < size && y < size) f[y][x] = true;
  };
  fill(0, 0, 9, 9);
  fill(size - 8, 0, 8, 9);
  fill(0, size - 8, 9, 8);
  fill(6, 0, 1, size);
  fill(0, 6, size, 1);
  const pos = ALIGN[version];
  for (const cy of pos) {
    for (const cx of pos) {
      const overlapsFinder = (cx < 9 && cy < 9) || (cx > size - 9 && cy < 9) || (cx < 9 && cy > size - 9);
      if (!overlapsFinder) fill(cx - 2, cy - 2, 5, 5);
    }
  }
  if (version >= 7) {
    fill(size - 11, 0, 3, 6);
    fill(0, size - 11, 6, 3);
  }
  return f;
}

function readBits(m, f, size, mask) {
  const bits = [];
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let k = 0; k < size; k++) {
      const row = upward ? size - 1 - k : k;
      for (const x of [col, col - 1]) {
        if (f[row][x]) continue;
        bits.push(m[row][x] !== MASK[mask](row, x) ? 1 : 0);
      }
    }
    upward = !upward;
  }
  return bits;
}

// GF(256) con 0x11d, armado aquí de nuevo para no depender del codificador
const EXP = [];
const LOG = [];
for (let i = 0, x = 1; i < 255; i++, x = x & 0x80 ? ((x << 1) ^ 0x11d) & 0xff : x << 1) {
  EXP[i] = x;
  LOG[x] = i;
}
const mul = (a, b) => (a && b ? EXP[(LOG[a] + LOG[b]) % 255] : 0);
const syndromesOk = (block, ecLength) =>
  Array.from({ length: ecLength }, (_, k) => block.reduce((acc, c) => mul(acc, EXP[k]) ^ c, 0)).every((s) => s === 0);

function decode({ size, modules: m }) {
  const version = (size - 17) / 4;
  // Buscadores: anillos alternos y separador claro
  for (const [ox, oy] of [[0, 0], [size - 7, 0], [0, size - 7]]) {
    for (let dy = 0; dy < 7; dy++) {
      for (let dx = 0; dx < 7; dx++) {
        const ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
        if (dark(m, ox + dx, oy + dy) !== (ring !== 2)) throw new Error('FINDER');
      }
    }
  }
  for (let i = 8; i < size - 8; i++) {
    if (dark(m, i, 6) !== (i % 2 === 0) || dark(m, 6, i) !== (i % 2 === 0)) throw new Error('TIMING');
  }
  if (!dark(m, 8, size - 8)) throw new Error('DARK_MODULE');

  const { a, b } = readFormat(m, size);
  if (a !== b) throw new Error('FORMAT_COPIES');
  const mask = FORMAT_M.indexOf(a);
  if (mask < 0) throw new Error('FORMAT_NOT_M');

  if (version >= 7) {
    let info = 0;
    for (let i = 17; i >= 0; i--) info = (info << 1) | (dark(m, size - 11 + (i % 3), Math.floor(i / 3)) ? 1 : 0);
    if (info !== VERSION_INFO[version]) throw new Error('VERSION_INFO');
  }

  const bits = readBits(m, functionMask(size, version), size, mask);
  const codewords = [];
  for (let i = 0; i + 8 <= bits.length && codewords.length < TOTAL_CODEWORDS[version]; i += 8) {
    codewords.push(bits.slice(i, i + 8).reduce((acc, bit) => (acc << 1) | bit, 0));
  }
  const [ecLength, ...groups] = BLOCKS[version];
  const sizes = groups.flatMap(([count, len]) => Array(count).fill(len));
  const blocks = sizes.map(() => []);
  let p = 0;
  for (let i = 0; i < Math.max(...sizes); i++) sizes.forEach((len, k) => i < len && blocks[k].push(codewords[p++]));
  const ecs = sizes.map(() => []);
  for (let i = 0; i < ecLength; i++) sizes.forEach((_, k) => ecs[k].push(codewords[p++]));
  blocks.forEach((block, k) => {
    if (!syndromesOk([...block, ...ecs[k]], ecLength)) throw new Error('REED_SOLOMON');
  });

  const data = blocks.flat().flatMap((byte) => Array.from({ length: 8 }, (_, i) => (byte >> (7 - i)) & 1));
  const take = (n) => data.splice(0, n).reduce((acc, bit) => (acc << 1) | bit, 0);
  if (take(4) !== 0b0100) throw new Error('MODE');
  const count = take(version < 10 ? 8 : 16);
  const bytes = Uint8Array.from({ length: count }, () => take(8));
  return { version, mask, text: new TextDecoder().decode(bytes) };
}

// Vuelve a armar la matriz desde el path SVG (lo que de verdad se pinta en pantalla)
function modulesFromPath(d, size) {
  const m = Array.from({ length: size }, () => new Array(size).fill(false));
  for (const [, x, y, len] of d.matchAll(/M(\d+) (\d+)h(\d+)v1h-\3z/g)) {
    for (let k = 0; k < Number(len); k++) m[Number(y) - QR_MARGIN][Number(x) - QR_MARGIN + k] = true;
  }
  return m;
}

const SAMPLES = [
  'https://quiet-river-lamp-cable.trycloudflare.com',
  'http://localhost:4173',
  'http://192.168.1.37:5173',
  'https://x.co',
  'Be Core · ¡Tu comunidad en movimiento! ñandú',
  `https://ejemplo.trycloudflare.com/${'a'.repeat(110)}`,
  `https://ejemplo.trycloudflare.com/${'b'.repeat(170)}`,
];

describe('encodeQr', () => {
  it.each(SAMPLES)('el decodificador de la norma lee de vuelta %s', (text) => {
    const qr = encodeQr(text);
    expect(qr.size).toBe(17 + qr.version * 4);
    expect(decode(qr).text).toBe(text);
  });

  it('elige la versión más pequeña: un enlace de trycloudflare cabe en la 4 (33×33)', () => {
    const qr = encodeQr(SAMPLES[0]);
    expect(qr.version).toBe(4);
    expect(qr.size).toBe(33);
  });

  it('cubre versiones con información de versión (7+) y varios grupos de bloques', () => {
    expect(encodeQr(SAMPLES[5]).version).toBeGreaterThanOrEqual(7);
    expect(encodeQr(SAMPLES[6]).version).toBe(10);
  });

  it('el decodificador de prueba no es complaciente: un módulo de datos cambiado rompe Reed-Solomon', () => {
    const qr = encodeQr(SAMPLES[0]);
    const modules = qr.modules.map((row) => [...row]);
    modules[qr.size - 1][qr.size - 1] = !modules[qr.size - 1][qr.size - 1];
    expect(() => decode({ size: qr.size, modules })).toThrow('REED_SOLOMON');
    const format = qr.modules.map((row) => [...row]);
    format[8][0] = !format[8][0];
    expect(() => decode({ size: qr.size, modules: format })).toThrow('FORMAT_COPIES');
  });

  it('rechaza textos que no caben en la versión 10', () => {
    expect(() => encodeQr('x'.repeat(214))).toThrow('QR_TOO_LONG');
  });
});

describe('qrPath', () => {
  it('pinta exactamente los módulos oscuros, con 4 módulos de margen', () => {
    const qr = encodeQr(SAMPLES[0]);
    const d = qrPath(qr.modules);
    expect(qrViewBoxSize(qr.size)).toBe(qr.size + 8);
    expect(modulesFromPath(d, qr.size)).toEqual(qr.modules);
    expect(decode({ size: qr.size, modules: modulesFromPath(d, qr.size) }).text).toBe(SAMPLES[0]);
  });

  it('une los módulos seguidos de una fila en una sola franja', () => {
    expect(qrPath([[true, true, false, true]], 0)).toBe('M0 0h2v1h-2zM3 0h1v1h-1z');
  });
});
