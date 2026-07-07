import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { ScreenHeader, Card, Button, SectionHeader } from '../components/UI';
import { C, SPACING, FONT, RADIUS } from '../constants/theme';
import { useGame } from '../context/AppContext';

export default function WorldScreen({ navigation, route }) {
  const { worldId } = route.params;
  const { worlds, addLot, deleteLot } = useGame();
  const world = worlds.find(w => w.id === worldId);

  if (!world) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <ScreenHeader title="World" onBack={() => navigation.goBack()} />
        <Text style={[FONT.bodyMuted, { textAlign: 'center', marginTop: SPACING.xxl }]}>This world no longer exists.</Text>
      </SafeAreaView>
    );
  }

  const handleAddLot = () => {
    const lotId = addLot(world.id);
    navigation.navigate('Build', { worldId: world.id, lotId });
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScreenHeader title={world.name} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={s.scroll}>
        <Card style={[s.themeCard, { borderColor: world.theme.palette + '55', borderWidth: 1 }]}>
          <View style={s.themeHeader}>
            <View style={[s.themeGlyph, { backgroundColor: world.theme.palette + '22' }]}>
              <Icon name="map" size={22} color={world.theme.palette} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={FONT.h3}>{world.theme.name}</Text>
              {!!world.prompt && <Text style={FONT.bodyMuted} numberOfLines={2}>"{world.prompt}"</Text>}
            </View>
          </View>
          <View style={s.tagRow}>
            {world.theme.features.map(f => (
              <View key={f} style={s.tag}><Text style={s.tagText}>{f}</Text></View>
            ))}
          </View>
        </Card>

        <View style={{ marginTop: SPACING.xl }}>
          <SectionHeader title={`Lots (${world.lots.length})`} />
          {world.lots.map(lot => (
            <TouchableOpacity key={lot.id} activeOpacity={0.85} onPress={() => navigation.navigate('Build', { worldId: world.id, lotId: lot.id })}>
              <Card style={s.lotCard}>
                <View style={s.lotGlyph}>
                  <Icon name="home" size={20} color={C.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={FONT.h3}>{lot.name}</Text>
                  <Text style={FONT.bodyMuted}>{lot.rooms.length} room{lot.rooms.length === 1 ? '' : 's'} · {lot.exterior.roofStyle} roof</Text>
                </View>
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => deleteLot(world.id, lot.id)}
                >
                  <Icon name="trash-2" size={18} color={C.textFaint} />
                </TouchableOpacity>
              </Card>
            </TouchableOpacity>
          ))}
          <Button label="Add Lot" icon="plus" variant="secondary" onPress={handleAddLot} style={{ marginTop: SPACING.sm }} />
        </View>

        <View style={{ marginTop: SPACING.xl, marginBottom: SPACING.xxl }}>
          <SectionHeader title="Get Inspired" />
          <Button label="Browse Layout Inspiration" icon="sparkles" variant="secondary" onPress={() => navigation.navigate('Inspiration')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  themeCard: {},
  themeHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  themeGlyph: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: C.surfaceAlt, borderRadius: RADIUS.pill, paddingVertical: 5, paddingHorizontal: 10 },
  tagText: { ...FONT.caption, color: C.textMuted },
  lotCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  lotGlyph: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
});
