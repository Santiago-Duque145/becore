import { Link, NavLink } from 'react-router';
import { Avatar, BrandMark } from '../components/ui/index.js';
import { cn } from '../lib/cn.js';
import { TOP_BAR_LINKS } from './navigation.js';

// Barra superior del participante (desktop-descubre.html: padding 20×40, enlaces 13.5 px con gap 30).
// El buscador del mockup llega con Descubre en R5.
export function DesktopTopBar({ profile }) {
  return (
    <header className="pt-safe sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur-md">
      <div className="flex items-center justify-between px-10 py-5">
        <Link to="/" aria-label="Be Core, inicio" className="focus-ring rounded-field">
          <BrandMark size={28} />
        </Link>
        <nav aria-label="Principal">
          <ul className="flex gap-[30px]">
            {TOP_BAR_LINKS.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'focus-ring rounded-md px-1 py-2 text-[13.5px] font-medium transition-colors',
                      isActive ? 'text-ink' : 'text-ink-muted hover:text-ink',
                    )
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <Link to="/perfil" aria-label="Mi perfil" className="focus-ring rounded-full">
          <Avatar name={profile?.fullName} decorative />
        </Link>
      </div>
    </header>
  );
}
