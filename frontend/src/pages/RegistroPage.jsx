import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext.jsx';
import { registerSchema } from '../lib/auth-schemas.js';
import { AuthLayout } from '../layouts/AuthLayout.jsx';
import { CalendarIcon, UsersIcon } from '../components/icons/index.js';
import { Button, Input, PasswordInput, useToast } from '../components/ui/index.js';

const ROLES = [
  { value: 'organizer', label: 'Quiero organizar eventos', Icon: CalendarIcon },
  { value: 'participant', label: 'Quiero participar en eventos', Icon: UsersIcon },
];

export default function RegistroPage() {
  const { session, loading, signUp } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
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
          <Link to="/ingresar" className="focus-ring rounded font-semibold text-accent hover:text-accent-soft">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {/* Selector de rol con radios nativos: sale del registro en R3 (auth-onboarding §5) */}
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-[7px] text-xs font-semibold text-ink-muted">¿Cómo vas a usar Be Core?</legend>
          {ROLES.map(({ value, label, Icon }) => (
            <label
              key={value}
              className="flex min-h-14 cursor-pointer items-center gap-3 rounded-card border border-line bg-panel px-4 text-sm text-ink transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent"
            >
              <input type="radio" value={value} className="sr-only" {...register('role')} />
              <Icon size={20} className="text-accent-soft" />
              <span className="font-semibold">{label}</span>
            </label>
          ))}
          {errors.role && (
            <p role="alert" className="text-xs font-medium text-danger">
              {errors.role.message}
            </p>
          )}
        </fieldset>
        <Input label="Nombre completo" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
        <Input label="Correo" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <PasswordInput
          label="Contraseña"
          autoComplete="new-password"
          hint="Mínimo 8 caracteres"
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordInput
          label="Confirmar contraseña"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" loading={isSubmitting}>
          Crear cuenta
        </Button>
      </form>
    </AuthLayout>
  );
}
