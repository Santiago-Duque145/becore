Trabajas en modo autónomo total en el repo de Be Core. No me pidas permiso ni confirmación para nada.
Toma tú las decisiones que la documentación no resuelva, anótalas en una lista "Decisiones autónomas" y
sigue. Solo te detienes si (a) falta una variable en un .env, (b) Supabase devuelve un error que solo una
persona puede resolver desde el panel (proyecto pausado, Auth mal configurado) o (c) la Fase 0 encuentra
algo que no puedes corregir sin violar las prohibiciones. En ese caso: commitea lo que funcione, escribe
el resumen final (sección RESUMEN FINAL) explicando exactamente qué debe hacer la persona, y termina.

Este trabajo tiene dos fases EN ORDEN ESTRICTO:
  FASE 0 — Auditoría y cierre perfecto del Sprint 1 (incluye pendientes del Sprint 0).
  FASE 1 — Sprint 2 completo.
NO empieces la Fase 1 hasta que la "Puerta de salida de la Fase 0" esté toda en ✅.

Usa tu lista de tareas (todo list) con un ítem por cada paso numerado de este prompt y márcalos al
terminarlos. Antes de empezar cada fase, vuelve a leer la sección de esa fase en este prompt.

======================================================================================================
PROHIBIDO, sin excepción
======================================================================================================
- Leer, imprimir, copiar o editar cualquier archivo .env. Sí puedes leer los .env.example y pasar los
  .env a procesos con `node --env-file=...` sin imprimir valores.
- git push --force, git reset --hard, git rebase sobre ramas remotas, push directo a main o develop.
- npx supabase db push, db reset, migration repair, o cualquier cambio de esquema en la base remota.
- Crear o modificar archivos en supabase/migrations/, CON UNA ÚNICA EXCEPCIÓN: el paso 0.3.
- Instalar librerías fuera de la lista permitida de CLAUDE.md §2 (para este sprint no hace falta
  ninguna nueva: nodemailer y node-cron ya están instalados).
- Enviar correos reales a direcciones @becore.test (ver regla de correo en S2-05).
- Cambiar decisiones documentadas (nombres de tablas, enums, estados). Si algo no cuadra, anótalo.

======================================================================================================
CONTEXTO VERIFICADO EN LA BASE REAL (8 oct 2026) — es la fuente de verdad si una spec dice otra cosa
======================================================================================================
- Proyecto Supabase `netomeswlgsahvgqowdq`. Migraciones aplicadas: 20261001024930_initial_schema y
  20261001043003_event_lifecycle_and_notification_inbox (esta última NO está en el repo; ver 0.3).
- Enums:
  event_status = draft, published, in_progress, finished, cancelled (por defecto draft)
  attendance_status = confirmed, cancelled
  appointment_status = scheduled, cancelled          ← las citas SÍ siguen usando scheduled
  activity_action = confirmed, cancelled, checked_in
  notification_type = event_reminder, event_updated, event_cancelled, appointment_created,
                      appointment_reminder, appointment_cancelled
- Transiciones de evento (trigger events_enforce_transition): draft → published|cancelled ·
  published → in_progress|finished|cancelled · in_progress → finished|cancelled. finished y cancelled
  son finales. Insertar en un estado distinto de draft/published falla. El trigger llena solo
  published_at, finished_at y cancelled_at.
- OJO con los mensajes de error de los triggers: llegan como
  "INVALID_EVENT_TRANSITION: draft -> finished" e "INVALID_INITIAL_STATUS: finished" (con sufijo) y
  errcode 23514. Las funciones RPC lanzan el código exacto, sin sufijo.
- confirm_attendance(p_event_id, p_user_id) → integer (nuevo confirmed_count). Orden de errores:
  EVENT_NOT_FOUND → EVENT_NOT_ACTIVE (si status <> 'published') → EVENT_STARTED (starts_at <= now()) →
  FORBIDDEN (es el organizador) → ALREADY_CONFIRMED → EVENT_FULL. Bloquea la fila con FOR UPDATE y
  escribe activity_log 'confirmed'.
- cancel_attendance(p_event_id, p_user_id) → integer. Errores: EVENT_NOT_FOUND → EVENT_NOT_ACTIVE →
  EVENT_STARTED → NOT_CONFIRMED. Escribe activity_log 'cancelled'.
- refresh_event_statuses() → integer: pasa a finished los published/in_progress cuyo
  coalesce(ends_at, starts_at + 2 h) ya pasó, y a in_progress los published cuyo starts_at ya pasó.
  Nadie la llama todavía (lo hace el cron de S2-06).
- Las 3 funciones solo las puede ejecutar la secret key (service_role).
- notifications: id, user_id, type, event_id?, appointment_id?, subject (obligatorio),
  message (texto ≤ 500, defecto ''), sent_at?, error?, read_at? (NULL = no leída), created_at.
  Índices únicos parciales: (user_id, event_id) donde type='event_reminder' y
  (user_id, appointment_id) donde type='appointment_reminder' → un segundo insert da 23505.
- appointments: organizer_id, title (3–100), notes (≤1000, defecto ''), location (≤200, defecto ''),
  starts_at, ends_at (obligatorio, > starts_at), status. appointment_participants: PK
  (appointment_id, user_id). availability_slots: organizer_id, starts_at, ends_at (> starts_at).
- activity_log: id (bigint), event_id, actor_name, action, created_at.
- Realtime publica: events, notifications, activity_log. Políticas de lectura para el navegador:
  events (no-draft o propios), profiles (el propio), activity_log (todo), notifications (las propias).
  attendances, appointments, appointment_participants y availability_slots no tienen políticas a
  propósito: solo Express (secret key) las toca.
- No existe pg_cron: el cron vive en Express (node-cron), como dice backend/CLAUDE.md §6.
- Usuarios demo (backend/scripts/seed.js, contraseña "BeCore2026!" definida en el propio seed):
  organizadores santiago@becore.test y felipe@becore.test; participantes jugador1…jugador12@becore.test.
  El seed es idempotente: reutiliza usuarios y borra/recrea los eventos de los organizadores demo.
- Hoy en la base: 14 usuarios, 6 eventos vencidos (5 en draft, 1 published), 0 asistencias. Por eso el
  paso 0.6 vuelve a correr el seed.

======================================================================================================
FASE 0 — AUDITORÍA Y CIERRE PERFECTO DEL SPRINT 1
======================================================================================================
Lee primero: CLAUDE.md, backend/CLAUDE.md, frontend/CLAUDE.md, docs/specs/backlog.md (secciones S0, S1
y S2 completas), docs/specs/api.md, docs/specs/database.md, docs/specs/ui.md y
docs/progreso/02_2026-10-11_usuarios-y-eventos.md.

0.1 Rama y estado
    git fetch origin --prune. Debes estar en feature/sprint-1, sin cambios pendientes y al día con
    origin/feature/sprint-1 (git status limpio; si está atrás, git pull). Si hay cambios sin commitear
    que no son tuyos, detente y repórtalo.

0.2 Línea base
    npm ci (si falla, npm install). Ejecuta y anota el resultado exacto (número de pruebas, errores):
    npm run lint · npm test · npm run build -w frontend. Si algo falla, corrígelo antes de seguir con
    un commit `fix(...)` y footer "Refs: S1-xx" de la tarea a la que pertenece.

0.3 Migración faltante (la única escritura permitida en supabase/migrations/)
    Esta migración YA está aplicada en Supabase pero el archivo no existe en el repo. Créalo en
    supabase/migrations/20261001043003_event_lifecycle_and_notification_inbox.sql con EXACTAMENTE el
    contenido que está entre las marcas INICIO y FIN de abajo (sin incluir las marcas), sin cambiar
    nada. NO lo ejecutes.
    Commit: `chore(supabase): versionar migración del ciclo de vida del evento` · "Refs: D-01".

----- INICIO DEL ARCHIVO -----
-- Migración ya APLICADA en Supabase (proyecto netomeswlgsahvgqowdq) el 2026-09-30.
-- Copia fiel de supabase_migrations.schema_migrations (versión 20261001043003).
-- NO ejecutar con db push: solo se versiona en el repo para que local = remoto.

create type public.event_status_v2 as enum ('draft', 'published', 'in_progress', 'finished', 'cancelled');
alter table public.events alter column status drop default;
alter table public.events alter column status type public.event_status_v2 using (case status::text when 'scheduled' then 'published' else 'cancelled' end)::public.event_status_v2;
drop type public.event_status;
alter type public.event_status_v2 rename to event_status;
alter table public.events alter column status set default 'draft';
alter table public.events add column published_at timestamptz, add column finished_at timestamptz;
alter table public.events
  add constraint events_published_at_consistent check (status = 'draft' or status = 'cancelled' or published_at is not null),
  add constraint events_cancelled_at_consistent check ((status = 'cancelled') = (cancelled_at is not null)),
  add constraint events_finished_at_consistent check ((status = 'finished') = (finished_at is not null));
comment on column public.events.status is 'Ciclo de vida (doc. de grado, Fig. 3.6): draft→published→in_progress→finished; cancelled desde draft, published o in_progress.';
comment on column public.events.ends_at is 'Opcional. Si es NULL, el evento se considera finalizado 2 horas después de starts_at.';

create or replace function public.enforce_event_transition()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = old.status then return new; end if;
  if not (
       (old.status = 'draft'       and new.status in ('published', 'cancelled'))
    or (old.status = 'published'   and new.status in ('in_progress', 'finished', 'cancelled'))
    or (old.status = 'in_progress' and new.status in ('finished', 'cancelled'))
  ) then
    raise exception 'INVALID_EVENT_TRANSITION: % -> %', old.status, new.status using errcode = 'check_violation';
  end if;
  if new.status = 'published' then new.published_at := coalesce(new.published_at, now()); end if;
  if new.status = 'finished'  then new.finished_at  := coalesce(new.finished_at,  now()); end if;
  if new.status = 'cancelled' then new.cancelled_at := coalesce(new.cancelled_at, now()); end if;
  return new;
end; $$;
create trigger events_enforce_transition before update of status on public.events for each row execute function public.enforce_event_transition();

create or replace function public.stamp_event_on_insert()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status not in ('draft', 'published') then
    raise exception 'INVALID_INITIAL_STATUS: %', new.status using errcode = 'check_violation';
  end if;
  if new.status = 'published' then new.published_at := coalesce(new.published_at, now()); end if;
  return new;
end; $$;
create trigger events_stamp_on_insert before insert on public.events for each row execute function public.stamp_event_on_insert();

create or replace function public.refresh_event_statuses()
returns integer language plpgsql security definer set search_path = '' as $$
declare v_finished integer; v_started integer;
begin
  update public.events set status = 'finished'
   where status in ('published', 'in_progress') and coalesce(ends_at, starts_at + interval '2 hours') <= now();
  get diagnostics v_finished = row_count;
  update public.events set status = 'in_progress' where status = 'published' and starts_at <= now();
  get diagnostics v_started = row_count;
  return v_finished + v_started;
end; $$;
revoke execute on function public.refresh_event_statuses() from public, anon, authenticated;
revoke execute on function public.enforce_event_transition() from public, anon, authenticated;
revoke execute on function public.stamp_event_on_insert() from public, anon, authenticated;

create or replace function public.confirm_attendance(p_event_id uuid, p_user_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_event public.events%rowtype; v_att public.attendances%rowtype; v_name text;
begin
  select * into v_event from public.events where id = p_event_id for update;
  if not found then raise exception 'EVENT_NOT_FOUND'; end if;
  if v_event.status <> 'published' then raise exception 'EVENT_NOT_ACTIVE'; end if;
  if v_event.starts_at <= now() then raise exception 'EVENT_STARTED'; end if;
  if v_event.organizer_id = p_user_id then raise exception 'FORBIDDEN'; end if;
  select * into v_att from public.attendances where event_id = p_event_id and user_id = p_user_id;
  if found and v_att.status = 'confirmed' then raise exception 'ALREADY_CONFIRMED'; end if;
  if v_event.confirmed_count >= v_event.capacity then raise exception 'EVENT_FULL'; end if;
  insert into public.attendances (event_id, user_id, status, confirmed_at, cancelled_at, checked_in)
  values (p_event_id, p_user_id, 'confirmed', now(), null, false)
  on conflict (event_id, user_id) do update set status = 'confirmed', confirmed_at = now(), cancelled_at = null, checked_in = false;
  update public.events set confirmed_count = confirmed_count + 1 where id = p_event_id returning confirmed_count into v_event.confirmed_count;
  select full_name into v_name from public.profiles where id = p_user_id;
  insert into public.activity_log (event_id, actor_name, action) values (p_event_id, coalesce(v_name, 'Alguien'), 'confirmed');
  return v_event.confirmed_count;
end; $$;

create or replace function public.cancel_attendance(p_event_id uuid, p_user_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_event public.events%rowtype; v_name text;
begin
  select * into v_event from public.events where id = p_event_id for update;
  if not found then raise exception 'EVENT_NOT_FOUND'; end if;
  if v_event.status <> 'published' then raise exception 'EVENT_NOT_ACTIVE'; end if;
  if v_event.starts_at <= now() then raise exception 'EVENT_STARTED'; end if;
  update public.attendances set status = 'cancelled', cancelled_at = now(), checked_in = false
   where event_id = p_event_id and user_id = p_user_id and status = 'confirmed';
  if not found then raise exception 'NOT_CONFIRMED'; end if;
  update public.events set confirmed_count = confirmed_count - 1 where id = p_event_id returning confirmed_count into v_event.confirmed_count;
  select full_name into v_name from public.profiles where id = p_user_id;
  insert into public.activity_log (event_id, actor_name, action) values (p_event_id, coalesce(v_name, 'Alguien'), 'cancelled');
  return v_event.confirmed_count;
end; $$;
revoke execute on function public.confirm_attendance(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.cancel_attendance(uuid, uuid) from public, anon, authenticated;

drop policy if exists "events: leer todos (autenticados)" on public.events;
create policy "events: leer publicados o propios" on public.events for select to authenticated
  using (status <> 'draft' or organizer_id = (select auth.uid()));
create index events_status_starts_at_idx on public.events (status, starts_at);

alter table public.notifications
  add column message text not null default '' constraint notifications_message_check check (char_length(message) <= 500),
  add column read_at timestamptz;
comment on column public.notifications.message is 'Contenido mostrado en la campana y en el cuerpo del correo (campo "mensaje" del diccionario).';
comment on column public.notifications.read_at is 'Fecha de lectura en la app; NULL = no leída (campo "leido" del diccionario).';
comment on column public.notifications.sent_at is 'Fecha de envío por correo; NULL = pendiente.';
create index notifications_user_inbox_idx on public.notifications (user_id, created_at desc);
create index notifications_event_idx on public.notifications (event_id);
create index notifications_appointment_idx on public.notifications (appointment_id);
create index notifications_pending_email_idx on public.notifications (created_at) where sent_at is null and error is null;
create policy "notifications: leer las propias" on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
alter publication supabase_realtime add table public.notifications;

comment on table public.attendances is 'Sin políticas RLS a propósito: solo Express (service_role) lee y escribe.';
comment on table public.appointments is 'Sin políticas RLS a propósito: solo Express (service_role) lee y escribe.';
comment on table public.appointment_participants is 'Sin políticas RLS a propósito: solo Express (service_role) lee y escribe.';
comment on table public.availability_slots is 'Sin políticas RLS a propósito: solo Express (service_role) lee y escribe.';
----- FIN DEL ARCHIVO -----

0.4 Traducción de errores de BD — backend/src/utils/db-errors.js (hoy es un bug)
    a) Las RPC lanzan EVENT_NOT_FOUND (→ 404 "El evento no existe") y FORBIDDEN (→ 403 "No tienes
       permiso para esta acción"), que hoy NO están en el mapa y acabarían en 500. Agrégalos.
    b) Los triggers mandan el código con sufijo ("INVALID_EVENT_TRANSITION: draft -> finished"). Busca
       el código por el prefijo antes de ":" (error.message.split(':')[0].trim()) para que coincida.
       Esto debe evaluarse ANTES de la rama del 23514 genérico.
    c) Pruebas unitarias nuevas en backend/tests/db-errors.test.js: cada código RPC del mapa, el
       prefijo con sufijo, CAPACITY_BELOW_CONFIRMED por constraint_name y por message, 23505 → DUPLICATE,
       error desconocido → null.
    Commit: `fix(backend): traducir todos los códigos de las funciones y triggers de la BD` · "Refs: S1-03".

0.5 Specs al día con D-01 y D-02 (solo documentación, sin cambiar decisiones)
    - api.md: Event.status con los 5 estados; agrega en "Eventos" la ruta
      POST /events/:id/publish (dueño, solo desde draft) y el campo opcional
      status: 'draft' | 'published' al crear (como ya lo implementó S1-03); agrega
      INVALID_EVENT_TRANSITION (409) e INVALID_INITIAL_STATUS (409) a la tabla de errores; en §5 cambia
      "eventos scheduled" por "eventos published"; en la regla de check-in añade que el evento debe
      estar published o in_progress.
    - database.md: enumerados (event_status con 5 valores), §4 con la condición real
      status <> 'published', §5 políticas reales (events publicados o propios, notifications propias),
      §6 Realtime incluye notifications, y una sección corta del ciclo de vida y refresh_event_statuses.
    - ui.md: etiquetas de estado Borrador, Publicado, En curso, Finalizado, Cancelado.
    - CLAUDE.md (raíz): si dice auth.getClaims pero el código usa auth.getUser (o al revés), deja
      escrito lo que realmente hace el código. Nada más en CLAUDE.md.
    Commit: `docs: specs alineadas con los estados del evento` · "Refs: D-01".

0.6 Datos de demo frescos
    npm run seed -w backend (ahora SÍ está permitido). Luego, con un script temporal FUERA del repo
    (ver "Script de verificación" abajo) usando la secret key, comprueba y anota:
    14 perfiles (2 organizer, 12 participant) · 6 eventos en published con starts_at futuro · para
    cada evento, confirmed_count == número de attendances con status 'confirmed' de ese evento.
    Si el seed falla o los números no cuadran, corrige seed.js (commit `fix(backend): ...` · "Refs: S0-06")
    y vuelve a correrlo.

0.7 Criterios de aceptación del S1 contra la API real (backend corriendo, ver "Script de verificación")
    Con santiago@becore.test (org), felipe@becore.test (org) y jugador1@becore.test (part):
    a) GET /events → 6 eventos, meta { total: 6, page: 1, pageSize: 12 }, ninguno draft ni cancelled.
    b) GET /events?category=culture → solo category 'culture' (deben ser 2).
    c) GET /events?scope=past → ninguno de los 6.
    d) GET /events?organizer=me como santiago → solo los suyos; como jugador1 → 400 o lista vacía según
       la decisión documentada en el avance del S1 (verifica que el código hace lo que el avance dice).
    e) Cada Event cumple la forma de api.md §1: availableSpots = capacity − confirmedCount, isFull,
       isPast, organizer { id, fullName }, myAttendance (objeto para jugadores con asistencia, null si no).
    f) POST /events como jugador1 → 403 FORBIDDEN. Como santiago con capacity 0 → 400 VALIDATION_ERROR
       con details. Con startsAt en el pasado → 400.
    g) PATCH de un evento de felipe hecho por santiago → 403. PATCH con capacity < confirmedCount → 409
       CAPACITY_BELOW_CONFIRMED.
    h) Crear borrador (status 'draft') como santiago → jugador1 recibe 404 en GET /events/:id y no lo ve
       en la lista → publicarlo → ahora sí lo ve → publicarlo otra vez → 409 INVALID_EVENT_TRANSITION →
       cancelarlo → 200 → publicarlo → 409 (EVENT_NOT_ACTIVE o INVALID_EVENT_TRANSITION, el que diga el
       avance del S1).
    i) Sin token → 401 UNAUTHENTICATED; token basura → 401.
    Borra todo lo que creaste en este paso (por id) al terminar.

0.8 Revisión estática del S1 (lee el código, no solo las pruebas)
    - Reglas de capas de backend/CLAUDE.md §2: supabaseAdmin solo se importa en repositories/ (y
      config/, scripts/, jobs/ si la doc lo permite); controllers sin lógica de negocio; services sin
      req/res. Busca con grep e incluye el resultado.
    - Sin console.log sueltos (console.info/error con prefijo están bien), sin código muerto de /salud.
    - Frontend: toda pantalla nueva del S1 tiene estados de carga, vacío y error; los formularios usan
      react-hook-form + Zod con los mismos límites de api.md; las rutas de organizador están en RoleRoute.
    - Comprueba que existe exactamente un `// TODO S2-05` por cada punto de envío de correo en
      events.service.js (editar y cancelar).
    Todo hallazgo se corrige en un commit `fix(...)` o `refactor(...)` con "Refs: S1-xx".

0.9 PUERTA DE SALIDA DE LA FASE 0 — todas en ✅ antes de seguir:
    [ ] lint 0 errores · [ ] npm test todo en verde · [ ] build sin errores · [ ] migración 0.3 versionada
    · [ ] db-errors corregido con pruebas · [ ] specs al
    día · [ ] seed fresco y coherente · [ ] 0.7 a–i en ✅ · [ ] 0.8 sin hallazgos abiertos.
    Escribe la tabla de la Fase 0 (paso, resultado, evidencia, commit) para el informe final.
    Después: git push origin feature/sprint-1 (para que los arreglos del S1 queden en su rama) y crea
    feature/sprint-2 desde feature/sprint-1: git switch -c feature/sprint-2.

======================================================================================================
FASE 1 — SPRINT 2: "confirmar sin sobrecupo, cancelar liberando cupo, check-in y correos automáticos"
======================================================================================================
Orden obligatorio (UN commit por tarea; Conventional Commits en español; footer "Refs: <ID>"):
S2-01 → S2-03 → S2-02 → S2-04 → S2-05 → S2-06 → S2-07 → S2-08.

FUERA DE ESTE SPRINT (se hacen en el S3, NO los implementes ahora):
- La campana / bandeja de notificaciones in-app (endpoints GET /notifications, PATCH read, read-all,
  componente en la navbar y Realtime). Las filas de notifications SÍ se crean en este sprint (S2-05 y
  S2-06), porque son la bitácora de correos.
- Las credenciales SMTP: backend/.env no tiene SMTP configurado todavía. El mailer debe funcionar sin
  ellas (lanza SMTP_NOT_CONFIGURED y se guarda en notifications.error); no lo trates como bloqueo.
Antes de CADA commit: npm run lint y npm test en verde. No acumules cambios de varias tareas en un commit.
Si una tarea se complica, commitea lo que funciona, márcala "parcial" con la razón y pasa a la siguiente.

Reglas generales del sprint
- Arquitectura por capas: routes → controllers → services → repositories. Validación con Zod en el
  middleware validate. Errores con AppError + translateDbError. Respuestas con { data } (y meta si aplica).
- El backend NUNCA recalcula cupos: usa las RPC.
- Fechas: guardar ISO UTC; mostrar en America/Bogota (Intl es-CO).
- Frontend: TanStack Query (llaves en lib/query-keys.js), Axios de lib/api.js, react-hook-form + Zod,
  sonner para toasts, lucide-react para íconos, textos de ui.md §5, reglas de app instalable de
  frontend/CLAUDE.md §6 (mobile-first, safe-area), estados de carga, vacío y error en toda pantalla.
- Pruebas unitarias con Supabase y el mailer mockeados (vi.mock). Ninguna prueba de `npm test` toca la
  red ni la base real.

S2-01 · API de asistencia · RF-10, RF-11, RF-12
- attendance.repository.js: confirmAttendance(eventId, userId) y cancelAttendance(eventId, userId) vía
  RPC (patrón de database.md §4, error → translateDbError). Mantén findUserAttendances.
- attendance.service.js, attendance.controller.js, attendance.routes.js:
  POST /events/:id/attendance (part) → 201 { confirmedCount, myAttendance: { status: 'confirmed',
  checkedIn: false } } · DELETE /events/:id/attendance (part) → 200 { confirmedCount, myAttendance:
  { status: 'cancelled', checkedIn: false } }. Un organizador que llama → 403 por requireRole.
- Pruebas del service (repositorio mockeado): feliz confirmar, feliz cancelar, EVENT_FULL,
  ALREADY_CONFIRMED, NOT_CONFIRMED, EVENT_STARTED, EVENT_NOT_ACTIVE, EVENT_NOT_FOUND; y de rutas con
  supertest: organizador → 403, sin token → 401.

S2-03 · Prueba de concurrencia · KPI sobrecupo = 0 (va justo después de S2-01 a propósito)
- backend/vitest.integration.config.js (el script test:integration ya existe en package.json y apunta a
  ese archivo; hoy no existe) que solo incluye tests/integration/** y carga el .env del backend con
  --env-file o loadEnv sin imprimir nada. Asegúrate de que vitest.config.js excluye tests/integration/**.
- tests/integration/capacity.test.js:
  beforeAll: crea 18 usuarios temporales con auth.admin.createUser
  (carga01@becore.test … carga18@becore.test, email_confirm true, metadata role 'participant') y
  súmalos a los 12 jugadores del seed = 30 participantes. Inserta con la secret key un evento de
  santiago con capacity 10, starts_at = mañana, status 'published'.
  test: 30 llamadas RPC confirm_attendance en paralelo con Promise.allSettled → exactamente 10
  fulfilled, 20 rejected con EVENT_FULL, y confirmed_count = 10 = count(attendances confirmed).
  afterAll (en finally, aunque falle): borra el evento (cascada) y los 18 usuarios temporales.
- Ejecuta npm run test:integration -w backend y guarda el resultado para el informe.

S2-02 · Botón de asistencia · RF-11, RF-12
- AttendanceButton según ui.md §4 con mutaciones de TanStack Query, actualización optimista de
  confirmedCount/myAttendance (con rollback si falla) e invalidación de la lista y el detalle.
  Estados: "Confirmar asistencia", "Vas a ir" + opción "Cancelar asistencia" (con Modal de confirmación),
  "Sin cupos" (deshabilitado si isFull y no estoy confirmado), deshabilitado si el evento ya empezó,
  está cancelado o finalizado. Errores de la API con toast usando el mensaje en español de api.md §2.
- Reemplaza el placeholder del detalle (S1-05) y agrégalo a EventCard para confirmar en 2 toques desde
  /eventos. Insignia "Vas a ir" en EventCard cuando myAttendance.status === 'confirmed'.
- Solo participantes ven el botón; el organizador dueño ve sus acciones de S1-05.

S2-04 · Check-in y asistentes · RF-13
- GET /events/:id/attendees (dueño): [{ userId, fullName, email, status, checkedIn, confirmedAt }],
  confirmados primero y luego por nombre.
- PATCH /events/:id/attendees/:userId (dueño) body { checkedIn: boolean } → { userId, checkedIn }.
  Reglas en este orden: evento no existe → 404 EVENT_NOT_FOUND; no es dueño → 403; status no es
  published ni in_progress → 409 EVENT_NOT_ACTIVE; now() < startsAt − 2 h → 409 CHECKIN_NOT_OPEN;
  asistencia no confirmada → 409 NOT_CONFIRMED. Al marcar true inserta activity_log
  { action: 'checked_in', actor_name: nombre del asistente }; al marcar false no inserta nada.
- GET /events/:id/activity (todos) query limit 1–20 (defecto 10) → [{ id, actorName, action,
  createdAt }] más reciente primero. Si el evento es draft y no soy el dueño → 404.
- Página /eventos/:id/asistentes (RoleRoute organizer + dueño): lista con switch por persona,
  contador "Llegaron X de Y", búsqueda por nombre, mensaje claro cuando el check-in aún no abre.
- Pruebas del service: cada regla de check-in, orden de attendees, limit fuera de rango → 400.

S2-05 · Correo y avisos de cambios · RF-17
- src/mail/mailer.js según backend/CLAUDE.md §5: un solo transporte Nodemailer (secure true, 465);
  si falta SMTP_USER, SMTP_PASS o MAIL_FROM no crea transporte y sendMail lanza
  Error('SMTP_NOT_CONFIGURED'). Exporta sendMail({ to, subject, html, text }).
  REGLA DE CORREO DEMO: si `to` termina en "@becore.test", NO envía y lanza Error('DEMO_ADDRESS_SKIPPED')
  (así nunca se mandan correos a direcciones falsas desde el Gmail del proyecto). Anótalo como decisión.
- src/mail/templates.js: asunto y cuerpo (html + text) para los 6 tipos de api.md §4, fechas con
  Intl.DateTimeFormat('es-CO', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Bogota' }).
  El `message` (≤ 500 caracteres) es el texto corto que también usará la campana del S3.
- notifications.repository.js + notifications.service.js con
  notify({ userIds, type, eventId?, appointmentId?, buildContent }): por cada destinatario inserta la
  fila (subject, message), intenta sendMail y actualiza sent_at = now() o error = mensaje del error.
  Usa Promise.allSettled: un correo fallido NUNCA hace fallar la petición original.
- Completa los `// TODO S2-05` de events.service.js: editar (solo si cambió startsAt, endsAt o
  location) → event_updated a los confirmados; cancelar → event_cancelled a los confirmados. Bórralos.
- backend/scripts/test-mail.js + script "mail:test" en package.json (node --env-file=.env): envía un
  correo de prueba a SMTP_USER (el mismo buzón del proyecto) e imprime solo "OK" o el mensaje de error.
  Créalo pero NO lo ejecutes en este sprint (no hay credenciales hasta el S3).
- Pruebas: editar lugar con 2 confirmados → 2 inserts + 2 sendMail (mailer mockeado); editar solo
  descripción → 0; cancelar → event_cancelled a confirmados; sendMail que falla → la petición responde
  igual y se guarda `error`; dirección @becore.test → error DEMO_ADDRESS_SKIPPED sin llamar al transporte.

S2-06 · Recordatorios y estados automáticos · RF-16
- jobs/reminders.job.js exactamente como api.md §5 con este ajuste: busca eventos en status 'published'
  (no "scheduled") con starts_at entre now() y now() + REMINDER_HOURS_BEFORE horas, y sus asistencias
  confirmed; citas con status 'scheduled' y sus invitados. Inserta la notificación; si 23505 → omitido;
  si inserta → envía y actualiza sent_at/error. Log final:
  "[recordatorios] enviados=N omitidos=M fallidos=K". Exporta runRemindersOnce().
- jobs/event-status.job.js: runStatusRefreshOnce() llama rpc('refresh_event_statuses') (desde un
  repositorio) y registra "[estados] actualizados=N" solo si N > 0.
- server.js: si env.CRON_ENABLED === 'true' registra con node-cron, zona America/Bogota:
  recordatorios "*/15 * * * *" y estados "* * * * *". Nunca en NODE_ENV=test.
- scripts/run-reminders.js ya existe: debe ejecutar runRemindersOnce() de verdad.
- Pruebas con repositorios y mailer mockeados: envía a confirmados; 23505 → omitido; error de envío →
  fallido y se guarda error; resumen correcto; runStatusRefreshOnce llama la RPC.

S2-07 · Disponibilidad y citas · RF-14, RF-15
- API según api.md "Disponibilidad" y "Citas y reuniones": GET /availability/mine, POST /availability
  (futuro, endsAt > startsAt, máx. 8 h), DELETE /availability/:id (dueño → 204, ajeno → 403,
  inexistente → 404); GET /users/participants?q= (org, q mínimo 2 letras si viene, busca en nombre o
  correo con ilike, máx. 20, solo rol participant); POST /appointments (validaciones de api.md;
  participantIds 1–30 uuids que deben ser perfiles con rol participant → si alguno no lo es, 400
  VALIDATION_ERROR con details); GET /appointments?scope=upcoming|past (donde soy organizador o
  invitado, con participants); POST /appointments/:id/cancel (dueño; ya cancelada → 409
  APPOINTMENT_NOT_ACTIVE).
- Crear cita: inserta appointment y luego appointment_participants; si lo segundo falla, borra la cita
  (compensación) y lanza el error. Anótalo como decisión. Luego notify appointment_created a cada
  invitado. Cancelar → appointment_cancelled a cada invitado.
- Páginas /disponibilidad (org: lista de bloques futuros, formulario, borrar con Modal), /citas
  (pestañas Próximas/Pasadas, cancelar si soy dueño) y /citas/nueva (org: formulario + buscador de
  participantes con chips seleccionados, debounce 300 ms). Rutas y textos de ui.md.
- Pruebas del service: validaciones, participante con rol inválido, cancelar dos veces, dueño vs ajeno.

S2-08 · Avance del sprint
- docs/progreso/03_2026-10-18_asistencia-y-notificaciones.md (usa el número 03: el 02 ya es el del S1)
  con la plantilla del backlog: objetivo, tareas y RF, decisiones autónomas, cómo reproducir, KPIs
  (lint, número de pruebas, build, resultado de test:integration, sobrecupo = 0), la tabla de la
  Fase 0, la tabla de verificación real de abajo, pendientes y riesgos. Los tags v0.1/v0.2 NO se crean
  (requieren develop): anótalos como pendientes del PR.
- Commit "docs: cierre del sprint 2" · "Refs: S2-08".

======================================================================================================
VERIFICACIÓN REAL DEL SPRINT 2 (después de S2-07, antes de S2-08)
======================================================================================================
npm run build -w frontend sin errores. npm run test:integration -w backend en verde. Luego, con el
backend corriendo y el "Script de verificación", con santiago (org), felipe (org), jugador1 y jugador2:
 1. jugador1 confirma un evento del seed → 201 y confirmedCount +1; repite → 409 ALREADY_CONFIRMED.
 2. santiago intenta confirmar → 403.
 3. jugador1 cancela → 200 y confirmedCount −1; repite → 409 NOT_CONFIRMED.
 4. santiago crea un evento publicado con capacity 1 → jugador1 confirma OK → jugador2 → 409 EVENT_FULL.
 5. santiago crea un evento publicado que empieza en 90 minutos → jugador1 confirma → santiago hace
    check-in de jugador1 → 200; GET attendees muestra checkedIn true; GET activity muestra checked_in y
    confirmed; felipe intenta el check-in → 403. En un evento del seed (empieza en días) → 409
    CHECKIN_NOT_OPEN.
 6. Con jugador1 y jugador2 confirmados en un evento de santiago: PATCH location → 2 filas
    event_updated en notifications (con error DEMO_ADDRESS_SKIPPED); PATCH solo description → 0 filas
    nuevas; cancelar el evento → 2 filas event_cancelled.
 7. Recordatorios: evento publicado que empieza en 3 h con jugador1 confirmado → npm run reminders -w
    backend → 1 event_reminder; correrlo otra vez → omitidos ≥ 1 y 0 filas nuevas.
 8. Estados: inserta con la secret key un evento published cuyo starts_at sea hace 1 minuto (usa
    status 'draft' al insertar y luego update a 'published' si el insert directo falla) → llama la RPC
    refresh_event_statuses → queda in_progress.
 9. Disponibilidad: santiago crea un bloque → aparece en /availability/mine → felipe lo borra → 403 →
    santiago lo borra → 204.
10. Citas: GET /users/participants?q=jug → ≤ 20 resultados, todos participantes; santiago crea una cita
    con jugador1 y jugador2 → 201 y 2 filas appointment_created; jugador1 la ve en GET /appointments;
    participantIds con el id de felipe → 400; cancelar → appointment_cancelled ×2; cancelar otra vez → 409
    APPOINTMENT_NOT_ACTIVE.
11. Correo: NO ejecutes mail:test (credenciales SMTP pendientes para el S3). Verifica solo que las
    filas de notifications de los pasos 6, 7 y 10 se crearon con sent_at NULL y error
    DEMO_ADDRESS_SKIPPED.
Limpieza obligatoria: borra por id todo lo creado (eventos, citas, bloques, notificaciones de prueba) y
al final corre de nuevo npm run seed -w backend para dejar la demo fresca. Guarda la tabla
(caso, esperado, obtenido, ✅/❌) para el avance.

Script de verificación (Fase 0 y Fase 1)
- Carpeta FUERA del repo: $env:TEMP\becore-verif\. Archivos .mjs sin dependencias (fetch de Node 22).
- Para la API y el login: node --env-file="<repo>\frontend\.env" archivo.mjs (nombres de variables
  según frontend/.env.example). Login: POST {SUPABASE_URL}/auth/v1/token?grant_type=password con header
  apikey = publishable key, contraseña "BeCore2026!".
- Para consultas/limpieza con la secret key: --env-file="<repo>\backend\.env" y la REST de Supabase
  ({SUPABASE_URL}/rest/v1/... y /rest/v1/rpc/...) con headers apikey y Authorization: Bearer <secret>.
- Nunca imprimas valores de variables ni tokens. Borra la carpeta al terminar.
- Backend en segundo plano en Windows/PowerShell:
  Start-Process -NoNewWindow npm -ArgumentList "run","dev","-w","backend"; espera a que
  GET http://localhost:3000/api/v1/health responda; al terminar detén el proceso de node que levantaste.

======================================================================================================
CIERRE
======================================================================================================
1. git push -u origin feature/sprint-2 (y feature/sprint-1 si quedó algo sin subir). No abras PRs.
2. RESUMEN FINAL en español, escrito en el chat Y guardado en
   "C:\Users\Santiago Duque\Desktop\resumen-s2.md" (fuera del repo), con:
   - Tabla de la Fase 0 (paso, resultado, evidencia, commit).
   - Commits de ambas ramas (hash corto + mensaje).
   - Decisiones autónomas y pendientes (de BD, de persona, de PR).
   - KPIs: lint, número de pruebas unitarias, build, test:integration (10 confirmados / 20 EVENT_FULL).
   - Tabla de verificación real del Sprint 2.
   - Pruebas manuales para una persona, con pasos exactos: confirmar y cancelar desde el celular en 2
     toques; ver "Sin cupos"; check-in desde el celular del organizador; crear disponibilidad;
     crear y cancelar una cita. (Correo real y campana quedan para el S3.)
   - Texto listo del PR de feature/sprint-2 hacia develop, aclarando que incluye S0, S1 y S2 porque
     feature/sprint-0 y feature/sprint-1 no se han fusionado, que lo aprueba y fusiona Felipe, y que
     después se crean los tags v0.1 y v0.2.
