import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, it, expect } from 'vitest';
import { ParaTiCarousel } from './ParaTiCarousel.jsx';

const render = (props) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <ParaTiCarousel {...props} />
    </MemoryRouter>,
  );

describe('"Para ti" vacío', () => {
  it('si ya confirmó todo, la sección no desaparece: estado vacío amable con una acción', () => {
    const html = render({ events: [], emptyReason: 'all_confirmed' });
    expect(html).toContain('>Para ti</h2>');
    expect(html).toContain('Ya estás en todo lo que encaja contigo.');
    expect(html).toContain('Explora más abajo');
    expect(html).toMatch(/href="\/mis-eventos"[^>]*>Ver mis eventos</);
  });

  it('si nada encaja, invita a mirar abajo o ajustar los gustos', () => {
    const html = render({ events: [], emptyReason: 'no_matches' });
    expect(html).toContain('Aún no hay eventos que encajen con tus gustos.');
    expect(html).toMatch(/href="\/perfil"[^>]*>Ajustar mis gustos</);
  });

  it('sin gustos, sin eventos o con error no se muestra nada', () => {
    for (const emptyReason of ['no_preferences', 'no_events', null, undefined]) {
      expect(render({ events: [], emptyReason })).toBe('');
    }
  });
});
