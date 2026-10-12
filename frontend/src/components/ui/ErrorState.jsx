import { forwardRef } from 'react';
import { Button } from './Button.jsx';
import { EmptyState } from './EmptyState.jsx';

// Error de red o de carga: mensaje + "Reintentar" (skill §4, Carga y feedback)
export const ErrorState = forwardRef(function ErrorState(
  { title = 'Algo salió mal', message = 'No pudimos cargar la información', onRetry, ...props },
  ref,
) {
  return (
    <EmptyState
      ref={ref}
      variant="error"
      title={title}
      description={message}
      action={
        onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Reintentar
          </Button>
        )
      }
      {...props}
    />
  );
});
