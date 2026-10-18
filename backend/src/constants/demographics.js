// Datos demográficos opcionales (solo estadísticas agregadas; NO se usan para recomendar ni se envían a IA).
// Deben ser idénticos al tipo gender_identity y al check de profiles.age_range de
// supabase/migrations/20261021120000_demographics_consent.sql y a frontend/src/constants/preferences.js.
export const GENDERS = ['female', 'male', 'other', 'prefer_not_to_say'];
export const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55+'];

export const GENDER_LABELS = { female: 'Mujer', male: 'Hombre', other: 'Otro', prefer_not_to_say: 'Prefiero no decirlo' };
