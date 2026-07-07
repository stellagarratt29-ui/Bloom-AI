import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { ScreenHeader, Chip, Button } from '../components/UI';
import { C, SPACING, FONT, RADIUS } from '../constants/theme';
import { useGame } from '../context/AppContext';
import { INSPIRATION_ITEMS } from '../constants/mockData';
import { STYLE_PRESETS } from '../constants/catalog';

export default function InspirationScreen({ navigation }) {
  const [category, setCategory] = useState(null);
  const { addToBoard, boards, worlds, activeWorldId } = useGame();
  const items = useMemo(() => INSPIRATION_ITEMS.filter(i => !category || i.category === category), [category]);
  const activeWorld = worlds.find(w => w.id === activeWorldId) || worlds[0];

  const save = (item) => addToBoard(boards[0].id, { kind: 'layout', refId: item.id, title: item.title, accent: item.accent, category: item.category });

  const importShell = (item) => {
    if (activeWorld && activeWorld.lots.length) {
      navigation.navigate('Build', { worldId: activeWorld.id, lotId: activeWorld.lots[0].id });
    } else {
      navigation.navigate('NewWorld');
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScreenHeader title="Inspiration" onBack={() => navigation.canGoBack() && navigation.goBack()}
        right={<TouchableOpacity onPress={() => navigation.navigate('InspirationBoard')}><Icon name="bookmark" size={20} color={C.text} /></TouchableOpacity>} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow}>
        <Chip label="All Styles" active={!category} onPress={() => setCategory(null)} />
        {STYLE_PRESETS.map(st => (
          <Chip key={st.id} label={st.name} active={category === st.name} onPress={() => setCategory(st.name)} color={st.accent} />
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={s.grid}>
        {items.map(item => (
          <View key={item.id} style={s.card}>
            <View style={[s.thumb, { backgroundColor: item.accent + '22' }]}>
              <Icon name="home" size={26} color={item.accent} />
            </View>
            <Text style={FONT.h3} numberOfLines={1}>{item.title}</Text>
            <Text style={FONT.bodyMuted} numberOfLines={1}>{item.category}</Text>
            <View style={s.actions}>
              <TouchableOpacity style={s.actionBtn} onPress={() => save(item)}>
                <Icon name="bookmark" size={14} color={C.accent} />
                <Text style={s.actionText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actionBtn} onPress={() => importShell(item)}>
                <Icon name="download" size={14} color={C.accent} />
                <Text style={s.actionText}>Import</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  chipRow: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  grid: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl, flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  card: { width: '47%', backgroundColor: C.surface, borderRadius: RADIUS.lg, padding: SPACING.md },
  thumb: { height: 90, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  actions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { ...FONT.caption, color: C.accent, fontWeight: '700' },
});
