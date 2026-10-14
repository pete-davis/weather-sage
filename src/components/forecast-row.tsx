import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WeatherIcon } from '@/components/weather-icon';
import { useSettings } from '@/settings';
import { CARD_PADDING, Palette, temperatureColor } from '@/theme';
import {
  TEMPERATURE_LABELS,
  formatPrecipitation,
  formatWind,
  otherTemperatureUnit,
  temperatureValue,
} from '@/units';
import { describeWeather, type DayForecast } from '@/weather';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const HEAVY_RAIN_MM = 20;

// Parsed by hand so the forecast's local date is not shifted by the phone's time zone.
export function weekdayOf(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

// "2026-10-15" -> "Oct 15"
function shortDate(date: string) {
  const [, month, day] = date.split('-').map(Number);
  return `${MONTHS[month - 1]} ${day}`;
}

type ForecastRowProps = {
  day: DayForecast;
  /** Shown instead of the day name, e.g. "Today". */
  label?: string;
  onPress?: () => void;
};

export function ForecastRow({ day, label, onPress }: ForecastRowProps) {
  const { settings } = useSettings();
  const secondaryUnit = otherTemperatureUnit(settings.temperatureUnit);
  const condition = describeWeather(day.code);
  const heavyRain = day.precipitationMm >= HEAVY_RAIN_MM;
  const precipitation = formatPrecipitation(day.precipitationMm, settings.precipitationUnit);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label ?? weekdayOf(day.date)}, details`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.day}>
        <Text style={styles.weekday} numberOfLines={1} adjustsFontSizeToFit>
          {label ?? weekdayOf(day.date)}
        </Text>
        <Text style={styles.date}>{shortDate(day.date)}</Text>
      </View>

      <View style={styles.condition}>
        <WeatherIcon name={condition.icon} size={30} color={condition.color} style={styles.conditionIcon} />
      </View>

      <View style={styles.temperatures}>
        {[day.high, day.low].map((celsius, index) => (
          <View key={index} style={styles.temperature}>
            <Text style={[styles.temperatureText, { color: temperatureColor(celsius) }]}>
              {temperatureValue(celsius, settings.temperatureUnit)}°
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

      <View style={styles.details}>
        <View style={[styles.detail, heavyRain && styles.heavyRain]}>
          <WeatherIcon name="raindrop" size={14} color={Palette.rain} style={styles.detailIcon} />
          <Text style={styles.detailText}>{precipitation}</Text>
        </View>
        <View style={styles.detail}>
          <WeatherIcon name="day-sunny" size={13} color={Palette.sun} style={styles.detailIcon} />
          <Text style={styles.detailText}>{Math.round(day.sunshineHours)} h</Text>
        </View>
        <View style={styles.detail}>
          <WeatherIcon
            name="direction-up"
            size={22}
            color={Palette.text}
            // The arrow points where the wind is heading, opposite to where it comes from.
            style={[styles.detailIcon, { transform: [{ rotate: `${(day.windFromDegrees + 180) % 360}deg` }] }]}
          />
          <Text style={styles.detailText}>{formatWind(day.windKmh, settings.windUnit)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.card,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: CARD_PADDING,
  },
  rowPressed: {
    opacity: 0.7,
  },
  // The four columns share the row by proportion, so they line up from row to row at any width.
  day: {
    flex: 4,
  },
  weekday: {
    color: Palette.text,
    fontSize: 18,
    fontWeight: '500',
  },
  date: {
    color: Palette.textMuted,
    fontSize: 14,
  },
  condition: {
    flex: 1.5,
    alignItems: 'center',
  },
  conditionIcon: {
    lineHeight: 40,
  },
  // The icon font's own line height is tall enough to stretch the row.
  detailIcon: {
    lineHeight: 18,
  },
  temperatures: {
    flex: 3,
  },
  temperature: {
    flexDirection: 'row',
    height: 26,
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 5,
    paddingTop: 2,
  },
  temperatureText: {
    fontSize: 18,
    fontWeight: '700',
  },
  temperatureSecondary: {
    color: Palette.textMuted,
    fontSize: 11,
  },
  details: {
    flex: 3.2,
    alignItems: 'flex-end',
    gap: 1,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 3,
    borderRadius: 3,
  },
  heavyRain: {
    backgroundColor: Palette.heavyRain,
  },
  detailText: {
    color: Palette.text,
    fontSize: 13,
  },
});
