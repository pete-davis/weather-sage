import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ForecastRow } from '@/components/forecast-row';
import { HourlyForecast } from '@/components/hourly-forecast';
import { HourlyPrecipitation } from '@/components/hourly-precipitation';
import { InstallHint } from '@/components/install-hint';
import { Menu } from '@/components/menu';
import { RefreshableScrollView } from '@/components/refreshable-scroll-view';
import { SkyBackground } from '@/components/sky-background';
import { useSplash } from '@/components/splash-overlay';
import { StaleBanner } from '@/components/stale-banner';
import { WeatherIcon, iconSizeWithin } from '@/components/weather-icon';
import { useForecast, useNow } from '@/forecast';
import { useLocations } from '@/locations';
import { useSettings } from '@/settings';
import { Palette } from '@/theme';
import { TEMPERATURE_LABELS, formatWind, otherTemperatureUnit, temperatureValue } from '@/units';
import { TRACE_MM, describeWeather, isPrecipitation, localDates, placeKey, type Place } from '@/weather';

const MAX_CONTENT_WIDTH = 480;
const SECTION_GAP = 20;
// The current-weather icon is fitted into its column, up to this width and height.
const CURRENT_ICON_SIZE = 200;
const MIN_ICON_COLUMN = 140;
const HOURS_SHOWN = 24;
const HOUR = 60 * 60 * 1000;

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

/** The same spot, or the same town by name, as a saved town and a position in it rarely match exactly. */
function samePlace(a: Place | null, b: Place) {
  if (!a) return false;
  if (placeKey(a) === placeKey(b)) return true;
  return a.name === b.name && (a.region ?? '') === (b.region ?? '') && (a.country ?? '') === (b.country ?? '');
}

function plural(count: number, unit: string) {
  return `${count} ${unit}${count === 1 ? '' : 's'} ago`;
}

// Cached weather can be days old, so the age moves up to hours and days.
function ageLabel(time: number, now: number) {
  const minutes = Math.max(0, Math.floor((now - time) / 60000));
  if (minutes < 60) return plural(minutes, 'minute');
  if (minutes < 48 * 60) return plural(Math.floor(minutes / 60), 'hour');
  return plural(Math.floor(minutes / (24 * 60)), 'day');
}

export default function HomeScreen() {
  const { settings } = useSettings();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [iconColumnWidth, setIconColumnWidth] = useState(MIN_ICON_COLUMN);
  const { place, selectedKey, currentPlace, locationFailed, selectPlace } = useLocations();
  // Going to the device's location is offered only when the screen shows somewhere else, or when
  // the location could not be read and is worth asking for again.
  const showsCurrentPlace =
    !locationFailed && (selectedKey === null || (currentPlace !== null && samePlace(place, currentPlace)));
  const { weather, updatedAt, loading, error, offline, load } = useForecast();
  const now = useNow();
  const [refreshing, setRefreshing] = useState(false);

  const { cover } = useSplash();

  // A pull to reload brings the splash back over the screen while the weather loads.
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await cover(load);
    setRefreshing(false);
  }, [cover, load]);

  const secondaryUnit = otherTemperatureUnit(settings.temperatureUnit);
  const { currentHour, today, yesterday, tomorrow } = weather
    ? localDates(weather, now)
    : { currentHour: '', today: '', yesterday: '', tomorrow: '' };
  const hours = weather?.hours.filter((hour) => hour.time >= currentHour).slice(0, HOURS_SHOWN) ?? [];
  const days = weather?.days.filter((day) => day.date >= yesterday) ?? [];
  // The current conditions say what is falling only while they are recent; after that the
  // forecast for the current hour has to.
  const precipitating =
    hours.length > 0 &&
    (hours[0].precipitationMm >= TRACE_MM ||
      isPrecipitation(hours[0].code) ||
      (weather !== null && now - updatedAt < HOUR && isPrecipitation(weather.code)));
  const condition = describeWeather(weather?.code ?? -1, weather?.isDay);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <SkyBackground />
      <View style={styles.header}>
        <HeaderButton icon="menu" label="Menu" onPress={() => setMenuOpen(true)} />
        <Text style={styles.title} numberOfLines={1}>
          {place?.name ?? (locationFailed ? '' : 'Locating…')}
        </Text>
        {!showsCurrentPlace && (
          <HeaderButton icon="my-location" label="Use my location" onPress={() => selectPlace(null)} />
        )}
      </View>

      <RefreshableScrollView
        contentContainerStyle={styles.content}
        // The bar is drawn over the right padding, which makes that side look narrower.
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={refresh}>
        <InstallHint />
        {weather ? (
          <>
            {error && <StaleBanner offline={offline} />}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Today's details"
              onPress={() => router.push({ pathname: '/day/[date]', params: { date: today } })}
              style={({ pressed }) => [styles.current, pressed && styles.pressed]}>
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
                <Text style={styles.currentDetail}>Last update: {ageLabel(updatedAt, now)}</Text>
                {loading && !refreshing && (
                  <View style={styles.loading}>
                    <ActivityIndicator size="small" color={Palette.text} />
                    <Text style={styles.currentDetail}>Loading fresh data…</Text>
                  </View>
                )}
                {locationFailed && (
                  <Text style={styles.currentDetail}>Location unavailable</Text>
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
            </Pressable>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hourly forecast</Text>
              <HourlyForecast hours={hours} />
            </View>

            {precipitating && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hourly Precipitation</Text>
                <HourlyPrecipitation hours={hours} />
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Daily Forecast</Text>
              <View style={styles.days}>
                {days.map((day) => (
                  <ForecastRow
                    key={day.date}
                    day={day}
                    label={({ [yesterday]: 'Yesterday', [today]: 'Today', [tomorrow]: 'Tomorrow' })[day.date]}
                    onPress={() => router.push({ pathname: '/day/[date]', params: { date: day.date } })}
                  />
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
        ) : !place && locationFailed ? (
          <View style={styles.status}>
            <Text style={styles.currentLine}>Your location is unavailable.</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/locations')} style={styles.retry}>
              <Text style={styles.retryText}>Choose a location</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.status}>
            <ActivityIndicator size="large" color={Palette.text} />
          </View>
        )}
      </RefreshableScrollView>

      {menuOpen && <Menu onClose={() => setMenuOpen(false)} />}
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
  title: {
    flex: 1,
    marginLeft: 6,
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
  pressed: {
    opacity: 0.7,
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
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
