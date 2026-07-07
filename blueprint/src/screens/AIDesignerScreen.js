import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { ScreenHeader, Button, Card } from '../components/UI';
import { C, SPACING, FONT, RADIUS } from '../constants/theme';
import { useGame } from '../context/AppContext';
import { matchStyle, STYLE_PRESETS, PIECES, ROOM_TYPES, COLORS } from '../constants/catalog';

const STYLE_PALETTE = {
  'modern-farmhouse': ['Warm White', 'Sage', 'Charcoal'],
  'coastal':          ['Warm White', 'Slate Blue', 'Sand'],
  'scandinavian':      ['Warm White', 'Stone Grey', 'Black'],
  'cottage':          ['Blush', 'Cream', 'Sage'],
  'mediterranean':    ['Terracotta', 'Sand', 'Olive'],
  'minimalist':       ['Charcoal', 'Warm White', 'Stone Grey'],
  'mountain-lodge':   ['Charcoal', 'Rust', 'Olive'],
  'french-country':   ['Rust', 'Cream', 'Sage'],
  'luxury-estate':    ['Butter', 'Charcoal', 'Navy'],
  'tiny-home':        ['Warm White', 'Sage', 'Sand'],
  'family-home':      ['Slate Blue', 'Cream', 'Stone Grey'],
};

const EXAMPLES = [
  'Warm California coastal living room with white oak floors and cream furniture.',
  'Cozy Scandinavian bedroom with soft neutrals and natural wood.',
  'Mediterranean dining room with terracotta tones and warm lighting.',
];

export default function AIDesignerScreen({ navigation, route }) {
  const { worldId, lotId, roomId } = route.params;
  const { worlds, setRoomCells, awardXP } = useGame();
  const [prompt, setPrompt] = useState('');
  const [working, setWorking] = useState(false);

  const world = worlds.find(w => w.id === worldId);
  const lot = world?.lots.find(l => l.id === lotId);
  const room = lot?.rooms.find(r => r.id === roomId);
  const style = prompt.trim() ? matchStyle(prompt) : null;

  if (!room) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <ScreenHeader title="AI Designer" onBack={() => navigation.goBack()} />
        <Text style={[FONT.bodyMuted, { textAlign: 'center', marginTop: SPACING.xxl }]}>No room selected.</Text>
      </SafeAreaView>
    );
  }

  const generate = () => {
    if (!prompt.trim() || working) return;
    setWorking(true);
    setTimeout(() => {
      const matched = matchStyle(prompt);
      const rt = ROOM_TYPES.find(r => r.id === room.typeId) || ROOM_TYPES[0];
      const palette = STYLE_PALETTE[matched.id] || COLORS.slice(0, 3).map(c => c.name);
      const candidates = PIECES.filter(p => rt.categories.includes(p.category));

      const cells = {};
      let i = 0;
      const positions = [];
      for (let y = 0; y < room.gridH; y++) for (let x = 0; x < room.gridW; x++) positions.push([x, y]);
      const border = positions.filter(([x, y]) => x === 0 || y === 0 || x === room.gridW - 1 || y === room.gridH - 1);
      const interior = positions.filter(([x, y]) => !(x === 0 || y === 0 || x === room.gridW - 1 || y === room.gridH - 1));
      const spots = [...border, ...interior];

      const count = Math.min(candidates.length, Math.max(6, Math.floor((room.gridW * room.gridH) / 3)));
      for (let n = 0; n < count && n < spots.length; n++) {
        const piece = candidates[n % candidates.length];
        const [x, y] = spots[n];
        const color = palette[n % palette.length];
        cells[`${x},${y}`] = { pieceId: piece.id, color, material: piece.materials[0] };
      }

      setRoomCells(worldId, lotId, roomId, cells);
      awardXP(15);
      setWorking(false);
      navigation.goBack();
    }, 1100);
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScreenHeader title="AI Designer" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.badge}>
          <Icon name="sparkles" size={16} color={C.accentDeep} />
          <Text style={s.badgeText}>Furnishing "{room.name}"</Text>
        </View>
        <Text style={[FONT.h2, { marginTop: SPACING.md }]}>Describe the vibe</Text>
        <Text style={[FONT.bodyMuted, { marginTop: 6, marginBottom: SPACING.lg }]}>
          Blueprint will automatically furnish this room. You can edit every item afterward.
        </Text>

        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Warm coastal living room with cream furniture and natural light..."
          placeholderTextColor={C.textFaint}
          multiline
          style={s.input}
        />

        {style && (
          <Card style={[s.previewCard, { borderColor: style.accent + '55', borderWidth: 1 }]}>
            <View style={s.previewHeader}>
              <View style={[s.previewGlyph, { backgroundColor: style.accent + '22' }]}><Icon name="star" size={18} color={style.accent} /></View>
              <Text style={FONT.h3}>{style.name}</Text>
            </View>
            <View style={s.swatchRow}>
              {(STYLE_PALETTE[style.id] || []).map(cn => {
                const hex = COLORS.find(c => c.name === cn)?.hex;
                return <View key={cn} style={[s.swatch, { backgroundColor: hex }]} />;
              })}
            </View>
          </Card>
        )}

        <Button
          label={working ? 'Furnishing Room...' : 'Furnish Room'}
          icon={working ? undefined : 'sparkles'}
          onPress={generate}
          disabled={!prompt.trim() || working}
          style={{ marginTop: SPACING.lg }}
        />
        {working && <ActivityIndicator color={C.accent} style={{ marginTop: SPACING.md }} />}

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
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.accentSoft, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: RADIUS.pill, gap: 6 },
  badgeText: { ...FONT.caption, color: C.accentDeep, fontWeight: '700' },
  input: {
    backgroundColor: C.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border,
    padding: SPACING.md, minHeight: 100, textAlignVertical: 'top', fontSize: 15, color: C.text,
  },
  previewCard: { marginTop: SPACING.lg },
  previewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  previewGlyph: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  swatchRow: { flexDirection: 'row', gap: 8 },
  swatch: { width: 28, height: 28, borderRadius: 8 },
  exampleRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: SPACING.sm, gap: 6 },
  exampleText: { ...FONT.bodyMuted, flex: 1 },
});
