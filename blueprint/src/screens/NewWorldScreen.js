import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { ScreenHeader, Button, Card } from '../components/UI';
import { C, SPACING, FONT, RADIUS } from '../constants/theme';
import { useGame } from '../context/AppContext';
import { matchTheme, WORLD_THEMES } from '../constants/catalog';

const EXAMPLES = [
  'Modern coastal neighborhood in California with white homes, palm trees, boutique shopping, and ocean cliffs.',
  'Luxury mountain town surrounded by pine forests and lakes.',
  'European village with stone streets and flower-covered cottages.',
  'Farmhouse community with vineyards, horse ranches, and rolling hills.',
];

export default function NewWorldScreen({ navigation }) {
  const { createWorld } = useGame();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  const preview = prompt.trim() ? matchTheme(prompt) : null;

  const handleGenerate = () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setTimeout(() => {
      const worldId = createWorld(prompt.trim());
      setGenerating(false);
      navigation.replace('World', { worldId });
    }, 900);
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScreenHeader title="New World" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={FONT.h2}>Describe your dream world</Text>
        <Text style={[FONT.bodyMuted, { marginTop: 6, marginBottom: SPACING.lg }]}>
          Blueprint generates terrain, roads, water, trees, parks, and empty lots to match.
        </Text>

        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="A coastal neighborhood with white homes and ocean cliffs..."
          placeholderTextColor={C.textFaint}
          multiline
          style={s.input}
        />

        {preview && (
          <Card style={[s.previewCard, { borderColor: preview.palette + '55', borderWidth: 1 }]}>
            <View style={s.previewHeader}>
              <View style={[s.previewGlyph, { backgroundColor: preview.palette + '22' }]}>
                <Icon name="map" size={20} color={preview.palette} />
              </View>
              <Text style={FONT.h3}>{preview.name}</Text>
            </View>
            <View style={s.tagRow}>
              {preview.features.map(f => (
                <View key={f} style={s.tag}><Text style={s.tagText}>{f}</Text></View>
              ))}
            </View>
          </Card>
        )}

        <Button
          label={generating ? 'Generating World...' : 'Generate World'}
          icon={generating ? undefined : 'sparkles'}
          onPress={handleGenerate}
          disabled={!prompt.trim() || generating}
          style={{ marginTop: SPACING.lg }}
        />
        {generating && <ActivityIndicator color={C.accent} style={{ marginTop: SPACING.md }} />}

        <Text style={[FONT.label, { marginTop: SPACING.xl, marginBottom: SPACING.sm }]}>TRY AN EXAMPLE</Text>
        {EXAMPLES.map(ex => (
          <TouchableOpacity key={ex} onPress={() => setPrompt(ex)} style={s.exampleRow}>
            <Icon name="chevron-right" size={16} color={C.textFaint} />
            <Text style={s.exampleText}>{ex}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  input: {
    backgroundColor: C.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border,
    padding: SPACING.md, minHeight: 100, textAlignVertical: 'top', fontSize: 15, color: C.text,
  },
  previewCard: { marginTop: SPACING.lg },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  previewGlyph: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: C.surfaceAlt, borderRadius: RADIUS.pill, paddingVertical: 5, paddingHorizontal: 10 },
  tagText: { ...FONT.caption, color: C.textMuted },
  exampleRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: SPACING.sm, gap: 6 },
  exampleText: { ...FONT.bodyMuted, flex: 1 },
});
