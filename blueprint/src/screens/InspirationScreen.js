import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import PhotoCard from '../components/PhotoCard';
import { ScreenHeader, Chip } from '../components/UI';
import { C, SPACING, FONT, RADIUS } from '../constants/theme';
import { useGame } from '../context/AppContext';
import { INSPIRATION_ITEMS } from '../constants/mockData';
import { STYLE_PRESETS } from '../constants/catalog';

export default function InspirationScreen({ navigation }) {
  const [category, setCategory] = useState(null);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
  const { addToBoard, boards, worlds, activeWorldId } = useGame();
  const items = useMemo(() => INSPIRATION_ITEMS.filter(i => !category || i.category === category), [category]);
  const activeWorld = worlds.find(w => w.id === activeWorldId) || worlds[0];

  const save = (item) => addToBoard(boards[0].id, { kind: 'layout', refId: item.id, title: item.title, accent: item.accent, category: item.category });

  const importShell = () => {
    if (activeWorld && activeWorld.lots.length) {
      navigation.navigate('Build', { worldId: activeWorld.id, lotId: activeWorld.lots[0].id });
    } else {
      navigation.navigate('NewWorld');
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScreenHeader title="Layout Inspiration" onBack={() => navigation.canGoBack() && navigation.goBack()}
        right={<TouchableOpacity onPress={() => navigation.navigate('InspirationBoard')}><Icon name="bookmark" size={20} color={C.text} /></TouchableOpacity>} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[s.chipRow, isDesktop && s.chipRowDesktop]}>
        <Chip label="All Styles" active={!category} onPress={() => setCategory(null)} />
        {STYLE_PRESETS.map(st => (
          <Chip key={st.id} label={st.name} active={category === st.name} onPress={() => setCategory(st.name)} color={st.accent} />
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={[s.grid, isDesktop && s.gridDesktop]}>
        {items.map(item => (
          <PhotoCard
            key={item.id}
            icon="home"
            accent={item.accent}
            height={180}
            title={item.title}
            subtitle={item.category}
            style={isDesktop ? s.cardDesktop : s.cardMobile}
          >
            <View style={s.actions}>
              <TouchableOpacity style={s.actionBtn} onPress={() => save(item)}>
                <Icon name="bookmark" size={13} color="#fff" />
                <Text style={s.actionText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actionBtn} onPress={importShell}>
                <Icon name="download" size={13} color="#fff" />
                <Text style={s.actionText}>Import</Text>
              </TouchableOpacity>
            </View>
          </PhotoCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  chipRow: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  chipRowDesktop: { paddingHorizontal: SPACING.xxl, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  grid: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl, flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  gridDesktop: { paddingHorizontal: SPACING.xxl, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  cardMobile: { width: '47%' },
  cardDesktop: { width: '23%', minWidth: 220 },
  actions: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', gap: 6 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.32)', borderRadius: RADIUS.pill, paddingVertical: 4, paddingHorizontal: 8 },
  actionText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
