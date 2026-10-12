import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';
import { Field } from './Field.jsx';
import { controlClass } from './control-classes.js';
import { describedBy, useFieldContext } from './field-context.js';

const TextareaControl = forwardRef(function TextareaControl({ invalid, className, rows = 4, ...props }, ref) {
  const field = useFieldContext();
  const isInvalid = invalid || field?.invalid;
  return (
    <textarea
      ref={ref}
      id={field?.id}
      rows={rows}
      aria-invalid={isInvalid || undefined}
      aria-describedby={describedBy(field)}
      className={controlClass({ invalid: isInvalid, className: cn('resize-y', className) })}
      {...props}
    />
  );
});

export const Textarea = forwardRef(function Textarea({ label, hint, error, ...props }, ref) {
  if (label !== undefined) {
    return (
      <Field label={label} hint={hint} error={error} className="mb-0">
        <TextareaControl ref={ref} {...props} />
      </Field>
    );
  }
  return <TextareaControl ref={ref} invalid={Boolean(error)} {...props} />;
});
