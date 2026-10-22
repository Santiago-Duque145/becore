import { useCallback, useEffect, useRef, useState } from 'react';
import { canUseGeolocation, locate } from '../lib/geo.js';

// Ubicación bajo demanda (M1, para "Ver eventos cerca de mí" en P6). No pide permiso al montar: solo
// cuando se llama request() desde un toque del usuario. La posición queda en el estado de React y se
// pierde al cerrar la pestaña; nunca se envía al backend ni se guarda.
// status: 'unsupported' | 'idle' | 'loading' | 'granted' | 'denied' | 'unavailable' | 'timeout'
export function useGeolocation() {
  const supported = canUseGeolocation({
    isSecureContext: window.isSecureContext,
    geolocation: navigator.geolocation,
  });
  const [state, setState] = useState({ status: supported ? 'idle' : 'unsupported', position: null, error: null });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const request = useCallback(async () => {
    if (!supported) return;
    setState((current) => ({ ...current, status: 'loading', error: null }));
    const next = await locate(navigator.geolocation);
    if (mounted.current) setState(next);
  }, [supported]);

  return { ...state, supported, request };
}
