import { BellIcon, CalendarIcon, ClockIcon, HomeIcon, PlusIcon, UserIcon } from '../components/icons/index.js';

// Navegación por rol (skill becore-ui, "Navegación"). Sin ítems de mapa (fuera de alcance).
// Provisional hasta R5/R7/R8: Inicio del participante sigue en /eventos (futuro /descubre);
// "Mis eventos" del organizador lleva a /eventos, y "Crear evento" va en la cabecera móvil.

export const MOBILE_TABS = {
  participant: [
    { to: '/eventos', label: 'Inicio', Icon: HomeIcon },
    { to: '/mis-eventos', label: 'Mis eventos', Icon: CalendarIcon },
    { to: '/avisos', label: 'Avisos', Icon: BellIcon, notifications: true },
    { to: '/perfil', label: 'Perfil', Icon: UserIcon },
  ],
  organizer: [
    { to: '/panel', label: 'Inicio', Icon: HomeIcon },
    { to: '/eventos', label: 'Mis eventos', Icon: CalendarIcon },
    { to: '/avisos', label: 'Avisos', Icon: BellIcon, notifications: true },
    { to: '/perfil', label: 'Perfil', Icon: UserIcon },
  ],
};

// Barra superior del participante en escritorio (desktop-descubre.html, sin "Mapa")
export const TOP_BAR_LINKS = [
  { to: '/eventos', label: 'Descubre' },
  { to: '/mis-eventos', label: 'Mis eventos' },
  { to: '/citas', label: 'Citas' },
  { to: '/avisos', label: 'Notificaciones' },
];

// Barra lateral del organizador (desktop-panel-organizador.html, sin "Mapa en vivo";
// "Participantes" y "Configuración" se agregan cuando exista su página)
export const SIDEBAR_LINKS = [
  { to: '/panel', label: 'Panel' },
  { to: '/eventos', label: 'Eventos' },
  { to: '/citas', label: 'Citas' },
  { to: '/avisos', label: 'Notificaciones' },
  { to: '/perfil', label: 'Perfil' },
];

// Accesos que en móvil no tienen pestaña propia: van como botones en la cabecera
export const MOBILE_HEADER_ACTIONS = {
  participant: [{ to: '/citas', label: 'Citas', Icon: ClockIcon }],
  organizer: [
    { to: '/citas', label: 'Citas', Icon: ClockIcon },
    { to: '/eventos/nuevo', label: 'Crear evento', Icon: PlusIcon },
  ],
};
