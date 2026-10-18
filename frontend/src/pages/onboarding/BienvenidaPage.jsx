import { useEffect, useReducer, useRef } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useCompleteOnboarding } from '../../hooks/useCompleteOnboarding.js';
import { homePathFor } from '../../layouts/navigation.js';
import { ChevronLeftIcon } from '../../components/icons/index.js';
import { Button, ProgressSteps, useToast } from '../../components/ui/index.js';
import { consentBlocks, initialOnboardingState, onboardingReducer, toOnboardingPayload, totalSteps } from './onboarding-reducer.js';
import { stepsFor } from './OnboardingSteps.jsx';
import { OnboardingDone } from './OnboardingDone.jsx';

// Estado inicial desde el perfil: rol actual, consentimiento pendiente y sexo/edad ya guardados (precargados)
const startState = (profile) =>
  initialOnboardingState(profile?.role, {
    needsConsent: profile?.dataConsentAccepted === false,
    gender: profile?.gender ?? null,
    ageRange: profile?.ageRange ?? null,
  });

// Onboarding de 6 pasos (7 si antes falta aceptar la política de datos; auth-onboarding §6). El estado vive en un solo useReducer: atrás no borra nada
// y si el guardado falla, el usuario sigue en el mismo paso con lo que eligió.
export default function BienvenidaPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const [state, dispatch] = useReducer(onboardingReducer, profile, startState);
  const titleRef = useRef(null);
  const firstRender = useRef(true);
  const modeRef = useRef('finish'); // 'finish' (último paso) u 'skip' (Omitir)

  const mutation = useCompleteOnboarding({
    // Se marca el final antes de que el perfil pase a completado, en el mismo render
    onSuccess: () => modeRef.current === 'finish' && dispatch({ type: 'finish' }),
  });

  // Foco al título del paso al cambiar de paso (no al entrar)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    titleRef.current?.focus();
  }, [state.step]);

  const firstName = profile?.fullName?.trim().split(/\s+/)[0];

  if (state.finished) return <OnboardingDone firstName={firstName} homePath={homePathFor(state.role)} />;
  // Ya completo (usuario del seed, o "Omitir" terminó): al inicio de su rol
  if (profile?.onboardingCompleted) return <Navigate to={homePathFor(profile.role)} replace />;

  function save(mode) {
    modeRef.current = mode;
    mutation.mutate(toOnboardingPayload(state), {
      onError: (error) =>
        toast.error(error.message, { action: { label: 'Reintentar', onClick: () => save(mode) } }),
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (mutation.isPending) return;
    if (consentBlocks(state)) return;
    if (state.step < total) dispatch({ type: 'next' });
    else save('finish');
  }

  const total = totalSteps(state);
  const Step = stepsFor(state.needsConsent)[state.step - 1];
  const saving = mutation.isPending;
  const isLast = state.step === total;
  const blocked = consentBlocks(state); // sin aceptar la política no se avanza ni se omite

  return (
    <form onSubmit={handleSubmit} noValidate className="flex min-h-dvh flex-col bg-bg">
      <header className="pt-safe sticky top-0 z-10 bg-bg/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-xl items-center gap-3 px-[22px]">
          {state.step > 1 ? (
            <button
              type="button"
              onClick={() => dispatch({ type: 'back' })}
              disabled={saving}
              aria-label="Atrás"
              className="focus-ring -ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-field text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
            >
              <ChevronLeftIcon size={22} />
            </button>
          ) : (
            <span className="-ml-2 h-11 w-11 shrink-0" aria-hidden="true" />
          )}
          <ProgressSteps total={total} current={state.step} className="flex-1" />
          <button
            type="button"
            onClick={() => save('skip')}
            disabled={saving || blocked}
            aria-busy={(saving && modeRef.current === 'skip') || undefined}
            className="focus-ring -mr-2 min-h-11 shrink-0 rounded-field px-2 text-xs font-semibold text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
          >
            Omitir
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-[22px] pt-4 pb-36">
        <div key={state.step} className="animate-enter motion-reduce:animate-none">
          <Step state={state} dispatch={dispatch} titleRef={titleRef} firstName={firstName} />
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-bg from-70% to-transparent">
        <div className="mx-auto w-full max-w-xl px-[22px] pt-6 pb-[max(20px,env(safe-area-inset-bottom))]">
          <Button type="submit" loading={saving && modeRef.current === 'finish'} disabled={saving || blocked} className="w-full">
            {isLast ? 'Ver mis eventos' : 'Continuar'}
          </Button>
        </div>
      </div>
    </form>
  );
}
