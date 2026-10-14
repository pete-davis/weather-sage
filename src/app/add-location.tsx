import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { SkyBackground } from '@/components/sky-background';
import { searchPlaces } from '@/location';
import { useLocations } from '@/locations';
import { CARD_PADDING, Palette } from '@/theme';
import { placeKey, placeRegion, type Place } from '@/weather';

const SEARCH_DELAY_MS = 350;

export default function AddLocationScreen() {
  const router = useRouter();
  const { addPlace } = useLocations();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[] | null>(null);
  const [failed, setFailed] = useState(false);

  // Searches a moment after typing stops.
  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setResults(null);
      setFailed(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      searchPlaces(text)
        .then((places) => {
          if (cancelled) return;
          setResults(places);
          setFailed(false);
        })
        .catch(() => !cancelled && setFailed(true));
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const add = (place: Place) => {
    addPlace(place);
    router.dismissTo('/locations');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <SkyBackground />
      <ScreenHeader title="Add location" />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="City name"
          placeholderTextColor={Palette.textMuted}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
        />

        {failed && <Text style={styles.hint}>Search is unavailable. Check your connection.</Text>}
        {!failed && results?.length === 0 && <Text style={styles.hint}>No places found.</Text>}

        {results?.map((place) => (
          <Pressable
            key={placeKey(place)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.result, pressed && styles.resultPressed]}
            onPress={() => add(place)}>
            <Text style={styles.name}>{place.name}</Text>
            {!!placeRegion(place) && <Text style={styles.region}>{placeRegion(place)}</Text>}
          </Pressable>
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
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  input: {
    height: 48,
    backgroundColor: Palette.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    color: Palette.text,
    fontSize: 17,
  },
  result: {
    backgroundColor: Palette.card,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: CARD_PADDING,
  },
  resultPressed: {
    opacity: 0.8,
  },
  name: {
    color: Palette.text,
    fontSize: 18,
    fontWeight: '500',
  },
  region: {
    color: Palette.textMuted,
    fontSize: 13,
  },
  hint: {
    marginTop: 12,
    color: Palette.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
