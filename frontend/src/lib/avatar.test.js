import { describe, it, expect } from 'vitest';
import { resolveAvatar } from './avatar.js';

describe('resolveAvatar', () => {
  it('la foto subida manda sobre todo', () =>
    expect(resolveAvatar({ avatarUrl: 'a.webp', avatarPreset: 'goleador' }, 'g.jpg')).toEqual({ src: 'a.webp', preset: null }));
  it('el avatar elegido gana sobre la foto de Google', () =>
    expect(resolveAvatar({ avatarPreset: 'goleador' }, 'g.jpg')).toEqual({ src: null, preset: 'goleador' }));
  it('sin nada propio usa la de Google', () => expect(resolveAvatar({}, 'g.jpg')).toEqual({ src: 'g.jpg', preset: null }));
  it('si no hay nada quedan las iniciales', () => expect(resolveAvatar(undefined)).toEqual({ src: null, preset: null }));
});
