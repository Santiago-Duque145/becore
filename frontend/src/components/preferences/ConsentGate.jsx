import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { consentMode } from '../../lib/consent-flow.js';
import { clearConsentPending, hasConsentPending } from '../../lib/consent-pending.js';
import { acceptConsent } from '../../services/profile.api.js';
import { Button, Modal, Spinner, useToast } from '../ui/index.js';
import { DemographicsFields } from './DemographicsFields.jsx';

const toggle = (current, value) => (current === value ? null : value);

// El consentimiento de datos es obligatorio para todos (ver lib/consent-flow.js):
//  - cuenta vieja (onboarding completo, sin aceptar): diálogo modal; solo se puede aceptar o "Salir";
//  - onboarding pendiente: no ve el diálogo; el paso de consentimiento es el primero de /bienvenida
//    (si acaba de marcar la casilla en /registro, la aceptación se guarda sola y ese paso no aparece).
export function ConsentGate({ children }) {
  const { profile, setProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [autoFailed, setAutoFailed] = useState(false);
  const [gender, setGender] = useState(null);
  const [ageRange, setAgeRange] = useState(null);
  const markRef = useRef(null); // la marca del registro se mira una vez, cuando ya hay perfil
  const autoStarted = useRef(false);

  if (markRef.current === null && profile) markRef.current = hasConsentPending();
  const mode = consentMode(profile, markRef.current === true && !autoFailed);

  const mutation = useMutation({
    mutationFn: async (body) => (await acceptConsent(body)).data,
    onSuccess: (me) => setProfile(me),
  });
  const { mutate } = mutation;

  useEffect(() => {
    if (mode !== 'auto' || autoStarted.current) return;
    autoStarted.current = true;
    clearConsentPending();
    mutate({}, { onError: () => setAutoFailed(true) }); // si falla, se le pide en el primer paso de /bienvenida
  }, [mode, mutate]);

  async function leave() {
    await signOut();
    navigate('/login', { replace: true });
  }

  function accept() {
    mutate(
      { ...(gender ? { gender } : {}), ...(ageRange ? { ageRange } : {}) },
      { onSuccess: () => toast.success('Gracias, quedó guardado.'), onError: (error) => toast.error(error.message) },
    );
  }

  if (mode === 'auto') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <Spinner label="Guardando tu aceptación" />
      </div>
    );
  }

  return (
    <>
      {children}
      <Modal open={mode === 'dialog'} dismissible={false} title="Tus datos, tu decisión" className="max-h-[92dvh] overflow-y-auto">
        <p className="mb-4 text-[13px] leading-5 text-ink-muted">
          Be Core es un proyecto académico de la Universidad Católica Luis Amigó. Para seguir usándolo debes aceptar la{' '}
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
          <Button variant="secondary" onClick={leave} disabled={mutation.isPending} className="w-full">
            Salir
          </Button>
        </div>
      </Modal>
    </>
  );
}
