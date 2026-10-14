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

/**
 * Shown when the device's location cannot be read. Only development has one, since simulators and
 * browsers often have no location; a released app asks for a place instead of guessing.
 */
export const DEFAULT_PLACE: Place | null = __DEV__
  ? {
      name: 'Shawnee',
      region: 'Kansas',
      country: 'United States',
      latitude: 39.04167,
      longitude: -94.72024,
    }
  : null;

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
  /** Local times, as "YYYY-MM-DDTHH:MM". */
  sunrise: string;
  sunset: string;
  /** Local times, as "HH:MM"; null when the moon does not rise or set that day, undefined when unknown. */
  moonrise?: string | null;
  moonset?: string | null;
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
  /** Rain plus melted snow and ice falling in the hour. */
  precipitationMm: number;
};

export type Weather = {
  temperature: number;
  code: number;
  isDay: boolean;
  windKmh: number;
  /** The place's offset from UTC, for telling which hour and day it is there now. */
  utcOffsetSeconds: number;
  /** Every forecast hour from the hour the weather was loaded, up to three days of them. */
  hours: HourForecast[];
  /** From the day before the weather was loaded, through the days ahead. */
  days: DayForecast[];
};

/** The time at the weather's place, as "YYYY-MM-DDTHH:MM". */
export function localTime(weather: Weather, now: number) {
  return new Date(now + weather.utcOffsetSeconds * 1000).toISOString().slice(0, 16);
}

const DAY_MS = 24 * 60 * 60 * 1000;

export type LocalDates = {
  /** The hour now at the weather's place, as "YYYY-MM-DDTHH:00". */
  currentHour: string;
  /** Dates at the weather's place, as "YYYY-MM-DD". */
  today: string;
  yesterday: string;
  tomorrow: string;
};

// Cached weather may have been loaded on an earlier day, so what counts as now, today and
// yesterday comes from the clock, not from where the data starts.
export function localDates(weather: Weather, now: number): LocalDates {
  const currentHour = `${localTime(weather, now).slice(0, 13)}:00`;
  return {
    currentHour,
    today: currentHour.slice(0, 10),
    yesterday: localTime(weather, now - DAY_MS).slice(0, 10),
    tomorrow: localTime(weather, now + DAY_MS).slice(0, 10),
  };
}

// Less than this in an hour is a trace, such as fog settling, and does not count as precipitation.
export const TRACE_MM = 0.1;

/** Whether a WMO code means something is falling: drizzle, rain, snow, hail and the like. */
export function isPrecipitation(code: number) {
  return code >= 51;
}

export type Condition = { label: string; icon: WeatherIconName; color: string };

// WMO weather interpretation codes.
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

const API_URL = 'https://api.weatherapi.com/v1';
// The free WeatherAPI plan forecasts today and the two days after it; Open-Meteo covers the rest.
const FORECAST_DAYS = 3;

// WeatherAPI condition codes, translated to the WMO codes the rest of the app speaks.
const WMO_CODES: Record<number, number> = {
  1000: 0, // Sunny or clear
  1003: 2, // Partly cloudy
  1006: 3, // Cloudy
  1009: 3, // Overcast
  1030: 45, // Mist
  1063: 80, // Patchy rain
  1066: 85, // Patchy snow
  1069: 66, // Patchy sleet
  1072: 56, // Patchy freezing drizzle
  1087: 95, // Thundery outbreaks
  1114: 71, // Blowing snow
  1117: 75, // Blizzard
  1135: 45, // Fog
  1147: 48, // Freezing fog
  1150: 51, // Patchy light drizzle
  1153: 51, // Light drizzle
  1168: 56, // Freezing drizzle
  1171: 57, // Heavy freezing drizzle
  1180: 61, // Patchy light rain
  1183: 61, // Light rain
  1186: 63, // Moderate rain at times
  1189: 63, // Moderate rain
  1192: 65, // Heavy rain at times
  1195: 65, // Heavy rain
  1198: 66, // Light freezing rain
  1201: 67, // Moderate or heavy freezing rain
  1204: 66, // Light sleet
  1207: 67, // Moderate or heavy sleet
  1210: 71, // Patchy light snow
  1213: 71, // Light snow
  1216: 73, // Patchy moderate snow
  1219: 73, // Moderate snow
  1222: 75, // Patchy heavy snow
  1225: 75, // Heavy snow
  1237: 77, // Ice pellets
  1240: 80, // Light rain shower
  1243: 81, // Moderate or heavy rain shower
  1246: 82, // Torrential rain shower
  1249: 66, // Light sleet showers
  1252: 67, // Moderate or heavy sleet showers
  1255: 85, // Light snow showers
  1258: 86, // Moderate or heavy snow showers
  1261: 77, // Light showers of ice pellets
  1264: 77, // Moderate or heavy showers of ice pellets
  1273: 95, // Patchy light rain with thunder
  1276: 95, // Moderate or heavy rain with thunder
  1279: 95, // Patchy light snow with thunder
  1282: 95, // Moderate or heavy snow with thunder
};

function wmoCode(condition: { code: number }) {
  return WMO_CODES[condition.code] ?? -1;
}

// WeatherAPI's "10:56 AM" -> "10:56"; its "No moonrise" and the like -> null.
function astroTime(time: string): string | null {
  const match = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(time ?? '');
  if (!match) return null;
  const hour = (Number(match[1]) % 12) + (match[3] === 'PM' ? 12 : 0);
  return `${String(hour).padStart(2, '0')}:${match[2]}`;
}

async function request(endpoint: string, place: Place, params: string): Promise<any> {
  const response = await fetch(
    `${API_URL}/${endpoint}.json?key=${process.env.EXPO_PUBLIC_WEATHERAPI_KEY}` +
      `&q=${place.latitude},${place.longitude}&${params}`,
  );
  if (!response.ok) {
    throw new Error(`Weather service returned ${response.status}`);
  }
  return response.json();
}

const DAILY_FIELDS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'sunshine_duration',
  'wind_speed_10m_max',
  'wind_direction_10m_dominant',
  'sunrise',
  'sunset',
].join(',');

/** Yesterday, today and the six days after, from Open-Meteo. */
async function fetchExtendedDays(place: Place): Promise<Pick<Weather, 'days' | 'utcOffsetSeconds'>> {
  const response = await fetch(
    'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${place.latitude}&longitude=${place.longitude}` +
      `&daily=${DAILY_FIELDS}` +
      '&timezone=auto&forecast_days=7&past_days=1',
  );
  if (!response.ok) {
    throw new Error(`Weather service returned ${response.status}`);
  }
  const data = await response.json();
  const daily = data.daily;

  return {
    utcOffsetSeconds: data.utc_offset_seconds,
    days: daily.time.map((date: string, i: number) => ({
      date,
      code: daily.weather_code[i],
      high: daily.temperature_2m_max[i],
      low: daily.temperature_2m_min[i],
      precipitationMm: daily.precipitation_sum[i] ?? 0,
      sunshineHours: (daily.sunshine_duration[i] ?? 0) / 3600,
      windKmh: daily.wind_speed_10m_max[i],
      windFromDegrees: daily.wind_direction_10m_dominant[i],
      sunrise: daily.sunrise[i],
      sunset: daily.sunset[i],
    })),
  };
}

export async function fetchWeather(place: Place): Promise<Weather> {
  const [data, extended] = await Promise.all([
    request('forecast', place, `days=${FORECAST_DAYS}&aqi=no&alerts=no`),
    fetchExtendedDays(place),
  ]);
  const forecastDays = data.forecast.forecastday;

  const currentHour = data.location.localtime_epoch - 3600;
  return {
    temperature: data.current.temp_c,
    code: wmoCode(data.current.condition),
    isDay: data.current.is_day === 1,
    windKmh: data.current.wind_kph,
    utcOffsetSeconds: extended.utcOffsetSeconds,
    hours: forecastDays
      .flatMap((forecastDay: any) => forecastDay.hour)
      .filter((hour: any) => hour.time_epoch > currentHour)
      .map((hour: any) => ({
        time: hour.time.replace(' ', 'T'),
        code: wmoCode(hour.condition),
        isDay: hour.is_day === 1,
        temperature: hour.temp_c,
        windKmh: hour.wind_kph,
        precipitationChance: Math.max(hour.chance_of_rain ?? 0, hour.chance_of_snow ?? 0),
        precipitationMm: hour.precip_mm ?? 0,
      })),
    // WeatherAPI's days replace Open-Meteo's conditions, temperatures and precipitation;
    // wind and sunshine stay Open-Meteo's on every day.
    days: extended.days.map((day) => {
      const forecastDay = forecastDays.find((other: any) => other.date === day.date);
      if (!forecastDay) return day;
      const near = forecastDay.day;
      return {
        ...day,
        code: wmoCode(near.condition),
        high: near.maxtemp_c,
        low: near.mintemp_c,
        precipitationMm: near.totalprecip_mm ?? 0,
        moonrise: astroTime(forecastDay.astro.moonrise),
        moonset: astroTime(forecastDay.astro.moonset),
      };
    }),
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
  const data = await request('forecast', place, 'days=1&aqi=no&alerts=no');
  const today = data.forecast.forecastday[0].day;

  return {
    temperature: data.current.temp_c,
    code: wmoCode(data.current.condition),
    isDay: data.current.is_day === 1,
    high: today.maxtemp_c,
    low: today.mintemp_c,
  };
}
