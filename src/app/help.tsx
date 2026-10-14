import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { SkyBackground } from '@/components/sky-background';
import { CARD_PADDING, Palette } from '@/theme';

type Topic = {
  icon: ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  points: string[];
};

const TOPICS: Topic[] = [
  {
    icon: 'home',
    title: 'Home screen',
    points: [
      'The top section shows the current temperature, conditions, wind and how long ago the weather was updated. Tap it to see the details for today.',
      'Hourly forecast shows the next 24 hours, with wind speed and the chance of rain for each hour. Scroll it sideways to see more.',
      'Hourly Precipitation appears only when rain or snow is falling or expected in the coming hours.',
      'Daily Forecast lists yesterday, today and the week ahead, with each day’s high and low, rain or snow, hours of sunshine and wind. Tap a day for its details.',
      'Pull the screen down to refresh the weather.',
    ],
  },
  {
    icon: 'palette',
    title: 'Colours and badges',
    points: [
      'Temperatures turn orange when it is hot, red when it is very hot, and blue near freezing.',
      'An orange badge on a day’s rainfall means heavy rain is expected.',
    ],
  },
  {
    icon: 'today',
    title: 'Day details',
    points: [
      'Each day has its own page with an hourly forecast, sunrise and sunset, the moon’s phase, and the date of the next full moon. Moonrise and moonset show for the next three days when you add a WeatherAPI key in Settings.',
    ],
  },
  {
    icon: 'place',
    title: 'Locations',
    points: [
      'Open the menu by tapping the Weather Sage icon in the top-left corner, then choose Locations.',
      'Tap + to search for a town or city and save it. Tap any saved location to show its weather.',
      'Tap the location button in the top-right corner of the home screen at any time to go back to the weather where you are.',
    ],
  },
  {
    icon: 'settings',
    title: 'Settings',
    points: [
      'Switch all units between metric and imperial at once, or choose temperature, wind and precipitation units separately.',
      'Turn on “Show both °C and °F” to see the other temperature unit as well.',
      'Choose how long cached weather is kept for offline use.',
      'The weather comes from Open-Meteo by default. Add your own free WeatherAPI key under “Weather service” to use WeatherAPI for the next three days.',
    ],
  },
  {
    icon: 'cloud-off',
    title: 'Using it offline',
    points: [
      'The last weather downloaded for each location is kept on your device, so you can still check the forecast without a connection.',
      'When the weather shown is not fresh, a yellow banner says so, and “Last update” tells you how old it is.',
    ],
  },
];

export default function HelpScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <SkyBackground />
      <ScreenHeader title="Help" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {TOPICS.map((topic) => (
          <View key={topic.title} style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name={topic.icon} size={24} color={Palette.rain} />
              <Text style={styles.cardTitle}>{topic.title}</Text>
            </View>
            {topic.points.map((point) => (
              <View key={point} style={styles.point}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.pointText}>{point}</Text>
              </View>
            ))}
          </View>
        ))}
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
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  card: {
    gap: 8,
    backgroundColor: Palette.card,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: CARD_PADDING,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  cardTitle: {
    color: Palette.text,
    fontSize: 18,
    fontWeight: '500',
  },
  point: {
    flexDirection: 'row',
    gap: 8,
  },
  bullet: {
    color: Palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  pointText: {
    flex: 1,
    color: Palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
