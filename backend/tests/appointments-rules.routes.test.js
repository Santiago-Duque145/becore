import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

// Reglas de cruces de la migración 20261021130000. Supabase se simula con el error exacto que
// devuelve PostgREST; el repositorio real lo pasa por translateDbError y la API responde 409.
// La regla en sí (exclusión, trigger, concurrencia) se prueba contra Supabase real en
// tests/integration/appointment-rules.test.js.
vi.mock('../src/config/supabase.js', () => ({
  supabaseAdmin: { auth: { getUser: vi.fn() }, from: vi.fn() },
}));
vi.mock('../src/repositories/profiles.repository.js', () => ({
  findProfileById: vi.fn(),
  findParticipantIds: vi.fn(),
}));
vi.mock('../src/services/notifications.service.js', () => ({ notify: vi.fn() }));

import { supabaseAdmin } from '../src/config/supabase.js';
import { findParticipantIds, findProfileById } from '../src/repositories/profiles.repository.js';
import { notify } from '../src/services/notifications.service.js';

const organizer = { id: 'org-1', email: 'o@becore.test', fullName: 'Org', role: 'organizer' };
const P1 = '3f1d2c4e-5a6b-4c7d-8e9f-0a1b2c3d4e51';
const inHours = (h) => new Date(Date.now() + h * 3600 * 1000).toISOString();

const SLOT_OVERLAP_PG = {
  code: '23P01',
  message: 'conflicting key value violates exclusion constraint "availability_slots_no_overlap"',
};
const APPOINTMENT_OVERLAP_PG = {
  code: '23P01',
  message: 'conflicting key value violates exclusion constraint "appointments_no_overlap"',
};
const OUTSIDE_SLOT_PG = { code: '23514', message: 'APPOINTMENT_OUTSIDE_SLOT' };

// Builder encadenable de supabase-js que termina en { data, error }
function builder(result) {
  const chain = {};
  for (const m of ['insert', 'select', 'delete', 'update', 'eq']) chain[m] = vi.fn(() => chain);
  chain.single = vi.fn(async () => result);
  chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return chain;
}

function failInsertWith(table, pgError) {
  supabaseAdmin.from.mockImplementation((name) => builder(name === table ? { data: null, error: pgError } : { data: [], error: null }));
}

const auth = (req) => req.set('Authorization', 'Bearer t');
const slotBody = { startsAt: inHours(48), endsAt: inHours(50) };
const appointmentBody = { title: 'Reunión', startsAt: inHours(48), endsAt: inHours(49), participantIds: [P1] };

beforeEach(() => {
  vi.resetAllMocks();
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: organizer.id } }, error: null });
  findProfileById.mockResolvedValue(organizer);
  findParticipantIds.mockResolvedValue([P1]);
});

describe('POST /availability con cruce', () => {
  it('franja que se cruza con otra → 409 SLOT_OVERLAP con el mensaje de la interfaz', async () => {
    failInsertWith('availability_slots', SLOT_OVERLAP_PG);
    const res = await auth(request(app).post('/api/v1/availability')).send(slotBody);
    expect(res.status).toBe(409);
    expect(res.body.error).toEqual({ code: 'SLOT_OVERLAP', message: 'Ese horario se cruza con otra de tus franjas. Elige otro o borra primero la que se cruza' });
  });
});

describe('POST /appointments con reglas de franja', () => {
  it('cita fuera de franja → 409 APPOINTMENT_OUTSIDE_SLOT y no inserta invitados ni avisa', async () => {
    failInsertWith('appointments', OUTSIDE_SLOT_PG);
    const res = await auth(request(app).post('/api/v1/appointments')).send(appointmentBody);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('APPOINTMENT_OUTSIDE_SLOT');
    expect(res.body.error.message).toBe('La cita debe quedar dentro de una de tus franjas de disponibilidad');
    expect(supabaseAdmin.from).not.toHaveBeenCalledWith('appointment_participants');
    expect(notify).not.toHaveBeenCalled();
  });

  it('cita cruzada con otra activa → 409 APPOINTMENT_OVERLAP', async () => {
    failInsertWith('appointments', APPOINTMENT_OVERLAP_PG);
    const res = await auth(request(app).post('/api/v1/appointments')).send(appointmentBody);
    expect(res.status).toBe(409);
    expect(res.body.error).toEqual({ code: 'APPOINTMENT_OVERLAP', message: 'Ese horario se cruza con otra de tus citas. Elige otro horario' });
    expect(notify).not.toHaveBeenCalled();
  });
});
