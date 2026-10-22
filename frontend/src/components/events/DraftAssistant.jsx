import { useId, useState } from 'react';
import { useEventDraft } from '../../hooks/useEvent.js';
import { draftUnavailableMessage } from '../../lib/draft-values.js';
import { SparklesIcon } from '../icons/index.js';
import { BrandLoader, Button, Textarea } from '../ui/index.js';

const TEXT_MIN = 10;
const TEXT_MAX = 500;

// IA8 · "Describe tu evento en una frase": la IA propone el borrador y el formulario se rellena. Nada se publica solo.
// onDraft(draft) aplica el borrador al formulario; onUndo vuelve a los valores de antes.
export function DraftAssistant({ onDraft, onUndo, canUndo }) {
  const titleId = useId();
  const draftMutation = useEventDraft();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null); // { tone: 'ok' | 'info', message }
  const loading = draftMutation.isPending;

  async function generate() {
    const phrase = text.trim();
    if (phrase.length < TEXT_MIN) return setError('Cuéntanos un poco más: escribe al menos 10 caracteres.');
    setError('');
    setNotice(null);
    try {
      const { draft, reason } = await draftMutation.mutateAsync(phrase);
      if (draft) {
        onDraft(draft);
        setNotice({ tone: 'ok', message: 'Revisa antes de publicar: la IA puede equivocarse.' });
      } else {
        setNotice({ tone: 'info', message: draftUnavailableMessage(reason) });
      }
    } catch (apiError) {
      setNotice({ tone: 'info', message: apiError.message });
    }
  }

  return (
    <section aria-labelledby={titleId} className="mb-6 rounded-card border border-accent/20 bg-accent/10 p-4">
      <h2 id={titleId} className="mb-3 flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
        <SparklesIcon size={18} className="shrink-0 text-accent-soft" aria-hidden="true" />
        Describe tu evento en una frase
      </h2>
      <Textarea
        label="Tu idea"
        rows={3}
        maxLength={TEXT_MAX}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ej.: micro el sábado en la tarde en Belén para 12 personas, nivel principiante"
        hint={`${text.length} / ${TEXT_MAX}`}
        error={error}
        disabled={loading}
      />
      {loading ? (
        <BrandLoader size="sm" message="Armando tu borrador…" className="mt-4" />
      ) : (
        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center">
          <Button variant="secondary" onClick={generate} className="md:w-auto">
            <SparklesIcon size={16} aria-hidden="true" />
            Crear borrador con IA
          </Button>
          {canUndo && (
            <Button variant="ghost" onClick={onUndo}>
              Deshacer
            </Button>
          )}
        </div>
      )}
      {notice && !loading && !(notice.tone === 'ok' && !canUndo) && (
        <p role="status" className={`mt-3 text-xs ${notice.tone === 'ok' ? 'font-medium text-accent-soft' : 'text-ink-muted'}`}>
          {notice.message}
        </p>
      )}
    </section>
  );
}
