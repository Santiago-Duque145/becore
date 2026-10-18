import { useEffect, useId, useState } from 'react';
import { Link, useParams } from 'react-router';
import { CheckIcon, ChevronLeftIcon } from '../../components/icons/index.js';
import { StarRating } from '../../components/events/StarRating.jsx';
import { Button, Chip, EmptyState, ErrorState, LinkButton, Skeleton, Textarea } from '../../components/ui/index.js';
import { RATING_COMMENT_MAX, RATING_TAGS, STAR_LABELS } from '../../constants/ratings.js';
import { useEvent } from '../../hooks/useEvent.js';
import { useMyRating, useSubmitRating } from '../../hooks/useRatings.js';
import { canRateEvent, RATING_ERRORS } from '../../lib/ratings.js';

function ThanksScreen({ eventId, stars }) {
  return (
    <div className="mx-auto flex max-w-[420px] flex-col items-center gap-3 pt-10 text-center" role="status">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
        <CheckIcon size={28} />
      </span>
      <h1 className="font-display text-[21px] font-semibold text-ink">¡Gracias por tu calificación!</h1>
      <p className="text-[13px] text-ink-muted">
        Le diste {stars} de 5 al evento. Tu opinión ayuda a que los próximos salgan mejor.
      </p>
      <div className="mt-3 flex flex-col gap-2.5 self-stretch">
        <LinkButton to={`/eventos/${eventId}`} variant="secondary">
          Volver al evento
        </LinkButton>
        <LinkButton to="/descubre" variant="ghost">
          Ver más eventos
        </LinkButton>
      </div>
    </div>
  );
}

// /eventos/:id/calificar: estrellas, etiquetas y comentario opcional. Si ya calificó, edita.
export default function CalificarEventoPage() {
  const { id } = useParams();
  const labelId = useId();
  const event = useEvent(id);
  const eligible = canRateEvent(event.data);
  const mine = useMyRating(id, { enabled: eligible });
  const submit = useSubmitRating(id, { isEdit: Boolean(mine.data) });

  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState([]);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState('');

  // Precarga mi calificación anterior para editarla
  useEffect(() => {
    if (!mine.data) return;
    setStars(mine.data.stars);
    setTags(mine.data.tags);
    setComment(mine.data.comment ?? '');
  }, [mine.data]);

  if (event.isPending || (eligible && mine.isPending)) {
    return (
      <div className="mx-auto flex max-w-[420px] flex-col gap-4" aria-busy="true">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-14" />
        <Skeleton className="h-24" />
      </div>
    );
  }
  if (event.isError) {
    return event.error.code === 'EVENT_NOT_FOUND' ? (
      <EmptyState title="No encontramos este evento" description="Puede que el enlace esté mal." />
    ) : (
      <ErrorState message={event.error.message} onRetry={event.refetch} />
    );
  }
  if (sent) return <ThanksScreen eventId={id} stars={stars} />;

  if (!eligible) {
    const reason =
      event.data.status !== 'finished'
        ? RATING_ERRORS.EVENT_NOT_FINISHED
        : !event.data.myAttendance?.checkedIn
          ? RATING_ERRORS.NOT_ATTENDED
          : RATING_ERRORS.RATING_WINDOW_CLOSED;
    return (
      <EmptyState
        title="Por ahora no puedes calificar"
        description={reason}
        action={
          <LinkButton to={`/eventos/${id}`} variant="secondary" size="sm">
            Volver al evento
          </LinkButton>
        }
      />
    );
  }

  function toggleTag(slug) {
    setTags((current) => (current.includes(slug) ? current.filter((t) => t !== slug) : [...current, slug]));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!stars) {
      setFormError('Elige de 1 a 5 estrellas');
      return;
    }
    setFormError('');
    submit.mutate(
      { stars, tags, comment: comment.trim() || null },
      {
        onSuccess: () => setSent(true),
        onError: (error) => setFormError(RATING_ERRORS[error.code] ?? error.message),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-[420px] flex-col gap-5" noValidate>
      <Link
        to={`/eventos/${id}`}
        className="focus-ring -ml-1 inline-flex w-fit items-center gap-1 rounded text-xs font-semibold text-ink-muted hover:text-ink"
      >
        <ChevronLeftIcon size={16} /> Volver al evento
      </Link>

      <header className="text-center">
        <h1 id={labelId} className="font-display text-[21px] font-semibold text-ink">
          ¿Cómo estuvo {event.data.title}?
        </h1>
        <p className="mt-1 text-[13px] text-ink-muted">{mine.data ? 'Puedes editar tu calificación.' : 'Cuéntanos qué tal te fue.'}</p>
      </header>

      <div>
        <StarRating value={stars} onChange={setStars} aria-labelledby={labelId} />
        <p className="mt-1.5 h-4 text-center text-xs font-semibold text-culture" aria-live="polite">
          {stars ? STAR_LABELS[stars - 1] : ''}
        </p>
      </div>

      <fieldset>
        <legend className="mb-2.5 text-xs font-semibold text-ink-muted">¿Qué destacas? (opcional)</legend>
        <div className="flex flex-wrap gap-2">
          {RATING_TAGS.map(({ slug, label }) => (
            <Chip key={slug} selected={tags.includes(slug)} onClick={() => toggleTag(slug)}>
              {label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <Textarea
        label="Comentario (opcional)"
        hint={`${comment.length}/${RATING_COMMENT_MAX}`}
        value={comment}
        maxLength={RATING_COMMENT_MAX}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
      />

      {formError && (
        <p role="alert" className="text-center text-xs font-medium text-danger">
          {formError}
        </p>
      )}

      <Button type="submit" loading={submit.isPending}>
        {mine.data ? 'Guardar cambios' : 'Enviar calificación'}
      </Button>
    </form>
  );
}
