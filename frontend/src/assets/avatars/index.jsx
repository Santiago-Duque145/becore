// 12 avatares predefinidos de Be Core: personas estilizadas, estilo plano y paleta de la marca
// (turquesa, verde, naranja, amarillo sobre azul profundo). Mismos ids que
// backend/src/constants/avatars.js y que el check profiles_avatar_preset_check; avatars.test.js los compara.

const SKIN = ['#F2C9A5', '#E0A982', '#C68B62', '#A0694A', '#7A4B33', '#5A3828'];
const NAVY = '#0D1B2A';

// Cada avatar: fondo, tono de piel, cabello (color + estilo), camiseta y un detalle
export const AVATAR_PRESETS = [
  { id: 'goleador', label: 'Goleador', bg: '#14B8A6', skin: SKIN[2], hair: '#1F2937', style: 'short', shirt: '#F97316', detail: 'ball' },
  { id: 'corredora', label: 'Corredora', bg: '#F97316', skin: SKIN[1], hair: '#3B2418', style: 'ponytail', shirt: '#14B8A6', detail: 'headband' },
  { id: 'ciclista', label: 'Ciclista', bg: '#10B981', skin: SKIN[0], hair: '#6B3F1D', style: 'cap', shirt: '#FACC15', detail: 'none' },
  { id: 'nadador', label: 'Nadador', bg: '#38BDF8', skin: SKIN[3], hair: '#111827', style: 'bald', shirt: '#0D1B2A', detail: 'goggles' },
  { id: 'bailarina', label: 'Bailarina', bg: '#FACC15', skin: SKIN[4], hair: '#111827', style: 'bun', shirt: '#F97316', detail: 'flower' },
  { id: 'guitarrista', label: 'Guitarrista', bg: '#A78BFA', skin: SKIN[1], hair: '#92400E', style: 'long', shirt: '#14B8A6', detail: 'headphones' },
  { id: 'pintor', label: 'Pintor', bg: '#F97316', skin: SKIN[0], hair: '#B45309', style: 'curly', shirt: '#10B981', detail: 'glasses' },
  { id: 'fotografa', label: 'Fotógrafa', bg: '#14B8A6', skin: SKIN[3], hair: '#1F2937', style: 'bob', shirt: '#FACC15', detail: 'glasses' },
  { id: 'lectora', label: 'Lectora', bg: '#10B981', skin: SKIN[2], hair: '#4B2E1E', style: 'long', shirt: '#A78BFA', detail: 'glasses' },
  { id: 'jardinero', label: 'Jardinero', bg: '#FACC15', skin: SKIN[5], hair: '#111827', style: 'curly', shirt: '#10B981', detail: 'cap' },
  { id: 'ajedrecista', label: 'Ajedrecista', bg: '#38BDF8', skin: SKIN[0], hair: '#9CA3AF', style: 'short', shirt: '#0D1B2A', detail: 'glasses' },
  { id: 'actriz', label: 'Actriz', bg: '#A78BFA', skin: SKIN[2], hair: '#7C2D12', style: 'bob', shirt: '#F97316', detail: 'flower' },
];

export const AVATAR_PRESET_IDS = AVATAR_PRESETS.map((p) => p.id);

function Hair({ style, color }) {
  switch (style) {
    case 'bald':
      return null;
    case 'long':
      return <path d="M20 30c0-11 6-16 12-16s12 5 12 16v14c-2-2-3-6-3-11H23c0 5-1 9-3 11V30z" fill={color} />;
    case 'bob':
      return <path d="M20 31c0-11 5-16 12-16s12 5 12 16v8h-5v-9H25v9h-5v-8z" fill={color} />;
    case 'bun':
      return (
        <>
          <circle cx="32" cy="12" r="5" fill={color} />
          <path d="M21 29c0-8 5-12 11-12s11 4 11 12c-4-4-8-5-11-5s-7 1-11 5z" fill={color} />
        </>
      );
    case 'ponytail':
      return (
        <>
          <path d="M21 29c0-8 5-12 11-12s11 4 11 12c-4-4-8-5-11-5s-7 1-11 5z" fill={color} />
          <path d="M43 24c6 2 7 9 4 15-1-5-3-8-6-9z" fill={color} />
        </>
      );
    case 'curly':
      return (
        <>
          <circle cx="24" cy="23" r="5" fill={color} />
          <circle cx="32" cy="19" r="6" fill={color} />
          <circle cx="40" cy="23" r="5" fill={color} />
          <circle cx="21" cy="30" r="3.5" fill={color} />
          <circle cx="43" cy="30" r="3.5" fill={color} />
        </>
      );
    case 'cap':
      return <path d="M21 28c0-8 5-12 11-12s11 4 11 12c-4-3-8-4-11-4s-7 1-11 4z" fill={color} />;
    default: // short
      return <path d="M21 30c0-9 5-13 11-13s11 4 11 13c-3-5-7-6-11-6s-8 1-11 6z" fill={color} />;
  }
}

function Detail({ detail, shirt }) {
  switch (detail) {
    case 'glasses':
      return (
        <g fill="none" stroke={NAVY} strokeWidth="1.6">
          <circle cx="27.5" cy="33" r="3.6" />
          <circle cx="36.5" cy="33" r="3.6" />
          <path d="M31 33h2" />
        </g>
      );
    case 'goggles':
      return <path d="M22 31.5h20v4H22z" fill="#38BDF8" opacity=".85" />;
    case 'headphones':
      return (
        <g fill="none" stroke={NAVY} strokeWidth="2.2" strokeLinecap="round">
          <path d="M21 33v-3c0-8 5-12 11-12s11 4 11 12v3" />
          <rect x="18.5" y="32" width="5" height="8" rx="2.2" fill={NAVY} stroke="none" />
          <rect x="40.5" y="32" width="5" height="8" rx="2.2" fill={NAVY} stroke="none" />
        </g>
      );
    case 'headband':
      return <path d="M21 26.5c6-3 16-3 22 0v3c-6-3-16-3-22 0z" fill="#FACC15" />;
    case 'flower':
      return (
        <g transform="translate(41 22)">
          {[0, 72, 144, 216, 288].map((r) => (
            <ellipse key={r} cx="0" cy="-3" rx="2" ry="3" fill="#FFFFFF" transform={`rotate(${r})`} />
          ))}
          <circle r="1.6" fill="#F97316" />
        </g>
      );
    case 'cap':
      return (
        <g fill="#FACC15">
          <path d="M21 27c0-6 5-10 11-10s11 4 11 10z" />
          <path d="M40 27h9c0 2-2 3-5 3h-4z" />
        </g>
      );
    case 'ball':
      return (
        <g transform="translate(46 50)">
          <circle r="7" fill="#FFFFFF" stroke={NAVY} strokeWidth="1.4" />
          <path d="M0-3l3 2-1 3.5h-4l-1-3.5z" fill={NAVY} />
        </g>
      );
    default:
      return <path d="M27 49c2 2 8 2 10 0" stroke={shirt} strokeWidth="0" fill="none" />;
  }
}

// Dibuja un avatar predefinido dentro de un contenedor redondo (el recorte lo hace el contenedor)
export function PresetAvatarSvg({ id, className }) {
  const p = AVATAR_PRESETS.find((a) => a.id === id);
  if (!p) return null;
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <rect width="64" height="64" fill={p.bg} />
      <path d="M8 64c0-12 9-18 24-18s24 6 24 18z" fill={p.shirt} />
      <rect x="28" y="38" width="8" height="9" rx="3" fill={p.skin} />
      <ellipse cx="32" cy="31" rx="10.5" ry="12" fill={p.skin} />
      <Hair style={p.style} color={p.hair} />
      <circle cx="27.8" cy="32.5" r="1.2" fill={NAVY} />
      <circle cx="36.2" cy="32.5" r="1.2" fill={NAVY} />
      <path d="M28.5 38c2 1.8 5 1.8 7 0" fill="none" stroke={NAVY} strokeWidth="1.4" strokeLinecap="round" />
      <Detail detail={p.detail} shirt={p.shirt} />
    </svg>
  );
}
