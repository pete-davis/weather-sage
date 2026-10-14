import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import type { ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
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
    text: 'Nothing to scroll past and nothing trying to sell you something. Just the weather.',
  },
  {
    icon: 'privacy-tip',
    title: 'No data collection',
    text: 'No accounts, no tracking and no analytics. Your locations and settings stay on your device, and your position is only used to look up the forecast.',
  },
  {
    icon: 'cloud-off',
    title: 'Works offline',
    text: 'The latest forecast is kept on your device, so you can still check it with a weak signal or none at all.',
  },
  {
    icon: 'spa',
    title: 'Simple',
    text: 'One clear screen with what you need to plan your day, and more detail a tap away.',
  },
];

export default function AboutScreen() {
  const version = Constants.expoConfig?.version;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScreenHeader title="About" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.icon}
            accessibilityLabel="Weather Sage icon"
          />
          <Text style={styles.name}>Weather Sage</Text>
          {version && <Text style={styles.version}>Version {version}</Text>}
        </View>

        <Text style={styles.intro}>
          Weather Sage is a calm, honest weather app. It shows the conditions now, the next 24 hours and the week ahead
          for wherever you are or the places you care about, without the clutter of mainstream weather apps.
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
