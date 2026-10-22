// IA4 · formato de las métricas de la prueba A/B (docs/specs/ai.md §10). Funciones puras.

const decimal = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1, minimumFractionDigits: 1 });

// Tasas: null (sin mostrados) → "—"; 0,333 → "33 %" (con espacio, como "Cupos ocupados" del panel)
export const formatRate = (value) => (value == null ? '—' : `${Math.round(value * 100)} %`);

// Calificación promedio: null → "—"; 4,25 → "4,3 ★"
export const formatStars = (value) => (value == null ? '—' : `${decimal.format(value)} ★`);

// Con menos de 30 personas por variante se reporta como estudio exploratorio (sin afirmar significancia)
export const SMALL_SAMPLE = 30;
export const isSmallSample = (metrics) => Math.min(metrics.rules.users, metrics.ai.users) < SMALL_SAMPLE;

export const hasData = (metrics) => metrics.rules.shown + metrics.ai.shown > 0;

// Filas de la tabla comparativa: [etiqueta, valor reglas, valor IA]
export function comparisonRows(metrics) {
  const { rules, ai } = metrics;
  return [
    ['Personas', rules.users, ai.users],
    ['Mostrados', rules.shown, ai.shown],
    ['Abiertos (CTR)', `${rules.clicked} · ${formatRate(rules.ctr)}`, `${ai.clicked} · ${formatRate(ai.ctr)}`],
    ['Confirmados', `${rules.confirmed} · ${formatRate(rules.confirmRate)}`, `${ai.confirmed} · ${formatRate(ai.confirmRate)}`],
    ['Calificación', formatStars(rules.avgRating), formatStars(ai.avgRating)],
  ];
}

// Dentro de la variante IA: cuánto vino de verdad de Gemini y cuánto de la plantilla
export function sourceLine({ gemini, template }) {
  return `Frases de Gemini: ${gemini.shown} mostrados, ${gemini.confirmed} confirmados · Plantilla: ${template.shown} mostrados, ${template.confirmed} confirmados`;
}
