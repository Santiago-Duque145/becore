import { useAuth } from '../contexts/AuthContext.jsx';
import { resolveAvatar } from '../lib/avatar.js';

// Avatar del usuario con sesión: { src, preset } listo para <Avatar {...useMyAvatar()} />
export function useMyAvatar() {
  const { profile, session } = useAuth();
  const meta = session?.user?.user_metadata;
  return resolveAvatar(profile ?? {}, meta?.avatar_url ?? meta?.picture ?? null);
}
