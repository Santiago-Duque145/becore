import { NavLink } from 'react-router';
import { Calendar, LayoutDashboard, Clock, User, PlusCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';

const navItems = [
  { to: '/eventos', label: 'Eventos', Icon: Calendar },
  { to: '/panel', label: 'Panel', Icon: LayoutDashboard },
  { to: '/citas', label: 'Citas', Icon: Clock },
  { to: '/perfil', label: 'Perfil', Icon: User },
];

export function Navbar() {
  const { profile } = useAuth();
  const isOrganizer = profile?.role === 'organizer';

  const linkClass = ({ isActive }) =>
    `flex flex-col items-center gap-0.5 text-xs min-w-[44px] min-h-[44px] justify-center px-2 transition-colors ${
      isActive ? 'text-teal-500' : 'text-gray-500 hover:text-gray-200'
    }`;

  return (
    <>
      {/* Barra superior en escritorio */}
      <header
        className="hidden md:flex items-center justify-between px-8 h-16 bg-navy-900 border-b border-navy-800"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <span className="font-display font-bold text-xl text-white tracking-wide">Be Core</span>
        <nav className="flex items-center gap-6">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
          {isOrganizer && (
            <NavLink to="/eventos/nuevo" className="flex items-center gap-1 text-teal-500 hover:text-teal-600 text-sm font-medium min-h-[44px]">
              <PlusCircle size={18} />
              Crear evento
            </NavLink>
          )}
        </nav>
      </header>

      {/* Barra inferior en móvil */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around bg-navy-900 border-t border-navy-800 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {navItems.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={linkClass}>
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
        {isOrganizer && (
          <NavLink to="/eventos/nuevo" className="flex flex-col items-center gap-0.5 text-xs text-teal-500 min-w-[44px] min-h-[44px] justify-center px-2">
            <PlusCircle size={24} />
            <span>Crear</span>
          </NavLink>
        )}
      </nav>
    </>
  );
}
