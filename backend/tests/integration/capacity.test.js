import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Golpea Supabase real: 30 confirmaciones simultáneas sobre un evento de cupo 10 (KPI sobrecupo = 0)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CAPACITY = 10;
const TEMP_USERS = 18;
const tempEmails = Array.from({ length: TEMP_USERS }, (_, i) => `carga${String(i + 1).padStart(2, '0')}@becore.test`);

let eventId = null;
let participantIds = [];

async function deleteTempUsers() {
  const { data } = await supabase.from('profiles').select('id').in('email', tempEmails);
  for (const { id } of data ?? []) await supabase.auth.admin.deleteUser(id);
}

beforeAll(async () => {
  await deleteTempUsers(); // restos de una corrida anterior interrumpida

  for (const email of tempEmails) {
    const { error } = await supabase.auth.admin.createUser({
      email,
      password: 'BeCore2026!',
      email_confirm: true,
      user_metadata: { full_name: `Carga ${email.slice(5, 7)}`, role: 'participant' },
    });
    if (error) throw error;
  }

  const { data: participants, error } = await supabase.from('profiles').select('id').eq('role', 'participant');
  if (error) throw error;
  participantIds = participants.map((p) => p.id);

  const { data: organizer } = await supabase.from('profiles').select('id').eq('email', 'santiago@becore.test').single();
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      organizer_id: organizer.id,
      title: 'Prueba de concurrencia',
      category: 'sport',
      location: 'Cancha de prueba',
      starts_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      capacity: CAPACITY,
      status: 'published',
    })
    .select('id')
    .single();
  if (eventError) throw eventError;
  eventId = event.id;
});

afterAll(async () => {
  try {
    if (eventId) await supabase.from('events').delete().eq('id', eventId);
  } finally {
    await deleteTempUsers();
  }
});

describe('confirm_attendance bajo concurrencia', () => {
  it('30 llamadas en paralelo sobre cupo 10 → 10 confirmadas y 20 EVENT_FULL', async () => {
    expect(participantIds.length).toBe(30);

    const results = await Promise.allSettled(
      participantIds.map(async (userId) => {
        const { error } = await supabase.rpc('confirm_attendance', { p_event_id: eventId, p_user_id: userId });
        if (error) throw new Error(error.message);
      }),
    );

    const rejected = results.filter((r) => r.status === 'rejected');
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(CAPACITY);
    expect(rejected).toHaveLength(participantIds.length - CAPACITY);
    expect(rejected.every((r) => r.reason.message === 'EVENT_FULL')).toBe(true);

    const { data: event } = await supabase.from('events').select('confirmed_count').eq('id', eventId).single();
    const { count } = await supabase
      .from('attendances')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'confirmed');
    expect(event.confirmed_count).toBe(CAPACITY);
    expect(count).toBe(CAPACITY);
  });
});
