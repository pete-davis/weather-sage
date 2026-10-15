import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { CARD_PADDING, Palette } from '@/theme';

const DISMISSED_KEY = 'install-hint-dismissed';

/**
 * Whether this is the web app in a browser on an iPhone or iPad, not yet installed. iOS has no
 * install prompt for a site to show, and hides Add to Home Screen in the Share menu.
 */
function isUninstalledOnIOS() {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return false;
  // iPadOS reports itself as a Mac, but a Mac has no touch screen.
  const iOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const installed =
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
  return iOS && !installed;
}

/** Points iPhone and iPad users at Share, then Add to Home Screen, until they close it. */
export function InstallHint() {
  const router = useRouter();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!isUninstalledOnIOS()) return;
    AsyncStorage.getItem(DISMISSED_KEY)
      .then((dismissed) => setShown(!dismissed))
      .catch(() => setShown(true));
  }, []);

  if (!shown) return null;

  function dismiss() {
    setShown(false);
    AsyncStorage.setItem(DISMISSED_KEY, '1').catch(() => {});
  }

  return (
    <View style={styles.card}>
      <MaterialIcons name="ios-share" size={26} color={Palette.rain} />
      <Pressable
        accessibilityRole="link"
        accessibilityHint="Opens Help with the steps"
        style={styles.text}
        onPress={() => router.push('/help')}>
        <Text style={styles.title}>Install Weather Sage</Text>
        <Text style={styles.body}>
          Tap Share, scroll down and choose Add to Home Screen. <Text style={styles.link}>How?</Text>
        </Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} onPress={dismiss}>
        <MaterialIcons name="close" size={22} color={Palette.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.card,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: CARD_PADDING,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: Palette.text,
    fontSize: 16,
    fontWeight: '600',
  },
  body: {
    color: Palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    color: Palette.rain,
    textDecorationLine: 'underline',
  },
});
