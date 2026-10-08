import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext.jsx';
import { updateMe } from '../services/profile.api.js';
import { profileSchema } from '../lib/auth-schemas.js';
import { Input } from '../components/ui/Field.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Spinner } from '../components/ui/Feedback.jsx';

const ROLE_LABELS = { organizer: 'Organizador', participant: 'Participante' };

export default function PerfilPage() {
  const { profile, setProfile, signOut } = useAuth();
  const navigate = useNavigate();
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
    navigate('/ingresar', { replace: true });
  }

  if (!profile) return <Spinner />;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-navy-900">Mi perfil</h1>

      <form
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm"
        noValidate
      >
        <Input label="Nombre" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
        <Input label="Correo" value={profile.email} readOnly disabled />
        <Input label="Rol" value={ROLE_LABELS[profile.role]} readOnly disabled />
        <Button type="submit" disabled={!isDirty || mutation.isPending}>
          {mutation.isPending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </form>

      <Button variant="danger" onClick={handleSignOut}>
        Cerrar sesión
      </Button>
    </div>
  );
}
