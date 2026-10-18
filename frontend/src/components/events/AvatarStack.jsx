import { useCallback, useRef, useState } from 'react';
import { Avatar, EmptyState, ErrorState, Modal, Skeleton } from '../ui/index.js';
import { useAvatarPreview } from '../../contexts/AvatarPreviewContext.jsx';
import { useConfirmedPeople } from '../../hooks/useConfirmedPeople.js';
import { cn } from '../../lib/cn.js';

const MAX_SHOWN = 3;

function ConfirmedList({ eventId, onPick }) {
  const { data, isPending, isError, error, refetch } = useConfirmedPeople(eventId);
  if (isPending) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-11" />
        ))}
      </div>
    );
  }
  if (isError) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!data.length) return <EmptyState title="Aún no hay confirmados." />;
  return (
    <ul className="-mx-2 flex max-h-[50dvh] flex-col overflow-y-auto">
      {data.map((person, i) => (
        <li key={i}>
          <button
            type="button"
            onClick={() => onPick(person)}
            aria-label={`Ver foto de ${person.name}`}
            className="focus-ring flex min-h-12 w-full items-center gap-3 rounded-field px-2 py-1.5 text-left hover:bg-field"
          >
            <Avatar name={person.name} src={person.avatarUrl} preset={person.avatarUrl ? null : person.avatarPreset} decorative />
            <span className="text-sm font-semibold text-ink">{person.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

// "Quiénes van": hasta 3 avatares solapados + "+N". Tocar la fila abre la lista de confirmados (solo nombre de
// pila y foto); tocar a uno abre su vista previa. Si no se pasa eventId, la fila es solo decorativa.
export function AvatarStack({ people = [], total, eventId, className }) {
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const { open: openPreview } = useAvatarPreview();
  const shown = people.slice(0, MAX_SHOWN);
  const extra = Math.max(total - shown.length, 0);
  if (!shown.length) return null;

  const row = (
    <>
      <span className="flex -space-x-2">
        {shown.map((person, i) => (
          <Avatar
            key={i}
            name={person.name}
            src={person.avatarUrl}
            preset={person.avatarUrl ? null : person.avatarPreset}
            size="sm"
            decorative
            className="ring-2 ring-panel"
          />
        ))}
      </span>
      {extra > 0 && <span className="ml-1.5 text-[11px] font-semibold text-ink-muted tabular-nums">+{extra}</span>}
    </>
  );

  if (!eventId) return <span className={cn('inline-flex items-center', className)}>{row}</span>;

  function pick(person) {
    close();
    openPreview(
      { name: person.name, role: 'participant', src: person.avatarUrl, preset: person.avatarPreset },
      triggerRef.current,
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ver quiénes van (${total})`}
        className={cn('focus-ring inline-flex min-h-8 items-center rounded-full', className)}
      >
        {row}
      </button>
      <Modal open={open} title="Quiénes van" onClose={close}>
        <ConfirmedList eventId={eventId} onPick={pick} />
      </Modal>
    </>
  );
}
