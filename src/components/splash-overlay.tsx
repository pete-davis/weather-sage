import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, useWindowDimensions } from 'react-native';

import { SkyBackground } from '@/components/sky-background';
import { Palette } from '@/theme';

// While the splash screen is being designed it stays up for good. Set to false to let the app through.
const HOLD = false;
const SHOW_MS = 3000;
const FADE_MS = 400;
// splash-art.png is the icon's artwork without its tile, centred on a square transparent canvas.
const MAX_ART_SIZE = 380;

/**
 * Covers the app for a few seconds on launch with the artwork, name and a spinner, while the
 * screens underneath load. It takes over from the native splash, which it hides once drawn.
 */
export function SplashOverlay() {
  const { width, height } = useWindowDimensions();
  const [opacity] = useState(() => new Animated.Value(1));
  const [fading, setFading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (HOLD) return;
    const timer = setTimeout(() => {
      setFading(true);
      Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start(() =>
        setDone(true),
      );
    }, SHOW_MS);
    return () => clearTimeout(timer);
  }, [opacity]);

  if (done) return null;

  // As large as fits, leaving room for the name and spinner below it on a short screen.
  const artSize = Math.min(MAX_ART_SIZE, width * 0.85, height * 0.45);

  return (
    <Animated.View
      style={[styles.overlay, { opacity }, fading && styles.passThrough]}
      onLayout={() => SplashScreen.hide()}
      accessibilityLabel="Weather Sage is loading">
      <SkyBackground />
      <Image
        source={require('@/assets/images/splash-art.png')}
        style={{ width: artSize, height: artSize }}
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
