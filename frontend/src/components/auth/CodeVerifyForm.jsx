import { useRef, useState } from 'react';
import { Button, useToast } from '../ui/index.js';
import { useCountdown } from '../../hooks/useCountdown.js';
import { RESEND_SECONDS, isComplete, toDigits } from '../../lib/otp.js';
import { FormAlert } from './FormAlert.jsx';
import { OtpInput } from './OtpInput.jsx';

// Paso de "escribe el código" compartido por el registro (/verificar) y la recuperación de contraseña.
// verify(code) y resend() lanzan errores con el mensaje ya en español; onVerified() corre cuando el código sirve.
export function CodeVerifyForm({ email, verify, resend, onVerified, submitLabel = 'Verificar' }) {
  const toast = useToast();
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const busyRef = useRef(false); // evita enviar dos veces (autoenvío + botón)
  const { left, restart } = useCountdown(RESEND_SECONDS);

  async function submit(value) {
    if (busyRef.current || !isComplete(toDigits(value))) return;
    busyRef.current = true;
    setVerifying(true);
    setError(null);
    try {
      await verify(value);
      await onVerified();
    } catch (err) {
      setError(err.message);
      setCode('');
    } finally {
      busyRef.current = false;
      setVerifying(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    try {
      await resend();
      setCode('');
      restart();
      toast.success('Te enviamos un código nuevo.');
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit(code);
      }}
      noValidate
    >
      <OtpInput value={code} onChange={setCode} onComplete={submit} disabled={verifying} invalid={Boolean(error)} autoFocus />
      <FormAlert className="mb-3">{error}</FormAlert>
      <Button type="submit" loading={verifying} disabled={!isComplete(toDigits(code))} className="w-full">
        {submitLabel}
      </Button>
      <Button
        variant="ghost"
        onClick={handleResend}
        loading={resending}
        disabled={left > 0 || verifying}
        aria-live="polite"
        className="mt-3 w-full"
      >
        {left > 0 ? `Reenviar código (${left} s)` : 'Reenviar código'}
      </Button>
      <p className="mt-3 text-center text-xs text-ink-muted">
        Lo enviamos a <strong className="font-semibold break-all text-ink">{email}</strong>. Revisa también spam.
      </p>
    </form>
  );
}
