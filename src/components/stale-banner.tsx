import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/theme';

/** Says the weather shown is cached because the last refresh failed, and whether for want of a connection. */
export function StaleBanner({ offline }: { offline: boolean }) {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <MaterialIcons name={offline ? 'cloud-off' : 'error-outline'} size={20} color={Palette.ink} />
      <Text style={styles.text}>{offline ? 'Offline' : 'Update failed'} – using cached data</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.sun,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  text: {
    color: Palette.ink,
    fontSize: 15,
    fontWeight: '700',
  },
});
