import { useCallback, useEffect, useState } from 'react';
import { cropRect } from '../../lib/crop.js';
import { cropImage } from '../../lib/image.js';
import { useCropPreview } from '../../hooks/useCropPreview.js';
import { Avatar, Button, ImageCropper, Modal } from '../ui/index.js';

const PREVIEW_SIZE = { width: 192, height: 192 };

// P8 · Encuadre de la foto de perfil: marco redondo, salida de 256 px (cropImage 'avatar') y vista previa a los tamaños
// en que se ve (52 y 34 px). onConfirm(blob) sube la foto recortada; "Cambiar imagen" vuelve a abrir el selector.
export function AvatarCropModal({ file, name, onConfirm, onChangeImage, onCancel }) {
  const [src, setSrc] = useState(null);
  const [image, setImage] = useState(null);
  const [state, setState] = useState(null);
  const [saving, setSaving] = useState(false);
  const preview = useCropPreview(image, state, PREVIEW_SIZE);

  useEffect(() => {
    setImage(null);
    setState(null);
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleChange = useCallback((next) => setState(next), []);

  async function confirm() {
    if (!image || !state) return;
    setSaving(true);
    try {
      await onConfirm(await cropImage(image, cropRect(state), 'avatar'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={Boolean(file)} title="Encuadra tu foto" onClose={onCancel} className="max-h-[94dvh] overflow-y-auto">
      <p className="mb-3 text-sm text-ink-muted">Deja tu cara dentro del círculo.</p>
      {src && <ImageCropper src={src} shape="circle" label="Encuadre de tu foto de perfil" onChange={handleChange} onReady={setImage} />}
      <div className="mt-4 flex items-center gap-3" aria-hidden="true">
        <span className="text-xs font-semibold text-ink-muted">Así se ve</span>
        <Avatar name={name} src={preview} size="lg" decorative />
        <Avatar name={name} src={preview} size="md" decorative />
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
