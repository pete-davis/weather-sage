import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { WeatherIcon } from '@/components/weather-icon';
import { Palette } from '@/theme';
import { clockTime } from '@/units';

const HEIGHT = 110;
// Room at the ends for the sun to sit on the horizon, and above for it at noon.
const INSET = 12;
const STEPS = 48;

// "2026-10-13T07:26" -> minutes since midnight
function minutesOf(time: string) {
  return Number(time.slice(11, 13)) * 60 + Number(time.slice(14, 16));
}

type SunArcProps = {
  /** Local times, as "YYYY-MM-DDTHH:MM". */
  sunrise: string;
  sunset: string;
  /** The local time now, if the arc is for today, to mark where the sun is. */
  now?: string;
};

/** The sun's path from sunrise to sunset as an arch, filled in up to the time now. */
export function SunArc({ sunrise, sunset, now }: SunArcProps) {
  const [width, setWidth] = useState(0);

  const rise = minutesOf(sunrise);
  const set = minutesOf(sunset);
  const daylight = set - rise;
  // How much of the day's arc is behind the sun: none before sunrise, all of it after sunset.
  const progress = now === undefined ? null : Math.min(1, Math.max(0, (minutesOf(now) - rise) / daylight));
  const up = progress !== null && progress > 0 && progress < 1;

  const horizon = HEIGHT - INSET / 2;
  const point = (t: number) => ({
    x: INSET + t * (width - 2 * INSET),
    y: horizon - Math.sin(Math.PI * t) * (horizon - INSET),
  });
  const path = (from: number, to: number) =>
    Array.from({ length: STEPS + 1 }, (_, i) => point(from + ((to - from) * i) / STEPS))
      .map(({ x, y }, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
      .join(' ');
  const sun = up ? point(progress) : null;

  return (
    <View style={styles.card}>
      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={{ height: HEIGHT }}>
        {width > 0 && (
          <Svg width={width} height={HEIGHT}>
            <Line x1={0} y1={horizon} x2={width} y2={horizon} stroke={Palette.textMuted} strokeOpacity={0.4} />
            <Path d={path(0, 1)} stroke={Palette.sun} strokeOpacity={0.45} strokeWidth={2} strokeDasharray="4 5" fill="none" />
            {!!progress && <Path d={path(0, progress)} stroke={Palette.sun} strokeWidth={3} fill="none" />}
            {sun && <Circle cx={sun.x} cy={sun.y} r={8} fill={Palette.sun} />}
          </Svg>
        )}
      </View>

      <View style={styles.labels}>
        <View style={styles.end}>
          <WeatherIcon name="sunrise" size={18} color={Palette.sun} style={styles.icon} />
          <Text style={styles.time}>{clockTime(sunrise.slice(11))}</Text>
        </View>
        <Text style={styles.daylight}>
          {Math.floor(daylight / 60)}h {daylight % 60}m of daylight
        </Text>
        <View style={styles.end}>
          <WeatherIcon name="sunset" size={18} color={Palette.sun} style={styles.icon} />
          <Text style={styles.time}>{clockTime(sunset.slice(11))}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.card,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 6,
  },
  labels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  end: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // The icon font's own line height is taller than the glyphs.
  icon: {
    lineHeight: 22,
  },
  time: {
    color: Palette.text,
    fontSize: 15,
    fontWeight: '600',
  },
  daylight: {
    color: Palette.textMuted,
    fontSize: 13,
  },
});
