import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
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

/**
 * The home screen's dropdown menu, drawn over the screen by the screen itself. Render it last and
 * only while open. It is not a Modal: on the web a Modal moves to the end of the page and traps
 * focus there, and on an iPhone the open menu sometimes stopped answering taps altogether, items
 * and backdrop alike.
 */
export function Menu({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Android's back button closes the menu rather than leaving the screen, as it did for the Modal.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [onClose]);

  return (
    <View style={styles.overlay}>
      {/* A sibling behind the menu rather than around it, so a tap on an item is only the item's. */}
      <Pressable accessibilityLabel="Close menu" style={StyleSheet.absoluteFill} onPress={onClose} />
      <View
        accessibilityRole="menu"
        style={[styles.menu, { marginTop: insets.top + HEADER_HEIGHT, marginLeft: insets.left }]}>
        {ITEMS.map((item) => (
          <Pressable
            key={item.route}
            accessibilityRole="menuitem"
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            onPress={() => {
              onClose();
              router.push(item.route);
            }}>
            {/* Not selectable: on the web a press that selects the label is cancelled, and on an
                iPhone a slightly long press selects it. */}
            <Text selectable={false} style={styles.itemText}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 10,
  },
  menu: {
    alignSelf: 'flex-start',
    userSelect: 'none',
    minWidth: 180,
    paddingVertical: 4,
    backgroundColor: Palette.headerSolid,
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
