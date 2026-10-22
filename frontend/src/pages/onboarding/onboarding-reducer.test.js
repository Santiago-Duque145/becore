import { describe, it, expect } from 'vitest';
import { consentBlocks, initialOnboardingState, onboardingReducer, toOnboardingPayload, totalSteps } from './onboarding-reducer.js';

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

describe('onboarding con consentimiento y precarga', () => {
  const google = initialOnboardingState('participant', { needsConsent: true });

  it('quien aún no aceptó (Google): 7 pasos y el consentimiento es el primero', () => {
    expect(totalSteps(google)).toBe(7);
    expect(totalSteps(initialOnboardingState('participant'))).toBe(6);
    expect(consentBlocks(google)).toBe(true);
  });

  it('sin aceptar no se avanza; al aceptar sí; y desmarcar vuelve a bloquear', () => {
    expect(run(google, { type: 'next' }).step).toBe(1);
    const accepted = run(google, { type: 'setConsent', accepted: true });
    expect(consentBlocks(accepted)).toBe(false);
    expect(run(accepted, { type: 'next' }).step).toBe(2);
    expect(run(accepted, { type: 'setConsent', accepted: false }, { type: 'next' }).step).toBe(1);
  });

  it('llega hasta el paso 7 y no pasa', () => {
    const s = run(google, { type: 'setConsent', accepted: true }, ...Array(10).fill({ type: 'next' }));
    expect(s.step).toBe(7);
  });

  it('el payload lleva consent: true solo si se aceptó en este onboarding', () => {
    expect(toOnboardingPayload(google)).not.toHaveProperty('consent');
    expect(toOnboardingPayload(run(google, { type: 'setConsent', accepted: true })).consent).toBe(true);
    // quien ya había aceptado (correo) no ve el paso y no reenvía el consentimiento
    expect(toOnboardingPayload(initialOnboardingState('participant'))).not.toHaveProperty('consent');
  });

  it('sexo y edad se precargan si ya existen y viajan en el payload', () => {
    const s = initialOnboardingState('participant', { gender: 'female', ageRange: '25-34' });
    expect(s).toMatchObject({ gender: 'female', ageRange: '25-34' });
    expect(toOnboardingPayload(s)).toMatchObject({ gender: 'female', ageRange: '25-34' });
  });

  it('sin datos previos quedan vacíos', () => {
    expect(initialOnboardingState('participant', { gender: null, ageRange: null })).toMatchObject({ gender: null, ageRange: null });
  });
});
