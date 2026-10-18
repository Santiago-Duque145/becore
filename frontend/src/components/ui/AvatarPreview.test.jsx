import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { toPreviewPerson } from '../../lib/avatar-preview.js';
import { AvatarPreviewView } from './AvatarPreview.jsx';

const render = (input) =>
  renderToStaticMarkup(<AvatarPreviewView person={toPreviewPerson(input)} handlers={{}} onClose={() => {}} />);

describe('AvatarPreviewView', () => {
  const html = render({ name: 'Ana Gómez', role: 'participant', src: 'https://cdn.test/a.webp', email: 'ana@correo.com' });

  it('es un diálogo modal accesible con la etiqueta "Foto de {nombre}"', () => {
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-label="Foto de Ana"');
  });

  it('tiene el botón de cerrar con aria-label', () => expect(html).toMatch(/<button[^>]*aria-label="Cerrar"/));

  it('muestra solo el nombre de pila y el rol; nunca el correo ni los apellidos', () => {
    expect(html).toContain('>Ana<');
    expect(html).toContain('>Participante<');
    expect(html).not.toMatch(/ana@correo|Gómez/);
  });

  it('usa la misma URL de la foto y un skeleton mientras carga', () => {
    expect(html).toContain('src="https://cdn.test/a.webp"');
    expect(html).toContain('animate-pulse');
  });

  it('sin foto muestra el avatar predefinido o las iniciales, sin imagen ni skeleton', () => {
    const preset = render({ name: 'Luis Pérez', role: 'organizer', preset: 'goleador' });
    expect(preset).toContain('<svg');
    expect(preset).toContain('>Organizador<');
    expect(preset).not.toContain('<img');
    const initials = render({ name: 'Luis Pérez', role: 'organizer' });
    expect(initials).not.toContain('<img');
    expect(initials).not.toContain('animate-pulse');
  });

  it('el botón "Cambiar foto" solo aparece cuando se pide', () => {
    expect(html).not.toContain('Cambiar foto');
    expect(render({ name: 'Ana', action: { label: 'Cambiar foto', onClick() {} } })).toContain('Cambiar foto');
  });
});
