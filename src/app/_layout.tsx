import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { SplashOverlay } from '@/components/splash-overlay';
import { ForecastProvider } from '@/forecast';
import { LocationsProvider } from '@/locations';
import { SettingsProvider } from '@/settings';
import { Palette } from '@/theme';

// Keep the native splash up until the in-app splash has drawn over the screens loading below it.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SettingsProvider>
      <LocationsProvider>
        <ForecastProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Palette.background },
            }}
          />
          <SplashOverlay />
        </ForecastProvider>
      </LocationsProvider>
    </SettingsProvider>
  );
}
