import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PASSWORD = 'BeCore2026!';

const ORGANIZERS = [
  { email: 'santiago@becore.test', full_name: 'Santiago Duque', role: 'organizer' },
  { email: 'felipe@becore.test', full_name: 'Felipe Jaramillo', role: 'organizer' },
];

const PARTICIPANTS = Array.from({ length: 12 }, (_, i) => ({
  email: `jugador${i + 1}@becore.test`,
  full_name: `Jugador ${i + 1}`,
  role: 'participant',
}));

async function upsertUser({ email, full_name, role }) {
  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email === email);
  if (existing) {
    console.info(`[seed] Usuario existente: ${email}`);
    return existing.id;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name, role },
  });
  if (error) throw new Error(`Error creando ${email}: ${error.message}`);
  console.info(`[seed] Usuario creado: ${email}`);
  return data.user.id;
}

const EVENTS = [
  {
    title: 'Partido 5v5 del sábado',
    description: 'Llevar camiseta oscura. Cancha cubierta.',
    category: 'sport',
    location: 'Cancha sintética Estadio, Medellín',
    hoursFromNow: 72,
    duration: 90,
    capacity: 12,
    attendances: 3,
  },
  {
    title: 'Torneo de baloncesto 3×3',
    description: 'Tres jugadores por equipo, inscripción libre.',
    category: 'sport',
    location: 'Parque de Belén, Medellín',
    hoursFromNow: 120,
    duration: 180,
    capacity: 18,
    attendances: 5,
  },
  {
    title: 'Cine al aire libre: Encanto',
    description: 'Traer cobija y algo para picar.',
    category: 'culture',
    location: 'Parque del Poblado, Medellín',
    hoursFromNow: 96,
    duration: 120,
    capacity: 30,
    attendances: 8,
  },
  {
    title: 'Ciclopaseo nocturno',
    description: 'Ruta de 15 km por el centro. Llevar luces.',
    category: 'recreation',
    location: 'Parque de las Luces, Medellín',
    hoursFromNow: 144,
    duration: 150,
    capacity: 20,
    attendances: 6,
  },
  {
    title: 'Taller de danza urbana',
    description: 'Para todos los niveles. Ropa cómoda.',
    category: 'culture',
    location: 'Centro Cultural Moravia, Medellín',
    hoursFromNow: 168,
    duration: 90,
    capacity: 15,
    attendances: 4,
  },
  {
    title: 'Torneo de ajedrez relámpago',
    description: '5 minutos por jugador. Inscripción gratuita.',
    category: 'recreation',
    location: 'Biblioteca España, Medellín',
    hoursFromNow: 192,
    duration: 240,
    capacity: 8,
    attendances: 2,
  },
];

async function deleteOrganizerEvents(organizerIds) {
  for (const id of organizerIds) {
    const { data: events } = await supabase.from('events').select('id').eq('organizer_id', id);
    if (events?.length) {
      const ids = events.map((e) => e.id);
      await supabase.from('activity_log').delete().in('event_id', ids);
      await supabase.from('attendances').delete().in('event_id', ids);
      await supabase.from('notifications').delete().in('event_id', ids);
      await supabase.from('events').delete().in('id', ids);
      console.info(`[seed] Eventos eliminados del organizador ${id}`);
    }
  }
}

async function main() {
  console.info('[seed] Iniciando...');

  const organizerIds = [];
  for (const org of ORGANIZERS) {
    organizerIds.push(await upsertUser(org));
  }

  const participantIds = [];
  for (const part of PARTICIPANTS) {
    participantIds.push(await upsertUser(part));
  }

  await deleteOrganizerEvents(organizerIds);

  const now = new Date();
  let eventIdx = 0;
  for (const def of EVENTS) {
    const organizerId = organizerIds[eventIdx % organizerIds.length];
    const startsAt = new Date(now.getTime() + def.hoursFromNow * 3600 * 1000);
    const endsAt = new Date(startsAt.getTime() + def.duration * 60 * 1000);

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        organizer_id: organizerId,
        title: def.title,
        description: def.description,
        category: def.category,
        location: def.location,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        capacity: def.capacity,
      })
      .select('id, title')
      .single();

    if (error) {
      console.error(`[seed] Error creando evento "${def.title}": ${error.message}`);
      eventIdx++;
      continue;
    }
    console.info(`[seed] Evento creado: ${event.title} (${event.id})`);

    // La BD crea los eventos en draft (D-01); Descubre y confirm_attendance exigen published
    const { error: publishError } = await supabase.from('events').update({ status: 'published' }).eq('id', event.id);
    if (publishError) {
      console.error(`[seed] No pudo publicar "${event.title}": ${publishError.message}`);
      eventIdx++;
      continue;
    }

    const count = Math.min(def.attendances, participantIds.length);
    let confirmed = 0;
    for (let i = 0; i < count; i++) {
      const { error: attError } = await supabase.rpc('confirm_attendance', {
        p_event_id: event.id,
        p_user_id: participantIds[i],
      });
      if (attError) console.warn(`[seed] No pudo confirmar jugador${i + 1}: ${attError.message}`);
      else confirmed++;
    }
    console.info(`[seed] ${confirmed} de ${count} asistencias confirmadas en "${event.title}"`);
    eventIdx++;
  }

  const { count: profileCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  const { count: eventCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true });

  console.info(`[seed] Listo. Perfiles en BD: ${profileCount} | Eventos en BD: ${eventCount}`);
}

main().catch((err) => {
  console.error('[seed] Error fatal:', err.message);
  process.exit(1);
});
