import { useEffect, useId, useRef } from 'react';
import { cn } from '../../lib/cn.js';
import {
  OTP_LENGTH,
  arrowTarget,
  backspaceAt,
  enterText,
  isComplete,
  toCode,
  toDigits,
} from '../../lib/otp.js';
import { controlClass } from '../ui/control-classes.js';

// Código de verificación: 6 casillas de un dígito. Pegar el código completo funciona (también el
// autocompletado del celular), avanza y retrocede solo, y todo el grupo tiene un único nombre accesible.
export function OtpInput({ value, onChange, onComplete, disabled = false, invalid = false, autoFocus = false, label = 'Código de verificación' }) {
  const labelId = useId();
  const refs = useRef([]);
  const digits = toDigits(value);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  function apply({ digits: next, focus }) {
    onChange(toCode(next));
    refs.current[focus]?.focus();
    if (isComplete(next)) onComplete?.(toCode(next));
  }

  function handleChange(index, event) {
    apply(enterText(digits, index, event.target.value));
  }

  function handlePaste(index, event) {
    event.preventDefault();
    apply(enterText(digits, index, event.clipboardData.getData('text')));
  }

  function handleKeyDown(index, event) {
    if (event.key === 'Backspace') {
      event.preventDefault();
      apply(backspaceAt(digits, index));
      return;
    }
    const target = arrowTarget(event.key, index);
    if (target !== null) {
      event.preventDefault();
      refs.current[target]?.focus();
    }
  }

  return (
    <div role="group" aria-labelledby={labelId} className="mb-4">
      <span id={labelId} className="mb-[7px] block text-xs font-semibold text-ink-muted">
        {label}
      </span>
      <div className="flex justify-between gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            enterKeyHint="done"
            aria-label={`Dígito ${index + 1} de ${OTP_LENGTH}`}
            aria-invalid={invalid || undefined}
            value={digit}
            disabled={disabled}
            onChange={(event) => handleChange(index, event)}
            onPaste={(event) => handlePaste(index, event)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onFocus={(event) => event.target.select()}
            className={cn(controlClass({ invalid }), 'h-14 min-w-0 flex-1 px-0 py-0 text-center font-display text-2xl font-bold tabular-nums md:text-2xl')}
          />
        ))}
      </div>
    </div>
  );
}
