// npm run demo (M1): construye el frontend, lo sirve con vite preview (:4173, proxy /api → :3000),
// abre un túnel rápido de Cloudflare y arranca el backend con APP_URL = la URL https del túnel.
// Ctrl+C (o la caída de cualquier proceso) cierra todo. Solo usa Node; cloudflared debe estar instalado.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FRONTEND = join(ROOT, 'frontend');
const BACKEND = join(ROOT, 'backend');
const VITE = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
const PREVIEW_PORT = 4173;
const PREVIEW_URL = `http://localhost:${PREVIEW_PORT}`;
// Puerto del backend; DEMO_API_PORT permite usar otro si :3000 está ocupado (npm run dev abierto)
const API_PORT = Number(process.env.DEMO_API_PORT || 3000);
const API_URL = `http://localhost:${API_PORT}`;
const HEALTH_PATH = '/api/v1/health';
const TUNNEL_URL_RE = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/;
const IS_WINDOWS = process.platform === 'win32';
const CLOUDFLARED_CANDIDATES = [
  process.env.CLOUDFLARED,
  'cloudflared',
  'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe',
  'C:\\Program Files\\cloudflared\\cloudflared.exe',
].filter(Boolean);

const children = [];
let shuttingDown = false;

const log = (msg) => console.info(`[demo] ${msg}`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function fail(msg) {
  console.error(`\n[demo] ${msg}\n`);
  shutdown(1);
}

// Cierra cada hijo con su árbol de procesos (en Windows, taskkill /T /F) y termina
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  log('Cerrando procesos...');
  for (const child of children) {
    if (child.exitCode !== null || child.signalCode !== null) continue;
    if (IS_WINDOWS)
      spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    else child.kill('SIGTERM');
  }
  process.exit(code);
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGBREAK', 'SIGHUP'])
  process.on(signal, () => shutdown(0));

// Reenvía la salida del hijo con un prefijo; `filter` decide qué líneas se muestran
function pipeLines(stream, prefix, onLine, filter = () => true) {
  let buffer = '';
  stream.setEncoding('utf8');
  stream.on('data', (chunk) => {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop();
    for (const line of lines) {
      onLine?.(line);
      if (line.trim() && filter(line)) console.info(`${prefix} ${line}`);
    }
  });
}

function start(name, command, args, { cwd, env, onLine, filter } = {}) {
  const child = spawn(command, args, {
    cwd,
    env: env ?? process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  children.push(child);
  pipeLines(child.stdout, `[${name}]`, onLine, filter);
  pipeLines(child.stderr, `[${name}]`, onLine, filter);
  child.on('error', (err) => fail(`No se pudo iniciar ${name}: ${err.message}`));
  child.on('exit', (code) => {
    if (!shuttingDown) fail(`${name} se cerró (código ${code}). Se detiene el modo demo.`);
  });
  return child;
}

async function waitFor(url, timeoutMs) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return true;
    } catch {
      // todavía no responde
    }
    await sleep(1000);
  }
  return false;
}

// true si el puerto está libre (se prueba abriendo y cerrando un servidor)
function isPortFree(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.listen(port, () => server.close(() => resolve(true)));
  });
}

function findCloudflared() {
  return CLOUDFLARED_CANDIDATES.find(
    (cmd) => spawnSync(cmd, ['--version'], { stdio: 'ignore' }).status === 0,
  );
}

function checkPrerequisites() {
  if (!existsSync(join(BACKEND, '.env')))
    fail('Falta backend/.env. Cópialo desde backend/.env.example (README §3).');
  if (!existsSync(join(FRONTEND, '.env')))
    fail('Falta frontend/.env. Cópialo desde frontend/.env.example (README §3).');
  if (!existsSync(VITE)) fail('No se encontró Vite. Corre npm install en la raíz.');
  const cloudflared = findCloudflared();
  if (!cloudflared)
    fail('No se encontró cloudflared. Instálalo con: winget install Cloudflare.cloudflared');
  return cloudflared;
}

function build() {
  log('Construyendo el frontend (vite build)...');
  const result = spawnSync(process.execPath, [VITE, 'build'], { cwd: FRONTEND, stdio: 'inherit' });
  if (result.status !== 0) fail('vite build falló.');
}

function openTunnel(cloudflared) {
  return new Promise((resolve) => {
    const timer = setTimeout(
      () =>
        fail('cloudflared no entregó una URL en 60 s. Revisa la conexión (plan B en README §8.1).'),
      60000,
    );
    start('tunnel', cloudflared, ['tunnel', '--no-autoupdate', '--url', PREVIEW_URL], {
      onLine: (line) => {
        const match = line.match(TUNNEL_URL_RE);
        if (match) {
          clearTimeout(timer);
          resolve(match[0]);
        }
      },
      filter: (line) => /\bERR\b/.test(line),
    });
  });
}

// QR con medios bloques, blanco sobre negro explícito para que funcione con cualquier tema de terminal
async function printQr(url) {
  try {
    const { encodeQr } = await import(pathToFileURL(join(FRONTEND, 'src', 'lib', 'qr.js')).href);
    const { size, modules } = encodeQr(url);
    const margin = 4; // zona de silencio que pide la norma
    const dark = (x, y) => x >= 0 && y >= 0 && x < size && y < size && Boolean(modules[y][x]);
    const rows = [];
    for (let y = -margin; y < size + margin; y += 2) {
      let row = '';
      for (let x = -margin; x < size + margin; x++) {
        const top = !dark(x, y);
        const bottom = !dark(x, y + 1);
        row += top && bottom ? '█' : top ? '▀' : bottom ? '▄' : ' ';
      }
      rows.push(`  \x1b[97;40m${row}\x1b[0m`);
    }
    console.info(`\n${rows.join('\n')}\n`);
  } catch (err) {
    log(`No se pudo dibujar el QR (${err.message}); usa la página /compartir.`);
  }
}

function printBanner(url) {
  const lines = [
    'Be Core en modo demo (HTTPS)',
    '',
    url,
    '',
    'Ábrela en el celular, incluso con datos móviles.',
    'La URL cambia en cada arranque. Ctrl+C para cerrar.',
  ];
  const width = Math.max(...lines.map((l) => l.length)) + 4;
  const pad = (l) => `║  ${l.padEnd(width - 4)}  ║`;
  const bold = (l) => (l === url ? `\x1b[1;36m${pad(l)}\x1b[0m` : pad(l));
  console.info(`\n╔${'═'.repeat(width)}╗\n${lines.map(bold).join('\n')}\n╚${'═'.repeat(width)}╝`);
}

async function main() {
  const cloudflared = checkPrerequisites();
  if (!(await isPortFree(API_PORT)))
    fail(
      `El puerto ${API_PORT} está ocupado (¿npm run dev abierto?). Ciérralo o usa DEMO_API_PORT.`,
    );
  if (!(await isPortFree(PREVIEW_PORT)))
    fail(`El puerto ${PREVIEW_PORT} está ocupado. Cierra el otro vite preview.`);
  build();

  log(`Sirviendo el build en ${PREVIEW_URL} (vite preview)...`);
  start('web', process.execPath, [VITE, 'preview'], {
    cwd: FRONTEND,
    env: { ...process.env, BECORE_API_PROXY: API_URL },
  });
  if (!(await waitFor(PREVIEW_URL, 30000)))
    fail('vite preview no respondió en el puerto 4173 (¿está ocupado?).');

  log('Abriendo el túnel de Cloudflare...');
  const url = await openTunnel(cloudflared);
  log(`Túnel listo: ${url}`);

  log('Arrancando el backend con APP_URL del túnel...');
  start('api', process.execPath, ['--env-file=.env', 'src/server.js'], {
    cwd: BACKEND,
    env: { ...process.env, APP_URL: url, PORT: String(API_PORT) },
  });
  if (!(await waitFor(`${API_URL}${HEALTH_PATH}`, 30000)))
    fail(`El backend no respondió en el puerto ${API_PORT}.`);

  log('Comprobando la URL pública (el DNS del túnel puede tardar unos segundos)...');
  const reachable = await waitFor(`${url}${HEALTH_PATH}`, 60000);
  printBanner(url);
  await printQr(url);
  if (!reachable)
    log('Aviso: la URL pública aún no responde desde este equipo; espera un poco y recarga.');
}

main().catch((err) => fail(err.stack ?? String(err)));
