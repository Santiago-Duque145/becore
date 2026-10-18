import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { insertSlot } from '../../src/repositories/availability.repository.js';
import { insertAppointment, markCancelled } from '../../src/repositories/appointments.repository.js';

// Golpea Supabase real: reglas de la migración 20261021130000 (exclusión + trigger) con los
// repositorios de verdad, así que también comprueba la traducción a los códigos de la API.
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Día lejano y hora fija (UTC) para no chocar con datos de demo
const DAY = new Date(Date.now() + 60 * 24 * 3600 * 1000);
DAY.setUTCHours(0, 0, 0, 0);
const at = (h, m = 0) => new Date(DAY.getTime() + (h * 60 + m) * 60 * 1000).toISOString();
const appointment = (startsAt, endsAt) => ({ title: 'Prueba de cruces', notes: '', location: '', startsAt, endsAt });

let organizerId = null;

async function cleanup() {
  if (!organizerId) return;
  const window = (q) => q.eq('organizer_id', organizerId).gte('starts_at', at(0)).lt('starts_at', at(24));
  await window(supabase.from('appointments').delete());
  await window(supabase.from('availability_slots').delete());
}

beforeAll(async () => {
  const { data, error } = await supabase.from('profiles').select('id').eq('email', 'santiago@becore.test').single();
  if (error) throw error;
  organizerId = data.id;
  await cleanup(); // restos de una corrida anterior interrumpida
  await insertSlot(organizerId, { startsAt: at(15), endsAt: at(17) });
});

afterAll(cleanup);

describe('franjas de disponibilidad', () => {
  it('una franja que se cruza con otra → SLOT_OVERLAP; una que solo toca entra', async () => {
    await expect(insertSlot(organizerId, { startsAt: at(16), endsAt: at(18) })).rejects.toMatchObject({
      status: 409,
      code: 'SLOT_OVERLAP',
    });
    await expect(insertSlot(organizerId, { startsAt: at(17), endsAt: at(18) })).resolves.toMatchObject({ id: expect.any(String) });
  });

  it('dos franjas cruzadas al mismo tiempo: solo una gana, la otra SLOT_OVERLAP', async () => {
    const results = await Promise.allSettled([
      insertSlot(organizerId, { startsAt: at(8), endsAt: at(10) }),
      insertSlot(organizerId, { startsAt: at(9), endsAt: at(11) }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.find((r) => r.status === 'rejected').reason).toMatchObject({ status: 409, code: 'SLOT_OVERLAP' });
  });
});

describe('citas dentro de una franja', () => {
  it('cita fuera de franja (o que abarca dos franjas) → APPOINTMENT_OUTSIDE_SLOT', async () => {
    await expect(insertAppointment(organizerId, appointment(at(14), at(15, 30)))).rejects.toMatchObject({
      status: 409,
      code: 'APPOINTMENT_OUTSIDE_SLOT',
    });
    // 15–17 y 17–18 se tocan, pero la cita debe caber completa en una sola
    await expect(insertAppointment(organizerId, appointment(at(16, 30), at(17, 30)))).rejects.toMatchObject({
      code: 'APPOINTMENT_OUTSIDE_SLOT',
    });
  });

  it('cita cruzada con otra activa → APPOINTMENT_OVERLAP; si la otra se cancela ya no bloquea', async () => {
    const first = await insertAppointment(organizerId, appointment(at(15), at(16)));
    await expect(insertAppointment(organizerId, appointment(at(15, 30), at(16, 30)))).rejects.toMatchObject({
      status: 409,
      code: 'APPOINTMENT_OVERLAP',
    });

    await markCancelled(first);
    await expect(insertAppointment(organizerId, appointment(at(15, 30), at(16, 30)))).resolves.toEqual(expect.any(String));
  });

  it('dos citas cruzadas al mismo tiempo: solo una gana, la otra APPOINTMENT_OVERLAP', async () => {
    const results = await Promise.allSettled([
      insertAppointment(organizerId, appointment(at(17), at(17, 45))),
      insertAppointment(organizerId, appointment(at(17, 15), at(18))),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.find((r) => r.status === 'rejected').reason).toMatchObject({ status: 409, code: 'APPOINTMENT_OVERLAP' });
  });
});
