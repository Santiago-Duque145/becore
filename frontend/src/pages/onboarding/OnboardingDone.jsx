import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { CheckIcon } from '../../components/icons/index.js';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';
import { Confetti } from './Confetti.jsx';

// Con movimiento se espera a que termine el confeti (1.5 s); sin movimiento, los 1.2 s de siempre
const REDIRECT_MS = 1600;
const REDIRECT_REDUCED_MS = 1200;

// Final del onboarding (auth-onboarding §6): check animado con confeti (P1) y luego al inicio de su rol
export function OnboardingDone({ firstName, homePath }) {
  const navigate = useNavigate();
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const delay = reducedMotion ? REDIRECT_REDUCED_MS : REDIRECT_MS;

  useEffect(() => {
    const timer = setTimeout(() => navigate(homePath, { replace: true }), delay);
    return () => clearTimeout(timer);
  }, [navigate, homePath, delay]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 overflow-hidden bg-bg px-[22px] text-center md:bg-hero">
      <span className="relative flex h-20 w-20 animate-pop items-center justify-center rounded-full bg-accent/15 text-accent motion-reduce:animate-none">
        <Confetti />
        <CheckIcon size={40} className="animate-draw [stroke-dasharray:24] motion-reduce:animate-none" />
      </span>
      <div role="status">
        <h1 className="font-display text-[22px] font-semibold text-ink">
          {firstName ? `¡Listo, ${firstName}!` : '¡Listo!'}
        </h1>
        <p className="mt-1.5 text-sm text-ink-muted">Ya tenemos planes para ti</p>
      </div>
    </main>
  );
}
