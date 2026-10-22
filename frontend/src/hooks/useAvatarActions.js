import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext.jsx';
import { compressImage } from '../lib/image.js';
import * as profileApi from '../services/profile.api.js';
import { uploadToTarget } from '../services/storage.js';

// Acciones del avatar (P3). Cada una responde como GET /me y deja el perfil actualizado en el contexto.
export function useAvatarActions() {
  const { setProfile } = useAuth();
  const onSuccess = ({ data }) => setProfile(data);

  const upload = useMutation({
    mutationFn: async (file) => {
      const blob = await compressImage(file, 'avatar');
      const { data: target } = await profileApi.requestAvatarUpload(blob.type);
      await uploadToTarget(target, blob);
      return profileApi.saveAvatarPhoto(target.path);
    },
    onSuccess,
  });
  const preset = useMutation({ mutationFn: profileApi.saveAvatarPreset, onSuccess });
  const remove = useMutation({ mutationFn: profileApi.removeAvatar, onSuccess });

  return {
    uploadPhoto: upload.mutateAsync,
    choosePreset: preset.mutateAsync,
    removeAvatar: remove.mutateAsync,
    pending: upload.isPending || preset.isPending || remove.isPending,
    uploading: upload.isPending,
  };
}
