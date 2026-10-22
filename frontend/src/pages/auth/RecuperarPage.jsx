import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { newPasswordSchema, recoverSchema } from '../../lib/auth-schemas.js';
import { destinationAfterAuth } from '../../lib/auth-redirect.js';
import { AuthLayout } from '../../layouts/AuthLayout.jsx';
import { AuthLink } from '../../components/auth/AuthLink.jsx';
import { CodeVerifyForm } from '../../components/auth/CodeVerifyForm.jsx';
import { FormAlert } from '../../components/auth/FormAlert.jsx';
import { PasswordStrength } from '../../components/auth/PasswordStrength.jsx';
import { Button, Field, Input, PasswordInput, Spinner, useToast } from '../../components/ui/index.js';
import { requestRecoveryCode, verifyRecoveryCode } from '../../services/auth-otp.js';

const footer = (
  <>
    ¿La recordaste? <AuthLink to="/login">Inicia sesión</AuthLink>
  </>
);

function EmailStep({ onSent }) {
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(recoverSchema), mode: 'onTouched' });

  async function onSubmit({ email }) {
    setFormError(null);
    try {
      await requestRecoveryCode(email);
      onSent(email);
    } catch (error) {
      setFormError(error.message);
    }
  }

  return (
    <AuthLayout
      title="¿Olvidaste tu contraseña?"
      subtitle="Escribe tu correo y te enviamos un código de 6 dígitos"
      footer={footer}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Correo electrónico" error={errors.email?.message}>
          <Input type="email" inputMode="email" autoComplete="email" placeholder="nombre@correo.com" {...register('email')} />
        </Field>
        <Button type="submit" loading={isSubmitting} className="mt-1 w-full">
          Enviar código
        </Button>
        <FormAlert className="mt-3">{formError}</FormAlert>
      </form>
    </AuthLayout>
  );
}

function PasswordStep({ email }) {
  const { session, profile, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(newPasswordSchema), mode: 'onTouched' });

  async function onSubmit({ password }) {
    setFormError(null);
    try {
      await updatePassword(password);
      toast.success('¡Listo! Ya tienes contraseña nueva.');
      // La sesión ya está abierta con el código: entra directo a la app
      navigate(destinationAfterAuth(profile, null), { replace: true });
    } catch (error) {
      setFormError(error.message);
    }
  }

  // La sesión llega justo después de verificar el código
  if (!session || loading) {
    return (
      <AuthLayout title="Crea una contraseña nueva">
        <Spinner label="Verificando tu código" />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Crea una contraseña nueva" subtitle="Úsala la próxima vez que inicies sesión">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Para que el gestor de contraseñas asocie la nueva con la cuenta */}
        <input type="email" autoComplete="username" value={email} readOnly hidden />
        <Field label="Contraseña nueva" error={errors.password?.message}>
          <PasswordInput autoComplete="new-password" placeholder="Mínimo 8 caracteres" aria-describedby="password-strength" {...register('password')} />
        </Field>
        <PasswordStrength id="password-strength" password={watch('password')} />
        <Button type="submit" loading={isSubmitting} className="mt-1 w-full">
          Guardar contraseña
        </Button>
        <FormAlert className="mt-3">{formError}</FormAlert>
      </form>
    </AuthLayout>
  );
}

// Recuperar contraseña en un solo flujo (P5): correo → código de 6 dígitos → contraseña nueva → dentro de la app.
export default function RecuperarPage() {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');

  if (step === 'email') {
    return (
      <EmailStep
        onSent={(sentTo) => {
          setEmail(sentTo);
          setStep('code');
        }}
      />
    );
  }

  if (step === 'code') {
    return (
      <AuthLayout
        title="Revisa tu correo"
        subtitle="Escribe el código de 6 dígitos para cambiar tu contraseña"
        footer={
          <>
            ¿Otro correo?{' '}
            <button type="button" onClick={() => setStep('email')} className="focus-ring rounded font-semibold text-accent underline">
              Volver a empezar
            </button>
          </>
        }
      >
        <CodeVerifyForm
          email={email}
          verify={(token) => verifyRecoveryCode({ email, token })}
          resend={() => requestRecoveryCode(email)}
          onVerified={() => setStep('password')}
          submitLabel="Verificar código"
        />
      </AuthLayout>
    );
  }

  return <PasswordStep email={email} />;
}
