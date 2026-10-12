import { describe, it, expect } from 'vitest';
import { initialOnboardingState, onboardingReducer, toOnboardingPayload } from './onboarding-reducer.js';

const run = (state, ...actions) => actions.reduce(onboardingReducer, state);

describe('onboardingReducer', () => {
  it('preselecciona el rol actual (participant si no hay)', () => {
    expect(initialOnboardingState('organizer').role).toBe('organizer');
    expect(initialOnboardingState(undefined).role).toBe('participant');
  });

  it('atrás conserva las respuestas', () => {
    const s = run(
      initialOnboardingState('participant'),
      { type: 'next' },
      { type: 'toggle', field: 'interests', value: 'football' },
      { type: 'next' },
      { type: 'back' },
      { type: 'back' },
    );
    expect(s.step).toBe(1);
    expect(s.interests).toEqual(['football']);
  });

  it('no pasa de 1 ni de 5', () => {
    let s = run(initialOnboardingState(), { type: 'back' });
    expect(s.step).toBe(1);
    s = run(s, ...Array(8).fill({ type: 'next' }));
    expect(s.step).toBe(5);
  });

  it('toggle agrega y quita', () => {
    const s = run(
      initialOnboardingState(),
      { type: 'toggle', field: 'days', value: 'weekends' },
      { type: 'toggle', field: 'days', value: 'weekdays' },
      { type: 'toggle', field: 'days', value: 'weekends' },
    );
    expect(s.days).toEqual(['weekdays']);
  });

  it('motivaciones: máximo 2, se puede quitar y volver a elegir', () => {
    let s = run(
      initialOnboardingState(),
      { type: 'toggle', field: 'motivations', value: 'fun' },
      { type: 'toggle', field: 'motivations', value: 'learn' },
      { type: 'toggle', field: 'motivations', value: 'health' },
    );
    expect(s.motivations).toEqual(['fun', 'learn']);
    s = run(s, { type: 'toggle', field: 'motivations', value: 'fun' }, { type: 'toggle', field: 'motivations', value: 'health' });
    expect(s.motivations).toEqual(['learn', 'health']);
  });

  it('zona recortada a 80 caracteres', () => {
    const s = run(initialOnboardingState(), { type: 'setZone', zone: 'x'.repeat(100) });
    expect(s.zone).toHaveLength(80);
  });

  it('payload: camelCase, sin zona vacía y con zona recortada', () => {
    const base = run(initialOnboardingState('participant'), { type: 'setRole', role: 'organizer' }, { type: 'toggle', field: 'timeSlots', value: 'evening' });
    expect(toOnboardingPayload(base)).toEqual({
      role: 'organizer',
      interests: [],
      days: [],
      timeSlots: ['evening'],
      motivations: [],
    });
    expect(toOnboardingPayload(run(base, { type: 'setZone', zone: '  Belén  ' })).zone).toBe('Belén');
  });
});
