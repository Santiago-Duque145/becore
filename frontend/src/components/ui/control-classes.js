import { cn } from '../../lib/cn.js';

// Estilo común de Input, PasswordInput, Textarea y Select (skill §3, Input).
// text-base en móvil evita el zoom de iOS; desde md se usa el text-sm de la skill.
export function controlClass({ invalid, className }) {
  return cn(
    'w-full rounded-field border bg-field px-4 py-3.5 text-base text-ink outline-none transition duration-200 md:text-sm',
    'placeholder:text-ink-faint focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
    invalid
      ? 'border-danger focus:border-danger focus:ring-danger/30'
      : 'border-line focus:border-accent focus:ring-accent/30',
    className,
  );
}
