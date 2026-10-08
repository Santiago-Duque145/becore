import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { CalendarPlus, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { registerSchema } from '../lib/auth-schemas.js';
import { AuthLayout } from '../components/layout/AuthLayout.jsx';
import { Input } from '../components/ui/Field.jsx';
import { Button } from '../components/ui/Button.jsx';

const ROLES = [
  { value: 'organizer', label: 'Quiero organizar eventos', Icon: CalendarPlus },
  { value: 'participant', label: 'Quiero participar en eventos', Icon: Users },
];

export default function RegistroPage() {
  const { session, loading, signUp } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) });

  if (!loading && session) return <Navigate to="/eventos" replace />;

  async function onSubmit({ confirmPassword: _confirm, ...values }) {
    try {
      await signUp(values);
      navigate('/eventos', { replace: true });
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <AuthLayout
      title="Crea tu cuenta"
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/ingresar" className="font-medium text-teal-500 underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-medium text-navy-900">¿Cómo vas a usar Be Core?</legend>
          {ROLES.map(({ value, label, Icon }) => (
            <label
              key={value}
              className="flex min-h-[56px] cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-4 text-navy-900 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-500/10 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-teal-500"
            >
              <input type="radio" value={value} className="sr-only" {...register('role')} />
              <Icon size={22} className="text-teal-600" aria-hidden="true" />
              <span className="font-medium">{label}</span>
            </label>
          ))}
          {errors.role && (
            <p role="alert" className="text-sm text-orange-500">
              {errors.role.message}
            </p>
          )}
        </fieldset>
        <Input label="Nombre completo" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
        <Input label="Correo" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          hint="Mínimo 8 caracteres"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
      </form>
    </AuthLayout>
  );
}
