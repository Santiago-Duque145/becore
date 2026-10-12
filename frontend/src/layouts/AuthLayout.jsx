import { BrandMark } from '../components/ui/index.js';

// Hero + hoja inferior de mobile-login.html. Reutilizable para login, registro y recuperar contraseña.
// En escritorio: la misma tarjeta centrada (máx. 420 px) sobre el fondo con el radial (auth-onboarding §4).
export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-dvh bg-bg md:bg-hero md:flex md:items-center md:justify-center md:p-6">
      <div className="flex min-h-dvh flex-col md:min-h-0 md:w-full md:max-w-[420px] md:overflow-hidden md:rounded-sheet md:border md:border-line">
        <div className="pt-safe flex h-[300px] shrink-0 flex-col items-center justify-center gap-3.5 bg-hero md:h-60">
          <BrandMark size={52} stacked />
          <p className="text-[12.5px] text-ink-muted">Tu comunidad en movimiento</p>
        </div>
        <main className="flex flex-1 flex-col rounded-t-sheet bg-sheet px-[26px] pt-[30px] pb-[max(30px,env(safe-area-inset-bottom))] md:rounded-none">
          <h1 className="mb-1.5 font-display text-xl font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mb-6 text-[13px] text-ink-muted">{subtitle}</p>}
          {children}
          {footer && <div className="mt-auto pt-2.5 text-center text-[13px] text-ink-muted">{footer}</div>}
        </main>
      </div>
    </div>
  );
}
