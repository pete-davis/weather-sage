export const Palette = {
  // The bottom of SkyGradient, shown wherever the gradient is not drawn.
  background: '#022063',
  // Header bars and cards are see-through navy, so the sky shows behind them while white text on
  // them stays readable even against the light blue at the top.
  header: 'rgba(1, 12, 38, 0.55)',
  // What the header looks like over the top of the sky, solid, for the menu that drops from it:
  // a see-through menu would show the forecast behind its items.
  headerSolid: '#064D84',
  card: 'rgba(2, 18, 52, 0.5)',
  // Solid near-black, for text on light backgrounds and for surfaces that must hide what is behind them.
  ink: '#020F1D',
  text: '#FFFFFF',
  textMuted: '#B4CBE0',
  rain: '#7FB8FF',
  sun: '#FFCF33',
  cloud: '#D5DEE8',
  storm: '#C58BFF',
  heavyRain: '#C97A1E',
};

/**
 * The app icon's sky, light blue at the top deepening to navy at the bottom, sampled from icon.png.
 * The native splash in app.json can only be one colour, so it uses the middle one, where the artwork sits.
 */
export const SkyGradient = {
  colors: ['#0DA2FD', '#0450B0', '#022063'],
  locations: [0, 0.5, 1],
} as const;

// Text colour for a temperature: white unless it is notably hot or cold.
// The thresholds are in °F and apply whichever unit is displayed.
export function temperatureColor(celsius: number): string {
  const fahrenheit = (celsius * 9) / 5 + 32;
  if (fahrenheit > 92) return '#FF5A4D';
  if (fahrenheit > 85) return '#FF9F2E';
  if (fahrenheit <= 35) return '#7FD0FF';
  return Palette.text;
}
