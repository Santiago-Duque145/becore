import { supabase } from '../lib/supabase.js';
import { AUTH_MESSAGES, AuthUiError, toAuthUiError } from '../lib/auth-errors.js';

// Códigos de 6 dígitos de Supabase Auth (confirmar cuenta y recuperar contraseña). Al verificar bien, Supabase
// abre la sesión y AuthContext la recibe por onAuthStateChange: aquí no hace falta tocar el contexto.

// Supabase responde igual (otp_expired) cuando el código está mal escrito y cuando venció
function toCodeError(error) {
  const text = error?.message ?? '';
  if (error?.code === 'otp_expired' || /expired or is invalid|invalid.*token/i.test(text)) {
    return new AuthUiError(AUTH_MESSAGES.invalidCode, 'otp_expired');
  }
  return toAuthUiError(error);
}

async function verify(params) {
  const { error } = await supabase.auth.verifyOtp(params);
  return error;
}

// Confirmación de cuenta. Con el SDK actual el tipo es 'email'; si el servidor solo aceptara el tipo
// histórico 'signup', se reintenta una vez con ese (un código realmente malo falla en los dos).
export async function verifySignupCode({ email, token }) {
  const error = await verify({ email, token, type: 'email' });
  if (!error) return;
  if (toCodeError(error).code !== 'otp_expired') throw toCodeError(error);
  const retry = await verify({ email, token, type: 'signup' });
  if (retry) throw toCodeError(retry);
}

export async function resendSignupCode(email) {
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw toAuthUiError(error);
}

// Recuperar contraseña: pide el código (no revela si el correo tiene cuenta), lo verifica y abre sesión
export async function requestRecoveryCode(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw toAuthUiError(error);
}

export async function verifyRecoveryCode({ email, token }) {
  const error = await verify({ email, token, type: 'recovery' });
  if (error) throw toCodeError(error);
}
