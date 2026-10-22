// Compartir un evento (P4). El enlace usa el origen desde el que se abrió la app (en la demo, el túnel HTTPS).
export const eventUrl = (event, origin) => `${origin}/eventos/${event.id}`;

export function shareText(event, url) {
  const when = new Intl.DateTimeFormat('es-CO', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Bogota' }).format(
    new Date(event.startsAt),
  );
  return `¡Vamos a ${event.title}! ${when} en ${event.location}. Confirma aquí: ${url}`;
}

export const whatsappUrl = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`;

// Qué aviso mostrar en /compartir según desde dónde se abrió la app (M1)
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

export function isLocalHost(hostname) {
  return LOCAL_HOSTS.has(hostname) || hostname.endsWith('.localhost');
}

// 'local': el QR solo sirve en este portátil. 'insecure': entra por HTTP (IP de la Wi-Fi): ubicación e
// instalación no funcionan en el celular. null: HTTPS real (modo demo con el túnel).
export function shareWarning({ hostname, isSecure }) {
  if (isLocalHost(hostname)) return 'local';
  if (!isSecure) return 'insecure';
  return null;
}
