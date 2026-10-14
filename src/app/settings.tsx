import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { IMPERIAL, METRIC, useSettings, usesSystem, type Settings, type UnitSystem } from '@/settings';
import { Palette } from '@/theme';
import { isWeatherApiKeyValid } from '@/weather';

type SegmentsProps<T extends string | number> = {
  title: string;
  options: { value: T; label: string }[];
  /** Null when none of the options is in effect. */
  selected: T | null;
  onSelect: (value: T) => void;
  /** Puts the options on a row of their own under the title, for more than fit beside it. */
  stacked?: boolean;
};

function Segments<T extends string | number>({ title, options, selected, onSelect, stacked }: SegmentsProps<T>) {
  return (
    <View style={[styles.card, stacked && styles.cardStacked]}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.options}>
        {options.map((option) => {
          const isSelected = selected === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              style={[styles.option, stacked && styles.optionStacked, isSelected && styles.optionSelected]}
              onPress={() => onSelect(option.value)}>
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type UnitChoiceProps<K extends keyof UnitSystem> = {
  title: string;
  setting: K;
  options: { value: Settings[K]; label: string }[];
};

function UnitChoice<K extends keyof UnitSystem>({ title, setting, options }: UnitChoiceProps<K>) {
  const { settings, updateSettings } = useSettings();
  return (
    <Segments
      title={title}
      options={options}
      selected={settings[setting]}
      onSelect={(value) => updateSettings({ [setting]: value })}
    />
  );
}

type KeyStatus = 'checking' | 'invalid' | 'unreachable' | null;

const KEY_STATUS_TEXT: Record<Exclude<KeyStatus, null>, string> = {
  checking: 'Checking the key…',
  invalid: 'WeatherAPI did not accept this key.',
  unreachable: 'Could not reach WeatherAPI to check the key. Check your connection.',
};

function WeatherApiKey() {
  const { settings, updateSettings } = useSettings();
  const [draft, setDraft] = useState(settings.weatherApiKey);
  const [status, setStatus] = useState<KeyStatus>(null);
  const key = draft.trim();
  const saved = settings.weatherApiKey;

  // A key is saved only once WeatherAPI accepts it, so a typo cannot leave the app without weather.
  async function save() {
    if (!key || key === saved) return;
    setStatus('checking');
    try {
      if (!(await isWeatherApiKeyValid(key))) {
        setStatus('invalid');
        return;
      }
      updateSettings({ weatherApiKey: key });
      setStatus(null);
    } catch {
      setStatus('unreachable');
    }
  }

  function remove() {
    setDraft('');
    setStatus(null);
    updateSettings({ weatherApiKey: '' });
  }

  return (
    <View style={[styles.card, styles.cardStacked]}>
      <Text style={styles.cardTitle}>WeatherAPI key</Text>
      <Text style={styles.cardDetail}>
        {saved
          ? 'Today and the next two days come from WeatherAPI with your key, including moonrise and moonset. Later days come from Open-Meteo.'
          : 'The weather comes from Open-Meteo, which is free and needs no key. To use WeatherAPI for today and the next two days, and to see moonrise and moonset, add your own key from weatherapi.com.'}
      </Text>
      <TextInput
        style={styles.input}
        value={draft}
        onChangeText={(text) => {
          setDraft(text);
          setStatus(null);
        }}
        onSubmitEditing={save}
        placeholder="Paste your key"
        placeholderTextColor={Palette.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        returnKeyType="done"
      />
      {status && (
        <Text style={[styles.cardDetail, status !== 'checking' && styles.error]}>{KEY_STATUS_TEXT[status]}</Text>
      )}
      <View style={styles.options}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !key || key === saved || status === 'checking' }}
          disabled={!key || key === saved || status === 'checking'}
          style={({ pressed }) => [
            styles.option,
            styles.optionStacked,
            styles.optionSelected,
            (!key || key === saved) && styles.optionDisabled,
            pressed && styles.optionPressed,
          ]}
          onPress={save}>
          <Text style={[styles.optionText, styles.optionTextSelected]}>{key && key === saved ? 'Saved' : 'Save'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !saved && !draft }}
          disabled={!saved && !draft}
          style={({ pressed }) => [
            styles.option,
            styles.optionStacked,
            !saved && !draft && styles.optionDisabled,
            pressed && styles.optionPressed,
          ]}
          onPress={remove}>
          <Text style={styles.optionText}>Remove</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { settings, updateSettings } = useSettings();
  const system = usesSystem(settings, METRIC) ? 'metric' : usesSystem(settings, IMPERIAL) ? 'imperial' : null;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Settings" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.section}>Units</Text>
        <Segments
          title="All units"
          options={[
            { value: 'metric', label: 'Metric' },
            { value: 'imperial', label: 'Imperial' },
          ]}
          selected={system}
          onSelect={(value) => updateSettings(value === 'metric' ? METRIC : IMPERIAL)}
        />

        <Text style={styles.section}>Temperature</Text>
        <UnitChoice
          title="Primary unit"
          setting="temperatureUnit"
          options={[
            { value: 'celsius', label: '°C' },
            { value: 'fahrenheit', label: '°F' },
          ]}
        />
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Show both °C and °F</Text>
          <Switch
            value={settings.showBothTemperatures}
            onValueChange={(value) => updateSettings({ showBothTemperatures: value })}
          />
        </View>

        <Text style={styles.section}>Other units</Text>
        <UnitChoice
          title="Wind speed"
          setting="windUnit"
          options={[
            { value: 'kmh', label: 'km/h' },
            { value: 'mph', label: 'mph' },
          ]}
        />
        <UnitChoice
          title="Precipitation"
          setting="precipitationUnit"
          options={[
            { value: 'mm', label: 'mm' },
            { value: 'inch', label: 'in' },
          ]}
        />

        <Text style={styles.section}>Cached weather</Text>
        <Segments
          title="Keep cached weather for"
          stacked
          options={[
            { value: 1, label: '1 day' },
            { value: 3, label: '3 days' },
            { value: 7, label: '7 days' },
            { value: 'never', label: 'Forever' },
          ]}
          selected={settings.cacheDays}
          onSelect={(value) => updateSettings({ cacheDays: value })}
        />

        <Text style={styles.section}>Weather service</Text>
        <WeatherApiKey />
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
    paddingBottom: 24,
  },
  section: {
    marginTop: 20,
    marginBottom: 4,
    color: Palette.text,
    fontSize: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 58,
    backgroundColor: Palette.card,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cardStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 10,
  },
  cardTitle: {
    color: Palette.text,
    fontSize: 17,
  },
  cardDetail: {
    color: Palette.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  error: {
    color: '#FF9F2E',
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.textMuted,
    paddingHorizontal: 12,
    color: Palette.text,
    fontSize: 16,
  },
  options: {
    flexDirection: 'row',
    gap: 6,
  },
  option: {
    minWidth: 60,
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.textMuted,
  },
  optionStacked: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 4,
  },
  optionSelected: {
    backgroundColor: Palette.text,
    borderColor: Palette.text,
  },
  optionDisabled: {
    opacity: 0.4,
  },
  optionPressed: {
    opacity: 0.7,
  },
  optionText: {
    color: Palette.text,
    fontSize: 15,
  },
  optionTextSelected: {
    color: Palette.card,
    fontWeight: '600',
  },
});
