import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/theme';

type Action = {
  icon: ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  onPress: () => void;
};

/** Header bar for screens reached from the home screen: back arrow, title, optional buttons on the right. */
export function ScreenHeader({ title, actions = [] }: { title: string; actions?: Action[] }) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={8}
        style={styles.button}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
        <MaterialIcons name="arrow-back" size={26} color={Palette.text} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          hitSlop={8}
          style={styles.button}
          onPress={action.onPress}>
          <MaterialIcons name={action.icon} size={28} color={Palette.text} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: Palette.header,
  },
  button: {
    padding: 6,
  },
  title: {
    flex: 1,
    marginLeft: 12,
    color: Palette.text,
    fontSize: 20,
  },
});
