import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect } from 'vitest';
import { queryKeys } from '../../lib/query-keys.js';
import { AiMetricsPanel } from './AiMetricsPanel.jsx';

const zero = { users: 0, shown: 0, clicked: 0, confirmed: 0, ctr: null, confirmRate: null, avgRating: null, ratings: 0 };
function render(data) {
  const client = new QueryClient();
  client.setQueryData(queryKeys.aiMetrics, data);
  return renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <AiMetricsPanel />
    </QueryClientProvider>,
  );
}

describe('AiMetricsPanel', () => {
  it('sin datos: estado vacío que explica cuándo aparecen', () => {
    const html = render({ rules: zero, ai: { ...zero, bySource: { gemini: zero, template: zero } }, excludedDemoRows: 0 });
    expect(html).toContain('Recomendaciones IA vs reglas');
    expect(html).toContain('Aún no hay datos de la prueba.');
    expect(html).not.toContain('<table');
  });

  it('con datos: tabla accesible reglas vs IA, línea Gemini/plantilla y aviso de muestra pequeña', () => {
    const rules = { ...zero, users: 2, shown: 3, clicked: 1, confirmed: 1, ctr: 0.333, confirmRate: 0.333, avgRating: 4 };
    const ai = { ...zero, users: 1, shown: 2, clicked: 1, confirmed: 1, ctr: 0.5, confirmRate: 0.5 };
    const html = render({ rules, ai: { ...ai, bySource: { gemini: { ...zero, shown: 2, confirmed: 1 }, template: { ...zero, shown: 1 } } } });
    expect(html).toContain('<caption class="sr-only">');
    expect(html).toMatch(/<th scope="row"[^>]*>Confirmados<\/th><td[^>]*>1 · 33 %<\/td><td[^>]*>1 · 50 %<\/td>/);
    expect(html).toContain('Frases de Gemini: 2 mostrados, 1 confirmados');
    expect(html).toContain('Muestra pequeña');
  });
});
