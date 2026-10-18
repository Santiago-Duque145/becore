// Mide la latencia de GET /api/v1/events (RNF: p90 < 2 s). Sin librerias, solo fetch.
// Uso (con el backend corriendo):
//   BECORE_TOKEN=<access_token> node backend/scripts/measure-p90.js
// Opcionales: BECORE_API_URL (defecto http://localhost:3000/api/v1), BECORE_REQUESTS (defecto 200),
// BECORE_CONCURRENCY (defecto 1, secuencial).

const API_URL = process.env.BECORE_API_URL ?? 'http://localhost:3000/api/v1';
const TOKEN = process.env.BECORE_TOKEN;
const TOTAL = Number(process.env.BECORE_REQUESTS ?? 200);
const CONCURRENCY = Number(process.env.BECORE_CONCURRENCY ?? 1);
const TARGET_MS = 2000;

function percentile(sorted, p) {
  const index = Math.max(0, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

async function timedRequest() {
  const start = performance.now();
  const res = await fetch(`${API_URL}/events`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  await res.arrayBuffer();
  return { ms: performance.now() - start, ok: res.ok, status: res.status };
}

async function main() {
  if (!TOKEN) {
    console.error('Falta BECORE_TOKEN (access_token de un usuario de prueba).');
    process.exit(1);
  }
  const first = await timedRequest();
  if (!first.ok) {
    console.error(`La peticion de prueba fallo con estado ${first.status}. Revisa el token y que el backend este arriba.`);
    process.exit(1);
  }

  const times = [];
  let failed = 0;
  let sent = 0;
  async function worker() {
    while (sent < TOTAL) {
      sent += 1;
      try {
        const r = await timedRequest();
        if (r.ok) times.push(r.ms);
        else failed += 1;
      } catch {
        failed += 1;
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  if (times.length === 0) {
    console.error('Ninguna peticion tuvo exito.');
    process.exit(1);
  }
  times.sort((a, b) => a - b);
  const p90 = percentile(times, 90);
  console.info(`Peticiones: ${TOTAL} (exitosas ${times.length}, fallidas ${failed}), concurrencia ${CONCURRENCY}`);
  console.info(`min ${times[0].toFixed(0)} ms | p50 ${percentile(times, 50).toFixed(0)} ms | p90 ${p90.toFixed(0)} ms | p99 ${percentile(times, 99).toFixed(0)} ms | max ${times.at(-1).toFixed(0)} ms`);
  console.info(p90 < TARGET_MS ? `CUMPLE: p90 < ${TARGET_MS} ms` : `NO CUMPLE: p90 >= ${TARGET_MS} ms`);
}

main();
