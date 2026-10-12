import { describe, it, expect } from 'vitest';
import * as front from './preferences.js';
import * as back from '../../../backend/src/constants/preferences.js';

// Si alguien cambia una lista en un lado y no en el otro, el PUT /me/onboarding devolvería 400
describe('preferencias: frontend y backend sincronizados', () => {
  it('gustos: mismos slugs, mismo orden y misma categoría', () => {
    const frontInterests = front.INTEREST_GROUPS.flatMap((g) => g.options.map((o) => ({ slug: o.slug, category: g.category })));
    expect(frontInterests).toEqual(back.INTERESTS);
  });

  it('gustos: mismos textos y grupos', () => {
    for (const group of front.INTEREST_GROUPS) {
      expect(group.label).toBe(back.CATEGORY_GROUP_LABELS[group.category]);
      for (const { slug, label } of group.options) expect(label).toBe(back.INTEREST_LABELS[slug]);
    }
  });

  it('días, franjas y motivaciones: mismos slugs, orden y textos', () => {
    expect(front.DAY_OPTIONS.map((o) => o.slug)).toEqual(back.DAYS);
    expect(front.TIME_SLOT_OPTIONS.map((o) => o.slug)).toEqual(back.TIME_SLOTS);
    expect(front.MOTIVATION_OPTIONS.map((o) => o.slug)).toEqual(back.MOTIVATIONS);
    for (const o of front.DAY_OPTIONS) expect(o.label).toBe(back.DAY_LABELS[o.slug]);
    for (const o of front.TIME_SLOT_OPTIONS) expect(o.label).toBe(back.TIME_SLOT_LABELS[o.slug]);
    for (const o of front.MOTIVATION_OPTIONS) expect(o.label).toBe(back.MOTIVATION_LABELS[o.slug]);
  });

  it('límites iguales', () => {
    expect(front.MAX_MOTIVATIONS).toBe(back.MAX_MOTIVATIONS);
    expect(front.MAX_ZONE_LENGTH).toBe(back.MAX_ZONE_LENGTH);
  });
});
