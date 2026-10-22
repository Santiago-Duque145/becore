import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { OtpInput } from './OtpInput.jsx';

const html = (props) => renderToStaticMarkup(<OtpInput value="" onChange={() => {}} {...props} />);

describe('OtpInput (marcado)', () => {
  it('son 6 casillas numéricas con autocompletado de código', () => {
    const markup = html({});
    expect(markup.match(/<input/g)).toHaveLength(6);
    expect(markup.match(/inputMode="numeric"/g)).toHaveLength(6);
    expect(markup.match(/autoComplete="one-time-code"/g)).toHaveLength(6);
  });

  it('un único nombre para el grupo y un aria-label por dígito', () => {
    const markup = html({});
    expect(markup).toContain('role="group"');
    expect(markup).toMatch(/aria-labelledby="[^"]+"/);
    expect(markup).toContain('Código de verificación');
    expect(markup).toContain('aria-label="Dígito 1 de 6"');
    expect(markup).toContain('aria-label="Dígito 6 de 6"');
  });

  it('muestra los dígitos recibidos y marca el error', () => {
    const markup = html({ value: '123', invalid: true });
    expect(markup).toContain('value="1"');
    expect(markup).toContain('value="3"');
    expect(markup.match(/aria-invalid="true"/g)).toHaveLength(6);
  });

  it('se deshabilita completo mientras verifica', () =>
    expect(html({ disabled: true }).match(/disabled=""/g)).toHaveLength(6));
});
