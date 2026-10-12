import * as Location from 'expo-location';
import { Platform } from 'react-native';

import type { Place } from '@/weather';

const UNNAMED_PLACE = 'Current location';

type PlaceName = Pick<Place, 'name' | 'region' | 'country'>;

async function deviceGeocoderName(latitude: number, longitude: number): Promise<PlaceName | null> {
  // There is no device geocoder in a browser, and asking for one logs a warning.
  if (Platform.OS === 'web') return null;
  try {
    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
    const name = address?.city || address?.district || address?.subregion || address?.region;
    if (!name) return null;
    return { name, region: address.region ?? undefined, country: address.country ?? undefined };
  } catch {
    return null;
  }
}

// BigDataCloud's keyless reverse geocoder, meant for coordinates read on the client.
async function onlineGeocoderName(latitude: number, longitude: number): Promise<PlaceName | null> {
  try {
    const response = await fetch(
      'https://api.bigdatacloud.net/data/reverse-geocode-client' +
        `?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
    );
    if (!response.ok) return null;
    const place = await response.json();
    const name = place.city || place.locality || place.principalSubdivision;
    if (!name) return null;
    return {
      name,
      region: place.principalSubdivision || undefined,
      country: place.countryName || undefined,
    };
  } catch {
    return null;
  }
}

async function nearestPlaceName(latitude: number, longitude: number): Promise<PlaceName> {
  return (
    (await deviceGeocoderName(latitude, longitude)) ??
    (await onlineGeocoderName(latitude, longitude)) ?? { name: UNNAMED_PLACE }
  );
}

/** The place nearest the device, or null if location is denied or unavailable. */
export async function findCurrentPlace(): Promise<Place | null> {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return null;

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude } = position.coords;
    return { ...(await nearestPlaceName(latitude, longitude)), latitude, longitude };
  } catch {
    return null;
  }
}

/** Places matching a typed name, best matches first. */
export async function searchPlaces(query: string): Promise<Place[]> {
  const response = await fetch(
    'https://geocoding-api.open-meteo.com/v1/search' +
      `?name=${encodeURIComponent(query)}&count=10&language=en&format=json`,
  );
  if (!response.ok) {
    throw new Error(`Place search returned ${response.status}`);
  }
  const data = await response.json();
  return (data.results ?? []).map(
    (result: { name: string; admin1?: string; country?: string; latitude: number; longitude: number }) => ({
      name: result.name,
      region: result.admin1,
      country: result.country,
      latitude: result.latitude,
      longitude: result.longitude,
    }),
  );
}
