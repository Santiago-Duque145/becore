import { forwardRef, useId } from 'react';
import { CalendarIcon, UsersIcon } from '../../components/icons/index.js';
import { Chip, Field, Input, OptionCard } from '../../components/ui/index.js';
import { DemographicsFields } from '../../components/preferences/DemographicsFields.jsx';
import {
  DAY_OPTIONS,
  INTEREST_GROUPS,
  MAX_MOTIVATIONS,
  MAX_ZONE_LENGTH,
  MOTIVATION_OPTIONS,
  ROLE_OPTIONS,
  TIME_SLOT_OPTIONS,
} from '../../constants/preferences.js';

// Los 6 pasos de /bienvenida con los textos de auth-onboarding §6.
// Cada paso recibe el estado del reducer, dispatch y la ref del título (recibe el foco al cambiar de paso).

const ROLE_ICONS = { participant: UsersIcon, organizer: CalendarIcon };

const StepHeading = forwardRef(function StepHeading({ id, title, subtitle }, ref) {
  return (
    <div className="mb-6">
      <h1
        ref={ref}
        id={id}
        tabIndex={-1}
        className="font-display text-xl font-semibold text-ink outline-none md:text-[22px]"
      >
        {title}
      </h1>
      {subtitle && <p className="mt-1.5 text-[13px] text-ink-muted">{subtitle}</p>}
    </div>
  );
});

// Grupo de chips multiselección con su subtítulo como etiqueta accesible
export function ChipGroup({ label, options, selected, onToggle }) {
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId} className="mb-6">
      <h2 id={labelId} className="mb-3 text-xs font-semibold text-ink-muted">
        {label}
      </h2>
      <div className="flex flex-wrap gap-2.5">
        {options.map(({ slug, label: text }) => (
          <Chip key={slug} selected={selected.includes(slug)} onClick={() => onToggle(slug)}>
            {text}
          </Chip>
        ))}
      </div>
    </div>
  );
}

export function RoleStep({ state, dispatch, titleRef, firstName }) {
  const titleId = useId();
  return (
    <>
      <p className="mb-2 font-display text-[22px] font-semibold text-ink">
        {firstName ? `¡Hola, ${firstName}!` : '¡Hola!'}
      </p>
      <StepHeading ref={titleRef} id={titleId} title="¿Cómo quieres usar Be Core?" />
      <div role="group" aria-labelledby={titleId} className="flex flex-col gap-3">
        {ROLE_OPTIONS.map(({ value, title, description }) => (
          <OptionCard
            key={value}
            icon={ROLE_ICONS[value]}
            title={title}
            description={description}
            selected={state.role === value}
            onClick={() => dispatch({ type: 'setRole', role: value })}
          />
        ))}
      </div>
    </>
  );
}

// Opcional y solo para estadísticas agregadas del proyecto: no cambia las recomendaciones
export function DemographicsStep({ state, dispatch, titleRef }) {
  const titleId = useId();
  return (
    <>
      <StepHeading
        ref={titleRef}
        id={titleId}
        title="Cuéntanos un poco de ti"
        subtitle="Es opcional. Solo lo usamos para estadísticas anónimas del proyecto; no cambia tus recomendaciones."
      />
      <div role="group" aria-labelledby={titleId}>
        <DemographicsFields
          gender={state.gender}
          ageRange={state.ageRange}
          onGender={(value) => dispatch({ type: 'pick', field: 'gender', value })}
          onAgeRange={(value) => dispatch({ type: 'pick', field: 'ageRange', value })}
        />
      </div>
    </>
  );
}

export function InterestsStep({ state, dispatch, titleRef }) {
  const titleId = useId();
  const toggle = (value) => dispatch({ type: 'toggle', field: 'interests', value });
  return (
    <>
      <StepHeading
        ref={titleRef}
        id={titleId}
        title="¿Qué te mueve?"
        subtitle="Elige todo lo que te guste. Mínimo uno para recomendarte mejor."
      />
      <div role="group" aria-labelledby={titleId}>
        {INTEREST_GROUPS.map((group) => (
          <ChipGroup
            key={group.category}
            label={group.label}
            options={group.options}
            selected={state.interests}
            onToggle={toggle}
          />
        ))}
      </div>
    </>
  );
}

export function AvailabilityStep({ state, dispatch, titleRef }) {
  const titleId = useId();
  return (
    <>
      <StepHeading ref={titleRef} id={titleId} title="¿Cuándo tienes tiempo?" />
      <div role="group" aria-labelledby={titleId}>
        <ChipGroup
          label="Días"
          options={DAY_OPTIONS}
          selected={state.days}
          onToggle={(value) => dispatch({ type: 'toggle', field: 'days', value })}
        />
        <ChipGroup
          label="Franja"
          options={TIME_SLOT_OPTIONS}
          selected={state.timeSlots}
          onToggle={(value) => dispatch({ type: 'toggle', field: 'timeSlots', value })}
        />
      </div>
    </>
  );
}

export function MotivationStep({ state, dispatch, titleRef }) {
  const titleId = useId();
  const full = state.motivations.length >= MAX_MOTIVATIONS;
  return (
    <>
      <StepHeading ref={titleRef} id={titleId} title="¿Qué buscas en un evento?" subtitle="Elige hasta 2." />
      <div role="group" aria-labelledby={titleId} className="flex flex-wrap gap-2.5">
        {MOTIVATION_OPTIONS.map(({ slug, label }) => {
          const selected = state.motivations.includes(slug);
          return (
            <Chip
              key={slug}
              selected={selected}
              disabled={!selected && full}
              onClick={() => dispatch({ type: 'toggle', field: 'motivations', value: slug })}
            >
              {label}
            </Chip>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-ink-muted" aria-live="polite">
        {state.motivations.length} de {MAX_MOTIVATIONS} elegidas
      </p>
    </>
  );
}

export function ZoneStep({ state, dispatch, titleRef }) {
  return (
    <>
      <StepHeading
        ref={titleRef}
        title="¿Por dónde te mueves?"
        subtitle="Así te mostramos planes cerca. Es opcional."
      />
      <Field label="Barrio o zona">
        <Input
          value={state.zone}
          onChange={(e) => dispatch({ type: 'setZone', zone: e.target.value })}
          placeholder="Ej.: Belén, Laureles, Envigado"
          maxLength={MAX_ZONE_LENGTH}
          autoComplete="off"
          enterKeyHint="done"
        />
      </Field>
    </>
  );
}

export const STEPS = [RoleStep, DemographicsStep, InterestsStep, AvailabilityStep, MotivationStep, ZoneStep];
