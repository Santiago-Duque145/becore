import { useEffect, useRef } from 'react';
import { SparklesIcon } from '../icons/index.js';
import { Button, useToast } from '../ui/index.js';
import { compressImage, validateImageFile } from '../../lib/image.js';

// Zona para subir la portada del evento (P3): vista previa, "Quitar" y el botón "Generar con IA",
// que queda deshabilitado hasta IA5. value = { blob, previewUrl, removed }; existingUrl = portada ya guardada.
export function CoverUpload({ value, existingUrl, onChange }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const shown = value.previewUrl ?? (value.removed ? null : existingUrl);

  // Libera la URL temporal de la vista previa al reemplazarla o al salir
  useEffect(() => {
    const url = value.previewUrl;
    return () => url && URL.revokeObjectURL(url);
  }, [value.previewUrl]);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    const problem = validateImageFile(file);
    if (problem) return toast.error(problem);
    try {
      const blob = await compressImage(file);
      onChange({ blob, previewUrl: URL.createObjectURL(blob), removed: false });
    } catch (error) {
      toast.error(error.message);
    }
    return undefined;
  }

  return (
    <div className="mb-4">
      <span className="mb-[7px] block text-xs font-semibold text-ink-muted">Imagen del evento (opcional)</span>
      <div className="overflow-hidden rounded-field border border-dashed border-line bg-field">
        {shown ? (
          <img src={shown} alt="Vista previa de la portada" className="h-36 w-full object-cover md:h-44" />
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
          <Button size="sm" variant="ghost" onClick={() => onChange({ blob: null, previewUrl: null, removed: true })}>
            Quitar
          </Button>
        )}
        <Button size="sm" variant="ghost" disabled title="Próximamente">
          <SparklesIcon size={14} /> Generar con IA
        </Button>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={handleFile} aria-label="Elegir imagen del evento" />
      </div>
    </div>
  );
}
