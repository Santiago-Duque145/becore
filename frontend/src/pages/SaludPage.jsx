import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export default function SaludPage() {
  const [status, setStatus] = useState('cargando...');

  useEffect(() => {
    api.get('/health')
      .then(({ data }) => setStatus(data.status))
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-gray-200 font-display text-xl mb-2">Estado de la API</h1>
      <p className="text-teal-500 font-mono text-lg">{status}</p>
    </div>
  );
}
