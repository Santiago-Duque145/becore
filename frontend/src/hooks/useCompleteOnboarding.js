import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext.jsx';
import { queryKeys } from '../lib/query-keys.js';
import { completeOnboarding } from '../services/profile.api.js';

// PUT /me/onboarding. El perfil vive en AuthContext (no en una query), así que además de invalidar
// la clave de /me se actualiza el contexto: con onboardingCompleted=true el guard deja de redirigir.
export function useCompleteOnboarding({ onSuccess } = {}) {
  const queryClient = useQueryClient();
  const { setProfile } = useAuth();
  return useMutation({
    mutationFn: completeOnboarding,
    onSuccess: ({ data }, variables) => {
      onSuccess?.(data, variables);
      setProfile(data);
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}
