import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type Settings = {
  /** The primary temperature unit. */
  temperatureUnit: 'celsius' | 'fahrenheit';
  /** Also show the other temperature unit, smaller, next to the primary one. */
  showBothTemperatures: boolean;
  windUnit: 'kmh' | 'mph';
  precipitationUnit: 'mm' | 'inch';
};

export type UnitSystem = Pick<Settings, 'temperatureUnit' | 'windUnit' | 'precipitationUnit'>;

export const METRIC: UnitSystem = { temperatureUnit: 'celsius', windUnit: 'kmh', precipitationUnit: 'mm' };
export const IMPERIAL: UnitSystem = { temperatureUnit: 'fahrenheit', windUnit: 'mph', precipitationUnit: 'inch' };

export function usesSystem(settings: Settings, system: UnitSystem) {
  return (
    settings.temperatureUnit === system.temperatureUnit &&
    settings.windUnit === system.windUnit &&
    settings.precipitationUnit === system.precipitationUnit
  );
}

const DEFAULT_SETTINGS: Settings = { ...METRIC, showBothTemperatures: false };

const STORAGE_KEY = 'settings';

type SettingsContextValue = {
  settings: Settings;
  updateSettings: (changes: Partial<Settings>) => void;
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      })
      .catch(() => {
        // Unreadable saved settings: keep the defaults.
      });
  }, []);

  const updateSettings = useCallback((changes: Partial<Settings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...changes };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return <SettingsContext.Provider value={{ settings, updateSettings }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
