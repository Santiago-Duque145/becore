import { createClient } from '@supabase/supabase-js';
import { gemini } from '../src/services/ai/geminiClient.js';
import { indexEvent } from '../src/services/ai/indexing.service.js';

// 10 eventos de demostración para el partido (31 oct) y la sustentación (3–6 nov), del 25 oct al 15 nov de 2026.
// MARCA: todos son de una cuenta organizadora creada solo para esto (DEMO_EMAIL). Para excluirlos del análisis del
// partido basta filtrar por su organizer_id; `--remove` borra sus eventos (y en cascada su event_ai, asistencias y
// recommendation_events) y la cuenta.
// Sin efectos hacia usuarios reales: se insertan directo con la secret key, sin pasar por la API, así que no hay
// correos ni avisos; en events solo corre el trigger que marca la fecha; el frontend solo escucha UPDATE de events
// filtrado por id u organizador (nadie recibe estos INSERT); los recordatorios solo van a confirmados (no hay).
// Etiquetas: con embeddings (solo cupo del modelo de embeddings, nunca el de texto).
// Uso: npm run seed:demo -w backend                → solo muestra el plan
//      npm run seed:demo -w backend -- --apply     → crea la cuenta y los eventos, y los etiqueta
//      npm run seed:demo -w backend -- --remove    → plan de borrado; con --remove --apply, borra

const DEMO_EMAIL = 'organizador.demo@becore.test';
const DEMO_NAME = 'Barrio Activo';
const DEMO_PASSWORD = 'BeCore2026!'; // la misma de las cuentas del seed

// Hora de Bogotá (UTC−5, sin horario de verano). Coordenadas aproximadas del lugar.
const EVENTS = [
  {
    title: 'Caminata al Cerro Nutibara',
    category: 'recreation',
    startsAt: '2026-10-25T08:00:00-05:00',
    endsAt: '2026-10-25T11:00:00-05:00',
    location: 'Pueblito Paisa, Cerro Nutibara, Medellín',
    latitude: 6.2367,
    longitude: -75.5795,
    capacity: 25,
    description: 'Subimos a pie desde la entrada de la carrera 65 hasta el Pueblito Paisa. Ritmo tranquilo, apto para principiantes. Lleva agua, gorra y bloqueador.',
  },
  {
    title: 'Microfútbol mixto',
    category: 'sport',
    startsAt: '2026-10-26T16:00:00-05:00',
    endsAt: '2026-10-26T18:00:00-05:00',
    location: 'Unidad Deportiva de Belén, Medellín',
    latitude: 6.2296,
    longitude: -75.601,
    capacity: 12,
    description: 'Dos equipos de seis, mixtos y rotativos. Cancha sintética. Trae tenis de suela lisa y una camiseta clara y otra oscura.',
  },
  {
    title: 'Club de lectura: Cien años de soledad',
    category: 'culture',
    startsAt: '2026-10-28T19:00:00-05:00',
    endsAt: '2026-10-28T20:30:00-05:00',
    location: 'Biblioteca Pública Piloto, Medellín',
    latitude: 6.2578,
    longitude: -75.5796,
    capacity: 15,
    description: 'Comentamos los primeros cinco capítulos. No importa si no los terminaste: la idea es conversar y conocer gente que disfrute leer.',
  },
  {
    title: 'Yoga al atardecer',
    category: 'sport',
    startsAt: '2026-10-30T17:30:00-05:00',
    endsAt: '2026-10-30T18:45:00-05:00',
    location: 'Parque de los Pies Descalzos, Medellín',
    latitude: 6.2446,
    longitude: -75.578,
    capacity: 30,
    description: 'Sesión de yoga suave y estiramientos al aire libre, para todos los niveles. Lleva tapete o una toalla grande.',
  },
  {
    title: 'Torneo relámpago de baloncesto 3×3',
    category: 'sport',
    startsAt: '2026-10-31T15:00:00-05:00',
    endsAt: '2026-10-31T18:00:00-05:00',
    location: 'Unidad Deportiva Atanasio Girardot, Medellín',
    latitude: 6.256,
    longitude: -75.588,
    capacity: 24,
    description: 'Equipos de tres, partidos a 11 puntos o 10 minutos. Inscríbete solo o con tu equipo: armamos los que falten en la cancha.',
  },
  {
    title: 'Taller de acuarela en el Jardín Botánico',
    category: 'culture',
    startsAt: '2026-11-01T10:00:00-05:00',
    endsAt: '2026-11-01T12:00:00-05:00',
    location: 'Jardín Botánico de Medellín',
    latitude: 6.2706,
    longitude: -75.565,
    capacity: 18,
    description: 'Pintamos plantas y flores del jardín con técnicas básicas de acuarela. Materiales incluidos; solo trae ganas de aprender.',
  },
  {
    title: 'Noche de juegos de mesa',
    category: 'recreation',
    startsAt: '2026-11-03T18:00:00-05:00',
    endsAt: '2026-11-03T21:00:00-05:00',
    location: 'Parque de Carlos E. Restrepo, Medellín',
    latitude: 6.2633,
    longitude: -75.5808,
    capacity: 20,
    description: 'Parqués, Catan, cartas y ajedrez. Si tienes un juego favorito, tráelo. Ideal para conocer gente del barrio.',
  },
  {
    title: 'Cine al aire libre: El abrazo de la serpiente',
    category: 'culture',
    startsAt: '2026-11-05T19:00:00-05:00',
    endsAt: '2026-11-05T21:30:00-05:00',
    location: 'Parque principal de Envigado',
    latitude: 6.1709,
    longitude: -75.5871,
    capacity: 60,
    description: 'Proyección gratuita de la película colombiana nominada al Óscar. Trae cobija o silla plegable y algo para picar.',
  },
  {
    title: 'Ciclopaseo al Parque Arví',
    category: 'sport',
    startsAt: '2026-11-08T07:00:00-05:00',
    endsAt: '2026-11-08T11:00:00-05:00',
    location: 'Parque Arví, Santa Elena, Medellín',
    latitude: 6.2826,
    longitude: -75.5023,
    capacity: 20,
    description: 'Ruta en bicicleta por los senderos del parque, con paradas para descansar. Casco obligatorio; nivel intermedio.',
  },
  {
    title: 'Feria de emprendimiento del barrio',
    category: 'other',
    startsAt: '2026-11-15T14:00:00-05:00',
    endsAt: '2026-11-15T19:00:00-05:00',
    location: 'Parque principal de Sabaneta',
    latitude: 6.1513,
    longitude: -75.6164,
    capacity: 100,
    description: 'Puestos de emprendedores locales: comida, ropa, artesanías y más. Entrada libre; el cupo es para quien quiera tener puesto.',
  },
];

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const remove = args.includes('--remove');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SLOTS = (hour) => (hour < 12 ? 'mañana' : hour < 18 ? 'tarde' : 'noche');
const when = (iso) =>
  `${new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))} (${SLOTS(Number(iso.slice(11, 13)))})`;

async function findDemoUser() {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;
  return data.users.find((u) => u.email === DEMO_EMAIL) ?? null;
}

async function demoEvents(organizerId) {
  const { data, error } = await supabase.from('events').select('id, title, confirmed_count').eq('organizer_id', organizerId);
  if (error) throw error;
  return data;
}

async function removeDemo() {
  const user = await findDemoUser();
  if (!user) return console.info('No hay cuenta de demostración: nada que borrar.');
  const events = await demoEvents(user.id);
  console.info(`${apply ? 'BORRANDO' : 'Plan de borrado (agrega --apply para borrar)'}: cuenta ${DEMO_EMAIL} y ${events.length} eventos`);
  for (const e of events) console.info(`  - «${e.title}»${e.confirmed_count ? ` · ${e.confirmed_count} confirmados (sus asistencias también se borran)` : ''}`);
  if (!apply) return;
  const { error } = await supabase.from('events').delete().eq('organizer_id', user.id);
  if (error) throw error;
  const { error: userError } = await supabase.auth.admin.deleteUser(user.id);
  if (userError) throw userError;
  console.info('Listo: eventos y cuenta de demostración borrados.');
}

async function ensureDemoOrganizer() {
  const existing = await findDemoUser();
  const user =
    existing ??
    (await supabase.auth.admin.createUser({ email: DEMO_EMAIL, password: DEMO_PASSWORD, email_confirm: true, user_metadata: { full_name: DEMO_NAME } }))
      .data.user;
  if (!user) throw new Error('No se pudo crear la cuenta de demostración');
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: DEMO_NAME, role: 'organizer', onboarding_completed_at: new Date().toISOString(), data_consent_at: new Date().toISOString() })
    .eq('id', user.id);
  if (error) throw error;
  return { user, created: !existing };
}

async function seed() {
  const existing = await findDemoUser();
  const already = new Set(existing ? (await demoEvents(existing.id)).map((e) => e.title) : []);
  console.info(`${apply ? 'APLICANDO' : 'Plan (agrega --apply para escribir)'}:`);
  console.info(`  Organizador: ${DEMO_NAME} <${DEMO_EMAIL}> ${existing ? '(ya existe)' : '(cuenta nueva, rol organizador)'}`);
  for (const e of EVENTS) {
    const mark = already.has(e.title) ? '= ya existe, se omite' : '+';
    console.info(`  ${mark} ${when(e.startsAt).padEnd(32)} ${e.category.padEnd(10)} cupo ${String(e.capacity).padStart(3)} · «${e.title}» · ${e.location} (${e.latitude}, ${e.longitude})`);
  }
  console.info(`  Etiquetas: con embeddings${gemini.enabled ? '' : ' — IA apagada: quedan para `npm run ai:backfill`'}`);
  if (!apply) return;

  const { user } = await ensureDemoOrganizer();
  for (const e of EVENTS.filter((x) => !already.has(x.title))) {
    const { data, error } = await supabase
      .from('events')
      .insert({
        organizer_id: user.id,
        title: e.title,
        description: e.description,
        category: e.category,
        location: e.location,
        latitude: e.latitude,
        longitude: e.longitude,
        starts_at: e.startsAt,
        ends_at: e.endsAt,
        capacity: e.capacity,
        status: 'published',
      })
      .select('id, title, description, category, status')
      .single();
    if (error) throw error;
    let tags = '(sin etiquetar)';
    if (gemini.enabled) {
      try {
        tags = (await indexEvent(data)).tags.join(', ') || '(sin etiquetas)';
      } catch (err) {
        tags = `sin etiquetar (${err.code ?? 'error'}): queda para el backfill`;
      }
    }
    console.info(`  ✓ «${e.title}» → ${tags}`);
  }
  console.info(`Para excluirlos del análisis del partido: organizer_id = ${user.id}`);
}

await (remove ? removeDemo() : seed());
