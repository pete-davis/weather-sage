import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { LocationsProvider } from '@/locations';
import { SettingsProvider } from '@/settings';
import { Palette } from '@/theme';

export default function RootLayout() {
  return (
    <SettingsProvider>
      <LocationsProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Palette.background },
          }}
        />
      </LocationsProvider>
    </SettingsProvider>
  );
}
