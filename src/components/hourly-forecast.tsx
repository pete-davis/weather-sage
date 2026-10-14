import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { WeatherIcon } from '@/components/weather-icon';
import { useSettings, type Settings } from '@/settings';
import { CARD_PADDING, Palette } from '@/theme';
import { TEMPERATURE_LABELS, formatWind, otherTemperatureUnit, temperatureValue } from '@/units';
import { describeWeather, type HourForecast } from '@/weather';

const RAIN_WORTH_MENTIONING = 30;
// Each hour's column is only as wide as its widest line, so the first hour starts exactly where the
// card's text does and the last ends where it ends; the hours are kept apart by this gap alone. Shared
// with the precipitation chart.
export const HOUR_GAP = 16;

// "2026-10-12T17:00" -> "5pm"
export function hourLabel(time: string) {
  const hour = Number(time.slice(11, 13));
  return `${hour % 12 || 12}${hour < 12 ? 'am' : 'pm'}`;
}

function isSnow(code: number) {
  return (code >= 71 && code <= 77) || code === 85 || code === 86;
}

function summarize(hours: HourForecast[], unit: Settings['temperatureUnit'], startsNow: boolean) {
  const counts = new Map<string, number>();
  for (const hour of hours) {
    // "Clear, cloudless sky" reads better in a sentence as just "Clear".
    const label = describeWeather(hour.code).label.split(',')[0];
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const [label, count] = [...counts].sort((a, b) => b[1] - a[1])[0];
  const all = startsNow ? `for the next ${hours.length} hours` : 'all day';
  const sky = count === hours.length ? `${label} ${all}.` : `Mostly ${label.toLowerCase()}.`;

  const wettest = Math.max(...hours.map((hour) => hour.precipitationChance));
  const firstWet = hours.find((hour) => hour.precipitationChance >= RAIN_WORTH_MENTIONING);
  const word = hours.some((hour) => isSnow(hour.code)) ? 'snow' : 'rain';
  const rain = firstWet
    ? `Chance of ${word} from ${firstWet === hours[0] && startsNow ? 'now' : hourLabel(firstWet.time)}, up to ${wettest}%.`
    : `Little chance of ${word}.`;

  const temperatures = hours.map((hour) => temperatureValue(hour.temperature, unit));
  const range = `${Math.min(...temperatures)}° to ${Math.max(...temperatures)}°.`;

  return `${sky} ${rain} ${range}`;
}

type HourlyForecastProps = {
  hours: HourForecast[];
  /** The first hour is the current one, labelled "Now"; otherwise the hours are a later day's. */
  startsNow?: boolean;
};

export function HourlyForecast({ hours, startsNow = true }: HourlyForecastProps) {
  const { settings } = useSettings();
  const secondaryUnit = otherTemperatureUnit(settings.temperatureUnit);

  if (hours.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.summary}>{summarize(hours, settings.temperatureUnit, startsNow)}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.hours}
        contentContainerStyle={styles.hoursContent}>
        {hours.map((hour, index) => {
          const condition = describeWeather(hour.code, hour.isDay);
          return (
            <View key={hour.time} style={styles.hour}>
              <Text style={styles.time}>{index === 0 && startsNow ? 'Now' : hourLabel(hour.time)}</Text>
              <WeatherIcon name={condition.icon} size={24} color={condition.color} style={styles.icon} />
              <Text style={styles.temperature}>{temperatureValue(hour.temperature, settings.temperatureUnit)}°</Text>
              {settings.showBothTemperatures && (
                <Text style={styles.secondary}>
                  {temperatureValue(hour.temperature, secondaryUnit)}
                  {TEMPERATURE_LABELS[secondaryUnit]}
                </Text>
              )}
              <Text style={styles.detail}>{formatWind(hour.windKmh, settings.windUnit)}</Text>
              <View style={styles.rain}>
                <WeatherIcon name="raindrop" size={12} color={Palette.rain} style={styles.rainIcon} />
                <Text style={styles.detail}>{hour.precipitationChance}%</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.card,
    borderRadius: 16,
    paddingVertical: 12,
  },
  summary: {
    color: Palette.text,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: CARD_PADDING,
    marginBottom: 10,
  },
  // Margin rather than content padding, so the hours clip where the card's text ends as they scroll.
  hours: {
    marginHorizontal: CARD_PADDING,
  },
  hoursContent: {
    gap: HOUR_GAP,
  },
  hour: {
    alignItems: 'center',
    gap: 3,
  },
  time: {
    color: Palette.textMuted,
    fontSize: 13,
  },
  icon: {
    lineHeight: 34,
  },
  temperature: {
    color: Palette.text,
    fontSize: 18,
    fontWeight: '700',
  },
  secondary: {
    marginTop: -3,
    color: Palette.textMuted,
    fontSize: 11,
  },
  detail: {
    color: Palette.text,
    fontSize: 12,
  },
  rain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rainIcon: {
    lineHeight: 16,
  },
});
