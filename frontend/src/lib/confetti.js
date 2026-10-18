// Piezas del confeti del final del onboarding (P1): 24 piezas con los colores de la marca, repartidas en círculo
// alrededor del check con un sesgo hacia arriba. Deterministas (sin Math.random) para que cada render sea igual.
export const CONFETTI_COLORS = ['bg-accent', 'bg-success', 'bg-action', 'bg-culture', 'bg-accent-soft'];
export const CONFETTI_COUNT = 24;
export const CONFETTI_MAX_DELAY_MS = 100;

export function confettiPieces(count = CONFETTI_COUNT) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 2 * Math.PI + (i % 3) * 0.12;
    const distance = 70 + ((i * 37) % 60);
    return {
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      round: i % 4 === 0,
      x: Math.round(Math.cos(angle) * distance * 1.3),
      y: Math.round(Math.sin(angle) * distance - 50),
      rotate: 180 + ((i * 137) % 360),
      delayMs: (i % 5) * (CONFETTI_MAX_DELAY_MS / 4),
    };
  });
}
