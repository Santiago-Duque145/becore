import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext.jsx';
import { loginSchema } from '../lib/auth-schemas.js';
import { AuthLayout } from '../layouts/AuthLayout.jsx';
import { Button, Input, PasswordInput, useToast } from '../components/ui/index.js';

export default function IngresarPage() {
  const { session, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  if (!loading && session) return <Navigate to="/eventos" replace />;

  async function onSubmit(values) {
    try {
      await signIn(values);
      navigate('/eventos', { replace: true });
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <AuthLayout
      title="Inicia sesión"
      subtitle="Entra para ver y organizar eventos de tu comunidad."
      footer={
        <>
          ¿Aún no tienes cuenta?{' '}
          <Link to="/registro" className="focus-ring rounded font-semibold text-accent hover:text-accent-soft">
            Regístrate
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input label="Correo" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <PasswordInput
          label="Contraseña"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" loading={isSubmitting}>
          Ingresar
        </Button>
      </form>
    </AuthLayout>
  );
}
