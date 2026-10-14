import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import type { ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { SkyBackground } from '@/components/sky-background';
import { Palette } from '@/theme';

const ICON_SIZE = 140;

type Feature = {
  icon: ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  text: string;
};

const FEATURES: Feature[] = [
  {
    icon: 'block',
    title: 'No ads',
    text: 'Not one. Old Man Weather tried selling umbrellas once and didn’t care for it. Every bit of the screen is weather.',
  },
  {
    icon: 'visibility-off',
    title: 'No snooping',
    text: 'No accounts, no tracking, no analytics. Your places and settings stay on your device. Your position is only used to look up the forecast and the name of where you are, and the old man keeps no notes.',
  },
  {
    icon: 'hiking',
    title: 'Works off the grid',
    text: 'The latest forecast is tucked away on your device, so you can still check it halfway up a mountain or anywhere else the signal gave up.',
  },
  {
    icon: 'self-improvement',
    title: 'No nonsense',
    text: 'What it’s doing now, what it’ll do later, and the week ahead, all on one screen. More detail is a tap away for the curious. Everyone else can get on with their day.',
  },
  {
    icon: 'savings',
    title: 'Free as fresh air',
    text: 'Forecasts come from Open-Meteo, with no sign-up and no fee. Fancy a second opinion? Add your own WeatherAPI key in Settings.',
  },
];

export default function AboutScreen() {
  const version = Constants.expoConfig?.version;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <SkyBackground />
      <ScreenHeader title="About" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.icon}
            accessibilityLabel="Weather Sage icon"
          />
          <Text style={styles.name}>Weather Sage</Text>
          <Text style={styles.tagline}>The weather, plainly told.</Text>
          {version && <Text style={styles.version}>Version {version}</Text>}
        </View>

        <Text style={styles.intro}>
          Old Man Weather has been at this a long time. He doesn’t do breathless headlines, flashing banners or ten
          different ways to say “cloudy”. He looks at the sky, tells you what it’s going to do, and gets back to his nap.
        </Text>
        <Text style={styles.intro}>
          Weather Sage works the same way: the conditions now, the next 24 hours and the week ahead, for wherever you
          are or the places you care about. Nothing you didn’t ask for.
        </Text>

        {FEATURES.map((feature) => (
          <View key={feature.title} style={styles.card}>
            <MaterialIcons name={feature.icon} size={28} color={Palette.rain} />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{feature.title}</Text>
              <Text style={styles.cardBody}>{feature.text}</Text>
            </View>
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
    paddingTop: 32,
    paddingBottom: 24,
  },
  hero: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE * 0.22,
    marginBottom: 10,
  },
  name: {
    color: Palette.text,
    fontSize: 30,
    fontWeight: '500',
  },
  tagline: {
    color: Palette.text,
    fontSize: 17,
    fontStyle: 'italic',
  },
  version: {
    color: Palette.textMuted,
    fontSize: 14,
  },
  intro: {
    color: Palette.text,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: Palette.card,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: Palette.text,
    fontSize: 17,
    fontWeight: '500',
  },
  cardBody: {
    color: Palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
