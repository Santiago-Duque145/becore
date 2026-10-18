import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({ verifyOtp: vi.fn(), resend: vi.fn(), resetPasswordForEmail: vi.fn() }));
vi.mock('../lib/supabase.js', () => ({ supabase: { auth } }));

import { AUTH_MESSAGES } from '../lib/auth-errors.js';
import { requestRecoveryCode, resendSignupCode, verifyRecoveryCode, verifySignupCode } from './auth-otp.js';

const ok = { data: {}, error: null };
const fail = (code, message = 'x') => ({ data: {}, error: { code, message, status: 403 } });

beforeEach(() => vi.resetAllMocks());

describe('confirmar la cuenta', () => {
  it('verifica con el tipo "email"', async () => {
    auth.verifyOtp.mockResolvedValue(ok);
    await verifySignupCode({ email: 'a@b.co', token: '123456' });
    expect(auth.verifyOtp).toHaveBeenCalledOnce();
    expect(auth.verifyOtp).toHaveBeenCalledWith({ email: 'a@b.co', token: '123456', type: 'email' });
  });

  it('si el servidor solo aceptara "signup", reintenta con ese tipo', async () => {
    auth.verifyOtp.mockResolvedValueOnce(fail('otp_expired')).mockResolvedValueOnce(ok);
    await expect(verifySignupCode({ email: 'a@b.co', token: '123456' })).resolves.toBeUndefined();
    expect(auth.verifyOtp).toHaveBeenLastCalledWith({ email: 'a@b.co', token: '123456', type: 'signup' });
  });

  it('código incorrecto o vencido → mensaje claro en español', async () => {
    auth.verifyOtp.mockResolvedValue(fail('otp_expired', 'Token has expired or is invalid'));
    await expect(verifySignupCode({ email: 'a@b.co', token: '000000' })).rejects.toMatchObject({
      message: AUTH_MESSAGES.invalidCode,
      code: 'otp_expired',
    });
  });

  it('demasiados intentos → mensaje de espera, sin reintentar', async () => {
    auth.verifyOtp.mockResolvedValue(fail('over_request_rate_limit'));
    await expect(verifySignupCode({ email: 'a@b.co', token: '123456' })).rejects.toMatchObject({
      message: AUTH_MESSAGES.tooManyRequests,
    });
    expect(auth.verifyOtp).toHaveBeenCalledOnce();
  });

  it('sin conexión → mensaje de red', async () => {
    auth.verifyOtp.mockResolvedValue({ error: { name: 'AuthRetryableFetchError', message: 'Failed to fetch', status: 0 } });
    await expect(verifySignupCode({ email: 'a@b.co', token: '123456' })).rejects.toMatchObject({
      message: AUTH_MESSAGES.network,
    });
  });
});

describe('reenviar código', () => {
  it('pide un código de registro nuevo', async () => {
    auth.resend.mockResolvedValue(ok);
    await resendSignupCode('a@b.co');
    expect(auth.resend).toHaveBeenCalledWith({ type: 'signup', email: 'a@b.co' });
  });

  it('límite de correos → mensaje en español', async () => {
    auth.resend.mockResolvedValue(fail('over_email_send_rate_limit'));
    await expect(resendSignupCode('a@b.co')).rejects.toMatchObject({ message: AUTH_MESSAGES.tooManyEmails });
  });
});

describe('recuperar contraseña', () => {
  it('pide el código sin enlace de redirección', async () => {
    auth.resetPasswordForEmail.mockResolvedValue(ok);
    await requestRecoveryCode('a@b.co');
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('a@b.co');
  });

  it('verifica con el tipo "recovery"', async () => {
    auth.verifyOtp.mockResolvedValue(ok);
    await verifyRecoveryCode({ email: 'a@b.co', token: '654321' });
    expect(auth.verifyOtp).toHaveBeenCalledWith({ email: 'a@b.co', token: '654321', type: 'recovery' });
  });

  it('código vencido → mensaje claro', async () => {
    auth.verifyOtp.mockResolvedValue(fail('otp_expired'));
    await expect(verifyRecoveryCode({ email: 'a@b.co', token: '654321' })).rejects.toMatchObject({
      message: AUTH_MESSAGES.invalidCode,
    });
  });
});
