import { useAvatarPreview } from '../../contexts/AvatarPreviewContext.jsx';
import { firstName } from '../../lib/avatar-preview.js';
import { cn } from '../../lib/cn.js';
import { Avatar } from './Avatar.jsx';

// Avatar que se puede tocar para ver la foto en grande. El botón envuelve al Avatar (decorativo) y
// su nombre accesible es "Ver foto de {nombre de pila}". role: 'organizer' | 'participant'.
export function PreviewableAvatar({ name, role, src, preset, action, size, className, avatarClassName }) {
  const { open } = useAvatarPreview();
  const label = firstName(name);
  return (
    <button
      type="button"
      aria-label={`Ver foto de ${label}`}
      onClick={(event) => open({ name, role, src, preset, action }, event.currentTarget)}
      className={cn('focus-ring inline-flex shrink-0 rounded-full', className)}
    >
      <Avatar name={name} src={src} preset={preset} size={size} className={avatarClassName} decorative />
    </button>
  );
}
