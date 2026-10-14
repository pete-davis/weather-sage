import { useLocalSearchParams, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { weekdayOf } from '@/components/forecast-row';
import { HourlyForecast } from '@/components/hourly-forecast';
import { HourlyPrecipitation } from '@/components/hourly-precipitation';
import { ScreenHeader } from '@/components/screen-header';
import { SkyBackground } from '@/components/sky-background';
import { StaleBanner } from '@/components/stale-banner';
import { SunArc } from '@/components/sun-arc';
import { WeatherIcon } from '@/components/weather-icon';
import { useForecast, useNow } from '@/forecast';
import { useLocations } from '@/locations';
import { moonPhase, nextFullMoon } from '@/moon';
import { useSettings } from '@/settings';
import { Palette, temperatureColor } from '@/theme';
import {
  TEMPERATURE_LABELS,
  clockTime,
  formatPrecipitation,
  formatWind,
  otherTemperatureUnit,
  temperatureValue,
} from '@/units';
import { TRACE_MM, describeWeather, localDates, localTime } from '@/weather';

const HOURS_SHOWN = 24;

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

// "2026-10-14" -> "Wednesday, October 14"
function longDate(date: string) {
  const [, month, day] = date.split('-').map(Number);
  return `${weekdayOf(date)}, ${MONTHS[month - 1]} ${day}`;
}

function compassPoint(degrees: number) {
  return COMPASS[Math.round(degrees / 45) % 8];
}

function MoonTime({ icon, label, time }: { icon: 'moonrise' | 'moonset'; label: string; time: string | null }) {
  return (
    <View style={styles.moonTime}>
      <WeatherIcon name={icon} size={18} color={Palette.cloud} style={styles.moonTimeIcon} />
      <Text style={styles.moonTimeLabel}>{label}</Text>
      <Text style={styles.moonTimeValue}>{time ? clockTime(time) : 'None'}</Text>
    </View>
  );
}

function Detail({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <View style={styles.detail}>
      {icon}
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{children}</Text>
    </View>
  );
}

export default function DayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const { settings } = useSettings();
  const router = useRouter();
  const { place, locationFailed } = useLocations();
  const { weather, error, offline, load } = useForecast();
  const now = useNow();

  const dates = weather ? localDates(weather, now) : null;
  const day = weather?.days.find((other) => other.date === date);
  const title =
    date === dates?.today
      ? 'Today'
      : date === dates?.yesterday
        ? 'Yesterday'
        : date === dates?.tomorrow
          ? 'Tomorrow'
          : weekdayOf(date);
  const startsNow = date === dates?.today;
  // Today's hours are the next 24 from now, running on into tomorrow; another day's are its own.
  const hours =
    (startsNow
      ? weather?.hours.filter((hour) => hour.time >= (dates?.currentHour ?? '')).slice(0, HOURS_SHOWN)
      : weather?.hours.filter((hour) => hour.time.startsWith(date))) ?? [];
  const wet = hours.some((hour) => hour.precipitationMm >= TRACE_MM);

  const unit = settings.temperatureUnit;
  const secondaryUnit = otherTemperatureUnit(unit);
  const condition = day && describeWeather(day.code);
  const moon = moonPhase(date);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <SkyBackground />
      <ScreenHeader title={title} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {weather && error && <StaleBanner offline={offline} />}

        {/* Opened from a link, this may be the first screen shown, so it needs the home screen's way out
            when there is no weather to wait for. */}
        {!weather && error ? (
          <View style={styles.status}>
            <Text style={styles.statusLine}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={load} style={styles.button}>
              <Text style={styles.buttonText}>Try again</Text>
            </Pressable>
          </View>
        ) : !weather && !place && locationFailed ? (
          <View style={styles.status}>
            <Text style={styles.statusLine}>Your location is unavailable.</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/locations')} style={styles.button}>
              <Text style={styles.buttonText}>Choose a location</Text>
            </Pressable>
          </View>
        ) : !weather ? (
          <View style={styles.status}>
            <ActivityIndicator size="large" color={Palette.text} />
          </View>
        ) : !day || !condition ? (
          <View style={styles.status}>
            <Text style={styles.note}>There is no forecast for this day.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.subtitle}>
              {longDate(day.date)}
              {place ? ` · ${place.name}` : ''}
            </Text>

            <View style={styles.summary}>
              <WeatherIcon name={condition.icon} size={72} color={condition.color} style={styles.summaryIcon} />
              <View style={styles.summaryText}>
                <Text style={styles.condition}>{condition.label}</Text>
                <View style={styles.temperatures}>
                  {[
                    { label: 'High', celsius: day.high },
                    { label: 'Low', celsius: day.low },
                  ].map(({ label, celsius }) => (
                    <View key={label}>
                      <Text style={styles.temperatureLabel}>{label}</Text>
                      <Text style={[styles.temperature, { color: temperatureColor(celsius) }]}>
                        {temperatureValue(celsius, unit)}°
                      </Text>
                      {settings.showBothTemperatures && (
                        <Text style={styles.temperatureSecondary}>
                          {temperatureValue(celsius, secondaryUnit)}
                          {TEMPERATURE_LABELS[secondaryUnit]}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.details}>
              <Detail
                label="Precipitation"
                icon={<WeatherIcon name="raindrop" size={20} color={Palette.rain} style={styles.detailIcon} />}>
                {formatPrecipitation(day.precipitationMm, settings.precipitationUnit, true)}
              </Detail>
              <Detail
                label="Sunshine"
                icon={<WeatherIcon name="day-sunny" size={20} color={Palette.sun} style={styles.detailIcon} />}>
                {Math.round(day.sunshineHours)} h
              </Detail>
              <Detail
                label={`Wind from ${compassPoint(day.windFromDegrees)}`}
                icon={
                  <WeatherIcon
                    name="direction-up"
                    size={28}
                    color={Palette.text}
                    // The arrow points where the wind is heading, opposite to where it comes from.
                    style={[styles.detailIcon, { transform: [{ rotate: `${(day.windFromDegrees + 180) % 360}deg` }] }]}
                  />
                }>
                {formatWind(day.windKmh, settings.windUnit)}
              </Detail>
            </View>

            {hours.length > 0 ? (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Hourly forecast</Text>
                  <HourlyForecast hours={hours} startsNow={startsNow} />
                </View>
                {wet && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Hourly Precipitation</Text>
                    <HourlyPrecipitation hours={hours} startsNow={startsNow} />
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.note}>
                {date < (dates?.today ?? '')
                  ? 'Hourly detail is not kept for past days.'
                  : 'Hourly detail is available for today and the next two days.'}
              </Text>
            )}

            {day.sunrise && day.sunset && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sunrise & Sunset</Text>
                <SunArc
                  sunrise={day.sunrise}
                  sunset={day.sunset}
                  now={startsNow && weather ? localTime(weather, now) : undefined}
                />
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Moon</Text>
              <View style={styles.moon}>
                <View style={styles.moonPhase}>
                  <WeatherIcon name={`moon-${moon.glyph}`} size={64} color={Palette.cloud} style={styles.moonIcon} />
                  <View style={styles.moonText}>
                    <Text style={styles.condition}>{moon.name}</Text>
                    <Text style={styles.moonDetail}>{moon.illumination}% illuminated</Text>
                    <Text style={styles.moonDetail}>
                      {Math.round(moon.ageDays)} {Math.round(moon.ageDays) === 1 ? 'day' : 'days'} since the new moon
                    </Text>
                  </View>
                </View>
                {day.moonrise !== undefined && day.moonset !== undefined && (
                  <View style={styles.moonTimes}>
                    <MoonTime icon="moonrise" label="Moonrise" time={day.moonrise} />
                    <MoonTime icon="moonset" label="Moonset" time={day.moonset} />
                  </View>
                )}
                <Text style={styles.moonDetail}>Next full moon: {longDate(nextFullMoon(date))}</Text>
              </View>
            </View>
          </>
        )}
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
    gap: 20,
    padding: 16,
  },
  subtitle: {
    color: Palette.textMuted,
    fontSize: 15,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    backgroundColor: Palette.card,
    borderRadius: 16,
    padding: 16,
  },
  summaryIcon: {
    lineHeight: 88,
  },
  summaryText: {
    flex: 1,
    gap: 8,
  },
  condition: {
    color: Palette.text,
    fontSize: 20,
  },
  temperatures: {
    flexDirection: 'row',
    gap: 28,
  },
  temperatureLabel: {
    color: Palette.textMuted,
    fontSize: 13,
  },
  temperature: {
    fontSize: 28,
    fontWeight: '700',
  },
  temperatureSecondary: {
    color: Palette.textMuted,
    fontSize: 12,
  },
  details: {
    flexDirection: 'row',
    gap: 8,
  },
  // Three tiles share the row equally.
  detail: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.card,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  // The icon font's own line height is taller than the glyphs.
  detailIcon: {
    lineHeight: 32,
  },
  detailLabel: {
    color: Palette.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  detailValue: {
    color: Palette.text,
    fontSize: 17,
    fontWeight: '600',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: Palette.text,
    fontSize: 20,
  },
  moon: {
    gap: 14,
    backgroundColor: Palette.card,
    borderRadius: 16,
    padding: 16,
  },
  moonPhase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  moonIcon: {
    lineHeight: 72,
  },
  moonText: {
    flex: 1,
    gap: 4,
  },
  moonDetail: {
    color: Palette.textMuted,
    fontSize: 14,
  },
  moonTimes: {
    flexDirection: 'row',
    gap: 8,
  },
  moonTime: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moonTimeIcon: {
    lineHeight: 22,
  },
  moonTimeLabel: {
    color: Palette.textMuted,
    fontSize: 14,
  },
  moonTimeValue: {
    color: Palette.text,
    fontSize: 15,
    fontWeight: '600',
  },
  note: {
    color: Palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  status: {
    alignItems: 'center',
    gap: 16,
    paddingTop: 96,
  },
  statusLine: {
    color: Palette.text,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Palette.card,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: Palette.text,
    fontSize: 16,
  },
});
