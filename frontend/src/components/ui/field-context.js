import { createContext, useContext } from 'react';

// Field comparte con su control el id y los ids de ayuda/error para aria-describedby
export const FieldContext = createContext(null);

export const useFieldContext = () => useContext(FieldContext);

export function describedBy(field, ownId) {
  const ids = [ownId, field?.invalid && field.errorId, field?.hint && field.hintId].filter(Boolean);
  return ids.length ? ids.join(' ') : undefined;
}
