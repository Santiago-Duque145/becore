import { RATING_WINDOW_DAYS } from '../constants/ratings.js';

const DAY_MS = 24 * 3600 * 1000;
const averageFormat = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// 4.6 → "4,6"
export const formatAverage = (value) => averageFormat.format(value);

// Misma regla que el backend: evento finalizado, con check-in y dentro de los 7 días
export function canRateEvent(event, now = Date.now()) {
  if (event?.status !== 'finished' || !event.myAttendance?.checkedIn || !event.finishedAt) return false;
  return now <= new Date(event.finishedAt).getTime() + RATING_WINDOW_DAYS * DAY_MS;
}

// Promedio general ponderado por cantidad de calificaciones de varios resúmenes
export function overallAverage(summaries) {
  const rated = summaries.filter((s) => s?.total > 0);
  const total = rated.reduce((sum, s) => sum + s.total, 0);
  if (total === 0) return { average: null, total: 0 };
  const weighted = rated.reduce((sum, s) => sum + s.average * s.total, 0);
  return { average: Math.round((weighted / total) * 10) / 10, total };
}

// Mensaje claro para los errores de elegibilidad del backend
export const RATING_ERRORS = {
  EVENT_NOT_FINISHED: 'Este evento aún no termina.',
  NOT_ATTENDED: 'Solo pueden calificar quienes hicieron check-in.',
  RATING_WINDOW_CLOSED: 'El plazo de 7 días para calificar ya terminó.',
};
