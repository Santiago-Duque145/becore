import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { newPasswordSchema } from '../../lib/auth-schemas.js';
import { destinationAfterAuth } from '../../lib/auth-redirect.js';
import { AuthLayout } from '../../layouts/AuthLayout.jsx';
import { FormAlert } from '../../components/auth/FormAlert.jsx';
import { PasswordStrength } from '../../components/auth/PasswordStrength.jsx';
import { Button, Field, LinkButton, PasswordInput, Spinner, useToast } from '../../components/ui/index.js';

// Destino del enlace de recuperación: Supabase abre la sesión desde la URL y aquí se cambia la contraseña
export default function NuevaContrasenaPage() {
  const { session, profile, loading, updatePassword, getUrlAuthError } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [linkError, setLinkError] = useState(undefined); // undefined = aún revisando la URL
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(newPasswordSchema), mode: 'onTouched' });

  useEffect(() => {
    let active = true;
    getUrlAuthError().then((error) => active && setLinkError(error));
    return () => {
      active = false;
    };
    // getUrlAuthError solo lee el resultado de la primera carga de la URL
  }, []);

  async function onSubmit({ password }) {
    setFormError(null);
    try {
      await updatePassword(password);
      toast.success('¡Listo! Ya tienes contraseña nueva.');
      navigate(destinationAfterAuth(profile, null), { replace: true });
    } catch (error) {
      setFormError(error.message);
    }
  }

  if (linkError === undefined || loading) {
    return (
      <AuthLayout title="Crea una contraseña nueva">
        <Spinner label="Revisando tu enlace" />
      </AuthLayout>
    );
  }

  if (!session) {
    return (
      <AuthLayout title="Este enlace ya no sirve" subtitle={linkError?.message ?? 'Abre el enlace más reciente que te enviamos o pide uno nuevo.'}>
        <LinkButton to="/recuperar" className="w-full">
          Pedir otro enlace
        </LinkButton>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Crea una contraseña nueva" subtitle="Úsala la próxima vez que inicies sesión">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Para que el gestor de contraseñas asocie la nueva con la cuenta */}
        <input type="email" autoComplete="username" value={session.user.email ?? ''} readOnly hidden />
        <Field label="Contraseña nueva" error={errors.password?.message}>
          <PasswordInput
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            aria-describedby="password-strength"
            {...register('password')}
          />
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
