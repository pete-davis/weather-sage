import { useRouter } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/theme';

// Height of the home screen's header bar, so the menu drops from its bottom edge.
const HEADER_HEIGHT = 54;

const ITEMS = [
  { label: 'Locations', route: '/locations' },
  { label: 'Settings', route: '/settings' },
  { label: 'Help', route: '/help' },
  { label: 'About', route: '/about' },
] as const;

export function Menu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Close menu" style={styles.backdrop} onPress={onClose}>
        <View style={[styles.menu, { marginTop: insets.top + HEADER_HEIGHT, marginLeft: insets.left }]}>
          {ITEMS.map((item) => (
            <Pressable
              key={item.route}
              accessibilityRole="menuitem"
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              onPress={() => {
                onClose();
                router.push(item.route);
              }}>
              <Text style={styles.itemText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  menu: {
    alignSelf: 'flex-start',
    minWidth: 180,
    paddingVertical: 4,
    backgroundColor: Palette.header,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    elevation: 8,
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.45)',
  },
  item: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  itemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  itemText: {
    color: Palette.text,
    fontSize: 16,
  },
});
