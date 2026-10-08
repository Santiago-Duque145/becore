import { Loader2 } from 'lucide-react';

export function Spinner({ label = 'Cargando' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-10 text-gray-500">
      <Loader2 className="animate-spin" size={20} aria-hidden="true" />
      <span>{label}…</span>
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-gray-200 ${className}`} />;
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
      <p className="font-display text-lg font-semibold text-navy-900">{title}</p>
      {description && <p className="max-w-sm text-gray-500">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message = 'No pudimos cargar la información', onRetry }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl border border-orange-500/40 bg-white px-6 py-12 text-center"
    >
      <p className="font-display text-lg font-semibold text-navy-900">Algo salió mal</p>
      <p className="max-w-sm text-gray-500">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-[44px] rounded-xl border border-gray-200 px-4 font-medium text-navy-900 hover:bg-gray-200/60"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
