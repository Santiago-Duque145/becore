import { gemini } from '../src/services/ai/geminiClient.js';
import { indexEvent, indexProfile } from '../src/services/ai/indexing.service.js';
import { listEventsMissingAi, listPreferencesMissingAi } from '../src/repositories/ai.repository.js';

// IA2 · Completa etiquetas y embeddings que falten (eventos publicados, en curso o finalizados; perfiles con gustos).
// Idempotente: solo toca lo que no tiene embedding. Pausa entre llamadas para no chocar con los límites de la capa
// gratuita. Imprime títulos de eventos y conteos, nunca nombres ni correos de usuarios.
// Uso: npm run ai:backfill -w backend [-- --pause 1500]
// Necesita AI_ENABLED=true y GEMINI_API_KEY en backend/.env (o AI_ENABLED=true en la línea de comandos).

const args = process.argv.slice(2);
const pauseMs = args.includes('--pause') ? Number(args[args.indexOf('--pause') + 1]) : 1500;
const pause = () => new Promise((resolve) => setTimeout(resolve, pauseMs));

if (!gemini.enabled) {
  console.error('[ai:backfill] La IA está apagada: pon AI_ENABLED=true y GEMINI_API_KEY en backend/.env');
  process.exit(1);
}

const summary = { events: { ok: 0, onlyTags: 0, failed: 0 }, profiles: { ok: 0, failed: 0 } };

// Sin cupo o con el modelo en pausa no tiene sentido seguir llamando: los eventos que falten quedan para otra corrida
const STOP = new Set(['AI_QUOTA_EXHAUSTED', 'AI_UNAVAILABLE']);

const events = await listEventsMissingAi();
console.info(`[ai:backfill] ${events.length} eventos sin embedding`);
for (const [i, event] of events.entries()) {
  try {
    const { tags, embedded } = await indexEvent(event);
    summary.events[embedded ? 'ok' : 'onlyTags'] += 1;
    console.info(`  ✓ «${event.title}» → ${tags.join(', ') || '(sin etiquetas)'}${embedded ? '' : ' · sin embedding'}`);
  } catch (error) {
    summary.events.failed += 1;
    console.info(`  ✗ «${event.title}» → ${error.code ?? 'AI_ERROR'}`);
    if (STOP.has(error.code)) {
      summary.events.pending = events.length - i - 1;
      console.info(`  … sin cupo del modelo de texto: ${summary.events.pending} eventos quedan para la próxima corrida`);
      break;
    }
  }
  await pause();
}

const profiles = await listPreferencesMissingAi();
console.info(`[ai:backfill] ${profiles.length} perfiles con gustos y sin embedding`);
for (const { userId, prefs } of profiles) {
  try {
    await indexProfile(userId, prefs);
    summary.profiles.ok += 1;
  } catch (error) {
    summary.profiles.failed += 1;
    console.info(`  ✗ un perfil → ${error.code ?? 'AI_ERROR'}`);
    if (STOP.has(error.code)) break;
  }
  await pause();
}

console.info('[ai:backfill] listo:', JSON.stringify(summary));
