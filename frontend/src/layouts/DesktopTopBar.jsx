import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useMyAvatar } from '../hooks/useMyAvatar.js';
import { Avatar, BrandMark, Input } from '../components/ui/index.js';
import { SearchIcon } from '../components/icons/index.js';
import { cn } from '../lib/cn.js';
import { TOP_BAR_LINKS } from './navigation.js';

// Buscador de desktop-descubre (240 px). Escribe ?q= en /descubre, que filtra la lista.
function TopBarSearch() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const onDescubre = pathname === '/descubre';
  const value = onDescubre ? (params.get('q') ?? '') : '';

  function handleChange(event) {
    const next = new URLSearchParams(onDescubre ? params : undefined);
    if (event.target.value) next.set('q', event.target.value);
    else next.delete('q');
    const search = next.toString();
    navigate(
      { pathname: '/descubre', search: search ? `?${search}` : '' },
      { replace: onDescubre },
    );
  }

  return (
    <div role="search" className="w-60">
      <label htmlFor="buscar-eventos" className="sr-only">
        Buscar eventos
      </label>
      <Input
        id="buscar-eventos"
        type="search"
        icon={SearchIcon}
        placeholder="Buscar eventos"
        value={value}
        onChange={handleChange}
      />
    </div>
  );
}

// Barra superior del participante (desktop-descubre.html: padding 20×40, enlaces 13.5 px con gap 30)
export function DesktopTopBar({ profile, hasUnread = false }) {
  const avatar = useMyAvatar();
  return (
    <header className="pt-safe sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur-md">
      <div className="flex items-center justify-between px-10 py-5">
        <Link to="/" aria-label="Be Core, inicio" className="focus-ring inline-flex min-h-11 items-center rounded-field">
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
                      'focus-ring inline-flex items-center gap-1.5 rounded-md px-1 py-3 text-[13.5px] font-medium transition-colors',
                      isActive ? 'text-ink' : 'text-ink-muted hover:text-ink',
                    )
                  }
                >
                  {label}
                  {to === '/avisos' && hasUnread && (
                    <>
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 shrink-0 rounded-full bg-action"
                      />
                      <span className="sr-only">(hay avisos sin leer)</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-[18px]">
          <TopBarSearch />
          <Link to="/perfil" aria-label="Mi perfil" className="focus-ring flex h-11 w-11 items-center justify-center rounded-full">
            <Avatar name={profile?.fullName} {...avatar} decorative />
          </Link>
        </div>
      </div>
    </header>
  );
}
