import { useId } from 'react';
import { AGE_RANGE_OPTIONS, GENDER_OPTIONS } from '../../constants/preferences.js';
import { Chip } from '../ui/index.js';

// Elección única opcional: tocar la elegida la quita (onChange recibe el slug tocado)
function SingleChoiceGroup({ label, options, value, onChange }) {
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId} className="mb-6">
      <h2 id={labelId} className="mb-3 text-xs font-semibold text-ink-muted">
        {label}
      </h2>
      <div className="flex flex-wrap gap-2.5">
        {options.map(({ slug, label: text }) => (
          <Chip key={slug} selected={value === slug} onClick={() => onChange(slug)}>
            {text}
          </Chip>
        ))}
      </div>
    </div>
  );
}

// "¿Con qué te identificas?" y "Rango de edad": opcionales, solo para estadísticas agregadas.
// Los usan el onboarding, el diálogo de consentimiento y Perfil.
export function DemographicsFields({ gender, ageRange, onGender, onAgeRange }) {
  return (
    <>
      <SingleChoiceGroup label="¿Con qué te identificas?" options={GENDER_OPTIONS} value={gender} onChange={onGender} />
      <SingleChoiceGroup label="Rango de edad" options={AGE_RANGE_OPTIONS} value={ageRange} onChange={onAgeRange} />
    </>
  );
}
