import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { EventTags, tagLabels } from './EventTags.jsx';

describe('EventTags (IA2)', () => {
  it('muestra los gustos en español como lista de solo lectura', () => {
    const html = renderToStaticMarkup(<EventTags tags={['football', 'music']} />);
    expect(html).toContain('aria-label="Gustos de este evento"');
    expect(html).toContain('>Fútbol</li>');
    expect(html).toContain('>Música y conciertos</li>');
    expect(html).not.toContain('<button');
  });

  it('ignora slugs desconocidos y no pinta nada sin etiquetas', () => {
    expect(tagLabels(['golf', 'dance'])).toEqual(['Danza']);
    expect(renderToStaticMarkup(<EventTags tags={[]} />)).toBe('');
    expect(renderToStaticMarkup(<EventTags />)).toBe('');
  });
});
