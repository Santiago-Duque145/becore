import { AlertCircleIcon } from '../icons/index.js';
import { cn } from '../../lib/cn.js';

// Error del formulario completo (credenciales, red…), anunciado al lector de pantalla
export function FormAlert({ children, className }) {
  if (!children) return null;
  return (
    <div role="alert" className={cn('flex items-start gap-2 text-[13px] font-medium text-danger', className)}>
      <AlertCircleIcon size={16} className="mt-0.5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
