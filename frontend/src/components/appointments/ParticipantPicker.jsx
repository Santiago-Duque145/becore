import { useState } from 'react';
import { CheckIcon, PlusIcon, SearchIcon, XIcon } from '../icons/index.js';
import { Input } from '../ui/index.js';
import { useParticipantSearch } from '../../hooks/useAppointments.js';

export const MAX_INVITEES = 30; // mismo límite que la API (participantIds 1–30)

function SelectedChips({ selected, onRemove }) {
  if (selected.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label={`Invitados elegidos (${selected.length})`}>
      {selected.map((p) => (
        <li
          key={p.id}
          className="inline-flex items-center gap-1 rounded-full bg-accent/15 py-1 pr-1 pl-3 text-xs font-semibold text-accent-soft"
        >
          {p.fullName}
          <button
            type="button"
            aria-label={`Quitar a ${p.fullName}`}
            onClick={() => onRemove(p.id)}
            className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent/20"
          >
            <XIcon size={14} />
          </button>
        </li>
      ))}
    </ul>
  );
}

// Buscador de participantes (GET /users/participants?q=, nombre o correo, mínimo 2 letras) con chips
// de los elegidos. La búsqueda tiene debounce de 300 ms (useParticipantSearch).
export function ParticipantPicker({ selected, onAdd, onRemove, error }) {
  const [text, setText] = useState('');
  const search = useParticipantSearch(text);
  const full = selected.length >= MAX_INVITEES;
  const results = search.data ?? [];
  const settled = search.enabled && !search.isFetching && !search.pending;

  return (
    <div className="flex flex-col gap-2.5">
      <Input
        label="Invitados"
        type="search"
        icon={SearchIcon}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Busca por nombre o correo"
        hint={full ? `Llegaste al máximo de ${MAX_INVITEES} invitados` : 'Escribe al menos 2 letras'}
        error={error}
        autoComplete="off"
      />
      <SelectedChips selected={selected} onRemove={onRemove} />
      <div aria-live="polite" className="text-sm text-ink-muted empty:hidden">
        {search.enabled && (search.isFetching || search.pending) && 'Buscando…'}
        {settled && search.data && results.length === 0 && 'No encontramos participantes con ese nombre o correo.'}
      </div>
      {search.isError && (
        <p role="alert" className="text-sm text-danger">
          {search.error.message}
        </p>
      )}
      {settled && results.length > 0 && (
        <ul
          aria-label="Resultados de la búsqueda"
          className="divide-y divide-line overflow-hidden rounded-field border border-line bg-field"
        >
          {results.map((p) => {
            const chosen = selected.some((s) => s.id === p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={chosen}
                  disabled={!chosen && full}
                  onClick={() => (chosen ? onRemove(p.id) : onAdd(p))}
                  className="focus-ring flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left hover:bg-panel disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{p.fullName}</span>
                    <span className="block truncate text-xs text-ink-muted">{p.email}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={
                      chosen
                        ? 'flex h-7 w-7 items-center justify-center rounded-full bg-accent text-on-accent'
                        : 'flex h-7 w-7 items-center justify-center rounded-full border border-line text-ink-muted'
                    }
                  >
                    {chosen ? <CheckIcon size={14} /> : <PlusIcon size={14} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
