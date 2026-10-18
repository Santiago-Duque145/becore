// Aplica una fila de Realtime (snake_case) a un evento ya cargado, sin perder lo que Realtime no trae
// (organizador, mi asistencia…). Igual que useRealtimeEvent, pero para listas.
export function applyEventRow(event, row) {
  const availableSpots = Math.max(row.capacity - row.confirmed_count, 0);
  return {
    ...event,
    confirmedCount: row.confirmed_count,
    capacity: row.capacity,
    status: row.status,
    availableSpots,
    isFull: availableSpots === 0,
  };
}

// Recorre lo que haya en la caché de eventos: páginas de useInfiniteQuery, un evento suelto o un arreglo.
// Solo toca el evento con ese id; el resto queda igual (misma referencia).
export function patchCachedEvents(data, row) {
  if (!data) return data;
  if (Array.isArray(data.pages)) {
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        data: page.data.map((event) => (event.id === row.id ? applyEventRow(event, row) : event)),
      })),
    };
  }
  if (!Array.isArray(data) && data.id === row.id) return applyEventRow(data, row);
  return data;
}
