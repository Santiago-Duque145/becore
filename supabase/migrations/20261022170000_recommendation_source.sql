-- =====================================================================
-- Be Core · IA3 · Origen de cada recomendación mostrada (docs/specs/ai.md §10)
-- recommendation_events.source: de dónde salió la frase y el orden de cada tarjeta de "Para ti":
--   gemini   → re-ordenado con Gemini (variante "ai", desde la caché)
--   template → orden híbrido y frase por plantilla (variante "ai" sin respuesta de Gemini)
--   rules    → reglas de R5 (variante "rules")
-- Sirve para separar en el análisis del partido lo que vino de Gemini de lo que no.
-- La tabla aún no tiene filas (IA3 es lo primero que escribe en ella), así que la columna nace NOT NULL sin defecto.
-- =====================================================================
alter table public.recommendation_events
  add column source text not null check (source in ('gemini', 'template', 'rules'));

comment on column public.recommendation_events.source is 'Origen de la recomendación mostrada: gemini, template (plantilla) o rules (R5).';

create index recommendation_events_source_idx on public.recommendation_events (variant, source, action);
