import { useState } from 'react';
import {
  Avatar,
  Badge,
  BrandMark,
  Button,
  CapacityBar,
  Chip,
  Divider,
  EmptyState,
  ErrorState,
  GoogleButton,
  Modal,
  OptionCard,
  ProgressSteps,
  Skeleton,
  Spinner,
  Toast,
  useToast,
} from '../../components/ui/index.js';
import { CalendarIcon, UsersIcon } from '../../components/icons/index.js';
import { STATUS_BADGES } from '../../components/ui/Badge.jsx';
import { FieldsDemo, GeoQrDemo, IconGrid, Section, Swatches, Typography } from './dev-sections.jsx';
import { LoadersDemo } from './LoadersDemo.jsx';

// Página de verificación del sistema de diseño (solo en desarrollo): /dev/ui
export default function DevUiPage() {
  const toast = useToast();
  const [chips, setChips] = useState(['sport']);
  const [tab, setTab] = useState('upcoming');
  const [role, setRole] = useState('participant');
  const [step, setStep] = useState(2);
  const [modalOpen, setModalOpen] = useState(false);
  const toggleChip = (value) =>
    setChips((current) => (current.includes(value) ? current.filter((c) => c !== value) : [...current, value]));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-[22px] py-8 md:px-10">
      <header className="flex flex-col gap-2">
        <BrandMark size={28} />
        <h1 className="font-display text-xl font-semibold md:text-[22px]">Sistema de diseño · /dev/ui</h1>
        <p className="text-sm text-ink-muted">Todos los componentes de components/ui en sus variantes y estados.</p>
      </header>

      <Section title="Tokens">
        <Swatches />
      </Section>

      <Section title="Tipografía">
        <Typography />
      </Section>

      <Section title="Button">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Confirmar asistencia</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Cancelar evento</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button loading>Guardando</Button>
          <Button disabled>Deshabilitado</Button>
          <Button size="sm">Confirmar</Button>
          <Button size="sm" variant="secondary">
            Ver
          </Button>
          <Button size="sm" loading>
            Enviando
          </Button>
        </div>
      </Section>

      <Section title="Field · Input · PasswordInput · Textarea · Select">
        <FieldsDemo />
      </Section>

      <Section title="GoogleButton · Divider">
        <div className="flex max-w-sm flex-col">
          <Button>Iniciar sesión</Button>
          <Divider className="my-[22px]">o continúa con</Divider>
          <GoogleButton />
          <GoogleButton loading className="mt-3" />
        </div>
      </Section>

      <Section title="Chip">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Categorías">
          {[
            ['sport', 'Deportivos'],
            ['culture', 'Culturales'],
            ['recreation', 'Recreativos'],
          ].map(([value, label]) => (
            <Chip key={value} selected={chips.includes(value)} onClick={() => toggleChip(value)}>
              {label}
            </Chip>
          ))}
          <Chip icon={CalendarIcon}>Con ícono</Chip>
          <Chip disabled>Deshabilitado</Chip>
        </div>
        <div className="flex gap-2" role="tablist" aria-label="Periodo">
          <Chip role="tab" selected={tab === 'upcoming'} onClick={() => setTab('upcoming')}>
            Próximos
          </Chip>
          <Chip role="tab" selected={tab === 'past'} onClick={() => setTab('past')}>
            Pasados
          </Chip>
        </div>
      </Section>

      <Section title="OptionCard · ProgressSteps">
        <div className="grid max-w-md gap-3" role="group" aria-label="¿Cómo quieres usar Be Core?">
          <OptionCard
            icon={UsersIcon}
            title="Quiero participar"
            description="Encontrar eventos y apuntarme"
            selected={role === 'participant'}
            onClick={() => setRole('participant')}
          />
          <OptionCard
            icon={CalendarIcon}
            title="Quiero organizar"
            description="Crear eventos y manejar cupos"
            selected={role === 'organizer'}
            onClick={() => setRole('organizer')}
          />
        </div>
        <div className="flex max-w-md flex-col gap-3">
          <ProgressSteps total={5} current={step} />
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setStep((s) => Math.max(1, s - 1))}>
              Atrás
            </Button>
            <Button size="sm" onClick={() => setStep((s) => Math.min(5, s + 1))}>
              Continuar
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Toast">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => toast.success('¡Listo! Tienes tu cupo.')}>
            Éxito
          </Button>
          <Button size="sm" variant="secondary" onClick={() => toast.error('No hay conexión con el servidor')}>
            Error
          </Button>
          <Button size="sm" variant="secondary" onClick={() => toast.info('El check-in abre 2 horas antes.')}>
            Info
          </Button>
        </div>
        <div className="flex max-w-md flex-col gap-2">
          <Toast type="success" message="Vista estática: éxito" />
          <Toast type="error" message="Vista estática: error" onClose={() => {}} />
        </div>
      </Section>

      <Section title="Skeleton · Spinner">
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-48" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Spinner />
        </div>
      </Section>

      <LoadersDemo />

      <Section title="EmptyState · ErrorState">
        <div className="grid gap-4 md:grid-cols-2">
          <EmptyState
            title="Aún no hay eventos por aquí."
            description="¡Crea el primero!"
            action={<Button size="sm">Crear evento</Button>}
          />
          <ErrorState message="No pudimos cargar los eventos" onRetry={() => toast.info('Reintentando…')} />
        </div>
      </Section>

      <Section title="BrandMark · Avatar">
        <div className="flex flex-wrap items-center gap-8">
          <BrandMark size={28} />
          <BrandMark size={52} stacked />
          <BrandMark size={52} wordmark={false} />
          <Avatar name="Camila Restrepo" size="sm" />
          <Avatar name="Camila Restrepo" />
          <Avatar name="Santiago Duque" size="lg" />
        </div>
      </Section>

      <Section title="Badge">
        <div className="flex flex-wrap gap-2">
          {['sport', 'culture', 'recreation', 'other'].map((c) => (
            <Badge key={c} category={c} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(STATUS_BADGES).map((s) => (
            <Badge key={s} status={s} />
          ))}
        </div>
      </Section>

      <Section title="CapacityBar">
        <div className="grid gap-5 md:grid-cols-2">
          <CapacityBar confirmedCount={24} capacity={40} live />
          <CapacityBar confirmedCount={46} capacity={50} />
          <CapacityBar confirmedCount={30} capacity={30} />
          <CapacityBar confirmedCount={0} capacity={12} />
        </div>
      </Section>

      <Section title="Modal">
        <Button variant="secondary" onClick={() => setModalOpen(true)}>
          Abrir diálogo
        </Button>
        <Modal open={modalOpen} title="¿Cancelar tu asistencia?" onClose={() => setModalOpen(false)}>
          <p className="mb-5 text-sm text-ink-muted">Liberarás tu cupo para que otra persona pueda ir.</p>
          <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Mantener cupo
            </Button>
            <Button variant="danger" onClick={() => setModalOpen(false)}>
              Sí, cancelar
            </Button>
          </div>
        </Modal>
      </Section>

      <Section title="NearMeButton · QrCode">
        <GeoQrDemo />
      </Section>

      <Section title="Íconos">
        <IconGrid />
      </Section>
    </div>
  );
}
