import { forwardRef, useState } from 'react';
import { cn } from '../../lib/cn.js';
import { EyeIcon, EyeOffIcon } from '../icons/index.js';
import { Field } from './Field.jsx';
import { InputControl } from './Input.jsx';

// Input + botón de ojo para mostrar u ocultar la contraseña (skill §3)
const PasswordControl = forwardRef(function PasswordControl({ className, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOffIcon : EyeIcon;
  return (
    <div className="relative">
      <InputControl ref={ref} type={visible ? 'text' : 'password'} className={cn('pr-12', className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        disabled={props.disabled}
        className="focus-ring absolute top-1/2 right-1 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-field text-ink-muted transition hover:text-ink disabled:opacity-50"
      >
        <Icon size={18} />
      </button>
    </div>
  );
});

export const PasswordInput = forwardRef(function PasswordInput({ label, hint, error, ...props }, ref) {
  if (label !== undefined) {
    return (
      <Field label={label} hint={hint} error={error} flush>
        <PasswordControl ref={ref} {...props} />
      </Field>
    );
  }
  return <PasswordControl ref={ref} invalid={Boolean(error)} {...props} />;
});
