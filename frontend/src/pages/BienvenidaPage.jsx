import { useMutation } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext.jsx';
import { completeOnboarding } from '../services/profile.api.js';
import { homePathFor } from '../layouts/navigation.js';
import { AuthLayout } from '../layouts/AuthLayout.jsx';
import { Button, useToast } from '../components/ui/index.js';

// Provisional hasta R4 (cuestionario de 5 pasos, auth-onboarding §6). Existe para que RequireOnboarding
// tenga a dónde llevar a las cuentas nuevas y no queden atrapadas: "Continuar" equivale a "Omitir"
// (guarda el rol actual sin gustos y marca el onboarding como completado).
export default function BienvenidaPage() {
  const { profile, setProfile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: ({ data }) => {
      setProfile(data);
      navigate(homePathFor(data.role), { replace: true });
    },
    onError: (error) => toast.error(error.message),
  });

  if (profile?.onboardingCompleted) return <Navigate to={homePathFor(profile.role)} replace />;

  const firstName = profile?.fullName?.split(' ')[0];

  return (
    <AuthLayout
      title={firstName ? `¡Hola, ${firstName}!` : '¡Hola!'}
      subtitle="Ya tienes tu cuenta en Be Core"
    >
      <p className="mb-6 text-sm text-ink">
        Muy pronto podrás contarnos qué te gusta para recomendarte planes. Por ahora, entra y mira lo que se viene.
      </p>
      <Button
        onClick={() => mutation.mutate({ role: profile.role })}
        loading={mutation.isPending}
        className="w-full"
      >
        Continuar
      </Button>
    </AuthLayout>
  );
}
