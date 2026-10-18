import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { dismissConsent, isConsentDismissed, takeConsentPending } from '../../lib/consent-pending.js';
import { acceptConsent } from '../../services/profile.api.js';
import { Button, Modal, useToast } from '../ui/index.js';
import { DemographicsFields } from './DemographicsFields.jsx';

const toggle = (current, value) => (current === value ? null : value);

// Usuarios sin data_consent_at (los que ya existían, o quien se registró en otra pestaña) ven este diálogo
// una vez por sesión. No bloquea nada: "Ahora no" lo cierra. Si acaban de marcar la casilla en /registro,
// la aceptación se guarda sola y el diálogo no aparece.
export function ConsentGate() {
  const { profile, setProfile } = useAuth();
  const toast = useToast();
  const needsConsent = profile?.dataConsentAccepted === false;
  const [dismissed, setDismissed] = useState(isConsentDismissed);
  const [autoAccept, setAutoAccept] = useState(null); // null = aún sin decidir
  const [gender, setGender] = useState(null);
  const [ageRange, setAgeRange] = useState(null);
  const pendingRef = useRef(null); // la marca se consume una sola vez, aunque el efecto corra dos veces
  const autoStarted = useRef(false);

  const mutation = useMutation({
    mutationFn: async (body) => (await acceptConsent(body)).data,
    onSuccess: (me) => setProfile(me),
  });
  const { mutate } = mutation;

  useEffect(() => {
    if (!needsConsent) return;
    if (pendingRef.current === null) pendingRef.current = takeConsentPending();
    setAutoAccept(pendingRef.current);
  }, [needsConsent]);

  useEffect(() => {
    if (!needsConsent || !autoAccept || autoStarted.current) return;
    autoStarted.current = true;
    mutate({}, { onError: () => setAutoAccept(false) }); // si falla, se le pregunta con el diálogo
  }, [needsConsent, autoAccept, mutate]);

  const open = needsConsent && autoAccept === false && !dismissed;

  function close() {
    dismissConsent();
    setDismissed(true);
  }

  function accept() {
    mutate(
      { ...(gender ? { gender } : {}), ...(ageRange ? { ageRange } : {}) },
      { onSuccess: () => toast.success('Gracias, quedó guardado.'), onError: (error) => toast.error(error.message) },
    );
  }

  return (
    <Modal open={open} title="Tus datos, tu decisión" onClose={close} className="max-h-[92dvh] overflow-y-auto">
      <p className="mb-4 text-[13px] leading-5 text-ink-muted">
        Be Core es un proyecto académico de la Universidad Católica Luis Amigó. Para seguir usándolo, acepta la{' '}
        <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline">
          política de tratamiento de datos personales
        </a>
        . Contarnos tu sexo y edad es opcional y solo sirve para estadísticas anónimas.
      </p>
      <DemographicsFields
        gender={gender}
        ageRange={ageRange}
        onGender={(value) => setGender((current) => toggle(current, value))}
        onAgeRange={(value) => setAgeRange((current) => toggle(current, value))}
      />
      <div className="flex flex-col gap-2.5">
        <Button onClick={accept} loading={mutation.isPending} className="w-full">
          Acepto la política
        </Button>
        <Button variant="ghost" onClick={close} disabled={mutation.isPending} className="w-full">
          Ahora no
        </Button>
      </div>
    </Modal>
  );
}
