import { Link } from 'react-router';
import { cn } from '../../lib/cn.js';

// Enlace turquesa de las pantallas de auth ("Crear cuenta", "Inicia sesión"…)
export function AuthLink({ className, ...props }) {
  return (
    <Link
      className={cn('focus-ring hit-area rounded font-semibold text-accent transition-colors hover:text-accent-soft', className)}
      {...props}
    />
  );
}
