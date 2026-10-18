import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { XIcon } from '../icons/index.js';
import { FOCUSABLE } from '../../lib/focus-trap.js';
import { dialogKeyAction, restoreFocus, shouldCloseOnSwipe, zoomFrom } from '../../lib/avatar-preview.js';
import { Avatar } from './Avatar.jsx';
import { Button } from './Button.jsx';
import { Skeleton } from './Skeleton.jsx';

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Imagen grande: la misma URL ya comprimida de la foto (sin pedir otra versión), con un Skeleton redondo
// mientras carga. Sin foto, el avatar de la marca o las iniciales en grande.
function BigImage({ person }) {
  const [state, setState] = useState(person.src ? 'loading' : 'ready');
  return (
    <>
      {person.src ? (
        <>
          {state === 'loading' && <Skeleton className="absolute inset-0 h-full w-full" style={{ borderRadius: 9999 }} />}
          {state === 'error' ? (
            <Avatar name={person.firstName} size="fill" decorative />
          ) : (
            <img
              src={person.src}
              alt=""
              referrerPolicy="no-referrer"
              onLoad={() => setState('ready')}
              onError={() => setState('error')}
              className="h-full w-full object-cover"
            />
          )}
        </>
      ) : (
        <Avatar name={person.firstName} preset={person.preset} size="fill" decorative />
      )}
    </>
  );
}

// Vista previa a pantalla completa en móvil y centrada en escritorio. Se cierra con la X, Escape, tocando
// fuera de la imagen y deslizando hacia abajo. Muestra solo nombre de pila y rol.
export function AvatarPreviewDialog({ person, trigger, onClose }) {
  const rootRef = useRef(null);
  const imageRef = useRef(null);
  const closeRef = useRef(null);
  const drag = useRef({ startY: null, dy: 0 });

  // Zoom desde el avatar tocado: solo transform y opacity, y nada con prefers-reduced-motion
  useLayoutEffect(() => {
    const image = imageRef.current;
    if (!trigger || !image || prefersReducedMotion() || typeof image.animate !== 'function') return;
    const { x, y, scale } = zoomFrom(trigger.getBoundingClientRect(), image.getBoundingClientRect());
    image.animate(
      [
        { transform: `translate(${x}px, ${y}px) scale(${scale})`, opacity: 0.4 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );
    rootRef.current?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
  }, [trigger]);

  // Foco: entra al diálogo, queda atrapado y, al cerrar, vuelve al avatar que lo abrió
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    function onKey(event) {
      const items = [...(rootRef.current?.querySelectorAll(FOCUSABLE) ?? [])];
      const action = dialogKeyAction({
        key: event.key,
        shiftKey: event.shiftKey,
        count: items.length,
        current: items.indexOf(document.activeElement),
      });
      if (!action) return;
      event.preventDefault();
      if (action.type === 'close') onClose();
      else (action.index === -1 ? rootRef.current : items[action.index])?.focus();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      restoreFocus(trigger);
    };
  }, [onClose, trigger]);

  // Deslizar hacia abajo para cerrar (móvil): la imagen sigue al dedo y, si pasa el umbral, se cierra
  function onPointerDown(event) {
    drag.current = { startY: event.clientY, dy: 0 };
  }
  function onPointerMove(event) {
    if (drag.current.startY === null) return;
    const dy = Math.max(event.clientY - drag.current.startY, 0);
    drag.current.dy = dy;
    if (imageRef.current && dy > 6) imageRef.current.style.transform = `translateY(${dy}px)`;
  }
  function onPointerEnd() {
    const { dy } = drag.current;
    drag.current = { startY: null, dy: 0 };
    if (shouldCloseOnSwipe(dy)) onClose();
    else if (imageRef.current) imageRef.current.style.transform = '';
  }

  function onBackdropClick(event) {
    // Tocar fuera de la imagen cierra; los botones del diálogo no
    if (!imageRef.current?.contains(event.target) && !event.target.closest('button')) onClose();
  }

  return (
    <AvatarPreviewView
      person={person}
      rootRef={rootRef}
      imageRef={imageRef}
      closeRef={closeRef}
      handlers={{ onClick: onBackdropClick, onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd }}
      onClose={onClose}
    />
  );
}

// Marcado del diálogo, separado para poder comprobar en pruebas qué datos expone
export function AvatarPreviewView({ person, rootRef, imageRef, closeRef, handlers, onClose }) {
  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Foto de ${person.firstName}`}
      tabIndex={-1}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-5 bg-bg/90 px-6 backdrop-blur-md outline-none"
      {...handlers}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="focus-ring absolute top-[max(1rem,env(safe-area-inset-top))] right-4 flex h-11 w-11 items-center justify-center rounded-full bg-field text-ink"
      >
        <XIcon size={20} />
      </button>

      <div
        ref={imageRef}
        className="relative aspect-square w-[min(320px,80vw)] touch-none overflow-hidden rounded-full bg-field md:w-[min(400px,70vh)]"
      >
        <BigImage person={person} />
      </div>

      <div className="text-center">
        <p className="font-display text-xl font-semibold text-ink">{person.firstName}</p>
        <p className="mt-0.5 text-sm text-ink-muted">{person.roleLabel}</p>
      </div>

      {person.action && (
        <Button variant="secondary" onClick={person.action.onClick}>
          {person.action.label}
        </Button>
      )}
    </div>
  );
}
