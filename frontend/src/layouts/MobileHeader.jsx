import { Link } from 'react-router';
import { BrandMark } from '../components/ui/index.js';
import { MOBILE_HEADER_ACTIONS } from './navigation.js';

// Cabecera compacta en móvil: deja el contenido fuera de la muesca y da acceso a lo que no cabe en la barra
export function MobileHeader({ role }) {
  const actions = MOBILE_HEADER_ACTIONS[role] ?? MOBILE_HEADER_ACTIONS.participant;
  return (
    <header className="pt-safe sticky top-0 z-40 bg-bg/95 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-[22px]">
        <Link to="/" aria-label="Be Core, inicio" className="focus-ring rounded-field">
          <BrandMark size={28} />
        </Link>
        <div className="flex items-center gap-2">
          {actions.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className="focus-ring flex h-11 w-11 items-center justify-center rounded-field bg-field text-ink-muted transition-colors hover:text-ink"
            >
              <Icon size={18} />
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
