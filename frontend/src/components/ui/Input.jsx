import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';
import { Field } from './Field.jsx';
import { controlClass } from './control-classes.js';
import { describedBy, useFieldContext } from './field-context.js';

// Control base. Dentro de <Field> toma id y aria-* del contexto.
// Atajo: <Input label="…" error="…" hint="…" /> se envuelve solo en un Field sin margen.
export const Input = forwardRef(function Input({ label, hint, error, ...props }, ref) {
  if (label !== undefined) {
    return (
      <Field label={label} hint={hint} error={error} className="mb-0">
        <InputControl ref={ref} {...props} />
      </Field>
    );
  }
  return <InputControl ref={ref} invalid={Boolean(error)} {...props} />;
});

export const InputControl = forwardRef(function InputControl(
  { icon: Icon, invalid, className, 'aria-describedby': ownDescribedBy, ...props },
  ref,
) {
  const field = useFieldContext();
  const isInvalid = invalid || field?.invalid;
  const input = (
    <input
      ref={ref}
      id={field?.id}
      aria-invalid={isInvalid || undefined}
      aria-describedby={describedBy(field, ownDescribedBy)}
      className={controlClass({ invalid: isInvalid, className: cn(Icon && 'pl-11', className) })}
      {...props}
    />
  );
  if (!Icon) return input;
  return (
    <div className="relative">
      <Icon size={16} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-faint" />
      {input}
    </div>
  );
});
