import { NavLink } from 'react-router';
import { Calendar, LayoutDashboard, Clock, User, PlusCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';

const NAV_LEFT = [
  { to: '/eventos', label: 'Eventos', Icon: Calendar },
  { to: '/panel', label: 'Panel', Icon: LayoutDashboard },
];
const NAV_RIGHT = [
  { to: '/citas', label: 'Citas', Icon: Clock },
  { to: '/perfil', label: 'Perfil', Icon: User },
];

const linkClass = ({ isActive }) =>
  `flex flex-col items-center gap-0.5 text-xs min-w-[44px] min-h-[44px] justify-center px-2 transition-colors focus-visible:outline-2 focus-visible:outline-teal-500 ${
    isActive ? 'text-teal-500' : 'text-gray-500 hover:text-gray-200'
  }`;

function NavItem({ to, label, Icon, size }) {
  return (
    <NavLink to={to} className={linkClass}>
      <Icon size={size} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  );
}

export function Navbar() {
  const { profile } = useAuth();
  const isOrganizer = profile?.role === 'organizer';

  return (
    <>
      {/* Barra superior en escritorio */}
      <header
        className="hidden md:flex items-center justify-between px-8 h-16 bg-navy-900 border-b border-navy-800"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <span className="font-display font-bold text-xl text-white tracking-wide">Be Core</span>
        <nav aria-label="Principal" className="flex items-center gap-6">
          {[...NAV_LEFT, ...NAV_RIGHT].map((item) => (
            <NavItem key={item.to} {...item} size={20} />
          ))}
          {isOrganizer && (
            <NavLink
              to="/eventos/nuevo"
              className="flex items-center gap-1 text-teal-500 hover:text-teal-600 text-sm font-medium min-h-[44px]"
            >
              <PlusCircle size={18} aria-hidden="true" />
              Crear evento
            </NavLink>
          )}
        </nav>
      </header>

      {/* Barra inferior en móvil; el "+" del organizador va al centro */}
      <nav
        aria-label="Principal"
        className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around bg-navy-900 border-t border-navy-800 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {NAV_LEFT.map((item) => (
          <NavItem key={item.to} {...item} size={22} />
        ))}
        {isOrganizer && (
          <NavLink
            to="/eventos/nuevo"
            aria-label="Crear evento"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500 text-navy-900 focus-visible:outline-2 focus-visible:outline-white"
          >
            <PlusCircle size={26} aria-hidden="true" />
          </NavLink>
        )}
        {NAV_RIGHT.map((item) => (
          <NavItem key={item.to} {...item} size={22} />
        ))}
      </nav>
    </>
  );
}
