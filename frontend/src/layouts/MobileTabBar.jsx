import { NavLink } from 'react-router';
import { cn } from '../lib/cn.js';
import { MOBILE_TABS } from './navigation.js';

// Barra inferior de 4 pestañas (mobile-descubre.html). NavLink pone aria-current="page" en la activa.
export function MobileTabBar({ role, hasUnread = false }) {
  const tabs = MOBILE_TABS[role] ?? MOBILE_TABS.participant;
  return (
    <nav
      aria-label="Principal"
      className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-line bg-bg/95 backdrop-blur-md"
    >
      <ul className="flex items-stretch justify-around px-2.5 pt-2 pb-2">
        {tabs.map(({ to, label, Icon, notifications }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'focus-ring relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-field text-[11px] font-semibold transition-colors',
                  isActive ? 'text-accent' : 'text-ink-muted hover:text-ink',
                )
              }
            >
              <span className="relative">
                <Icon size={20} />
                {notifications && hasUnread && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-bg bg-action" />
                )}
              </span>
              {label}
              {notifications && hasUnread && <span className="sr-only">(hay avisos sin leer)</span>}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
