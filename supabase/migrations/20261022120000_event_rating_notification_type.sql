-- =====================================================================
-- Be Core · P2 · Tipo de aviso para pedir la calificación de un evento
-- Va en su propio archivo: un valor nuevo de enum no se puede usar en la
-- misma transacción que lo crea (el índice único está en la migración siguiente).
-- =====================================================================
alter type public.notification_type add value if not exists 'event_rating_request';
