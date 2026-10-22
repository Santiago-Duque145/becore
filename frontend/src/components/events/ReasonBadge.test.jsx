import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { ReasonBadge } from './ReasonBadge.jsx';
import { CardHighlight } from './CardHighlight.jsx';

describe('ReasonBadge (P8)', () => {
  it('destello o check según reasonKind; el texto es solo la razón (sin "IA" ni la variante)', () => {
    const spark = renderToStaticMarkup(<ReasonBadge reason="Fútbol el sábado en la tarde, como te gusta" kind="spark" />);
    const check = renderToStaticMarkup(<ReasonBadge reason="Deporte, de lo que más te gusta" kind="check" />);
    expect(spark).toContain('M12 3l1.8 5.2'); // trazo de SparklesIcon
    expect(check).toContain('M20 6L9 17l-5-5'); // trazo de CheckIcon
    expect(spark).toContain('reason-badge');
    expect(spark).toContain('motion-reduce:animate-none');
    for (const html of [spark, check]) expect(html.replace(/<[^>]+>/g, '')).not.toMatch(/\bIA\b|Gemini|rules|\bai\b/i);
  });
});

describe('CardHighlight (P8)', () => {
  const soon = new Date(Date.now() + 2 * 24 * 3600 * 1000 + 3600 * 1000).toISOString();
  const event = { status: 'published', isFull: false, startsAt: soon, capacity: 10, confirmedCount: 9, createdAt: '2026-01-01T00:00:00Z' };

  it('un solo mensaje con ícono y texto, y nada cuando no hay qué decir', () => {
    const html = renderToStaticMarkup(<CardHighlight event={event} />);
    expect(html).toContain('¡Queda 1 cupo!');
    expect(html).toContain('<svg');
    expect(renderToStaticMarkup(<CardHighlight event={{ ...event, confirmedCount: 1 }} />)).toBe('');
    expect(renderToStaticMarkup(<CardHighlight event={event} mine />)).toBe('');
  });
});
