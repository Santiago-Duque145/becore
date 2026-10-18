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

  it('no pasa de 1 ni de 6', () => {
    let s = run(initialOnboardingState(), { type: 'back' });
    expect(s.step).toBe(1);
    s = run(s, ...Array(8).fill({ type: 'next' }));
    expect(s.step).toBe(6);
  });

  it('sexo y rango de edad: elección única opcional, tocar la elegida la quita', () => {
    let s = run(
      initialOnboardingState(),
      { type: 'pick', field: 'gender', value: 'female' },
      { type: 'pick', field: 'gender', value: 'other' },
      { type: 'pick', field: 'ageRange', value: '25-34' },
    );
    expect(s).toMatchObject({ gender: 'other', ageRange: '25-34' });
    s = run(s, { type: 'pick', field: 'gender', value: 'other' });
    expect(s.gender).toBeNull();
  });

  it('pick ignora campos que no son de elección única', () => {
    const s = initialOnboardingState();
    expect(run(s, { type: 'pick', field: 'interests', value: 'football' })).toBe(s);
  });

  it('payload: sexo y edad solo van si se eligieron (el paso es opcional)', () => {
    const base = initialOnboardingState('participant');
    expect(toOnboardingPayload(base)).not.toHaveProperty('gender');
    expect(toOnboardingPayload(base)).not.toHaveProperty('ageRange');
    const chosen = run(base, { type: 'pick', field: 'gender', value: 'prefer_not_to_say' }, { type: 'pick', field: 'ageRange', value: '55+' });
    expect(toOnboardingPayload(chosen)).toMatchObject({ gender: 'prefer_not_to_say', ageRange: '55+' });
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
