import { MaterialIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ForecastRow } from '@/components/forecast-row';
import { HourlyForecast } from '@/components/hourly-forecast';
import { Menu } from '@/components/menu';
import { WeatherIcon, iconSizeWithin } from '@/components/weather-icon';
import { useLocations } from '@/locations';
import { useSettings } from '@/settings';
import { Palette } from '@/theme';
import { TEMPERATURE_LABELS, formatWind, otherTemperatureUnit, temperatureValue } from '@/units';
import { describeWeather, fetchWeather, placeKey, type Weather } from '@/weather';

const MAX_CONTENT_WIDTH = 480;
const SECTION_GAP = 20;
// The current-weather icon is fitted into its column, up to this width and height.
const CURRENT_ICON_SIZE = 200;
const MIN_ICON_COLUMN = 140;
// The daily data starts with yesterday; later days show their day name.
const DAY_LABELS = ['Yesterday', 'Today'];

type HeaderButtonProps = {
  icon: ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  onPress?: () => void;
};

function HeaderButton({ icon, label, onPress }: HeaderButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={styles.headerButton}>
      <MaterialIcons name={icon} size={26} color={Palette.text} />
    </Pressable>
  );
}

function minutesSince(time: number, now: number) {
  return Math.max(0, Math.floor((now - time) / 60000));
}

export default function HomeScreen() {
  const { settings } = useSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const [iconColumnWidth, setIconColumnWidth] = useState(MIN_ICON_COLUMN);
  const { place, locationFailed, selectPlace } = useLocations();
  const [weather, setWeather] = useState<Weather | null>(null);
  const [updatedAt, setUpdatedAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const key = place ? placeKey(place) : null;

  const load = useCallback(async () => {
    if (!place) return;
    try {
      setWeather(await fetchWeather(place));
      setUpdatedAt(Date.now());
      setNow(Date.now());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the weather');
    }
    // Reload only when the position changes, not on every new place object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Another place's weather must not linger under the new place's name.
  useEffect(() => {
    setWeather(null);
    setError(null);
    load();
  }, [load]);

  // Keeps "Last update" ticking.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const minutes = minutesSince(updatedAt, now);
  const secondaryUnit = otherTemperatureUnit(settings.temperatureUnit);
  const condition = describeWeather(weather?.code ?? -1, weather?.isDay);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <HeaderButton icon="menu" label="Menu" onPress={() => setMenuOpen(true)} />
        <Text style={styles.place} numberOfLines={1}>
          {place?.name ?? 'Locating…'}
        </Text>
        <HeaderButton icon="search" label="Search for a place" />
        <HeaderButton icon="my-location" label="Use my location" onPress={() => selectPlace(null)} />
        <HeaderButton icon="help" label="Help" />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        // The bar is drawn over the right padding, which makes that side look narrower.
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Palette.text} />}>
        {weather ? (
          <>
            <View style={styles.current}>
              <View style={styles.currentText}>
                <View style={styles.currentTemperature}>
                  <Text style={styles.currentValue}>
                    {temperatureValue(weather.temperature, settings.temperatureUnit)}
                  </Text>
                  <Text style={styles.currentUnit}>{TEMPERATURE_LABELS[settings.temperatureUnit]}</Text>
                </View>
                {settings.showBothTemperatures && (
                  <Text style={styles.currentSecondary}>
                    {temperatureValue(weather.temperature, secondaryUnit)} {TEMPERATURE_LABELS[secondaryUnit]}
                  </Text>
                )}
                <Text style={styles.currentDetail}>{condition.label}</Text>
                <Text style={styles.currentDetail}>{formatWind(weather.windKmh, settings.windUnit)}</Text>
                <Text style={styles.currentDetail}>
                  Last update: {minutes} {minutes === 1 ? 'minute' : 'minutes'} ago
                </Text>
                {error && <Text style={styles.currentDetail}>Refresh failed: {error}</Text>}
                {locationFailed && (
                  <Text style={styles.currentDetail}>Location unavailable, showing {place?.name}</Text>
                )}
              </View>
              <View
                style={styles.currentIconColumn}
                onLayout={(event) => setIconColumnWidth(event.nativeEvent.layout.width)}>
                <WeatherIcon
                  name={condition.icon}
                  size={iconSizeWithin(condition.icon, Math.min(CURRENT_ICON_SIZE, iconColumnWidth))}
                  color={condition.color}
                  style={styles.currentIcon}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hourly forecast</Text>
              <HourlyForecast hours={weather.hours} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Daily Forecast</Text>
              <View style={styles.days}>
                {weather.days.map((day, index) => (
                  <ForecastRow key={day.date} day={day} label={DAY_LABELS[index]} />
                ))}
              </View>
            </View>
          </>
        ) : error ? (
          <View style={styles.status}>
            <Text style={styles.currentLine}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={load} style={styles.retry}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.status}>
            <ActivityIndicator size="large" color={Palette.text} />
          </View>
        )}
      </ScrollView>

      <Menu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: Palette.header,
  },
  headerButton: {
    padding: 6,
  },
  place: {
    flex: 1,
    marginLeft: 12,
    color: Palette.text,
    fontSize: 20,
  },
  content: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    // The sections stack in a column; the gap is the only vertical spacing between them.
    gap: SECTION_GAP,
    padding: 16,
    paddingTop: SECTION_GAP,
  },
  current: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // The text takes only the width it needs; the icon column gets the rest and centres the icon.
  currentText: {
    flexShrink: 1,
  },
  currentIconColumn: {
    flex: 1,
    minWidth: MIN_ICON_COLUMN,
    alignItems: 'center',
  },
  currentIcon: {
    lineHeight: CURRENT_ICON_SIZE,
  },
  section: {
    gap: 10,
  },
  currentDetail: {
    color: Palette.text,
    fontSize: 14,
    lineHeight: 20,
  },
  currentTemperature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currentValue: {
    color: Palette.text,
    fontSize: 96,
    fontWeight: '300',
    lineHeight: 108,
  },
  currentUnit: {
    marginTop: 16,
    color: Palette.text,
    fontSize: 24,
  },
  currentSecondary: {
    marginBottom: 8,
    color: Palette.textMuted,
    fontSize: 22,
  },
  currentLine: {
    color: Palette.text,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    color: Palette.text,
    fontSize: 20,
  },
  days: {
    gap: 8,
  },
  status: {
    alignItems: 'center',
    gap: 16,
    paddingTop: 96,
  },
  retry: {
    backgroundColor: Palette.card,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryText: {
    color: Palette.text,
    fontSize: 16,
  },
});
