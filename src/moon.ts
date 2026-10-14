// The Moon's phase by date, from the mean length of the lunar month. It can be off by up to a
// day against the true phase, which is close enough for naming the phase and its brightness.

const SYNODIC_DAYS = 29.530588853;
// A new moon: 6 January 2000, 18:14 UTC.
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const DAY_MS = 24 * 60 * 60 * 1000;

const PHASE_NAMES = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
];

export type MoonPhase = {
  name: string;
  /** Days since the last new moon. */
  ageDays: number;
  /** Share of the face lit, 0..100. */
  illumination: number;
  /** Which of the icon font's 28 phase glyphs, from new moon (0) round to the last crescent (27). */
  glyph: number;
};

// Noon on the date, so the phase is the one for the middle of the day.
function noon(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day, 12);
}

/** The Moon's phase on a date given as "YYYY-MM-DD". */
export function moonPhase(date: string): MoonPhase {
  const cycles = (noon(date) - KNOWN_NEW_MOON) / DAY_MS / SYNODIC_DAYS;
  const fraction = cycles - Math.floor(cycles);
  return {
    // The quarters and the new and full moon are single days; the eighths between them are spans.
    name: PHASE_NAMES[Math.round(fraction * 8) % 8],
    ageDays: fraction * SYNODIC_DAYS,
    illumination: Math.round(((1 - Math.cos(2 * Math.PI * fraction)) / 2) * 100),
    glyph: Math.round(fraction * 28) % 28,
  };
}

/** The next date after the given one, as "YYYY-MM-DD", on which the moon is full. */
export function nextFullMoon(date: string) {
  const cycles = (noon(date) - KNOWN_NEW_MOON) / DAY_MS / SYNODIC_DAYS;
  const nextFull = Math.floor(cycles - 0.5) + 1.5;
  return new Date(KNOWN_NEW_MOON + nextFull * SYNODIC_DAYS * DAY_MS).toISOString().slice(0, 10);
}
