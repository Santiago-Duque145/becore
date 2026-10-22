import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Reprocesa UNA VEZ las imágenes que ya están en Storage con las mismas reglas que hoy aplica el navegador al subir
// (frontend/src/lib/image.js): portada ≤ 1200 px de ancho y alto, avatar ≤ 256 px, WebP calidad 0,8.
// Sin librerías: Node no decodifica imágenes, así que la conversión la hace un Edge sin ventana (mismo canvas que la app)
// controlado por el protocolo de DevTools con el WebSocket de Node 22.
//
// Uso (por defecto NO escribe nada, solo muestra el plan):
//   npm run images:reprocess -w backend                         → plan de portadas
//   npm run images:reprocess -w backend -- --bucket avatars     → plan de avatares
//   npm run images:reprocess -w backend -- --apply              → sube los WebP y actualiza las filas que los usan
//   ... --apply --delete-old                                    → además borra el archivo viejo
// Una imagen solo se reemplaza si el WebP pesa menos que el original. Las filas se actualizan solo en la columna de la
// URL (events.cover_url / profiles.avatar_url): no se tocan otros datos ni se mandan avisos.

const TARGETS = {
  'event-covers': { table: 'events', column: 'cover_url', max: 1200 },
  avatars: { table: 'profiles', column: 'avatar_url', max: 256 },
};
const QUALITY = 0.8;
const EDGE = process.env.EDGE_PATH ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

const args = process.argv.slice(2);
const bucket = args.includes('--bucket') ? args[args.indexOf('--bucket') + 1] : 'event-covers';
const apply = args.includes('--apply');
const deleteOld = args.includes('--delete-old');
const target = TARGETS[bucket];
if (!target) throw new Error(`Bucket desconocido: ${bucket}. Usa event-covers o avatars`);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

// ---- Edge sin ventana: una pestaña en blanco que convierte imágenes con OffscreenCanvas ----
async function openBrowser() {
  const profile = mkdtempSync(join(tmpdir(), 'becore-reprocess-'));
  const port = 9400 + Math.floor(Math.random() * 400);
  const proc = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', 'about:blank']);
  let pages;
  for (let i = 0; i < 50 && !pages; i++) {
    await new Promise((r) => setTimeout(r, 200));
    pages = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json()).catch(() => null);
  }
  const page = pages?.find((p) => p.type === 'page');
  if (!page) throw new Error('No se pudo abrir Edge sin ventana (revisa EDGE_PATH)');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    pending.get(msg.id)?.(msg);
    pending.delete(msg.id);
  });
  const evaluate = (expression) =>
    new Promise((resolve, reject) => {
      const msgId = ++id;
      pending.set(msgId, (msg) => {
        const details = msg.result?.exceptionDetails;
        if (msg.error || details) reject(new Error(details?.exception?.description ?? JSON.stringify(msg.error)));
        else resolve(msg.result.result.value);
      });
      ws.send(JSON.stringify({ id: msgId, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } }));
    });
  const close = () => {
    ws.close();
    proc.kill();
    setTimeout(() => rmSync(profile, { recursive: true, force: true }), 500);
  };
  return { evaluate, close };
}

// Misma cuenta que fitWithin de frontend/src/lib/image.js. `fn` se ejecuta dentro de Edge, no en Node.
/* global createImageBitmap, OffscreenCanvas */
async function toWebp(browser, bytes, max) {
  const fn = async (b64, maxSide, quality) => {
    const blob = await (await fetch(`data:application/octet-stream;base64,${b64}`)).blob();
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, maxSide / bitmap.width, maxSide / bitmap.height);
    const [w, h] = [Math.round(bitmap.width * scale), Math.round(bitmap.height * scale)];
    const canvas = new OffscreenCanvas(w, h);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
    const out = await canvas.convertToBlob({ type: 'image/webp', quality });
    const buf = new Uint8Array(await out.arrayBuffer());
    let bin = '';
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return { b64: btoa(bin), type: out.type, from: [bitmap.width, bitmap.height], to: [w, h] };
  };
  const r = await browser.evaluate(`(${fn})(${JSON.stringify(Buffer.from(bytes).toString('base64'))}, ${max}, ${QUALITY})`);
  if (r.type !== 'image/webp') throw new Error('Edge no codificó WebP');
  return { ...r, bytes: Buffer.from(r.b64, 'base64') };
}

async function listObjects() {
  const { data: folders, error } = await supabase.storage.from(bucket).list('', { limit: 1000 });
  if (error) throw error;
  const objects = [];
  for (const folder of folders) {
    const { data: files, error: err } = await supabase.storage.from(bucket).list(folder.name, { limit: 1000 });
    if (err) throw err;
    for (const file of files) if (file.metadata) objects.push({ path: `${folder.name}/${file.name}`, size: file.metadata.size });
  }
  return objects;
}

const publicUrl = (path) => supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;

async function rowsUsing(url) {
  const { data, error } = await supabase.from(target.table).select('id').eq(target.column, url);
  if (error) throw error;
  return data.map((row) => row.id);
}

async function replace(object, webp, rows) {
  const newPath = `${object.path.split('/')[0]}/${randomUUID()}.webp`;
  const up = await supabase.storage.from(bucket).upload(newPath, webp.bytes, { contentType: 'image/webp', cacheControl: '3600' });
  if (up.error) throw up.error;
  if (rows.length) {
    const { error } = await supabase.from(target.table).update({ [target.column]: publicUrl(newPath) }).in('id', rows);
    if (error) throw error;
  }
  if (deleteOld) {
    const { error } = await supabase.storage.from(bucket).remove([object.path]);
    if (error) throw error;
  }
  return newPath;
}

const browser = await openBrowser();
let saved = 0;
try {
  const objects = await listObjects();
  console.info(`${bucket}: ${objects.length} archivos · ${apply ? 'APLICANDO' : 'solo plan (agrega --apply para escribir)'}\n`);
  for (const object of objects) {
    const { data, error } = await supabase.storage.from(bucket).download(object.path);
    if (error) throw error;
    const webp = await toWebp(browser, await data.arrayBuffer(), target.max);
    const rows = await rowsUsing(publicUrl(object.path));
    const line = `${object.path}  ${webp.from.join('×')} ${kb(object.size)} → ${webp.to.join('×')} ${kb(webp.bytes.length)}  (${rows.length} fila(s) en ${target.table})`;
    if (webp.bytes.length >= object.size) {
      console.info(`= ${line}  sin cambio: el WebP no pesa menos`);
      continue;
    }
    saved += object.size - webp.bytes.length;
    if (!apply) {
      console.info(`~ ${line}`);
      continue;
    }
    const newPath = await replace(object, webp, rows);
    console.info(`✓ ${line}  → ${newPath}${deleteOld ? ' (viejo borrado)' : ''}`);
  }
  console.info(`\nAhorro${apply ? '' : ' posible'}: ${kb(saved)}`);
} finally {
  browser.close();
}
