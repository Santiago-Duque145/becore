import { normalizeQuery } from './query-text.js';

// IA7 · Puntaje de un evento para una consulta (funciones puras):
//   puntaje = similitud reescalada (0..1) + coincidencia literal (1) + refuerzos (día 0,15 · franja 0,1 · categoría 0,1
//             · gusto 0,25)  →  entra si puntaje ≥ SEARCH_THRESHOLD
// Calibrado el 22 oct con 20 consultas anotadas a mano sobre los 12 eventos próximos (docs/progreso/21_*):
//   similitud de los esperados: mín. 0,610 · mediana 0,680 · máx. 0,776; de los no esperados: mediana 0,606 · p90 0,651
//   · máx. 0,696. Con piso 0,44, techo 0,80 y umbral 0,75: precisión 0,81, recall 0,86, 15 de 20 exactas y las 2
//   consultas sin respuesta esperada ("clases de piano", "natación") sin resultados. Sin refuerzos, un evento entra
//   solo por similitud si pasa ~0,71 cruda: por encima de todos los no esperados.
export const SIM_FLOOR = 0.44;
export const SIM_CEIL = 0.8;
export const SEARCH_THRESHOLD = 0.75;
export const BOOSTS = { day: 0.15, slot: 0.1, category: 0.1, interest: 0.25 };
export const LITERAL_MATCH = 1;

export const scaleSimilarity = (raw) => Math.min(1, Math.max(0, (raw - SIM_FLOOR) / (SIM_CEIL - SIM_FLOOR)));

// Palabras que no cuentan para la coincidencia literal
const STOP = new Set(['algo', 'para', 'con', 'el', 'la', 'los', 'las', 'de', 'del', 'en', 'un', 'una', 'mi', 'mis', 'que', 'otras', 'otros', 'personas', 'cerca', 'hacer', 'plan', 'planes']);

// La consulta completa, o todas sus palabras de 3+ letras (sin las de relleno), aparecen en el texto
export function containsQuery(q, text) {
  const query = normalizeQuery(q);
  const haystack = normalizeQuery(text);
  if (query.length >= 3 && haystack.includes(query)) return true;
  const words = query.split(' ').filter((w) => w.length >= 3 && !STOP.has(w));
  return words.length > 0 && words.every((w) => haystack.includes(w));
}

// Coincidencia literal del modo semántico: en el título o el lugar ("Avengers", "Arví")
export const literalMatch = (q, event) => containsQuery(q, `${event.title} ${event.location}`);

const bogota = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Bogota', weekday: 'short', hour: 'numeric', hourCycle: 'h23' });
const DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// Día de la semana (0 = domingo) y franja del evento en hora de Bogotá
export function eventWhen(iso) {
  const parts = Object.fromEntries(bogota.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  const hour = Number(parts.hour);
  return { dow: DOW[parts.weekday], slot: hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening' };
}

export function intentBoost(intent, event, tags = []) {
  const { dow, slot } = eventWhen(event.startsAt);
  const weekend = dow === 0 || dow === 6;
  let boost = 0;
  if (intent.days.has(dow) || (intent.days.has('weekends') && weekend) || (intent.days.has('weekdays') && !weekend)) boost += BOOSTS.day;
  if (intent.slot && intent.slot === slot) boost += BOOSTS.slot;
  if (intent.categories.has(event.category)) boost += BOOSTS.category;
  if (tags.some((t) => intent.interests.has(t))) boost += BOOSTS.interest;
  return boost;
}

// similarity: coseno crudo (null en modo clásico o sin embedding)
export function scoreEvent({ q, intent, event, tags, similarity }) {
  return (similarity == null ? 0 : scaleSimilarity(similarity)) + (literalMatch(q, event) ? LITERAL_MATCH : 0) + intentBoost(intent, event, tags);
}
