import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { recoverSchema } from '../../lib/auth-schemas.js';
import { AuthLayout } from '../../layouts/AuthLayout.jsx';
import { AuthLink } from '../../components/auth/AuthLink.jsx';
import { FormAlert } from '../../components/auth/FormAlert.jsx';
import { Button, Field, Input, LinkButton } from '../../components/ui/index.js';

const footer = (
  <>
    ¿La recordaste? <AuthLink to="/login">Inicia sesión</AuthLink>
  </>
);

// Pide el enlace para crear una contraseña nueva. No revela si el correo tiene cuenta.
export default function RecuperarPage() {
  const { requestPasswordReset } = useAuth();
  const [sentTo, setSentTo] = useState(null);
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(recoverSchema), mode: 'onTouched' });

  async function onSubmit({ email }) {
    setFormError(null);
    try {
      await requestPasswordReset(email);
      setSentTo(email);
    } catch (error) {
      setFormError(error.message);
    }
  }

  if (sentTo) {
    return (
      <AuthLayout title="Revisa tu correo" subtitle="Ya casi recuperas tu cuenta" footer={footer}>
        <p className="mb-6 text-sm text-ink">
          Si <strong className="font-semibold break-all">{sentTo}</strong> tiene cuenta en Be Core, te llega un enlace
          para crear una contraseña nueva. Puede tardar un par de minutos; revisa también spam.
        </p>
        <LinkButton to="/login" variant="secondary" className="w-full">
          Volver a iniciar sesión
        </LinkButton>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="¿Olvidaste tu contraseña?"
      subtitle="Escribe tu correo y te enviamos un enlace para crear una nueva"
      footer={footer}
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
        <Button type="submit" loading={isSubmitting} className="mt-1 w-full">
          Enviar enlace
        </Button>
        <FormAlert className="mt-3">{formError}</FormAlert>
      </form>
    </AuthLayout>
  );
}
