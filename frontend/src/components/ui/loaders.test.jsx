import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { LOADING_PHRASES, SLOW_MESSAGE } from '../../constants/loading.js';
import { BrandLoader } from './BrandLoader.jsx';
import { Button } from './Button.jsx';
import { FullScreenLoader } from './FullScreenLoader.jsx';
import { GoogleButton } from './GoogleButton.jsx';
import { Skeleton } from './Skeleton.jsx';
import { Spinner } from './Spinner.jsx';

const html = (el) => renderToStaticMarkup(el);
const srText = (markup) => [...markup.matchAll(/<span class="sr-only">([^<]*)<\/span>/g)].map((m) => m[1]);

describe('BrandLoader', () => {
  const md = html(<BrandLoader />);

  it('anuncia "Cargando" una sola vez (role="status", aria-live polite) y la frase va aria-hidden', () => {
    expect(md).toContain('role="status"');
    expect(md).toContain('aria-live="polite"');
    expect(srText(md)).toEqual(['Cargando']);
    const phrase = md.match(/<p aria-hidden="true"[^>]*>([^<]*)<\/p>/);
    expect(LOADING_PHRASES).toContain(phrase[1]);
  });

  it('dibuja el isotipo con trazo, las cuatro líneas de color y los tres puntos', () => {
    expect(md).toContain('data-loader="brand"');
    expect(md.match(/animate-loader-streak/g)).toHaveLength(4);
    for (const color of ['accent', 'success', 'action', 'culture']) expect(md).toContain(`var(--color-${color})`);
    expect(md.match(/animate-loader-dot/g)).toHaveLength(3);
    expect(md).toContain('animate-loader-trace');
  });

  it('tamaños sm/md/lg = 32/52/72 px; sm sin frases', () => {
    expect(html(<BrandLoader size="sm" />)).toMatch(/<svg width="32"/);
    expect(md).toMatch(/<svg width="52"/);
    expect(html(<BrandLoader size="lg" />)).toMatch(/<svg width="72"/);
    expect(html(<BrandLoader size="sm" />)).not.toContain('<p ');
  });

  it('con prefers-reduced-motion todo queda quieto: cada pieza animada lleva motion-reduce:animate-none', () => {
    const animated = md.match(/animate-(loader|phrase)[\w-]*/g).length;
    expect(md.match(/motion-reduce:animate-none/g).length).toBe(animated);
  });

  it('variantes por categoría: balón que rebota, nota que vibra, árbol que se mece', () => {
    expect(html(<BrandLoader category="sport" />)).toMatch(/data-loader="sport"[\s\S]*animate-ball-bounce/);
    expect(html(<BrandLoader category="culture" />)).toMatch(/data-loader="culture"[\s\S]*animate-note-shake/);
    expect(html(<BrandLoader category="recreation" />)).toMatch(/data-loader="recreation"[\s\S]*animate-tree-sway/);
    expect(html(<BrandLoader category="raro" />)).toContain('data-loader="other"');
    expect(html(<BrandLoader category="sport" />)).not.toContain('data-loader="brand"');
  });

  it('un mensaje fijo reemplaza las frases y es lo que se anuncia', () => {
    const slow = html(<BrandLoader message={SLOW_MESSAGE} />);
    expect(srText(slow)).toEqual([SLOW_MESSAGE]);
    expect(slow).toContain(`>${SLOW_MESSAGE}</p>`);
  });
});

describe('FullScreenLoader', () => {
  it('los primeros 300 ms solo pinta el fondo (sin parpadeo)', () => {
    const first = html(<FullScreenLoader />);
    expect(first).toContain('bg-bg');
    expect(first).not.toContain('role="status"');
  });

  it('immediate lo muestra ya (quien lo usa esperó los 300 ms con useLoaderVisibility)', () => {
    expect(html(<FullScreenLoader immediate />)).toContain('role="status"');
  });

  it('pasado el límite: "Esto está tardando más de lo normal…" con Reintentar', () => {
    const slow = html(<FullScreenLoader immediate slowAfter={0} />);
    expect(slow).toContain(SLOW_MESSAGE);
    expect(slow).toMatch(/<button[^>]*>Reintentar<\/button>/);
  });

  it('slowAfter={null} nunca muestra el aviso', () => {
    expect(html(<FullScreenLoader immediate slowAfter={null} />)).not.toContain('Reintentar');
  });
});

describe('botones, skeleton y spinner', () => {
  it('Button loading: tres puntos que rebotan en lugar del spinner, deshabilitado y aria-busy', () => {
    const button = html(<Button loading>Guardar</Button>);
    expect(button).toContain('aria-busy="true"');
    expect(button).toContain('disabled=""');
    expect(button.match(/animate-dot-bounce/g)).toHaveLength(3);
    expect(button).not.toContain('animate-spin');
  });

  it('GoogleButton loading usa los mismos puntos', () => {
    const google = html(<GoogleButton loading />);
    expect(google).toContain('data-loading-dots');
    expect(google).not.toContain('animate-spin');
  });

  it('Skeleton: barrido de marca en lugar del pulso gris', () => {
    const block = html(<Skeleton className="h-4" />);
    expect(block).toContain('skeleton-sweep');
    expect(block).not.toContain('animate-pulse');
  });

  it('Spinner es el BrandLoader pequeño con su texto fijo', () => {
    const spinner = html(<Spinner label="Verificando tu código" />);
    expect(spinner).toMatch(/<svg width="32"/);
    expect(spinner).toContain('Verificando tu código…');
    expect(srText(spinner)).toEqual(['Verificando tu código…']);
  });
});

describe('CSS y páginas estáticas', () => {
  it('el barrido del skeleton y los loaders se apagan con prefers-reduced-motion', async () => {
    const css = await readFile(new URL('../../index.css', import.meta.url), 'utf8');
    expect(css).toMatch(/@utility skeleton-sweep[\s\S]*prefers-reduced-motion: reduce[\s\S]*animation: none/);
    // los bucles de los loaders solo animan transform y opacity (salvo el trazo de la "B")
    const block = css.slice(css.indexOf('@keyframes loader-fill'), css.indexOf('@utility origin-self'));
    const props = [...block.matchAll(/^\s+([a-z-]+):/gm)].map((m) => m[1]);
    expect(new Set(props)).toEqual(new Set(['opacity', 'transform']));
  });

  it('"Sin conexión" muestra el balón quieto y el texto del plan', async () => {
    const offline = await readFile(new URL('../../../public/offline.html', import.meta.url), 'utf8');
    expect(offline).toContain('Parece que se fue la señal. Revisa tu conexión.');
    expect(offline).toContain('<circle cx="12" cy="12" r="10" />');
  });

  it('index.html trae el isotipo de arranque que aparece a los 300 ms', async () => {
    const index = await readFile(new URL('../../../index.html', import.meta.url), 'utf8');
    expect(index).toMatch(/<div id="root">\s*<div class="boot"/);
    expect(index).toContain('boot-in 200ms ease-out 300ms');
  });
});
