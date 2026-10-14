import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Settings } from '@/settings';
import type { Place, Weather } from '@/weather';

const KEY_PREFIX = 'weather:';
// Raise whenever the shape of Weather changes, so that entries saved in the old shape are dropped
// rather than shown with missing values.
const FORMAT = 3;
const DAY = 24 * 60 * 60 * 1000;
// Weather loaded this close by stands in for a place that has none of its own, such as a
// position further along a trail with no signal.
const NEARBY_KM = 25;

type MaxAgeDays = Settings['cacheDays'];
type Position = Pick<Place, 'latitude' | 'longitude'>;

export type CachedWeather = {
  format: typeof FORMAT;
  weather: Weather;
  /** Where the weather was loaded for. */
  place: Position;
  /** When the weather was loaded, in milliseconds since the epoch. */
  savedAt: number;
};

// Coarser than placeKey (about 1 km), so the device's position drifting does not pile up entries.
function cacheKey(place: Place) {
  return `${KEY_PREFIX}${place.latitude.toFixed(2)},${place.longitude.toFixed(2)}`;
}

function isExpired(cached: CachedWeather, maxAgeDays: MaxAgeDays) {
  return maxAgeDays !== 'never' && Date.now() - cached.savedAt > maxAgeDays * DAY;
}

// Flat-earth distance, which is accurate enough over a few tens of kilometres.
function distanceKm(a: Position, b: Position) {
  const kmPerDegree = 111.2;
  const north = (a.latitude - b.latitude) * kmPerDegree;
  const east = (a.longitude - b.longitude) * kmPerDegree * Math.cos((a.latitude * Math.PI) / 180);
  return Math.hypot(north, east);
}

/** Every stored entry by key; null for one that cannot be read or is in an older format. */
async function readAll(): Promise<[string, CachedWeather | null][]> {
  const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(KEY_PREFIX));
  const entries = await AsyncStorage.multiGet(keys);
  return entries.map(([key, value]) => {
    try {
      const cached = JSON.parse(value ?? 'null') as CachedWeather | null;
      return [key, cached?.format === FORMAT ? cached : null];
    } catch {
      return [key, null];
    }
  });
}

/** The weather last loaded at or nearest to a place, or null if none is near or recent enough. */
export async function readCachedWeather(place: Place, maxAgeDays: MaxAgeDays): Promise<CachedWeather | null> {
  try {
    let nearest: CachedWeather | null = null;
    for (const [, cached] of await readAll()) {
      if (!cached || isExpired(cached, maxAgeDays) || distanceKm(cached.place, place) > NEARBY_KM) continue;
      if (!nearest || distanceKm(cached.place, place) < distanceKm(nearest.place, place)) nearest = cached;
    }
    return nearest;
  } catch {
    // Unreadable cache: carry on without it.
    return null;
  }
}

export function cacheWeather(place: Place, weather: Weather) {
  const cached: CachedWeather = {
    format: FORMAT,
    weather,
    place: { latitude: place.latitude, longitude: place.longitude },
    savedAt: Date.now(),
  };
  AsyncStorage.setItem(cacheKey(place), JSON.stringify(cached)).catch(() => {});
}

/** Deletes the weather of every place that is older than maxAgeDays. */
export async function pruneWeatherCache(maxAgeDays: MaxAgeDays) {
  try {
    const expired = (await readAll())
      .filter(([, cached]) => !cached || isExpired(cached, maxAgeDays))
      .map(([key]) => key);
    if (expired.length > 0) await AsyncStorage.multiRemove(expired);
  } catch {
    // Left for the next time the app opens.
  }
}
