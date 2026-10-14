import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { useLocations } from '@/locations';
import { useSettings } from '@/settings';
import { fetchWeather, placeKey, type Weather } from '@/weather';
import { cacheWeather, pruneWeatherCache, readCachedWeather } from '@/weather-cache';

type ForecastContextValue = {
  /** The selected place's weather: fresh, or cached until fresh weather arrives. */
  weather: Weather | null;
  /** When the weather on hand was loaded, in milliseconds since the epoch. */
  updatedAt: number;
  /** Fresh weather is being loaded. */
  loading: boolean;
  /** Why the last load failed, or null if it did not. */
  error: string | null;
  /** The last load failed without reaching the weather service at all. */
  offline: boolean;
  load: () => Promise<void>;
};

const ForecastContext = createContext<ForecastContextValue>({
  weather: null,
  updatedAt: 0,
  loading: false,
  error: null,
  offline: false,
  load: async () => {},
});

// Open-Meteo updates current conditions every 15 minutes, so refreshing more often finds nothing new.
const REFRESH_MS = 15 * 60 * 1000;
// How often to check whether a refresh is due. Checking rather than waiting the full interval keeps
// refreshes on time after a manual refresh, a new place, or the app waking from sleep.
const REFRESH_CHECK_MS = 60 * 1000;

/** Loads and caches the weather for the place the app shows, for every screen to share. */
export function ForecastProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const { place } = useLocations();
  const [weather, setWeather] = useState<Weather | null>(null);
  const [updatedAt, setUpdatedAt] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  // The place whose weather on hand is fresh, so that a slow cache read cannot replace it.
  const freshKey = useRef<string | null>(null);
  // When a load last started, successful or not, so that automatic refreshes do not retry a failing
  // service any faster than they would refresh a working one.
  const lastAttempt = useRef(0);

  const key = place ? placeKey(place) : null;

  const load = useCallback(async () => {
    if (!place) return;
    lastAttempt.current = Date.now();
    setLoading(true);
    try {
      const fresh = await fetchWeather(place, settings.weatherApiKey);
      freshKey.current = key;
      setWeather(fresh);
      setUpdatedAt(Date.now());
      setError(null);
      setOffline(false);
      cacheWeather(place, fresh);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the weather');
      // fetch rejects with a TypeError when there is no connection; a reply from the service does not.
      setOffline(e instanceof TypeError);
    } finally {
      setLoading(false);
    }
    // Reload only when the position or the weather service changes, not on every new place object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, settings.weatherApiKey]);

  // Another place's weather must not linger under the new place's name. The place's own cached
  // weather stands in until the fresh weather arrives.
  useEffect(() => {
    let current = true;
    freshKey.current = null;
    setWeather(null);
    setError(null);
    setOffline(false);
    if (place) {
      readCachedWeather(place, settings.cacheDays).then((cached) => {
        if (!current || !cached || freshKey.current === key) return;
        setWeather(cached.weather);
        setUpdatedAt(cached.savedAt);
      });
    }
    load();
    return () => {
      current = false;
    };
    // load changes exactly when the position or the weather service does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  // Refresh while the app is in view, and on coming back to it, once the weather is REFRESH_MS old.
  // Nothing loads while the app is in the background.
  useEffect(() => {
    function refreshIfDue() {
      if (AppState.currentState === 'active' && Date.now() - lastAttempt.current >= REFRESH_MS) load();
    }
    const timer = setInterval(refreshIfDue, REFRESH_CHECK_MS);
    const subscription = AppState.addEventListener('change', refreshIfDue);
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [load]);

  useEffect(() => {
    pruneWeatherCache(settings.cacheDays);
  }, [settings.cacheDays]);

  return (
    <ForecastContext.Provider value={{ weather, updatedAt, loading, error, offline, load }}>
      {children}
    </ForecastContext.Provider>
  );
}

export function useForecast() {
  return useContext(ForecastContext);
}

/** The current time, updated every half minute so that relative times and "now" stay current. */
export function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
