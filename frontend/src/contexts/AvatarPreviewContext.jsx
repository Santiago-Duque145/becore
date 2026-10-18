import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AvatarPreviewDialog } from '../components/ui/AvatarPreview.jsx';
import { toPreviewPerson } from '../lib/avatar-preview.js';

const AvatarPreviewContext = createContext(null);

// Una sola vista previa de avatar para toda la app: open(persona, elementoQueLaAbrió)
export function AvatarPreviewProvider({ children }) {
  const [preview, setPreview] = useState(null);
  const close = useCallback(() => setPreview(null), []);
  const open = useCallback((person, trigger) => setPreview({ person: toPreviewPerson(person), trigger }), []);
  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <AvatarPreviewContext.Provider value={value}>
      {children}
      {preview && <AvatarPreviewDialog person={preview.person} trigger={preview.trigger} onClose={close} />}
    </AvatarPreviewContext.Provider>
  );
}

export function useAvatarPreview() {
  const context = useContext(AvatarPreviewContext);
  if (!context) throw new Error('useAvatarPreview debe usarse dentro de AvatarPreviewProvider');
  return context;
}
