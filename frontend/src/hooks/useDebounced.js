import { useEffect, useState } from 'react';

// El valor, pero solo después de delayMs sin cambios (búsquedas mientras se escribe)
export function useDebounced(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
