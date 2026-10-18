-- =====================================================================
-- Be Core · P6 · Ubicación de los eventos en el mapa
-- events.latitude / events.longitude (opcionales). O vienen las dos o ninguna, y dentro de su rango.
-- Los eventos existentes quedan sin coordenadas (NULL) y siguen funcionando con el texto del lugar.
-- =====================================================================
alter table public.events
  add column if not exists latitude numeric(9, 6),
  add column if not exists longitude numeric(9, 6);

alter table public.events
  add constraint events_latitude_range check (latitude is null or latitude between -90 and 90),
  add constraint events_longitude_range check (longitude is null or longitude between -180 and 180),
  add constraint events_coordinates_together check ((latitude is null) = (longitude is null));

comment on column public.events.latitude is 'Latitud del lugar (WGS84). NULL si el organizador no marcó el lugar en el mapa.';
comment on column public.events.longitude is 'Longitud del lugar (WGS84). Va junto con latitude: las dos o ninguna.';
