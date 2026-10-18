import { Avatar } from '../ui/index.js';
import { cn } from '../../lib/cn.js';

const MAX_SHOWN = 3;

// "Quiénes van": hasta 3 avatares solapados + "+N" (confirmedPreview trae solo nombre de pila y avatar).
// El texto de personas confirmadas va al lado, por eso los avatares son decorativos.
export function AvatarStack({ people = [], total, className }) {
  const shown = people.slice(0, MAX_SHOWN);
  const extra = Math.max(total - shown.length, 0);
  if (!shown.length) return null;
  return (
    <span className={cn('inline-flex items-center', className)}>
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
    </span>
  );
}
