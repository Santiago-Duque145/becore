// Codificador QR propio y mínimo (M1, sin librerías): modo byte (UTF-8), corrección de errores nivel M,
// versiones 1 a 10 (hasta 213 bytes; un enlace de trycloudflare ocupa ~50). Sigue ISO/IEC 18004.
// Lo usan la página /compartir (SVG) y scripts/demo.js (terminal). Devuelve { size, modules[y][x] }.

// Nivel M por versión: [EC por bloque, [bloques, datos por bloque], [bloques, datos por bloque]?]
const BLOCKS_M = [
  null,
  [10, [1, 16]],
  [16, [1, 28]],
  [26, [1, 44]],
  [18, [2, 32]],
  [24, [2, 43]],
  [16, [4, 27]],
  [18, [4, 31]],
  [22, [2, 38], [2, 39]],
  [22, [3, 36], [2, 37]],
  [26, [4, 43], [1, 44]],
];
const ALIGNMENT = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
const MAX_VERSION = 10;
const ECC_M_FORMAT = 0; // bits de formato del nivel M

// --- Campo de Galois GF(256) con polinomio 0x11d ---
const EXP = new Array(512);
const LOG = new Array(256);
for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = x;
  LOG[x] = i;
  x <<= 1;
  if (x & 0x100) x ^= 0x11d;
}
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
const gfMul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

function rsGenerator(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < next.length; j++) {
      next[j] = (j < poly.length ? poly[j] : 0) ^ (j > 0 ? gfMul(poly[j - 1], EXP[i]) : 0);
    }
    poly = next;
  }
  return poly;
}

function rsRemainder(data, degree) {
  const gen = rsGenerator(degree);
  const rem = new Array(degree).fill(0);
  for (const byte of data) {
    const factor = byte ^ rem.shift();
    rem.push(0);
    for (let i = 0; i < degree; i++) rem[i] ^= gfMul(gen[i + 1], factor);
  }
  return rem;
}

// --- Datos ---
const dataCapacity = (version) => BLOCKS_M[version].slice(1).reduce((sum, [count, size]) => sum + count * size, 0);
const countBits = (version) => (version < 10 ? 8 : 16);

function chooseVersion(byteLength) {
  for (let v = 1; v <= MAX_VERSION; v++) {
    if (4 + countBits(v) + byteLength * 8 <= dataCapacity(v) * 8) return v;
  }
  throw new Error('QR_TOO_LONG');
}

function dataCodewords(bytes, version) {
  const bits = [];
  const push = (value, length) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, countBits(version));
  bytes.forEach((b) => push(b, 8));
  const capacityBits = dataCapacity(version) * 8;
  push(0, Math.min(4, capacityBits - bits.length));
  while (bits.length % 8) bits.push(0);
  const words = [];
  for (let i = 0; i < bits.length; i += 8) words.push(bits.slice(i, i + 8).reduce((acc, bit) => (acc << 1) | bit, 0));
  for (let pad = 0xec; words.length < dataCapacity(version); pad ^= 0xec ^ 0x11) words.push(pad);
  return words;
}

function interleave(words, version) {
  const [ecLength, ...groups] = BLOCKS_M[version];
  const blocks = [];
  let offset = 0;
  for (const [count, size] of groups) {
    for (let i = 0; i < count; i++) {
      const data = words.slice(offset, offset + size);
      offset += size;
      blocks.push({ data, ec: rsRemainder(data, ecLength) });
    }
  }
  const out = [];
  const maxData = Math.max(...blocks.map((b) => b.data.length));
  for (let i = 0; i < maxData; i++) blocks.forEach((b) => i < b.data.length && out.push(b.data[i]));
  for (let i = 0; i < ecLength; i++) blocks.forEach((b) => out.push(b.ec[i]));
  return out;
}

// --- Matriz ---
function createGrid(size) {
  const make = () => Array.from({ length: size }, () => new Array(size).fill(false));
  const modules = make();
  const reserved = make();
  const set = (x, y, dark) => {
    modules[y][x] = dark;
    reserved[y][x] = true;
  };
  return { size, modules, reserved, set };
}

function drawFunctionPatterns(grid, version) {
  const { size, set } = grid;
  for (let i = 0; i < size; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, dist !== 2 && dist !== 4);
      }
    }
  }
  const pos = ALIGNMENT[version];
  pos.forEach((cy, i) =>
    pos.forEach((cx, j) => {
      const last = pos.length - 1;
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }),
  );
  drawFormatBits(grid, 0); // reserva el área; se redibuja con la máscara elegida
  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const dark = ((bits >>> i) & 1) === 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      set(a, b, dark);
      set(b, a, dark);
    }
  }
}

function drawFormatBits(grid, mask) {
  const { size, set } = grid;
  const data = (ECC_M_FORMAT << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;
  const bit = (i) => ((bits >>> i) & 1) === 1;
  for (let i = 0; i <= 5; i++) set(8, i, bit(i));
  set(8, 7, bit(6));
  set(8, 8, bit(7));
  set(7, 8, bit(8));
  for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
  for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
  set(8, size - 8, true);
}

function drawCodewords(grid, codewords) {
  const { size, modules, reserved } = grid;
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const y = ((right + 1) & 2) === 0 ? size - 1 - vert : vert;
        if (!reserved[y][x] && i < codewords.length * 8) {
          modules[y][x] = ((codewords[i >>> 3] >>> (7 - (i & 7))) & 1) === 1;
          i++;
        }
      }
    }
  }
}

const MASKS = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function applyMask(grid, mask) {
  const { size, modules, reserved } = grid;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) if (!reserved[y][x] && MASKS[mask](x, y)) modules[y][x] = !modules[y][x];
  }
}

// Penalización estándar (reglas N1–N4) para elegir la máscara más legible
function penalty({ size, modules }) {
  let score = 0;
  const lines = [];
  for (let i = 0; i < size; i++) {
    lines.push(modules[i]);
    lines.push(modules.map((row) => row[i]));
  }
  const finderLike = [
    [true, false, true, true, true, false, true, false, false, false, false],
    [false, false, false, false, true, false, true, true, true, false, true],
  ];
  for (const line of lines) {
    for (let start = 0, i = 1; i <= size; i++) {
      if (i === size || line[i] !== line[start]) {
        if (i - start >= 5) score += 3 + (i - start - 5);
        start = i;
      }
    }
    for (let i = 0; i + 11 <= size; i++) {
      if (finderLike.some((p) => p.every((v, k) => line[i + k] === v))) score += 40;
    }
  }
  let dark = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (modules[y][x]) dark++;
      if (x < size - 1 && y < size - 1) {
        const c = modules[y][x];
        if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) score += 3;
      }
    }
  }
  const total = size * size;
  score += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
  return score;
}

export function encodeQr(text) {
  const bytes = Array.from(new TextEncoder().encode(text));
  const version = chooseVersion(bytes.length);
  const codewords = interleave(dataCodewords(bytes, version), version);
  const size = 17 + version * 4;
  let best = null;
  for (let mask = 0; mask < 8; mask++) {
    const grid = createGrid(size);
    drawFunctionPatterns(grid, version);
    drawCodewords(grid, codewords);
    applyMask(grid, mask);
    drawFormatBits(grid, mask);
    const score = penalty(grid);
    if (!best || score < best.score) best = { score, grid };
  }
  return { size, version, modules: best.grid.modules };
}
