import type { Settings } from '@/settings';

// Weather is always fetched in °C, km/h and mm; these convert for display.

export const TEMPERATURE_LABELS: Record<Settings['temperatureUnit'], string> = {
  celsius: '°C',
  fahrenheit: '°F',
};

export function otherTemperatureUnit(unit: Settings['temperatureUnit']): Settings['temperatureUnit'] {
  return unit === 'celsius' ? 'fahrenheit' : 'celsius';
}

export function temperatureValue(celsius: number, unit: Settings['temperatureUnit']): number {
  return Math.round(unit === 'fahrenheit' ? (celsius * 9) / 5 + 32 : celsius);
}

export function formatWind(kmh: number, unit: Settings['windUnit']): string {
  return unit === 'mph' ? `${Math.round(kmh * 0.621371)} mph` : `${Math.round(kmh)} km/h`;
}

// "07:26" -> "7:26am"
export function clockTime(time: string): string {
  const hour = Number(time.slice(0, 2));
  return `${hour % 12 || 12}:${time.slice(3, 5)}${hour < 12 ? 'am' : 'pm'}`;
}

/** An amount too small to show reads as "-", or as zero in the unit with showZero. */
export function formatPrecipitation(mm: number, unit: Settings['precipitationUnit'], showZero = false): string {
  if (unit === 'inch') {
    const inches = Math.round((mm / 25.4) * 100) / 100;
    return inches === 0 && !showZero ? '-' : `${inches} in`;
  }
  const rounded = mm < 0.1 ? 0 : Math.round(mm * 10) / 10;
  return rounded === 0 && !showZero ? '-' : `${rounded} mm`;
}
