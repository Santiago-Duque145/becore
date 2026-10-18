import { useCallback, useState } from 'react';
import { CopyIcon, ShareIcon } from '../icons/index.js';
import { eventUrl, shareText, whatsappUrl } from '../../lib/share.js';
import { Button, ExternalLinkButton, Modal, useToast } from '../ui/index.js';

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// "Compartir" en el detalle: Web Share API si el navegador la tiene (celulares); si no, un menú con
// WhatsApp y "Copiar enlace". El enlace usa window.location.origin (en la demo, el túnel HTTPS).
export function ShareEventButton({ event, className }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const url = eventUrl(event, window.location.origin);
  const text = shareText(event, url);

  async function handleClick() {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: event.title, text, url });
      } catch (error) {
        if (error?.name !== 'AbortError') setOpen(true); // el usuario cerró la hoja: no es un error
      }
      return;
    }
    setOpen(true);
  }

  async function handleCopy() {
    const ok = await copyToClipboard(url);
    if (ok) toast.success('Copiamos el enlace.');
    else toast.error('No pudimos copiarlo. Mantén presionado el enlace para copiarlo.');
    close();
  }

  return (
    <>
      <Button variant="secondary" size="sm" className={className} onClick={handleClick}>
        <ShareIcon size={14} /> Compartir
      </Button>
      <Modal open={open} title="Compartir evento" onClose={close}>
        <p className="mb-4 text-sm break-all text-ink-muted">{url}</p>
        <div className="flex flex-col gap-2.5">
          <ExternalLinkButton href={whatsappUrl(text)} variant="secondary" onClick={close}>
            WhatsApp
          </ExternalLinkButton>
          <Button variant="secondary" onClick={handleCopy}>
            <CopyIcon size={16} /> Copiar enlace
          </Button>
          <Button variant="ghost" onClick={close}>
            Cerrar
          </Button>
        </div>
      </Modal>
    </>
  );
}
