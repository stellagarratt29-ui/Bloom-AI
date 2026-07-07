import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import PhotoCard from '../components/PhotoCard';
import { ScreenHeader, Button, Card } from '../components/UI';
import { C, SPACING, FONT, RADIUS } from '../constants/theme';
import { useGame } from '../context/AppContext';
import { matchTheme, ENVIRONMENT_TILES, TIME_OF_DAY, SEASONS, WEATHER } from '../constants/catalog';

function PickerRow({ icon, label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: SPACING.sm }}>
      <TouchableOpacity style={s.pickerRow} onPress={() => setOpen(v => !v)}>
        <Icon name={icon} size={16} color={C.textMuted} />
        <Text style={[FONT.body, { flex: 1, marginLeft: SPACING.sm }]}>{label}</Text>
        <Text style={s.pickerValue}>{value}</Text>
        <Icon name={open ? 'chevron-down' : 'chevron-right'} size={16} color={C.textFaint} style={{ marginLeft: 6 }} />
      </TouchableOpacity>
      {open && (
        <View style={s.pickerOptions}>
          {options.map(opt => (
            <TouchableOpacity key={opt} style={s.pickerOption} onPress={() => { onChange(opt); setOpen(false); }}>
              <Text style={[FONT.bodyMuted, value === opt && { color: C.accent, fontWeight: '700' }]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function NewWorldScreen({ navigation }) {
  const { createWorld } = useGame();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
  const [prompt, setPrompt] = useState('');
  const [envId, setEnvId] = useState(null);
  const [timeOfDay, setTimeOfDay] = useState('Golden Hour');
  const [season, setSeason] = useState('Summer');
  const [weather, setWeather] = useState('Clear');
  const [generating, setGenerating] = useState(false);

  const matched = envId ? ENVIRONMENT_TILES.find(t => t.id === envId) : (prompt.trim() ? matchTheme(prompt) : null);

  const handleGenerate = () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setTimeout(() => {
      const worldId = createWorld(prompt.trim(), matched, { timeOfDay, season, weather });
      setGenerating(false);
      navigation.replace('World', { worldId });
    }, 900);
  };

  const Left = (
    <View style={{ flex: 1 }}>
      <Text style={FONT.h2}>Describe the world you want to build</Text>
      <TextInput
        value={prompt}
        onChangeText={setPrompt}
        placeholder="Coastal California village with modern homes, palm trees, ocean cliffs, cute coffee shops and a boutique shopping district."
        placeholderTextColor={C.textFaint}
        multiline
        maxLength={200}
        style={[s.input, { marginTop: SPACING.md }]}
      />
      <Text style={s.charCount}>{prompt.length}/200</Text>

      <Text style={[FONT.label, { marginTop: SPACING.lg, marginBottom: SPACING.sm }]}>CHOOSE ENVIRONMENT</Text>
      <View style={s.envGrid}>
        {ENVIRONMENT_TILES.map(env => (
          <PhotoCard
            key={env.id}
            icon={env.icon}
            accent={env.palette}
            height={80}
            title={env.name}
            style={[s.envTile, envId === env.id && s.envTileActive]}
            onPress={() => setEnvId(env.id)}
          />
        ))}
      </View>

      <Text style={[FONT.label, { marginTop: SPACING.xl, marginBottom: SPACING.sm }]}>CUSTOMIZE</Text>
      <Card style={{ padding: SPACING.md }}>
        <PickerRow icon="sun" label="Time of Day" value={timeOfDay} options={TIME_OF_DAY} onChange={setTimeOfDay} />
        <PickerRow icon="tree" label="Season" value={season} options={SEASONS} onChange={setSeason} />
        <PickerRow icon="cloud" label="Weather" value={weather} options={WEATHER} onChange={setWeather} />
      </Card>
    </View>
  );

  const Right = (
    <View style={isDesktop ? s.previewPanel : { marginTop: SPACING.xl }}>
      <Text style={FONT.label}>WORLD PREVIEW</Text>
      <PhotoCard
        icon={matched ? matched.icon : 'map'}
        accent={matched ? matched.palette : C.borderStrong}
        height={isDesktop ? 320 : 200}
        style={{ marginTop: SPACING.sm }}
        title={matched ? matched.name : 'Describe a world to preview it'}
        subtitle={matched ? matched.features.slice(0, 2).join(' · ') : undefined}
      />
      <Button
        label={generating ? 'Generating...' : 'Generate World'}
        icon={generating ? undefined : 'sparkles'}
        onPress={handleGenerate}
        disabled={!prompt.trim() || generating}
        style={{ marginTop: SPACING.lg }}
      />
      <Button label="Randomize" variant="ghost" onPress={() => setEnvId(ENVIRONMENT_TILES[Math.floor(Math.random() * ENVIRONMENT_TILES.length)].id)} style={{ marginTop: SPACING.sm, alignSelf: 'center' }} />
      {generating && <ActivityIndicator color={C.accent} style={{ marginTop: SPACING.md }} />}
    </View>
  );

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScreenHeader title="Create New World" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[s.scroll, isDesktop && s.scrollDesktop]} keyboardShouldPersistTaps="handled">
        {isDesktop ? (
          <View style={s.columns}>
            <View style={{ flex: 1.3 }}>{Left}</View>
            <View style={{ flex: 1 }}>{Right}</View>
          </View>
        ) : (
          <>{Left}{Right}</>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  scrollDesktop: { paddingHorizontal: SPACING.xxl, maxWidth: 1100, width: '100%', alignSelf: 'center' },
  columns: { flexDirection: 'row', gap: SPACING.xxl },
  previewPanel: {},
  input: {
    backgroundColor: C.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border,
    padding: SPACING.md, minHeight: 90, textAlignVertical: 'top', fontSize: 15, color: C.text,
  },
  charCount: { ...FONT.caption, textAlign: 'right', marginTop: 4 },
  envGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  envTile: { width: '31%' },
  envTileActive: { borderWidth: 3, borderColor: C.accent },
  pickerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  pickerValue: { ...FONT.bodyMuted, fontWeight: '600' },
  pickerOptions: { paddingLeft: 26, paddingBottom: 6 },
  pickerOption: { paddingVertical: 6 },
});
