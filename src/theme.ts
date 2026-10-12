export const Palette = {
  background: '#041E36',
  header: '#010B16',
  card: '#020F1D',
  text: '#FFFFFF',
  textMuted: '#B4CBE0',
  rain: '#7FB8FF',
  sun: '#FFCF33',
  cloud: '#D5DEE8',
  storm: '#C58BFF',
  heavyRain: '#C97A1E',
};

// Text colour for a temperature: white unless it is notably hot or cold.
// The thresholds are in °F and apply whichever unit is displayed.
export function temperatureColor(celsius: number): string {
  const fahrenheit = (celsius * 9) / 5 + 32;
  if (fahrenheit > 92) return '#FF5A4D';
  if (fahrenheit > 85) return '#FF9F2E';
  if (fahrenheit <= 35) return '#7FD0FF';
  return Palette.text;
}
