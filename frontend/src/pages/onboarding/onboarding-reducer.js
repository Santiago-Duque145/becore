import { MAX_MOTIVATIONS, MAX_ZONE_LENGTH } from '../../constants/preferences.js';

// Estado del onboarding en un solo reducer (auth-onboarding §6). Volver atrás no borra nada.
// 6 pasos; si falta aceptar la política de datos (entró por Google), se antepone un paso de consentimiento: 7.
export const BASE_STEPS = 6;

export const totalSteps = (state) => BASE_STEPS + (state.needsConsent ? 1 : 0);
// En el paso de consentimiento no se avanza (ni se omite) sin aceptar
export const consentBlocks = (state) => state.needsConsent && !state.consentAccepted && state.step === 1;

// extras: { needsConsent, gender, ageRange } del perfil; sexo y edad se precargan si ya existen
export function initialOnboardingState(role, { needsConsent = false, gender = null, ageRange = null } = {}) {
  return {
    step: 1,
    needsConsent,
    consentAccepted: false,
    role: role === 'organizer' ? 'organizer' : 'participant', // preseleccionado el rol actual
    gender, // opcionales; solo estadísticas, no se usan para recomendar
    ageRange,
    interests: [],
    days: [],
    timeSlots: [],
    motivations: [],
    zone: '',
    finished: false,
  };
}

const LIST_FIELDS = ['interests', 'days', 'timeSlots', 'motivations'];
const SINGLE_FIELDS = ['gender', 'ageRange'];

export function onboardingReducer(state, action) {
  switch (action.type) {
    case 'next':
      if (consentBlocks(state)) return state;
      return { ...state, step: Math.min(state.step + 1, totalSteps(state)) };
    case 'setConsent':
      return { ...state, consentAccepted: Boolean(action.accepted) };
    case 'back':
      return { ...state, step: Math.max(state.step - 1, 1) };
    case 'setRole':
      return { ...state, role: action.role };
    case 'pick': // elección única opcional: tocar la elegida la quita
      if (!SINGLE_FIELDS.includes(action.field)) return state;
      return { ...state, [action.field]: state[action.field] === action.value ? null : action.value };
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
    ...(state.needsConsent && state.consentAccepted ? { consent: true } : {}),
    ...(state.gender ? { gender: state.gender } : {}),
    ...(state.ageRange ? { ageRange: state.ageRange } : {}),
    interests: state.interests,
    days: state.days,
    timeSlots: state.timeSlots,
    motivations: state.motivations,
    ...(zone ? { zone } : {}),
  };
}
