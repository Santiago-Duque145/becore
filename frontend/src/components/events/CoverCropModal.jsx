import { useCallback, useEffect, useState } from 'react';
import { cn } from '../../lib/cn.js';
import { cropRect } from '../../lib/crop.js';
import { compressImage, cropImage } from '../../lib/image.js';
import { CATEGORY_LABELS } from '../../lib/format.js';
import { useCropPreview } from '../../hooks/useCropPreview.js';
import { Button, ImageCropper, Modal } from '../ui/index.js';
import { EventCover } from './EventCover.jsx';

// La portada se guarda 2:1 (1200 × 600) y cada pantalla la recorta distinto: la tarjeta a 390 px muestra ~la mitad
// central del alto (346 × 84) y el detalle en el celular ~el 85 % central del ancho (390 × 230). El marco marca la
// franja de la tarjeta y debajo se ven las dos con el recorte en vivo.
const CARD_GUIDE = { band: 0.5, label: 'Se ve en la tarjeta' };
const PREVIEW_SIZE = { width: 600, height: 300 };
const DETAIL_ASPECT = 390 / 230;

const PILL_TEXT = { sport: 'text-accent-soft', culture: 'text-culture', recreation: 'text-success', other: 'text-ink-muted' };

// source: { file } (imagen recién elegida) o { url, fallback } (volver a encuadrar: el original guardado, o la portada
// actual si no hay original). onConfirm({ blob, originalBlob }) entrega la portada recortada y el original para Storage.
export function CoverCropModal({ open, source, event, onConfirm, onChangeImage, onCancel, onSourceError }) {
  const [src, setSrc] = useState(null);
  const [image, setImage] = useState(null);
  const [state, setState] = useState(null);
  const [saving, setSaving] = useState(false);
  const preview = useCropPreview(image, state, PREVIEW_SIZE);

  useEffect(() => {
    setImage(null);
    setState(null);
    if (!source?.file) {
      setSrc(source?.url ?? null);
      return undefined;
    }
    const url = URL.createObjectURL(source.file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [source]);

  const handleChange = useCallback((next) => setState(next), []);

  async function confirm() {
    if (!image || !state) return;
    setSaving(true);
    try {
      const blob = await cropImage(image, cropRect(state), 'cover');
      // El original va al lado de la portada nueva: del archivo elegido, o el mismo que se volvió a encuadrar
      const originalBlob = source.file ? await compressImage(source.file, 'original') : await (await fetch(source.url)).blob();
      await onConfirm({ blob, originalBlob });
    } finally {
      setSaving(false);
    }
  }

  const category = event?.category || 'other';
  return (
    <Modal open={open} title="Encuadra la portada" onClose={onCancel} className="max-h-[94dvh] overflow-y-auto md:max-w-2xl">
      <p className="mb-3 text-sm text-ink-muted">Mueve la imagen para dejar lo importante dentro de la franja.</p>
      {source?.fallback && (
        <p className="mb-3 rounded-field border border-culture/30 bg-culture/10 px-3 py-2 text-xs text-culture">
          Esta imagen se subió antes del editor: se puede mover, pero con menos calidad.
        </p>
      )}
      {src && (
        <ImageCropper
          src={src}
          aspect={2}
          guide={CARD_GUIDE}
          label="Encuadre de la portada"
          onChange={handleChange}
          onReady={setImage}
          onError={onSourceError}
        />
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <figure>
          <figcaption className="mb-1.5 text-xs font-semibold text-ink-muted">Así se ve en la tarjeta</figcaption>
          <div className="max-w-[346px] overflow-hidden rounded-card border border-white/[0.06] bg-panel">
            <EventCover event={{ category, coverUrl: preview, confirmedCount: 0, capacity: event?.capacity || 0 }} />
            <p className="truncate px-3.5 py-2.5 text-sm font-semibold text-ink">{event?.title || 'Título del evento'}</p>
          </div>
        </figure>
        <figure>
          <figcaption className="mb-1.5 text-xs font-semibold text-ink-muted">Así se ve en el detalle (celular)</figcaption>
          <div className="relative max-w-[346px] overflow-hidden rounded-card bg-field" style={{ aspectRatio: DETAIL_ASPECT }}>
            {preview && <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />}
            <span className="absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-bg/40" aria-hidden="true" />
            <span className={cn('absolute bottom-3 left-3 rounded-full bg-bg/55 px-3 py-[5px] text-[11px] leading-none font-bold', PILL_TEXT[category])}>
              {CATEGORY_LABELS[category]}
            </span>
          </div>
        </figure>
      </div>

      <div className="mt-5 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="secondary" onClick={onChangeImage} disabled={saving}>
          Cambiar imagen
        </Button>
        <Button onClick={confirm} loading={saving} disabled={!state}>
          Usar esta imagen
        </Button>
      </div>
    </Modal>
  );
}
