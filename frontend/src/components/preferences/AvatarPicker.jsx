import { useRef, useState } from 'react';
import { AVATAR_PRESETS, PresetAvatarSvg } from '../../assets/avatars/index.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useAvatarActions } from '../../hooks/useAvatarActions.js';
import { useMyAvatar } from '../../hooks/useMyAvatar.js';
import { validateImageFile } from '../../lib/image.js';
import { cn } from '../../lib/cn.js';
import { Avatar, Button, useToast } from '../ui/index.js';
import { AvatarCropModal } from './AvatarCropModal.jsx';

// Foto de perfil: subir una (se comprime en el navegador) o elegir uno de los 12 avatares de la marca.
// compact: sin título ni "Quitar" (último paso del onboarding).
export function AvatarPicker({ compact = false }) {
  const { profile } = useAuth();
  const avatar = useMyAvatar();
  const toast = useToast();
  const fileRef = useRef(null);
  const [cropFile, setCropFile] = useState(null); // P8: foto elegida, abierta en el editor de encuadre
  const { uploadPhoto, choosePreset, removeAvatar, pending, uploading } = useAvatarActions();
  const hasOwn = Boolean(profile?.avatarUrl || profile?.avatarPreset);

  async function run(action, success) {
    try {
      await action();
      if (success) toast.success(success);
    } catch (error) {
      toast.error(error.message);
    }
  }

  function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    const problem = validateImageFile(file);
    if (problem) return toast.error(problem);
    setCropFile(file);
    return undefined;
  }

  async function uploadCropped(blob) {
    await run(() => uploadPhoto(blob), 'Actualizamos tu foto.');
    setCropFile(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Avatar name={profile?.fullName} {...avatar} size="lg" className="h-16 w-16" decorative />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" loading={uploading} disabled={pending} onClick={() => fileRef.current?.click()}>
            Subir foto
          </Button>
          {!compact && hasOwn && (
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(removeAvatar, 'Quitamos tu foto.')}>
              Quitar
            </Button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={handleFile} aria-label="Elegir foto de perfil" />
        </div>
      </div>
      <AvatarCropModal
        file={cropFile}
        name={profile?.fullName}
        onConfirm={uploadCropped}
        onChangeImage={() => fileRef.current?.click()}
        onCancel={() => setCropFile(null)}
      />

      <div>
        <p className="mb-2 text-xs font-semibold text-ink-muted">O elige un avatar</p>
        <ul className="grid grid-cols-6 gap-2" role="list">
          {AVATAR_PRESETS.map(({ id, label }) => {
            const selected = profile?.avatarPreset === id && !profile?.avatarUrl;
            return (
              <li key={id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={label}
                  disabled={pending}
                  onClick={() => run(() => choosePreset(id))}
                  className={cn(
                    'focus-ring relative block aspect-square w-full overflow-hidden rounded-full border-2 transition duration-200 disabled:opacity-50 motion-reduce:transition-none',
                    selected ? 'border-accent' : 'border-transparent hover:border-line',
                  )}
                >
                  <PresetAvatarSvg id={id} className="h-full w-full" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
