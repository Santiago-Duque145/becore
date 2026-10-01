import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 px-6 text-center">
      <p className="text-6xl font-display font-bold text-teal-500">404</p>
      <p className="text-gray-200 text-lg">No encontramos esta página.</p>
      <Link to="/eventos" className="text-teal-500 underline">
        Volver a eventos
      </Link>
    </div>
  );
}
