import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { LogOutIcon } from '../components/icons/index.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { updateMe } from '../services/profile.api.js';
import { profileSchema } from '../lib/auth-schemas.js';
import { Button, Input, Spinner, useToast } from '../components/ui/index.js';

const ROLE_LABELS = { organizer: 'Organizador', participant: 'Participante' };

export default function PerfilPage() {
  const { profile, setProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(profileSchema), values: { fullName: profile?.fullName ?? '' } });

  const mutation = useMutation({
    mutationFn: updateMe,
    onSuccess: ({ data }) => {
      setProfile(data);
      toast.success('Guardamos tu nombre.');
    },
    onError: (error) => {
      const detail = error.details?.find((d) => d.field === 'fullName');
      if (detail) setError('fullName', { message: detail.message });
      else toast.error(error.message);
    },
  });

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  if (!profile) return <Spinner />;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <h1 className="font-display text-xl font-semibold text-ink md:text-[22px]">Mi perfil</h1>

      <form
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        className="flex flex-col gap-4 rounded-card border border-line bg-panel p-5"
        noValidate
      >
        <Input label="Nombre" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
        <Input label="Correo" value={profile.email} readOnly disabled />
        <Input label="Rol" value={ROLE_LABELS[profile.role]} readOnly disabled />
        <Button type="submit" disabled={!isDirty} loading={mutation.isPending}>
          Guardar cambios
        </Button>
      </form>

      <Button variant="danger" onClick={handleSignOut}>
        <LogOutIcon size={18} /> Cerrar sesión
      </Button>
    </div>
  );
}
