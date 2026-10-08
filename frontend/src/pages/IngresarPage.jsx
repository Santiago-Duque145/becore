import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext.jsx';
import { loginSchema } from '../lib/auth-schemas.js';
import { AuthLayout } from '../components/layout/AuthLayout.jsx';
import { Input } from '../components/ui/Field.jsx';
import { Button } from '../components/ui/Button.jsx';

export default function IngresarPage() {
  const { session, loading, signIn } = useAuth();
  const navigate = useNavigate();
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
          <Link to="/registro" className="font-medium text-teal-500 underline">
            Regístrate
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input label="Correo" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando…' : 'Ingresar'}
        </Button>
      </form>
    </AuthLayout>
  );
}
