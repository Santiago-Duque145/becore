import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '../../lib/cn.js';
import { MAX_ZOOM, MIN_ZOOM, centered, initialState, keyAction, moveBy, resizeFrame, scaleOf, zoomTo } from '../../lib/crop.js';
import { Button } from './Button.jsx';
import { Spinner } from './Spinner.jsx';

const WHEEL_FACTOR = 1.1;

// P8 · Editor de encuadre propio (sin librería): arrastrar con el mouse o un dedo, pellizcar con dos dedos, rueda,
// slider "Zoom", botón "Centrar" y teclado (flechas mueven, Shift ×4, + y − acercan, 0 centra). La geometría vive en
// lib/crop.js. El padre recibe el estado en onChange y la <img> cargada en onReady para recortarla con cropImage.
// shape: 'rect' (proporción aspect) o 'circle' (marco cuadrado con máscara redonda). guide: franja que se ve en la tarjeta.
export function ImageCropper({ src, aspect = 2, shape = 'rect', guide, label, onChange, onReady, onError, className }) {
  const frameRef = useRef(null);
  const pointers = useRef(new Map());
  const pinch = useRef(null);
  const [state, setState] = useState(null);
  const zoomId = useId();
  const hintId = useId();

  // Imagen nueva: se espera a que cargue para conocer su tamaño real
  useEffect(() => setState(null), [src]);

  useEffect(() => {
    if (state) onChange?.(state);
  }, [state, onChange]);

  // El marco cambia de tamaño (rotar el celular, otra pantalla): se conserva el encuadre
  useEffect(() => {
    const frame = frameRef.current;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width && height) setState((s) => (s ? resizeFrame(s, { fw: width, fh: height }) : s));
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  // Rueda: zoom hacia el cursor. Escucha nativa con passive: false para que la página no se desplace.
  useEffect(() => {
    const frame = frameRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      const box = frame.getBoundingClientRect();
      const px = e.clientX - box.left - box.width / 2;
      const py = e.clientY - box.top - box.height / 2;
      setState((s) => s && zoomTo(s, s.zoom * (e.deltaY < 0 ? WHEEL_FACTOR : 1 / WHEEL_FACTOR), px, py));
    };
    frame.addEventListener('wheel', onWheel, { passive: false });
    return () => frame.removeEventListener('wheel', onWheel);
  }, []);

  function handleLoad(e) {
    const img = e.currentTarget;
    const frame = frameRef.current;
    setState(initialState({ iw: img.naturalWidth, ih: img.naturalHeight }, { fw: frame.clientWidth, fh: frame.clientHeight }));
    onReady?.(img);
  }

  function pinchInfo() {
    const [a, b] = [...pointers.current.values()];
    const box = frameRef.current.getBoundingClientRect();
    return {
      distance: Math.hypot(a.x - b.x, a.y - b.y),
      mid: { x: (a.x + b.x) / 2 - box.left - box.width / 2, y: (a.y + b.y) / 2 - box.top - box.height / 2 },
    };
  }

  function handlePointerDown(e) {
    if (!state) return;
    frameRef.current.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    pinch.current = pointers.current.size === 2 ? pinchInfo() : null;
  }

  function handlePointerMove(e) {
    const previous = pointers.current.get(e.pointerId);
    if (!previous) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      setState((s) => s && moveBy(s, e.clientX - previous.x, e.clientY - previous.y));
    } else if (pointers.current.size === 2 && pinch.current) {
      const now = pinchInfo();
      const before = pinch.current;
      pinch.current = now;
      setState((s) => s && moveBy(zoomTo(s, (s.zoom * now.distance) / before.distance, now.mid.x, now.mid.y), now.mid.x - before.mid.x, now.mid.y - before.mid.y));
    }
  }

  function handlePointerUp(e) {
    pointers.current.delete(e.pointerId);
    pinch.current = pointers.current.size === 2 ? pinchInfo() : null;
  }

  function handleKeyDown(e) {
    if (!state || e.altKey || e.ctrlKey || e.metaKey) return;
    const next = keyAction(state, e.key, e.shiftKey);
    if (!next) return;
    e.preventDefault();
    setState(next);
  }

  const scale = state ? scaleOf(state) : 0;
  const zoomPercent = Math.round((state?.zoom ?? 1) * 100);

  return (
    <div className={className}>
      <div
        ref={frameRef}
        role="application"
        tabIndex={0}
        aria-label={label ?? 'Encuadre de la imagen'}
        aria-describedby={hintId}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className={cn(
          'focus-ring relative w-full cursor-grab touch-none overflow-hidden rounded-field bg-field select-none active:cursor-grabbing',
          shape === 'circle' && 'mx-auto max-w-[280px]',
        )}
        style={{ aspectRatio: shape === 'circle' ? 1 : aspect }}
      >
        <img
          src={src}
          alt=""
          crossOrigin="anonymous"
          draggable={false}
          onLoad={handleLoad}
          onError={onError}
          className="pointer-events-none absolute top-1/2 left-1/2 max-w-none"
          style={
            state
              ? {
                  width: state.iw * scale,
                  height: state.ih * scale,
                  transform: `translate(-50%, -50%) translate(${state.x}px, ${state.y}px)`,
                }
              : { opacity: 0 }
          }
        />
        {shape === 'circle' && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_color-mix(in_oklab,var(--color-bg)_65%,transparent)] ring-2 ring-ink/70"
          />
        )}
        {guide && state && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 border-y border-dashed border-ink/80"
            style={{ top: `${((1 - guide.band) / 2) * 100}%`, bottom: `${((1 - guide.band) / 2) * 100}%` }}
          >
            <span className="absolute top-1.5 left-1.5 rounded-full bg-bg/75 px-2 py-0.5 text-[11px] font-semibold text-ink">{guide.label}</span>
          </span>
        )}
        {!state && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner label="Cargando imagen" className="py-0" />
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <label htmlFor={zoomId} className="text-xs font-semibold text-ink-muted">
          Zoom
        </label>
        <input
          id={zoomId}
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={state?.zoom ?? 1}
          disabled={!state}
          aria-valuetext={`${zoomPercent} %`}
          onChange={(e) => setState((s) => s && zoomTo(s, Number(e.target.value)))}
          className="h-11 min-w-0 flex-1 cursor-pointer accent-accent"
        />
        <Button size="sm" variant="secondary" disabled={!state} onClick={() => setState((s) => s && centered(s))}>
          Centrar
        </Button>
      </div>
      <p id={hintId} className="mt-1 text-xs text-ink-muted">
        Arrastra para mover y usa el zoom o pellizca para acercar. Con el teclado: flechas para mover, + y − para acercar.
      </p>
      <p className="sr-only" aria-live="polite">
        {state ? `Zoom ${zoomPercent} %` : ''}
      </p>
    </div>
  );
}
