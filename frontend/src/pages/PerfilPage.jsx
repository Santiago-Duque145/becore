import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { LogOutIcon } from '../components/icons/index.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { updateMe } from '../services/profile.api.js';
import { profileSchema } from '../lib/auth-schemas.js';
import { Avatar, Button, Input, Spinner, useToast } from '../components/ui/index.js';
import { PreferencesEditor } from '../components/preferences/PreferencesEditor.jsx';

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
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="flex items-center gap-4 pt-1">
        <Avatar name={profile.fullName} size="lg" decorative />
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl font-semibold text-ink md:text-[22px]">{profile.fullName}</h1>
          <p className="text-xs text-ink-muted">{ROLE_LABELS[profile.role]}</p>
        </div>
      </header>

      <section aria-labelledby="perfil-datos" className="rounded-card border border-line bg-panel p-5">
        <h2 id="perfil-datos" className="mb-4 font-display text-base font-semibold text-ink">
          Tus datos
        </h2>
        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4" noValidate>
          <Input label="Nombre" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
          <Input label="Correo" value={profile.email} readOnly disabled />
          <Input label="Rol" value={ROLE_LABELS[profile.role]} readOnly disabled />
          <Button type="submit" disabled={!isDirty} loading={mutation.isPending} className="md:self-start">
            Guardar nombre
          </Button>
        </form>
      </section>

      <section aria-labelledby="perfil-gustos" className="rounded-card border border-line bg-panel p-5">
        <h2 id="perfil-gustos" className="font-display text-base font-semibold text-ink">
          Tus gustos
        </h2>
        <p className="mt-1 mb-5 text-[13px] text-ink-muted">Con esto armamos tu sección "Para ti" en Descubre.</p>
        <PreferencesEditor />
      </section>

      <Button variant="danger" onClick={handleSignOut} className="md:self-start">
        <LogOutIcon size={18} /> Cerrar sesión
      </Button>
    </div>
  );
}
