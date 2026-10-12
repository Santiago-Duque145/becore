import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { AuthLayout } from '../../layouts/AuthLayout.jsx';
import { FormAlert } from '../../components/auth/FormAlert.jsx';
import { Button } from '../../components/ui/index.js';

const NOT_YET = 'Todavía no vemos la confirmación. Abre el enlace del correo (revisa también spam) y vuelve a intentarlo.';

// "Revisa tu correo para activar la cuenta" + "Ya lo confirmé" (auth-onboarding §5).
// "Ya lo confirmé" intenta entrar con los mismos datos; si el correo sigue sin confirmar, lo dice.
export function ConfirmEmailNotice({ email, password, onBack }) {
  const { signIn } = useAuth();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);

  async function handleConfirmed() {
    setChecking(true);
    setError(null);
    try {
      await signIn({ email, password });
      // Con sesión, RegistroPage redirige a /bienvenida
    } catch (err) {
      setError(err.code === 'email_not_confirmed' ? NOT_YET : err.message);
      setChecking(false);
    }
  }

  return (
    <AuthLayout title="Revisa tu correo" subtitle="Te falta un paso para activar tu cuenta">
      <p className="mb-6 text-sm text-ink">
        Te enviamos un enlace a <strong className="font-semibold break-all">{email}</strong>. Ábrelo para activar tu
        cuenta y vuelve aquí.
      </p>
      <Button onClick={handleConfirmed} loading={checking} className="w-full">
        Ya lo confirmé
      </Button>
      <FormAlert className="mt-3">{error}</FormAlert>
      <Button variant="ghost" onClick={onBack} disabled={checking} className="mt-3 w-full">
        Usar otro correo
      </Button>
    </AuthLayout>
  );
}
