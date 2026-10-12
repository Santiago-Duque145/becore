import { useId, useReducer } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { queryKeys } from '../../lib/query-keys.js';
import { updatePreferences } from '../../services/profile.api.js';
import {
  DAY_OPTIONS,
  INTEREST_GROUPS,
  MAX_MOTIVATIONS,
  MAX_ZONE_LENGTH,
  MOTIVATION_OPTIONS,
  TIME_SLOT_OPTIONS,
} from '../../constants/preferences.js';
import { ChipGroup } from '../../pages/onboarding/OnboardingSteps.jsx';
import { initialOnboardingState, onboardingReducer, toOnboardingPayload } from '../../pages/onboarding/onboarding-reducer.js';
import { Button, Chip, Field, Input, useToast } from '../ui/index.js';

function fromPreferences(prefs) {
  return {
    ...initialOnboardingState(),
    interests: prefs?.interests ?? [],
    days: prefs?.days ?? [],
    timeSlots: prefs?.timeSlots ?? [],
    motivations: prefs?.motivations ?? [],
    zone: prefs?.zone ?? '',
  };
}

// "Tus gustos" en Perfil: los mismos chips del onboarding y el mismo reducer, guardados con
// PUT /me/preferences. Al guardar se refresca "Para ti" de Descubre.
export function PreferencesEditor() {
  const { profile, setProfile } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const motivationsId = useId();
  const [state, dispatch] = useReducer(onboardingReducer, profile?.preferences, fromPreferences);
  const toggle = (field) => (value) => dispatch({ type: 'toggle', field, value });

  const mutation = useMutation({
    mutationFn: async () => {
      const { role: _role, ...body } = toOnboardingPayload(state);
      return (await updatePreferences(body)).data;
    },
    onSuccess: (me) => {
      setProfile(me);
      queryClient.invalidateQueries({ queryKey: queryKeys.recommendedEvents });
      toast.success('Guardamos tus gustos.');
    },
    onError: (err) => toast.error(err.message),
  });

  const fullMotivations = state.motivations.length >= MAX_MOTIVATIONS;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="flex flex-col"
      noValidate
    >
      {INTEREST_GROUPS.map((group) => (
        <ChipGroup
          key={group.category}
          label={group.label}
          options={group.options}
          selected={state.interests}
          onToggle={toggle('interests')}
        />
      ))}
      <ChipGroup label="Días" options={DAY_OPTIONS} selected={state.days} onToggle={toggle('days')} />
      <ChipGroup label="Franja" options={TIME_SLOT_OPTIONS} selected={state.timeSlots} onToggle={toggle('timeSlots')} />

      <div role="group" aria-labelledby={motivationsId} className="mb-6">
        <h3 id={motivationsId} className="mb-3 text-xs font-semibold text-ink-muted">
          Qué buscas (hasta {MAX_MOTIVATIONS})
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {MOTIVATION_OPTIONS.map(({ slug, label }) => {
            const selected = state.motivations.includes(slug);
            return (
              <Chip key={slug} selected={selected} disabled={!selected && fullMotivations} onClick={() => toggle('motivations')(slug)}>
                {label}
              </Chip>
            );
          })}
        </div>
      </div>

      <Field label="Barrio o zona">
        <Input
          value={state.zone}
          onChange={(e) => dispatch({ type: 'setZone', zone: e.target.value })}
          placeholder="Ej.: Belén, Laureles, Envigado"
          maxLength={MAX_ZONE_LENGTH}
          autoComplete="off"
        />
      </Field>

      <Button type="submit" loading={mutation.isPending} className="w-full md:w-auto md:self-start">
        Guardar gustos
      </Button>
    </form>
  );
}
