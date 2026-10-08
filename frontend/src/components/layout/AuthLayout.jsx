export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center bg-navy-900 px-4 py-8"
      style={{
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="mb-6 text-center">
        <p className="font-display text-3xl font-bold tracking-wide text-white">Be Core</p>
        <p className="mt-1 text-sm text-teal-500">Tu comunidad en movimiento</p>
      </div>
      <main className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="font-display text-xl font-semibold text-navy-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        <div className="mt-5">{children}</div>
      </main>
      {footer && <div className="mt-5 text-sm text-gray-200">{footer}</div>}
    </div>
  );
}
