import { Navigate, useLocation, useSearchParams } from 'react-router';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { destinationAfterAuth, fromState } from '../../lib/auth-redirect.js';
import { AuthLayout } from '../../layouts/AuthLayout.jsx';
import { AuthLink } from '../../components/auth/AuthLink.jsx';
import { CodeVerifyForm } from '../../components/auth/CodeVerifyForm.jsx';
import { Spinner } from '../../components/ui/index.js';
import { resendSignupCode, verifySignupCode } from '../../services/auth-otp.js';

// /verificar?email=…: código de 6 dígitos para confirmar la cuenta. Al verificar, Supabase abre la sesión y
// esta pantalla redirige (cuenta nueva → /bienvenida).
export default function VerificarPage() {
  const { session, profile, loading } = useAuth();
  const [params] = useSearchParams();
  const location = useLocation();
  const email = params.get('email')?.trim();

  if (session && !loading) return <Navigate to={destinationAfterAuth(profile, fromState(location))} replace />;
  if (!email) return <Navigate to="/registro" replace />;

  return (
    <AuthLayout
      title="Escribe tu código"
      subtitle="Te enviamos 6 dígitos para activar tu cuenta"
      footer={
        <>
          ¿Te equivocaste de correo?{' '}
          <AuthLink to="/registro" state={location.state}>
            Volver a registrarte
          </AuthLink>
        </>
      }
    >
      {session ? (
        <Spinner label="Entrando a tu cuenta" />
      ) : (
        <CodeVerifyForm
          email={email}
          verify={(token) => verifySignupCode({ email, token })}
          resend={() => resendSignupCode(email)}
          onVerified={() => {}}
          submitLabel="Activar cuenta"
        />
      )}
    </AuthLayout>
  );
}
