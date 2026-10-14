import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
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

type ButtonProps = { label: string; onPress: () => void; primary?: boolean; disabled?: boolean };

function Button({ label, onPress, primary, disabled }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.option,
        styles.optionStacked,
        primary && styles.optionSelected,
        disabled && styles.optionDisabled,
        pressed && styles.optionPressed,
      ]}
      onPress={onPress}>
      <Text style={[styles.optionText, primary && styles.optionTextSelected]}>{label}</Text>
    </Pressable>
  );
}

// Stands in for a saved key. Always the same length, so it gives away nothing about the key.
const HIDDEN_KEY = '•'.repeat(16);

function WeatherApiKey() {
  const { settings, updateSettings } = useSettings();
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<KeyStatus>(null);
  const [shown, setShown] = useState(false);
  const key = draft.trim();
  const saved = settings.weatherApiKey;

  // A key is saved only once WeatherAPI accepts it, so a typo cannot leave the app without weather.
  async function save() {
    if (!key) return;
    setStatus('checking');
    try {
      if (!(await isWeatherApiKeyValid(key))) {
        setStatus('invalid');
        return;
      }
      updateSettings({ weatherApiKey: key });
      setDraft('');
      setShown(false);
      setStatus(null);
    } catch {
      setStatus('unreachable');
    }
  }

  function remove() {
    setShown(false);
    setStatus(null);
    updateSettings({ weatherApiKey: '' });
  }

  return (
    <View style={[styles.card, styles.cardStacked]}>
      <Text style={styles.cardTitle}>WeatherAPI key</Text>
      {saved ? (
        <>
          <Text style={styles.cardDetail}>
            Saved. Today and the next two days come from WeatherAPI; later days still come from Open-Meteo.
          </Text>
          <Text style={[styles.keyText, !shown && styles.keyHidden]} selectable={shown}>
            {shown ? saved : HIDDEN_KEY}
          </Text>
          <View style={styles.options}>
            <Button label={shown ? 'Hide key' : 'Show key'} onPress={() => setShown(!shown)} />
            <Button label="Remove" onPress={remove} />
          </View>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={(text) => {
              setDraft(text);
              setStatus(null);
            }}
            onSubmitEditing={save}
            placeholder="Paste your WeatherAPI key"
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
            <Button label="Save" primary disabled={!key || status === 'checking'} onPress={save} />
          </View>
        </>
      )}
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
        <View style={[styles.card, styles.cardStacked]}>
          <Text style={styles.cardDetail}>
            Weather Sage uses Open-Meteo by default. It is free and needs no key.
          </Text>
          <Text style={styles.cardDetail}>
            For more accurate forecasts, you can add your own API key for one of these weather services:
          </Text>
          <Text style={styles.serviceName}>
            WeatherAPI <Text style={styles.cardDetail}>· weatherapi.com</Text>
          </Text>
          <Text style={styles.cardDetail}>
            Free and paid plans. Covers today and the next two days, and adds moonrise and moonset.
          </Text>
        </View>
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
  serviceName: {
    color: Palette.text,
    fontSize: 16,
    fontWeight: '600',
  },
  keyText: {
    color: Palette.text,
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  keyHidden: {
    color: Palette.textMuted,
    letterSpacing: 2,
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
