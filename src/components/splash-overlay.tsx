import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, useWindowDimensions } from 'react-native';

import { Palette } from '@/theme';

const SHOW_MS = 3000;
const FADE_MS = 400;
const MAX_ICON_WIDTH = 260;
// splash-icon.png is the rounded tile, slightly wider than it is tall.
const ICON_ASPECT = 1193 / 1135;

/**
 * Covers the app for a few seconds on launch with the icon, name and a spinner, while the
 * screens underneath load. It takes over from the native splash, which it hides once drawn.
 */
export function SplashOverlay() {
  const { width } = useWindowDimensions();
  const [opacity] = useState(() => new Animated.Value(1));
  const [fading, setFading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true);
      Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start(() =>
        setDone(true),
      );
    }, SHOW_MS);
    return () => clearTimeout(timer);
  }, [opacity]);

  if (done) return null;

  const iconWidth = Math.min(MAX_ICON_WIDTH, width * 0.6);

  return (
    <Animated.View
      style={[styles.overlay, { opacity }, fading && styles.passThrough]}
      onLayout={() => SplashScreen.hide()}
      accessibilityLabel="Weather Sage is loading">
      <Image
        source={require('@/assets/images/splash-icon.png')}
        style={{ width: iconWidth, height: iconWidth / ICON_ASPECT }}
      />
      <Text style={styles.name}>Weather Sage</Text>
      <ActivityIndicator size="large" color={Palette.text} style={styles.spinner} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.splash,
  },
  passThrough: {
    pointerEvents: 'none',
  },
  name: {
    marginTop: 24,
    color: Palette.text,
    fontSize: 34,
    fontWeight: '500',
  },
  spinner: {
    marginTop: 40,
  },
});
