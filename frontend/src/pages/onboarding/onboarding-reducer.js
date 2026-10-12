import { MAX_MOTIVATIONS, MAX_ZONE_LENGTH } from '../../constants/preferences.js';

// Estado del onboarding en un solo reducer (auth-onboarding §6). Volver atrás no borra nada.
export const TOTAL_STEPS = 5;

export function initialOnboardingState(role) {
  return {
    step: 1,
    role: role === 'organizer' ? 'organizer' : 'participant', // preseleccionado el rol actual
    interests: [],
    days: [],
    timeSlots: [],
    motivations: [],
    zone: '',
    finished: false,
  };
}

const LIST_FIELDS = ['interests', 'days', 'timeSlots', 'motivations'];

export function onboardingReducer(state, action) {
  switch (action.type) {
    case 'next':
      return { ...state, step: Math.min(state.step + 1, TOTAL_STEPS) };
    case 'back':
      return { ...state, step: Math.max(state.step - 1, 1) };
    case 'setRole':
      return { ...state, role: action.role };
    case 'toggle': {
      if (!LIST_FIELDS.includes(action.field)) return state;
      const list = state[action.field];
      if (list.includes(action.value)) return { ...state, [action.field]: list.filter((v) => v !== action.value) };
      if (action.field === 'motivations' && list.length >= MAX_MOTIVATIONS) return state;
      return { ...state, [action.field]: [...list, action.value] };
    }
    case 'setZone':
      return { ...state, zone: action.zone.slice(0, MAX_ZONE_LENGTH) };
    case 'finish':
      return { ...state, finished: true };
    default:
      return state;
  }
}

// Body de PUT /me/onboarding (api.md). zone vacía no se envía.
export function toOnboardingPayload(state) {
  const zone = state.zone.trim();
  return {
    role: state.role,
    interests: state.interests,
    days: state.days,
    timeSlots: state.timeSlots,
    motivations: state.motivations,
    ...(zone ? { zone } : {}),
  };
}
