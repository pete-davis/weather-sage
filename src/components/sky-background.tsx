import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { SkyGradient } from '@/theme';

/** The app icon's sky, filling the view it is placed in, behind everything else in it. Place it first. */
export function SkyBackground() {
  return (
    <LinearGradient
      colors={SkyGradient.colors}
      locations={SkyGradient.locations}
      style={styles.fill}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    inset: 0,
  },
});
