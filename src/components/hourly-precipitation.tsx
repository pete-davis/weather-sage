import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { hourLabel } from '@/components/hourly-forecast';
import { useSettings } from '@/settings';
import { Palette } from '@/theme';
import { formatPrecipitation } from '@/units';
import type { HourForecast } from '@/weather';

const BAR_HEIGHT = 72;
// The tallest bar stands for at least this much, so that drizzle does not fill the chart.
const MIN_FULL_SCALE_MM = 2;

/** A bar per hour, as tall as its share of the wettest hour. */
export function HourlyPrecipitation({ hours, startsNow = true }: { hours: HourForecast[]; startsNow?: boolean }) {
  const { settings } = useSettings();
  const fullScale = Math.max(MIN_FULL_SCALE_MM, ...hours.map((hour) => hour.precipitationMm));

  return (
    <View style={styles.card}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hours}>
        {hours.map((hour, index) => (
          <View key={hour.time} style={styles.hour}>
            <Text style={styles.time}>{index === 0 && startsNow ? 'Now' : hourLabel(hour.time)}</Text>
            <View style={styles.chart}>
              {/* Each column draws its stretch of the gridlines; side by side they run the chart's width. */}
              <View style={[styles.gridline, { top: 0 }]} />
              <View style={[styles.gridline, { top: BAR_HEIGHT / 2 }]} />
              <View style={[styles.gridline, { bottom: 0 }]} />
              <View style={[styles.bar, { height: (hour.precipitationMm / fullScale) * BAR_HEIGHT }]} />
            </View>
            <Text style={styles.amount}>{formatPrecipitation(hour.precipitationMm, settings.precipitationUnit, true)}</Text>
          </View>
        ))}
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
  // Margin rather than content padding, so the hours clip at the inset instead of the card edge.
  hours: {
    marginHorizontal: 14,
  },
  hour: {
    width: 62,
    alignItems: 'center',
    gap: 3,
  },
  time: {
    color: Palette.textMuted,
    fontSize: 13,
  },
  // The bars stand on a common baseline, with the amounts in a row beneath it.
  chart: {
    alignSelf: 'stretch',
    alignItems: 'center',
    height: BAR_HEIGHT,
    justifyContent: 'flex-end',
    marginVertical: 4,
  },
  gridline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  amount: {
    color: Palette.text,
    fontSize: 12,
  },
  bar: {
    width: 26,
    backgroundColor: Palette.rain,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
});
