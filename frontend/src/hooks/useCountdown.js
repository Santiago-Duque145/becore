import { useCallback, useEffect, useState } from 'react';
import { secondsLeft } from '../lib/otp.js';

// Cuenta regresiva en segundos que arranca sola y se puede reiniciar (botón "Reenviar código")
export function useCountdown(seconds) {
  const [endAt, setEndAt] = useState(() => Date.now() + seconds * 1000);
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    setLeft(secondsLeft(endAt));
    const timer = setInterval(() => {
      const remaining = secondsLeft(endAt);
      setLeft(remaining);
      if (remaining === 0) clearInterval(timer);
    }, 500);
    return () => clearInterval(timer);
  }, [endAt]);

  const restart = useCallback(() => setEndAt(Date.now() + seconds * 1000), [seconds]);
  return { left, restart };
}
