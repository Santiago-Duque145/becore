// Textos del cupo, iguales en tarjetas, detalle y panel:
// "Confirmados 1 de 5" y aparte "4 cupos disponibles" (o "Cupo lleno").
export function capacityText(confirmedCount, capacity) {
  const available = Math.max(capacity - confirmedCount, 0);
  return {
    confirmed: `Confirmados ${confirmedCount} de ${capacity}`,
    available: available === 0 ? 'Cupo lleno' : available === 1 ? '1 cupo disponible' : `${available} cupos disponibles`,
    isFull: available === 0,
  };
}
