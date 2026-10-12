import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useLocation } from 'react-router';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { loginSchema } from '../../lib/auth-schemas.js';
import { destinationAfterAuth, fromState } from '../../lib/auth-redirect.js';
import { AuthLayout } from '../../layouts/AuthLayout.jsx';
import { FormAlert } from '../../components/auth/FormAlert.jsx';
import { GoogleSignIn } from '../../components/auth/GoogleSignIn.jsx';
import { AuthLink } from '../../components/auth/AuthLink.jsx';
import { Button, Field, Input, PasswordInput } from '../../components/ui/index.js';

// Login con los valores exactos de mobile-login.html (auth-onboarding §4)
export default function LoginPage() {
  const { session, profile, loading, signIn } = useAuth();
  const location = useLocation();
  const from = fromState(location);
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: location.state?.email ?? '', password: '' },
  });

  // Con sesión y perfil cargado (recién entró o ya estaba dentro) decide a dónde ir
  if (session && !loading) return <Navigate to={destinationAfterAuth(profile, from)} replace />;

  async function onSubmit(values) {
    setFormError(null);
    try {
      await signIn(values);
    } catch (error) {
      setFormError(error.message);
    }
  }

  const busy = isSubmitting || Boolean(session);

  return (
    <AuthLayout
      title="Bienvenido de nuevo"
      subtitle="Inicia sesión para ver tus eventos y citas"
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <AuthLink to="/registro" state={location.state}>
            Crear cuenta
          </AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Correo electrónico" error={errors.email?.message}>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="nombre@correo.com"
            {...register('email')}
          />
        </Field>
        <Field label="Contraseña" error={errors.password?.message}>
          <PasswordInput autoComplete="current-password" placeholder="••••••••" {...register('password')} />
        </Field>

        <div className="-mt-1.5 mb-5 flex justify-end">
          <Link
            to="/recuperar"
            className="focus-ring hit-area rounded text-xs leading-[normal] font-semibold text-accent transition-colors hover:text-accent-soft"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button type="submit" loading={busy} className="w-full">
          Iniciar sesión
        </Button>
        <FormAlert className="mt-3">{formError}</FormAlert>
      </form>

      <GoogleSignIn from={from} disabled={busy} />
    </AuthLayout>
  );
}
