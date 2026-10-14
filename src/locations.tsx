import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { findCurrentPlace } from '@/location';
import { DEFAULT_PLACE, placeKey, type Place } from '@/weather';

const STORAGE_KEY = 'locations';
// The device's last known place, so the app can open on it before it has been located again.
const CURRENT_PLACE_KEY = 'current-place';

type Stored = {
  saved: Place[];
  /** Key of the chosen saved place, or null to follow the device's location. */
  selectedKey: string | null;
};

type LocationsContextValue = Stored & {
  /** The place the home screen shows; null while it is still being worked out. */
  place: Place | null;
  /** The device's last known place. */
  currentPlace: Place | null;
  /** The device's location was asked for and could not be read. */
  locationFailed: boolean;
  addPlace: (place: Place) => void;
  /** Pass null to follow the device's location. */
  selectPlace: (place: Place | null) => void;
};

const LocationsContext = createContext<LocationsContextValue>({
  saved: [],
  selectedKey: null,
  place: null,
  currentPlace: null,
  locationFailed: false,
  addPlace: () => {},
  selectPlace: () => {},
});

export function LocationsProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<Stored | null>(null);
  const [currentPlace, setCurrentPlace] = useState<Place | null>(null);
  const [locationFailed, setLocationFailed] = useState(false);

  const locate = useCallback(async () => {
    const current = await findCurrentPlace();
    setLocationFailed(!current);
    // Keep the last known place if a later attempt fails.
    setCurrentPlace((previous) => current ?? previous);
    if (current) AsyncStorage.setItem(CURRENT_PLACE_KEY, JSON.stringify(current)).catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.multiGet([STORAGE_KEY, CURRENT_PLACE_KEY])
      .then(([[, locations], [, lastPlace]]) => ({
        loaded: locations ? (JSON.parse(locations) as Stored) : null,
        lastPlace: lastPlace ? (JSON.parse(lastPlace) as Place) : null,
      }))
      .catch(() => ({ loaded: null, lastPlace: null }))
      .then(({ loaded, lastPlace }) => {
        const initial = loaded ?? { saved: [], selectedKey: null };
        setCurrentPlace((previous) => previous ?? lastPlace);
        setStored(initial);
        if (initial.selectedKey === null) locate();
      });
  }, [locate]);

  const update = useCallback((change: (previous: Stored) => Stored) => {
    setStored((previous) => {
      const next = change(previous ?? { saved: [], selectedKey: null });
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const addPlace = useCallback(
    (place: Place) => {
      update((previous) =>
        previous.saved.some((other) => placeKey(other) === placeKey(place))
          ? previous
          : { ...previous, saved: [...previous.saved, place] },
      );
    },
    [update],
  );

  const selectPlace = useCallback(
    (place: Place | null) => {
      update((previous) => ({ ...previous, selectedKey: place ? placeKey(place) : null }));
      if (!place) locate();
    },
    [update, locate],
  );

  const saved = stored?.saved ?? [];
  const selected = saved.find((other) => placeKey(other) === stored?.selectedKey) ?? null;
  const place = !stored ? null : (selected ?? currentPlace ?? (locationFailed ? DEFAULT_PLACE : null));

  return (
    <LocationsContext.Provider
      value={{
        saved,
        selectedKey: selected ? placeKey(selected) : null,
        place,
        currentPlace,
        locationFailed: !selected && locationFailed,
        addPlace,
        selectPlace,
      }}>
      {children}
    </LocationsContext.Provider>
  );
}

export function useLocations() {
  return useContext(LocationsContext);
}
