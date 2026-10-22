import { useEffect, useRef, useState } from 'react';
import { CropIcon, SparklesIcon } from '../icons/index.js';
import { Button, useToast } from '../ui/index.js';
import { originalUrlFor, validateImageFile } from '../../lib/image.js';
import { CoverCropModal } from './CoverCropModal.jsx';

// Zona para subir la portada del evento (P3): vista previa, "Quitar" y el botón "Generar con IA",
// que queda deshabilitado hasta IA5. value = { blob, originalBlob, previewUrl, removed }; existingUrl = portada ya guardada.
// P8: al elegir una imagen se abre el editor de encuadre; "Encuadrar" lo vuelve a abrir con el original guardado
// (o con la portada actual, si se subió antes del editor). event: título, categoría y cupo para las vistas previas.
export function CoverUpload({ value, existingUrl, onChange, event }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const lastFile = useRef(null);
  const [cropSource, setCropSource] = useState(null);
  const shown = value.previewUrl ?? (value.removed ? null : existingUrl);

  // Libera la URL temporal de la vista previa al reemplazarla o al salir
  useEffect(() => {
    const url = value.previewUrl;
    return () => url && URL.revokeObjectURL(url);
  }, [value.previewUrl]);

  function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return undefined;
    const problem = validateImageFile(file);
    if (problem) return toast.error(problem);
    lastFile.current = file;
    setCropSource({ file });
    return undefined;
  }

  // Volver a encuadrar: la imagen recién elegida, o el original guardado de la portada
  function reframe() {
    if (value.blob && lastFile.current) setCropSource({ file: lastFile.current });
    else if (existingUrl) setCropSource({ url: originalUrlFor(existingUrl) });
  }

  // Sin original (portada de antes de P8): se encuadra la portada actual, con aviso de menos calidad
  function handleSourceError() {
    if (cropSource?.url && !cropSource.fallback && existingUrl) return setCropSource({ url: existingUrl, fallback: true });
    setCropSource(null);
    return toast.error('No pudimos abrir la imagen. Intenta con otra');
  }

  async function handleConfirm({ blob, originalBlob }) {
    onChange({ blob, originalBlob, previewUrl: URL.createObjectURL(blob), removed: false });
    setCropSource(null);
  }

  return (
    <div className="mb-4">
      <span className="mb-[7px] block text-xs font-semibold text-ink-muted">Imagen del evento (opcional)</span>
      <div className="overflow-hidden rounded-field border border-dashed border-line bg-field">
        {shown ? (
          <img src={shown} alt="Vista previa de la portada" className="aspect-[2/1] w-full object-cover" />
        ) : (
          <p className="flex h-24 items-center justify-center px-4 text-center text-xs text-ink-muted">
            Sin imagen: se usa la portada de la categoría.
          </p>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
          {shown ? 'Cambiar imagen' : 'Subir imagen'}
        </Button>
        {shown && (
          <Button size="sm" variant="secondary" onClick={reframe}>
            <CropIcon size={14} /> Encuadrar
          </Button>
        )}
        {shown && (
          <Button size="sm" variant="ghost" onClick={() => onChange({ blob: null, originalBlob: null, previewUrl: null, removed: true })}>
            Quitar
          </Button>
        )}
        <Button size="sm" variant="ghost" disabled title="Próximamente">
          <SparklesIcon size={14} /> Generar con IA
        </Button>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={handleFile} aria-label="Elegir imagen del evento" />
      </div>
      <CoverCropModal
        open={Boolean(cropSource)}
        source={cropSource}
        event={event}
        onConfirm={handleConfirm}
        onChangeImage={() => fileRef.current?.click()}
        onCancel={() => setCropSource(null)}
        onSourceError={handleSourceError}
      />
    </div>
  );
}
