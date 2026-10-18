import { BellIcon, CalendarIcon, ClockIcon, HomeIcon, PlusIcon, QrCodeIcon, UserIcon } from '../components/icons/index.js';

// Navegación por rol (skill becore-ui, "Navegación"). Sin ítems de mapa (fuera de alcance).
// Provisional hasta R7/R8: "Mis eventos" del organizador lleva a /descubre, y "Crear evento" va en la
// cabecera móvil.

// Inicio por rol, destino por defecto después de entrar (auth-onboarding §4)
export function homePathFor(role) {
  return role === 'organizer' ? '/panel' : '/descubre';
}

export const MOBILE_TABS = {
  participant: [
    { to: '/descubre', label: 'Inicio', Icon: HomeIcon },
    { to: '/mis-eventos', label: 'Mis eventos', Icon: CalendarIcon },
    { to: '/avisos', label: 'Avisos', Icon: BellIcon, notifications: true },
    { to: '/perfil', label: 'Perfil', Icon: UserIcon },
  ],
  organizer: [
    { to: '/panel', label: 'Inicio', Icon: HomeIcon },
    { to: '/descubre', label: 'Mis eventos', Icon: CalendarIcon },
    { to: '/avisos', label: 'Avisos', Icon: BellIcon, notifications: true },
    { to: '/perfil', label: 'Perfil', Icon: UserIcon },
  ],
};

// Barra superior del participante en escritorio (desktop-descubre.html, sin "Mapa")
export const TOP_BAR_LINKS = [
  { to: '/descubre', label: 'Descubre' },
  { to: '/mis-eventos', label: 'Mis eventos' },
  { to: '/citas', label: 'Citas' },
  { to: '/avisos', label: 'Notificaciones' },
];

// Barra lateral del organizador (desktop-panel-organizador.html, sin "Mapa en vivo";
// "Participantes" y "Configuración" se agregan cuando exista su página)
export const SIDEBAR_LINKS = [
  { to: '/panel', label: 'Panel' },
  { to: '/descubre', label: 'Eventos' },
  { to: '/citas', label: 'Citas' },
  { to: '/avisos', label: 'Notificaciones' },
  { to: '/compartir', label: 'Compartir' },
  { to: '/perfil', label: 'Perfil' },
];

// Accesos que en móvil no tienen pestaña propia: van como botones en la cabecera
export const MOBILE_HEADER_ACTIONS = {
  participant: [{ to: '/citas', label: 'Citas', Icon: ClockIcon }],
  organizer: [
    { to: '/citas', label: 'Citas', Icon: ClockIcon },
    { to: '/compartir', label: 'Compartir la app', Icon: QrCodeIcon },
    { to: '/eventos/nuevo', label: 'Crear evento', Icon: PlusIcon },
  ],
};
