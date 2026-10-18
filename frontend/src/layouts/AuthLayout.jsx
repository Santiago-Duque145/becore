import { BrandMark } from '../components/ui/index.js';
import { HeroMotion } from '../components/auth/HeroMotion.jsx';
import { LiveStats } from '../components/auth/LiveStats.jsx';

// Hero + hoja inferior de mobile-login.html. Reutilizable para login, registro y recuperar contraseña.
// En escritorio: la misma tarjeta centrada (máx. 420 px) sobre el fondo con el radial (auth-onboarding §4).
// Los textos usan leading-[normal] como el mockup, para que las alturas coincidan a 390 px.
// P1: HeroMotion va detrás (absoluto) y LiveStats cuelga del tagline, así que ninguno mueve logo ni tagline.
export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-dvh bg-bg md:bg-hero md:flex md:items-center md:justify-center md:p-6">
      <div className="flex min-h-dvh flex-col md:min-h-0 md:w-full md:max-w-[420px] md:overflow-hidden md:rounded-sheet md:border md:border-line">
        <div className="pt-safe relative flex h-[300px] shrink-0 flex-col items-center justify-center gap-3.5 overflow-hidden bg-hero md:h-60">
          <HeroMotion />
          <BrandMark size={52} stacked className="relative" />
          <div className="relative">
            <p className="text-[12.5px] leading-[normal] text-ink-muted">Tu comunidad en movimiento</p>
            <LiveStats />
          </div>
        </div>
        <main className="flex flex-1 flex-col rounded-t-sheet bg-sheet px-[26px] pt-[30px] pb-[max(30px,env(safe-area-inset-bottom))] md:rounded-none">
          <h1 className="mb-1.5 font-display text-xl leading-[normal] font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mb-6 text-[13px] leading-[normal] text-ink-muted">{subtitle}</p>}
          {children}
          {footer && (
            <div className="mt-auto pt-2.5 text-center text-[13px] leading-[normal] text-ink-muted">{footer}</div>
          )}
        </main>
      </div>
    </div>
  );
}
