import { forwardRef, useId } from 'react';

const CONTROL =
  'w-full rounded-xl border bg-white px-3 min-h-[44px] text-navy-900 placeholder:text-gray-500 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-500';

function FieldShell({ id, label, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-navy-900">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-orange-500">
          {error}
        </p>
      )}
    </div>
  );
}

function controlProps(id, error) {
  return {
    id,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `${id}-error` : undefined,
  };
}

export const Input = forwardRef(function Input({ label, error, hint, className = '', ...props }, ref) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <input
        ref={ref}
        {...controlProps(id, error)}
        className={`${CONTROL} ${error ? 'border-orange-500' : 'border-gray-200'} ${className}`}
        {...props}
      />
    </FieldShell>
  );
});

export const Textarea = forwardRef(function Textarea({ label, error, hint, className = '', ...props }, ref) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <textarea
        ref={ref}
        rows={4}
        {...controlProps(id, error)}
        className={`${CONTROL} py-2 ${error ? 'border-orange-500' : 'border-gray-200'} ${className}`}
        {...props}
      />
    </FieldShell>
  );
});

export const Select = forwardRef(function Select({ label, error, hint, children, ...props }, ref) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <select
        ref={ref}
        {...controlProps(id, error)}
        className={`${CONTROL} ${error ? 'border-orange-500' : 'border-gray-200'}`}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
});
