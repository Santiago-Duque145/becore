import { CheckIcon, NavigationIcon } from '../icons/index.js';
import { Button } from '../ui/index.js';

// Botón "Ver eventos cerca de mí" (M1, se usa en P6). Recibe el resultado de useGeolocation().
// Sin contexto seguro (http://IP de la Wi-Fi) el navegador no da la ubicación: el botón no se muestra.
export function NearMeButton({ geo, className }) {
  if (!geo.supported) return null;
  const granted = geo.status === 'granted';
  return (
    <div className={className}>
      <Button
        variant="secondary"
        size="sm"
        loading={geo.status === 'loading'}
        onClick={geo.request}
      >
        {granted ? <CheckIcon size={16} className="text-success" /> : geo.status !== 'loading' && <NavigationIcon size={16} />}
        {granted ? 'Mostrando distancias' : 'Ver eventos cerca de mí'}
      </Button>
      {geo.error && (
        <p role="status" className="mt-2 text-xs text-ink-muted">
          {geo.error}
        </p>
      )}
    </div>
  );
}
