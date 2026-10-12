import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { registerSchema } from '../../lib/auth-schemas.js';
import { destinationAfterAuth, fromState } from '../../lib/auth-redirect.js';
import { AuthLayout } from '../../layouts/AuthLayout.jsx';
import { AuthLink } from '../../components/auth/AuthLink.jsx';
import { FormAlert } from '../../components/auth/FormAlert.jsx';
import { GoogleSignIn } from '../../components/auth/GoogleSignIn.jsx';
import { PasswordStrength } from '../../components/auth/PasswordStrength.jsx';
import { ConfirmEmailNotice } from './ConfirmEmailNotice.jsx';
import { Button, Field, Input, PasswordInput } from '../../components/ui/index.js';

// Crear cuenta: nombre, correo y contraseña, sin rol (auth-onboarding §5)
export default function RegistroPage() {
  const { session, profile, loading, signUp } = useAuth();
  const location = useLocation();
  const from = fromState(location);
  const [formError, setFormError] = useState(null);
  const [pending, setPending] = useState(null); // { email, password } cuando falta confirmar el correo
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema), mode: 'onTouched' });

  // Sin confirmación de correo, signUp deja la sesión abierta y el perfil nuevo trae onboardingCompleted=false
  if (session && !loading) return <Navigate to={destinationAfterAuth(profile, from)} replace />;

  if (pending) {
    return <ConfirmEmailNotice email={pending.email} password={pending.password} onBack={() => setPending(null)} />;
  }

  async function onSubmit(values) {
    setFormError(null);
    try {
      const { needsConfirmation } = await signUp(values);
      if (needsConfirmation) setPending({ email: values.email, password: values.password });
    } catch (error) {
      if (error.code === 'user_already_exists') {
        setError('email', { type: 'exists' }, { shouldFocus: true });
      } else {
        setFormError(error.message);
      }
    }
  }

  const emailError =
    errors.email?.type === 'exists' ? (
      <>
        Ese correo ya tiene cuenta.{' '}
        <AuthLink to="/login" state={{ ...location.state, email: watch('email') }} className="underline">
          ¿Quieres iniciar sesión?
        </AuthLink>
      </>
    ) : (
      errors.email?.message
    );
  const busy = isSubmitting || Boolean(session);

  return (
    <AuthLayout
      title="Crea tu cuenta"
      subtitle="Únete y encuentra planes en tu comunidad"
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <AuthLink to="/login" state={location.state}>
            Inicia sesión
          </AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Nombre" error={errors.fullName?.message}>
          <Input autoComplete="name" placeholder="Tu nombre y apellido" {...register('fullName')} />
        </Field>
        <Field label="Correo electrónico" error={emailError}>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="nombre@correo.com"
            {...register('email')}
          />
        </Field>
        <Field label="Contraseña" error={errors.password?.message}>
          <PasswordInput
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            aria-describedby="password-strength"
            {...register('password')}
          />
        </Field>
        <PasswordStrength id="password-strength" password={watch('password')} />

        <Button type="submit" loading={busy} className="mt-1 w-full">
          Crear cuenta
        </Button>
        <FormAlert className="mt-3">{formError}</FormAlert>
      </form>

      <GoogleSignIn from={from} disabled={busy} />
    </AuthLayout>
  );
}
