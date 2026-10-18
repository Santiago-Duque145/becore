import { useEffect, useRef, useState } from 'react';
import { CheckIcon, CopyIcon, InfoIcon } from '../components/icons/index.js';
import { QrCode } from '../components/share/QrCode.jsx';
import { Button, Input, useToast } from '../components/ui/index.js';
import { shareWarning } from '../lib/share.js';

const WARNINGS = {
  local:
    'Estás abriendo Be Core desde este portátil (localhost), así que este código solo funciona aquí. Arranca el modo demo y abre su enlace https para que los celulares puedan entrar.',
  insecure:
    'Entraste por la red Wi-Fi sin HTTPS: el código funciona, pero en los celulares no se podrá instalar la app ni usar la ubicación. Con el modo demo funciona todo.',
};

// /compartir (M1, solo organizadores): QR grande con la dirección de la app para escanear en la cancha
export default function CompartirPage() {
  const toast = useToast();
  const inputRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const url = window.location.origin;
  const warning = shareWarning({ hostname: window.location.hostname, isSecure: window.isSecureContext });

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      // navigator.clipboard solo existe en contexto seguro (https o localhost)
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('¡Enlace copiado! Pégalo en el grupo del partido.');
    } catch {
      inputRef.current?.select();
      toast.error('No pudimos copiarlo. Mantén presionado el enlace para copiarlo a mano.');
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5">
      <div>
        <h1 className="font-display text-[21px] font-semibold text-ink md:text-[22px]">Comparte Be Core</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Que escaneen este código con la cámara del celular y entren directo, sin escribir nada.
        </p>
      </div>

      {warning && (
        <div className="flex items-start gap-2.5 rounded-card border border-accent/20 bg-accent/10 p-4 text-[13px] leading-5 text-accent-soft">
          <InfoIcon size={18} className="mt-0.5 shrink-0" />
          <p>{WARNINGS[warning]}</p>
        </div>
      )}

      <div className="rounded-card border border-line bg-panel p-5">
        <div className="mx-auto w-full max-w-[320px] overflow-hidden rounded-field">
          <QrCode value={url} label={`Código QR con el enlace ${url}`} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Input
          ref={inputRef}
          label="Enlace de la app"
          type="text"
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
        />
        <Button onClick={copy} aria-live="polite">
          {copied ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
          {copied ? 'Copiado' : 'Copiar enlace'}
        </Button>
      </div>
    </div>
  );
}
