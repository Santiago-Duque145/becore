import { createIcon } from './create-icon.jsx';

// Trazos tomados de docs/mockups/ cuando el ícono aparece allí.
export const HomeIcon = createIcon('HomeIcon', [
  ['path', { d: 'M3 11l9-8 9 8' }],
  ['path', { d: 'M5 10v10h14V10' }],
]);

export const CalendarIcon = createIcon('CalendarIcon', [
  ['rect', { x: 3, y: 5, width: 18, height: 16, rx: 2 }],
  ['path', { d: 'M3 10h18M8 3v4M16 3v4' }],
]);

export const BellIcon = createIcon('BellIcon', [
  ['path', { d: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9' }],
  ['path', { d: 'M13.7 21a2 2 0 01-3.4 0' }],
]);

export const UserIcon = createIcon('UserIcon', [
  ['circle', { cx: 12, cy: 8, r: 4 }],
  ['path', { d: 'M4 21c1.5-4.5 5-6 8-6s6.5 1.5 8 6' }],
]);

export const SearchIcon = createIcon('SearchIcon', [
  ['circle', { cx: 11, cy: 11, r: 7 }],
  ['path', { d: 'M21 21l-4.3-4.3' }],
]);

export const ClockIcon = createIcon('ClockIcon', [
  ['circle', { cx: 12, cy: 12, r: 9 }],
  ['path', { d: 'M12 7v5l3 2' }],
]);

export const MapPinIcon = createIcon('MapPinIcon', [
  ['path', { d: 'M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z' }],
  ['circle', { cx: 12, cy: 9, r: 2.5 }],
]);

export const UsersIcon = createIcon('UsersIcon', [
  ['circle', { cx: 9, cy: 8, r: 4 }],
  ['path', { d: 'M2 21c1-4 4-6 7-6s6 2 7 6' }],
  ['path', { d: 'M16 4.1a4 4 0 010 7.8' }],
  ['path', { d: 'M22 21c-.6-2.6-2-4.4-4-5.3' }],
]);

export const PlusIcon = createIcon('PlusIcon', [['path', { d: 'M12 5v14M5 12h14' }]]);

export const CheckIcon = createIcon('CheckIcon', [['path', { d: 'M20 6L9 17l-5-5' }]]);

export const ChevronLeftIcon = createIcon('ChevronLeftIcon', [['path', { d: 'M15 18l-6-6 6-6' }]]);

export const ChevronRightIcon = createIcon('ChevronRightIcon', [['path', { d: 'M9 18l6-6-6-6' }]]);

export const EyeIcon = createIcon('EyeIcon', [
  ['path', { d: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z' }],
  ['circle', { cx: 12, cy: 12, r: 3 }],
]);

export const EyeOffIcon = createIcon('EyeOffIcon', [
  ['path', { d: 'M3 3l18 18' }],
  ['path', { d: 'M10.6 5.1A10 10 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4.2' }],
  ['path', { d: 'M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7c1.7 0 3.2-.4 4.5-1.1' }],
  ['path', { d: 'M9.9 9.9a3 3 0 004.2 4.2' }],
]);

export const LogOutIcon = createIcon('LogOutIcon', [
  ['path', { d: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4' }],
  ['path', { d: 'M16 17l5-5-5-5' }],
  ['path', { d: 'M21 12H9' }],
]);

export const SettingsIcon = createIcon('SettingsIcon', [
  ['circle', { cx: 12, cy: 12, r: 3 }],
  ['path', { d: 'M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1' }],
]);

// Adicionales que ya usan las páginas actuales (reemplazan a lucide-react)
export const XIcon = createIcon('XIcon', [['path', { d: 'M18 6L6 18M6 6l12 12' }]]);

export const TrashIcon = createIcon('TrashIcon', [
  ['path', { d: 'M3 6h18' }],
  ['path', { d: 'M8 6V4h8v2' }],
  ['path', { d: 'M19 6l-1 14H6L5 6' }],
  ['path', { d: 'M10 11v6M14 11v6' }],
]);

export const LoaderIcon = createIcon('LoaderIcon', [['path', { d: 'M21 12a9 9 0 11-9-9' }]]);

export const AlertCircleIcon = createIcon('AlertCircleIcon', [
  ['circle', { cx: 12, cy: 12, r: 9 }],
  ['path', { d: 'M12 8v4M12 16h.01' }],
]);

export const InfoIcon = createIcon('InfoIcon', [
  ['circle', { cx: 12, cy: 12, r: 9 }],
  ['path', { d: 'M12 11v5M12 8h.01' }],
]);

// Portadas de evento por categoría (sin fotos externas): deporte, cultura, recreación y otros
export const TrophyIcon = createIcon('TrophyIcon', [
  ['path', { d: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z' }],
  ['path', { d: 'M17 6h2a2 2 0 010 4h-2M7 6H5a2 2 0 000 4h2' }],
]);

export const MusicIcon = createIcon('MusicIcon', [
  ['path', { d: 'M9 18V5l12-2v13' }],
  ['circle', { cx: 6, cy: 18, r: 3 }],
  ['circle', { cx: 18, cy: 16, r: 3 }],
]);

export const TreeIcon = createIcon('TreeIcon', [
  ['path', { d: 'M12 3l6 8h-3l4 6H5l4-6H6l6-8z' }],
  ['path', { d: 'M12 17v4' }],
]);

export const SparklesIcon = createIcon('SparklesIcon', [
  ['path', { d: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z' }],
  ['path', { d: 'M19 17v4M17 19h4' }],
]);

// Estrella de calificación (P2); se rellena con fill="currentColor" cuando está activa
export const StarIcon = createIcon('StarIcon', [
  ['path', { d: 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9L12 2.5z' }],
]);

export const MinusIcon =createIcon('MinusIcon', [['path', { d: 'M5 12h14' }]]);

// M1: compartir la app con QR y ubicación del dispositivo
export const QrCodeIcon = createIcon('QrCodeIcon', [
  ['rect', { x: 3, y: 3, width: 7, height: 7, rx: 1 }],
  ['rect', { x: 14, y: 3, width: 7, height: 7, rx: 1 }],
  ['rect', { x: 3, y: 14, width: 7, height: 7, rx: 1 }],
  ['path', { d: 'M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3' }],
]);

export const CopyIcon = createIcon('CopyIcon', [
  ['rect', { x: 9, y: 9, width: 12, height: 12, rx: 2 }],
  ['path', { d: 'M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1' }],
]);

export const NavigationIcon = createIcon('NavigationIcon', [['path', { d: 'M3 11l19-9-9 19-2-8-8-2z' }]]);

export const ShareIcon = createIcon('ShareIcon', [
  ['circle', { cx: 18, cy: 5, r: 3 }],
  ['circle', { cx: 6, cy: 12, r: 3 }],
  ['circle', { cx: 18, cy: 19, r: 3 }],
  ['path', { d: 'M8.6 13.5l6.8 4M15.4 6.5l-6.8 4' }],
]);
