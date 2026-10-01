import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/app-error.js';
import { findProfileById } from '../repositories/profiles.repository.js';

export async function requireAuth(req, _res, next) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError(401, 'UNAUTHENTICATED', 'Debes iniciar sesión');

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user?.id) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Tu sesión expiró, inicia sesión de nuevo');
  }

  const profile = await findProfileById(data.user.id);
  if (!profile) throw new AppError(401, 'UNAUTHENTICATED', 'Perfil no encontrado');

  req.user = profile;
  next();
}
