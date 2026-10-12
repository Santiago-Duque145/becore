import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';
import { ChevronRightIcon } from '../icons/index.js';
import { Field } from './Field.jsx';
import { controlClass } from './control-classes.js';
import { describedBy, useFieldContext } from './field-context.js';

const SelectControl = forwardRef(function SelectControl({ invalid, className, children, ...props }, ref) {
  const field = useFieldContext();
  const isInvalid = invalid || field?.invalid;
  return (
    <div className="relative">
      <select
        ref={ref}
        id={field?.id}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy(field)}
        className={controlClass({ invalid: isInvalid, className: cn('appearance-none pr-11', className) })}
        {...props}
      >
        {children}
      </select>
      <ChevronRightIcon
        size={16}
        className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 rotate-90 text-ink-muted"
      />
    </div>
  );
});

export const Select = forwardRef(function Select({ label, hint, error, ...props }, ref) {
  if (label !== undefined) {
    return (
      <Field label={label} hint={hint} error={error} flush>
        <SelectControl ref={ref} {...props} />
      </Field>
    );
  }
  return <SelectControl ref={ref} invalid={Boolean(error)} {...props} />;
});
