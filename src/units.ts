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

export function formatPrecipitation(mm: number, unit: Settings['precipitationUnit']): string {
  if (unit === 'inch') {
    const inches = Math.round((mm / 25.4) * 100) / 100;
    return inches === 0 ? '-' : `${inches} in`;
  }
  return mm < 0.1 ? '-' : `${Math.round(mm * 10) / 10} mm`;
}
