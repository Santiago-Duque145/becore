import * as Icons from '../../components/icons/index.js';
import { Field, Input, PasswordInput, Select, Textarea } from '../../components/ui/index.js';

export function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-4 border-t border-line pt-6">
      <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

// Clases literales para que Tailwind las genere
const SWATCHES = [
  ['bg-bg', 'bg'],
  ['bg-bg-deep', 'bg-deep'],
  ['bg-sheet', 'sheet'],
  ['bg-panel', 'panel'],
  ['bg-field', 'field'],
  ['bg-line', 'line'],
  ['bg-ink', 'ink'],
  ['bg-ink-muted', 'ink-muted'],
  ['bg-ink-faint', 'ink-faint'],
  ['bg-accent', 'accent'],
  ['bg-accent-soft', 'accent-soft'],
  ['bg-on-accent', 'on-accent'],
  ['bg-success', 'success'],
  ['bg-action', 'action'],
  ['bg-culture', 'culture'],
  ['bg-danger', 'danger'],
];

export function Swatches() {
  return (
    <ul className="grid grid-cols-4 gap-3 md:grid-cols-8">
      {SWATCHES.map(([className, name]) => (
        <li key={name} className="flex flex-col gap-1.5">
          <span className={`h-12 rounded-field border border-line ${className}`} />
          <span className="text-[11px] text-ink-muted">{name}</span>
        </li>
      ))}
    </ul>
  );
}

export function Typography() {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-display text-2xl font-bold">
        Be <span className="text-accent">Core</span>
      </p>
      <p className="font-display text-xl font-semibold">Título de pantalla (h1, 20 px)</p>
      <p className="text-[14.5px] font-semibold">Título de tarjeta (14.5 px)</p>
      <p className="text-sm">Texto normal (14 px). Tu comunidad en movimiento.</p>
      <p className="text-xs font-semibold text-ink-muted">Label de campo (12 px)</p>
      <p className="text-xs text-ink-muted">Metadatos · sáb 31 oct · 3:00 p. m.</p>
    </div>
  );
}

export function IconGrid() {
  return (
    <ul className="grid grid-cols-4 gap-3 md:grid-cols-7">
      {Object.entries(Icons).map(([name, Icon]) => (
        <li key={name} className="flex flex-col items-center gap-2 rounded-field bg-panel p-3 text-ink-muted">
          <Icon size={24} className="text-ink" />
          <span className="text-center text-[11px]">{name.replace('Icon', '')}</span>
        </li>
      ))}
    </ul>
  );
}

export function FieldsDemo() {
  return (
    <div className="grid gap-x-6 md:grid-cols-2">
      <Field label="Correo electrónico">
        <Input type="email" inputMode="email" autoComplete="email" placeholder="nombre@correo.com" />
      </Field>
      <Field label="Contraseña">
        <PasswordInput autoComplete="current-password" placeholder="••••••••" />
      </Field>
      <Field label="Nombre" hint="Así te verán los demás">
        <Input autoComplete="name" defaultValue="Camila" />
      </Field>
      <Field label="Correo" error="Escribe un correo válido">
        <Input defaultValue="camila@" />
      </Field>
      <Field label="Buscar">
        <Input icon={Icons.SearchIcon} type="search" placeholder="Buscar eventos" />
      </Field>
      <Field label="Rol (solo lectura)">
        <Input value="Participante" disabled readOnly />
      </Field>
      <Field label="Categoría">
        <Select defaultValue="">
          <option value="">Elige una categoría</option>
          <option value="sport">Deportivo</option>
        </Select>
      </Field>
      <Field label="Descripción">
        <Textarea rows={3} placeholder="Cuéntale a la gente de qué se trata" />
      </Field>
    </div>
  );
}
