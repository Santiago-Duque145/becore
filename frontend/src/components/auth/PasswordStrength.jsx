import { cn } from '../../lib/cn.js';
import { passwordStrength } from '../../lib/password-strength.js';

// Débil / buena / fuerte en danger / action / success + texto (auth-onboarding §5).
// El estado no va solo en color: siempre lleva la palabra.
const LEVELS = {
  weak: { label: 'Débil', bars: 1, bar: 'bg-danger', text: 'text-danger' },
  good: { label: 'Buena', bars: 2, bar: 'bg-action', text: 'text-action' },
  strong: { label: 'Fuerte', bars: 3, bar: 'bg-success', text: 'text-success' },
};

export function PasswordStrength({ password, id }) {
  const level = LEVELS[passwordStrength(password)];
  if (!level) return null;
  return (
    <div id={id} className="-mt-2 mb-4 flex items-center gap-3" aria-live="polite">
      <div className="flex flex-1 gap-1.5" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={cn('h-1 flex-1 rounded-full transition-colors duration-200 motion-reduce:transition-none', n <= level.bars ? level.bar : 'bg-line')}
          />
        ))}
      </div>
      <p className="text-xs text-ink-muted">
        Seguridad: <span className={cn('font-semibold', level.text)}>{level.label}</span>
      </p>
    </div>
  );
}
