import { Outlet, useMatches } from 'react-router';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useMediaQuery } from '../hooks/useMediaQuery.js';
import { DesktopSidebar } from './DesktopSidebar.jsx';
import { DesktopTopBar } from './DesktopTopBar.jsx';
import { MobileHeader } from './MobileHeader.jsx';
import { MobileTabBar } from './MobileTabBar.jsx';

function SkipLink() {
  return (
    <a
      href="#contenido"
      className="sr-only z-[80] rounded-field bg-accent px-4 py-2 font-semibold text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      Saltar al contenido
    </a>
  );
}

// Elige el layout por rol y ancho (768 px): barra inferior en móvil,
// barra superior para el participante y barra lateral para el organizador en escritorio.
export function AppShell() {
  const { profile } = useAuth();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const role = profile?.role === 'organizer' ? 'organizer' : 'participant';
  const immersive = useMatches().some((match) => match.handle?.immersive);

  // Pantallas de pantalla completa en móvil (detalle de evento): sin cabecera ni barra inferior,
  // la página trae su propia barra de acción fija (mobile-detalle-evento.html)
  if (!isDesktop && immersive) {
    return (
      <div className="min-h-dvh">
        <SkipLink />
        <main id="contenido">
          <Outlet />
        </main>
      </div>
    );
  }

  if (!isDesktop) {
    return (
      <div className="min-h-dvh">
        <SkipLink />
        <MobileHeader role={role} />
        <main id="contenido" className="px-[22px] pt-2 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
          <Outlet />
        </main>
        <MobileTabBar role={role} />
      </div>
    );
  }

  if (role === 'organizer') {
    return (
      <div className="flex min-h-dvh">
        <SkipLink />
        <DesktopSidebar profile={profile} />
        <main id="contenido" className="min-w-0 flex-1 px-9 py-7">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <SkipLink />
      <DesktopTopBar profile={profile} />
      <main id="contenido" className="px-10 py-[30px]">
        {/* 1360 px = 1440 − 2 × 40 de desktop-descubre; las páginas angostas se limitan solas */}
        <div className="mx-auto w-full max-w-[1360px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
