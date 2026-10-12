import { createIconSet } from '@expo/vector-icons';

// Glyphs from Erik Flowers' Weather Icons font; code points are from its weather-icons.css.
const GLYPHS = {
  'day-sunny': 0xf00d,
  'day-sunny-overcast': 0xf00c,
  'day-cloudy': 0xf002,
  'night-clear': 0xf02e,
  'night-alt-partly-cloudy': 0xf081,
  'night-alt-cloudy': 0xf086,
  cloudy: 0xf013,
  fog: 0xf014,
  sprinkle: 0xf01c,
  'rain-mix': 0xf017,
  rain: 0xf019,
  showers: 0xf01a,
  snow: 0xf01b,
  thunderstorm: 0xf01e,
  hail: 0xf015,
  raindrop: 0xf078,
  'direction-up': 0xf058,
  na: 0xf07b,
};

export type WeatherIconName = keyof typeof GLYPHS;

// Glyph widths as a fraction of the font size, measured from the font. The glyphs are
// far from square, so a size has to allow for this to hit a given width.
const WIDTHS: Partial<Record<WeatherIconName, number>> = {
  'day-sunny': 1.11,
  'day-sunny-overcast': 1.24,
  'day-cloudy': 1.4,
  'night-clear': 0.74,
  'night-alt-partly-cloudy': 0.86,
  'night-alt-cloudy': 1.13,
  cloudy: 1.16,
  fog: 1.29,
  sprinkle: 1.08,
  'rain-mix': 1.08,
  rain: 1.08,
  showers: 1.09,
  snow: 1.08,
  thunderstorm: 1.08,
  hail: 1.08,
  na: 0.85,
};

/** The largest font size, up to `max`, at which the icon is no wider than `max`. */
export function iconSizeWithin(name: WeatherIconName, max: number) {
  return Math.round(max / Math.max(1, WIDTHS[name] ?? 1));
}

export const WeatherIcon = createIconSet(GLYPHS, 'weathericons', require('@/assets/fonts/weathericons.ttf'));
