import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, useWindowDimensions } from 'react-native';

import { SkyBackground } from '@/components/sky-background';
import { Palette } from '@/theme';

// While the splash screen is being designed it stays up for good. Set to false to let the app through.
const HOLD = false;
const SHOW_MS = 3000;
const FADE_MS = 400;
// Shown again for a reload, it stays at least this long, so it does not flash.
const RELOAD_MIN_MS = 1500;
// splash-art.png is the icon's artwork without its tile, centred on a square transparent canvas.
const MAX_ART_SIZE = 380;

type SplashContextValue = {
  /** Shows the splash while `work` runs, for at least a moment, then fades it out. */
  cover: (work: () => Promise<unknown>) => Promise<void>;
};

const SplashContext = createContext<SplashContextValue>({ cover: async (work) => void (await work()) });

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Covers the app for a few seconds on launch with the artwork, name and a spinner, while the
 * screens underneath load, taking over from the native splash, which it hides once drawn. Screens
 * can bring it back with useSplash, as the home screen does for a pull to reload.
 */
export function SplashProvider({ children }: { children: ReactNode }) {
  const [opacity] = useState(() => new Animated.Value(1));
  const [shown, setShown] = useState(true);
  const [fading, setFading] = useState(false);
  const launchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fadeOut = useCallback(() => {
    setFading(true);
    Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start(({ finished }) => {
      // A reload may have brought it back while it was fading.
      if (finished) setShown(false);
    });
  }, [opacity]);

  useEffect(() => {
    if (HOLD) return;
    launchTimer.current = setTimeout(fadeOut, SHOW_MS);
    return () => {
      if (launchTimer.current) clearTimeout(launchTimer.current);
    };
  }, [fadeOut]);

  const cover = useCallback(
    async (work: () => Promise<unknown>) => {
      if (launchTimer.current) clearTimeout(launchTimer.current);
      // Fully there at once, so nothing on the screen below shows through as it arrives.
      opacity.stopAnimation();
      opacity.setValue(1);
      setShown(true);
      setFading(false);
      try {
        await Promise.all([work(), wait(RELOAD_MIN_MS)]);
      } finally {
        if (!HOLD) fadeOut();
      }
    },
    [opacity, fadeOut],
  );

  return (
    <SplashContext.Provider value={{ cover }}>
      {children}
      {shown && <SplashOverlay opacity={opacity} fading={fading} />}
    </SplashContext.Provider>
  );
}

export function useSplash() {
  return useContext(SplashContext);
}

function SplashOverlay({ opacity, fading }: { opacity: Animated.Value; fading: boolean }) {
  const { width, height } = useWindowDimensions();
  // As large as fits, leaving room for the name and spinner below it on a short screen.
  const artSize = Math.min(MAX_ART_SIZE, width * 0.85, height * 0.45);

  return (
    <Animated.View
      style={[styles.overlay, { opacity }, fading && styles.passThrough]}
      onLayout={() => SplashScreen.hide()}
      accessibilityLabel="Weather Sage is loading">
      <SkyBackground />
      <Image source={require('@/assets/images/splash-art.png')} style={{ width: artSize, height: artSize }} />
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
