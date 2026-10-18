import { describe, it, expect } from 'vitest';
import { publicStatsText } from './public-stats.js';

describe('publicStatsText', () => {
  it('arma el texto con plurales', () => {
    expect(publicStatsText({ eventsThisWeek: 12, confirmedPeople: 48 })).toBe(
      '12 eventos esta semana · 48 personas confirmadas',
    );
    expect(publicStatsText({ eventsThisWeek: 1, confirmedPeople: 1 })).toBe(
      '1 evento esta semana · 1 persona confirmada',
    );
  });

  it('no muestra nada sin datos, con ceros o con valores raros', () => {
    expect(publicStatsText(undefined)).toBeNull();
    expect(publicStatsText({ eventsThisWeek: 0, confirmedPeople: 5 })).toBeNull();
    expect(publicStatsText({ eventsThisWeek: 3, confirmedPeople: 0 })).toBeNull();
    expect(publicStatsText({ eventsThisWeek: '3', confirmedPeople: 2 })).toBeNull();
  });
});
