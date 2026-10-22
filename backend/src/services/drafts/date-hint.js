import { detectIntent } from '../search/intent.js';
import { normalizeQuery } from '../search/query-text.js';

// IA8 · Fecha y hora de una pista en español ("el sábado en la tarde", "mañana a las 5 pm", "el 5 de noviembre").
// El modelo NO inventa fechas: la pista llega como texto y estas reglas la resuelven relativa a la fecha actual en
// America/Bogota (UTC−5 todo el año, sin horario de verano). Función pura. → ISO UTC en el futuro, o null.

const OFFSET_HOURS = 5;
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const SLOT_HOURS = { morning: 9, afternoon: 16, evening: 19 };
const DEFAULT_HOUR = 18;
const MORNING_PHRASE = /\b(en|por|de) la manana\b/g;

// "a las 5", "a las 5 30", "a las 5 y media", "a las 5 pm"
function explicitTime(text, slot) {
  const match = text.match(/\ba las (\d{1,2})(?: (\d{2})\b| y media\b)?\s*(am|pm)?\b/);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : match[0].includes('y media') ? 30 : 0;
  if (hour > 23 || minute > 59) return null;
  const afternoon = match[3] === 'pm' || (!match[3] && (slot === 'afternoon' || slot === 'evening'));
  if (afternoon && hour < 12) hour += 12;
  return { hour, minute };
}

// Día (año, mes 0-11, día) pedido, o null si la pista no trae ninguno. today = { y, m, d, dow } en hora de Bogotá.
function targetDay(text, intent, today) {
  const at = (offsetDays) => {
    const date = new Date(Date.UTC(today.y, today.m, today.d + offsetDays));
    return { y: date.getUTCFullYear(), m: date.getUTCMonth(), d: date.getUTCDate() };
  };
  if (/\bpasado manana\b/.test(text)) return at(2);
  if (/\bmanana\b/.test(text)) return at(1);
  if (/\bhoy\b/.test(text)) return at(0);

  const explicit = text.match(new RegExp(`\\b(\\d{1,2}) de (${MONTHS.join('|')})\\b`));
  if (explicit) {
    const month = MONTHS.indexOf(explicit[2]);
    const day = Number(explicit[1]);
    const year = month < today.m || (month === today.m && day < today.d) ? today.y + 1 : today.y;
    const check = new Date(Date.UTC(year, month, day));
    return check.getUTCMonth() === month ? { y: year, m: month, d: day } : null; // "31 de febrero" no existe
  }

  const weekday = [...intent.days].find((d) => typeof d === 'number') ?? (intent.days.has('weekends') ? 6 : null);
  if (weekday === null) return null;
  const ahead = (weekday - today.dow + 7) % 7 || 7; // siempre un día futuro: "el sábado" siendo sábado es el próximo
  return at(ahead);
}

export function parseDateHint(hint, now = Date.now()) {
  const original = String(hint ?? '');
  if (!original.trim()) return null;
  const intent = detectIntent(original);
  const text = normalizeQuery(original).replace(MORNING_PHRASE, ' ');
  const local = new Date(now - OFFSET_HOURS * 3600 * 1000);
  const today = { y: local.getUTCFullYear(), m: local.getUTCMonth(), d: local.getUTCDate(), dow: local.getUTCDay() };

  const day = targetDay(text, intent, today);
  if (!day) return null;
  const time = explicitTime(normalizeQuery(original), intent.slot) ?? { hour: SLOT_HOURS[intent.slot] ?? DEFAULT_HOUR, minute: 0 };

  const startsAt = Date.UTC(day.y, day.m, day.d, time.hour + OFFSET_HOURS, time.minute);
  return startsAt > now ? new Date(startsAt).toISOString() : null;
}
