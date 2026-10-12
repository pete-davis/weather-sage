import type { WeatherIconName } from '@/components/weather-icon';
import { Palette } from '@/theme';

export type Place = {
  name: string;
  /** State, province or similar. */
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
};

export const DEFAULT_PLACE: Place = {
  name: 'Basel',
  region: 'Basel-Stadt',
  country: 'Switzerland',
  latitude: 47.5584,
  longitude: 7.5733,
};

/** Identifies a place by position, to about 100 m. */
export function placeKey(place: Place) {
  return `${place.latitude.toFixed(3)},${place.longitude.toFixed(3)}`;
}

/** "State, Country", leaving out whatever is unknown or repeats the name. */
export function placeRegion(place: Place) {
  return [place.region, place.country].filter((part) => part && part !== place.name).join(', ');
}

export type DayForecast = {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  code: number;
  high: number;
  low: number;
  precipitationMm: number;
  sunshineHours: number;
  windKmh: number;
  /** Direction the wind blows from, in degrees. */
  windFromDegrees: number;
};

export type HourForecast = {
  /** Local time, YYYY-MM-DDTHH:MM. */
  time: string;
  code: number;
  isDay: boolean;
  temperature: number;
  windKmh: number;
  /** Chance of precipitation, 0..100. */
  precipitationChance: number;
};

export type Weather = {
  temperature: number;
  code: number;
  isDay: boolean;
  windKmh: number;
  /** The next 24 hours, starting with the current hour. */
  hours: HourForecast[];
  /** Yesterday, today, then the days ahead. */
  days: DayForecast[];
};

export type Condition = { label: string; icon: WeatherIconName; color: string };

// WMO weather interpretation codes, as returned by Open-Meteo.
export function describeWeather(code: number, isDay = true): Condition {
  if (!isDay) {
    if (code === 0) return { label: 'Clear, cloudless sky', icon: 'night-clear', color: Palette.cloud };
    if (code === 1) return { label: 'Mostly clear', icon: 'night-alt-partly-cloudy', color: Palette.cloud };
    if (code === 2) return { label: 'Partly cloudy', icon: 'night-alt-cloudy', color: Palette.cloud };
  }
  if (code === 0) return { label: 'Clear, cloudless sky', icon: 'day-sunny', color: Palette.sun };
  if (code === 1) return { label: 'Mostly clear', icon: 'day-sunny-overcast', color: Palette.sun };
  if (code === 2) return { label: 'Partly cloudy', icon: 'day-cloudy', color: Palette.sun };
  if (code === 3) return { label: 'Overcast', icon: 'cloudy', color: Palette.cloud };
  if (code === 45 || code === 48) return { label: 'Fog', icon: 'fog', color: Palette.cloud };
  if (code >= 51 && code <= 55) return { label: 'Drizzle', icon: 'sprinkle', color: Palette.rain };
  if (code === 56 || code === 57) return { label: 'Freezing drizzle', icon: 'rain-mix', color: Palette.rain };
  if (code === 61 || code === 63) return { label: 'Rain', icon: 'rain', color: Palette.rain };
  if (code === 65) return { label: 'Heavy rain', icon: 'rain', color: Palette.rain };
  if (code === 66 || code === 67) return { label: 'Freezing rain', icon: 'rain-mix', color: Palette.rain };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { label: 'Snow', icon: 'snow', color: Palette.text };
  }
  if (code === 80 || code === 81) return { label: 'Rain showers', icon: 'showers', color: Palette.rain };
  if (code === 82) return { label: 'Violent rain showers', icon: 'showers', color: Palette.rain };
  if (code === 95) return { label: 'Thunderstorm', icon: 'thunderstorm', color: Palette.storm };
  if (code === 96 || code === 99) return { label: 'Thunderstorm with hail', icon: 'hail', color: Palette.storm };
  return { label: 'Unknown', icon: 'na', color: Palette.cloud };
}

const DAILY_FIELDS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'sunshine_duration',
  'wind_speed_10m_max',
  'wind_direction_10m_dominant',
].join(',');

export async function fetchWeather(place: Place): Promise<Weather> {
  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${place.latitude}&longitude=${place.longitude}` +
    '&current=temperature_2m,weather_code,is_day,wind_speed_10m' +
    '&hourly=temperature_2m,weather_code,is_day,wind_speed_10m,precipitation_probability' +
    '&forecast_hours=24' +
    `&daily=${DAILY_FIELDS}` +
    // past_days adds yesterday in front of today in the daily data only.
    '&timezone=auto&forecast_days=7&past_days=1';

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather service returned ${response.status}`);
  }
  const data = await response.json();
  const daily = data.daily;
  const hourly = data.hourly;

  return {
    temperature: data.current.temperature_2m,
    code: data.current.weather_code,
    isDay: data.current.is_day === 1,
    windKmh: data.current.wind_speed_10m,
    hours: hourly.time.map((time: string, i: number) => ({
      time,
      code: hourly.weather_code[i],
      isDay: hourly.is_day[i] === 1,
      temperature: hourly.temperature_2m[i],
      windKmh: hourly.wind_speed_10m[i],
      precipitationChance: hourly.precipitation_probability[i] ?? 0,
    })),
    days: daily.time.map((date: string, i: number) => ({
      date,
      code: daily.weather_code[i],
      high: daily.temperature_2m_max[i],
      low: daily.temperature_2m_min[i],
      precipitationMm: daily.precipitation_sum[i] ?? 0,
      sunshineHours: (daily.sunshine_duration[i] ?? 0) / 3600,
      windKmh: daily.wind_speed_10m_max[i],
      windFromDegrees: daily.wind_direction_10m_dominant[i],
    })),
  };
}

export type PlaceSummary = {
  temperature: number;
  code: number;
  isDay: boolean;
  high: number;
  low: number;
};

/** Current conditions and today's high and low, for the locations list. */
export async function fetchPlaceSummary(place: Place): Promise<PlaceSummary> {
  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${place.latitude}&longitude=${place.longitude}` +
    '&current=temperature_2m,weather_code,is_day' +
    '&daily=temperature_2m_max,temperature_2m_min' +
    '&timezone=auto&forecast_days=1';

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather service returned ${response.status}`);
  }
  const data = await response.json();

  return {
    temperature: data.current.temperature_2m,
    code: data.current.weather_code,
    isDay: data.current.is_day === 1,
    high: data.daily.temperature_2m_max[0],
    low: data.daily.temperature_2m_min[0],
  };
}
