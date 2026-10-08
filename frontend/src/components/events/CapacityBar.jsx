// Turquesa < 80 %, naranja >= 80 %, navy-800 cuando está lleno (ui.md §4)
export function CapacityBar({ confirmedCount, capacity }) {
  const percent = capacity > 0 ? Math.min(Math.round((confirmedCount / capacity) * 100), 100) : 0;
  const color = confirmedCount >= capacity ? 'bg-navy-800' : percent >= 80 ? 'bg-orange-500' : 'bg-teal-500';

  return (
    <div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={confirmedCount}
        aria-label="Cupos confirmados"
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
      >
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 text-sm text-gray-500">
        {confirmedCount} de {capacity} confirmados
      </p>
    </div>
  );
}
