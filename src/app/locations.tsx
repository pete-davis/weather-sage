import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { SkyBackground } from '@/components/sky-background';
import { WeatherIcon } from '@/components/weather-icon';
import { useLocations } from '@/locations';
import { useSettings } from '@/settings';
import { Palette, temperatureColor } from '@/theme';
import { temperatureValue } from '@/units';
import {
  describeWeather,
  fetchPlaceSummary,
  placeKey,
  placeRegion,
  type Place,
  type PlaceSummary,
} from '@/weather';

type LocationRowProps = {
  /** Null for the device's location when it is not known yet. */
  place: Place | null;
  /** Small line above the name, e.g. "Current location". */
  caption?: string;
  selected: boolean;
  onPress: () => void;
};

function LocationRow({ place, caption, selected, onPress }: LocationRowProps) {
  const { settings } = useSettings();
  const [summary, setSummary] = useState<PlaceSummary | null>(null);
  const [failed, setFailed] = useState(false);
  const key = place ? placeKey(place) : null;

  useEffect(() => {
    if (!place) return;
    let cancelled = false;
    setSummary(null);
    setFailed(false);
    fetchPlaceSummary(place, settings.weatherApiKey)
      .then((result) => !cancelled && setSummary(result))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
    // Refetch only when the position or the weather service changes, not on every new object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, settings.weatherApiKey]);

  const condition = summary && describeWeather(summary.code, summary.isDay);
  const unit = settings.temperatureUnit;
  const region = place && placeRegion(place);

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && styles.rowPressed]}
      onPress={onPress}>
      <View style={styles.names}>
        {caption && <Text style={styles.caption}>{caption}</Text>}
        <Text style={styles.name} numberOfLines={1}>
          {place?.name ?? 'Use my location'}
        </Text>
        {!!region && (
          <Text style={styles.region} numberOfLines={1}>
            {region}
          </Text>
        )}
        <Text style={styles.condition} numberOfLines={1}>
          {condition?.label ?? (failed ? 'Weather unavailable' : place ? 'Loading…' : 'Tap to find where you are')}
        </Text>
      </View>

      {summary && condition && (
        <>
          <View style={styles.icon}>
            <WeatherIcon name={condition.icon} size={30} color={condition.color} style={styles.iconGlyph} />
          </View>
          <Text style={styles.temperature}>{temperatureValue(summary.temperature, unit)}°</Text>
          <View style={styles.range}>
            <Text style={[styles.rangeText, { color: temperatureColor(summary.high) }]}>
              {temperatureValue(summary.high, unit)}°
            </Text>
            <Text style={[styles.rangeText, { color: temperatureColor(summary.low) }]}>
              {temperatureValue(summary.low, unit)}°
            </Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

export default function LocationsScreen() {
  const router = useRouter();
  const { saved, selectedKey, currentPlace, selectPlace } = useLocations();

  const choose = (place: Place | null) => {
    selectPlace(place);
    router.dismissTo('/');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <SkyBackground />
      <ScreenHeader
        title="Locations"
        action={{ icon: 'add', label: 'Add a location', onPress: () => router.push('/add-location') }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LocationRow
          place={currentPlace}
          caption={currentPlace ? 'Current location' : undefined}
          selected={selectedKey === null}
          onPress={() => choose(null)}
        />
        {saved.map((place) => (
          <LocationRow
            key={placeKey(place)}
            place={place}
            selected={selectedKey === placeKey(place)}
            onPress={() => choose(place)}
          />
        ))}
        {saved.length === 0 && <Text style={styles.hint}>Tap + to add a location.</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  rowSelected: {
    borderColor: Palette.rain,
  },
  rowPressed: {
    opacity: 0.8,
  },
  names: {
    flex: 1,
  },
  caption: {
    color: Palette.rain,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  name: {
    color: Palette.text,
    fontSize: 18,
    fontWeight: '500',
  },
  region: {
    color: Palette.textMuted,
    fontSize: 13,
  },
  condition: {
    marginTop: 2,
    color: Palette.text,
    fontSize: 13,
  },
  icon: {
    width: 40,
    alignItems: 'center',
  },
  iconGlyph: {
    lineHeight: 40,
  },
  temperature: {
    minWidth: 52,
    color: Palette.text,
    fontSize: 30,
    fontWeight: '300',
    textAlign: 'right',
  },
  range: {
    minWidth: 36,
    alignItems: 'flex-end',
  },
  rangeText: {
    fontSize: 15,
    fontWeight: '700',
  },
  hint: {
    marginTop: 12,
    color: Palette.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
