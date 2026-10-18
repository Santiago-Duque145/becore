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
