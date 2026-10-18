import { useCallback, useState } from 'react';
import { CalendarIcon } from '../icons/index.js';
import { downloadIcs, googleCalendarUrl } from '../../lib/calendar.js';
import { eventUrl } from '../../lib/share.js';
import { Button, ExternalLinkButton, Modal } from '../ui/index.js';

// "Agregar a mi calendario" para quien confirmó asistencia: Google Calendar (enlace) o archivo .ics
// generado en el navegador (Apple, Outlook y cualquier otro calendario).
export function AddToCalendarButton({ event, className }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const url = eventUrl(event, window.location.origin);

  return (
    <>
      <Button variant="secondary" size="sm" className={className} onClick={() => setOpen(true)}>
        <CalendarIcon size={14} /> Agregar a mi calendario
      </Button>
      <Modal open={open} title="Agregar a mi calendario" onClose={close}>
        <div className="flex flex-col gap-2.5">
          <ExternalLinkButton href={googleCalendarUrl(event, url)} variant="secondary" onClick={close}>
            Google Calendar
          </ExternalLinkButton>
          <Button
            variant="secondary"
            onClick={() => {
              downloadIcs(event, url);
              close();
            }}
          >
            Descargar archivo .ics
          </Button>
          <Button variant="ghost" onClick={close}>
            Cerrar
          </Button>
        </div>
      </Modal>
    </>
  );
}
