import { useCallback, useEffect, useRef, useState } from 'react';
import { draftToFormValues } from '../../lib/draft-values.js';

const HIGHLIGHT_MS = 2200;

// IA8 · Aplica el borrador de la IA al formulario y permite deshacerlo. Guarda los valores y el pin de antes.
// → { apply(draft), undo(), canUndo, filled: Set de campos rellenados hace un instante }
export function useApplyDraft({ getValues, setValue, place, setPlace }) {
  const [filled, setFilled] = useState(() => new Set());
  const [previous, setPrevious] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const flash = useCallback((names) => {
    clearTimeout(timer.current);
    setFilled(new Set(names));
    timer.current = setTimeout(() => setFilled(new Set()), HIGHLIGHT_MS);
  }, []);

  const apply = useCallback(
    (draft) => {
      const { values, place: pin } = draftToFormValues(draft);
      const before = getValues();
      setPrevious({ values: Object.fromEntries(Object.keys(values).map((name) => [name, before[name]])), place });
      for (const [name, value] of Object.entries(values)) {
        setValue(name, value, { shouldDirty: true, shouldValidate: true });
      }
      if (pin) setPlace(pin);
      flash([...Object.keys(values), ...(pin ? ['pin'] : [])]);
    },
    [getValues, setValue, place, setPlace, flash],
  );

  const undo = useCallback(() => {
    if (!previous) return;
    for (const [name, value] of Object.entries(previous.values)) {
      setValue(name, value, { shouldDirty: true, shouldValidate: true });
    }
    setPlace(previous.place);
    setPrevious(null);
    setFilled(new Set());
  }, [previous, setValue, setPlace]);

  return { apply, undo, canUndo: previous !== null, filled };
}
