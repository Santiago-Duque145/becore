import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { CheckIcon } from '../../components/icons/index.js';

const REDIRECT_MS = 1200;

// Final del onboarding (auth-onboarding §6): check animado y a los 1.2 s al inicio de su rol
export function OnboardingDone({ firstName, homePath }) {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate(homePath, { replace: true }), REDIRECT_MS);
    return () => clearTimeout(timer);
  }, [navigate, homePath]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-bg px-[22px] text-center md:bg-hero">
      <span className="flex h-20 w-20 animate-pop items-center justify-center rounded-full bg-accent/15 text-accent motion-reduce:animate-none">
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
