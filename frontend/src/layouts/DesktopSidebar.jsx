import { Link, NavLink } from 'react-router';
import { Avatar, BrandMark } from '../components/ui/index.js';
import { cn } from '../lib/cn.js';
import { SIDEBAR_LINKS } from './navigation.js';

const ROLE_LABELS = { organizer: 'Organizador', participant: 'Participante' };

// Barra lateral del organizador (desktop-panel-organizador.html: 240 px, fondo bg-deep, padding 28×20)
export function DesktopSidebar({ profile }) {
  return (
    <aside className="pt-safe sticky top-0 flex h-dvh w-60 shrink-0 flex-col gap-8 border-r border-line bg-bg-deep px-5 py-7">
      <Link to="/" aria-label="Be Core, inicio" className="focus-ring self-start rounded-field">
        <BrandMark size={30} />
      </Link>
      <nav aria-label="Principal">
        <ul className="flex flex-col gap-1">
          {SIDEBAR_LINKS.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'focus-ring group flex items-center gap-3 rounded-[10px] px-3 py-[11px] text-sm font-medium transition-colors',
                    isActive ? 'bg-panel text-ink' : 'text-ink-muted hover:bg-panel/60 hover:text-ink',
                  )
                }
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink-faint group-aria-[current=page]:bg-accent"
                />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto flex items-center gap-2.5 rounded-field bg-panel p-3">
        <Avatar name={profile?.fullName} decorative />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-ink">{profile?.fullName}</p>
          <p className="text-[11px] text-ink-muted">{ROLE_LABELS[profile?.role]}</p>
        </div>
      </div>
    </aside>
  );
}
