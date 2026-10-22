import { Link } from 'react-router';
import { BrandMark } from '../components/ui/index.js';

// Política de tratamiento de datos (pública: se lee antes de crear la cuenta). Texto corto, sin jerga.
// Si cambia lo que se hace con los datos, este texto cambia primero.
const SECTIONS = [
  {
    title: 'Qué datos recogemos',
    body: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Tu nombre y tu correo, para crear tu cuenta y avisarte de tus eventos.</li>
        <li>Tus gustos (deportes, cultura, horarios, zona), para recomendarte planes.</li>
        <li>Tu sexo y tu rango de edad, solo si quieres contarlos. Son opcionales.</li>
        <li>Las calificaciones que des a los eventos.</li>
      </ul>
    ),
  },
  {
    title: 'Para qué los usamos',
    body: (
      <p>
        Para organizar eventos, recomendarte los que encajan contigo y sacar estadísticas anónimas para el proyecto de
        grado. Tu sexo y tu edad solo entran en esas estadísticas: no cambian lo que te recomendamos.
      </p>
    ),
  },
  {
    title: 'Tu ubicación',
    body: (
      <p>
        Solo la pedimos si tocas «Ver eventos cerca de mí», para calcular a qué distancia queda cada evento. Ese cálculo
        se hace en tu celular: tu ubicación nunca se envía a nuestro servidor ni se guarda.
      </p>
    ),
  },
  {
    title: 'Inteligencia artificial',
    body: (
      <p>
        Para recomendarte eventos usamos IA: Gemini, de Google, en su capa gratuita. En esa capa Google puede usar lo que
        le enviamos para mejorar sus productos. Por eso solo le enviamos tus gustos (lo que elegiste en el cuestionario:
        planes, días, horarios, qué buscas y tu zona), los textos de los eventos (título, descripción y lugar) y lo que
        escribes en el buscador de Descubre, sin correos ni teléfonos y sin decir quién lo escribió. Nunca datos
        personales: ni tu nombre, ni tu correo, ni tu sexo, ni tu edad.
      </p>
    ),
  },
  {
    title: 'Cómo pedir que borremos tus datos',
    body: (
      <p>
        Escríbenos al correo del proyecto, <span className="font-semibold text-ink">becore.app@gmail.com</span>, y
        eliminamos tu cuenta y tus datos.
      </p>
    ),
  },
  {
    title: 'Quiénes somos',
    body: (
      <p>
        Be Core es un proyecto académico de la Universidad Católica Luis Amigó (Medellín). Tratamos tus datos según la
        Ley 1581 de 2012 de protección de datos personales de Colombia.
      </p>
    ),
  },
];

export default function PrivacidadPage() {
  return (
    <div className="min-h-dvh bg-bg">
      <main className="mx-auto w-full max-w-2xl px-[22px] pt-safe pb-16">
        <header className="py-6">
          <BrandMark />
        </header>

        <h1 className="font-display text-2xl font-semibold text-ink">Política de tratamiento de datos personales</h1>
        <p className="mt-2 text-[13px] text-ink-muted">En corto: te pedimos poco, lo usamos para lo que dijimos y lo borramos si nos lo pides.</p>

        <div className="mt-8 flex flex-col gap-6">
          {SECTIONS.map(({ title, body }) => (
            <section key={title} className="rounded-card border border-line bg-panel p-5">
              <h2 className="mb-2 font-display text-base font-semibold text-ink">{title}</h2>
              <div className="text-sm leading-6 text-ink-muted">{body}</div>
            </section>
          ))}
        </div>

        <Link
          to="/registro"
          className="focus-ring mt-8 inline-flex min-h-11 items-center rounded-field text-sm font-semibold text-accent underline"
        >
          Volver
        </Link>
      </main>
    </div>
  );
}
