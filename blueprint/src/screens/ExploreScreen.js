import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { Card, Chip, ScreenHeader } from '../components/UI';
import { C, SPACING, FONT, RADIUS } from '../constants/theme';
import { useGame } from '../context/AppContext';
import { COMMUNITY_BUILDS } from '../constants/mockData';
import { STYLE_PRESETS } from '../constants/catalog';

const SORTS = ['Popular', 'Newest', 'Most Saved'];

export default function ExploreScreen({ navigation }) {
  const { communityLikes, communitySaves, toggleLike, toggleSave } = useGame();
  const [styleFilter, setStyleFilter] = useState(null);
  const [sort, setSort] = useState('Popular');

  const builds = useMemo(() => {
    let list = COMMUNITY_BUILDS.filter(b => !styleFilter || b.style === styleFilter);
    if (sort === 'Popular') list = [...list].sort((a, b) => b.likes - a.likes);
    if (sort === 'Newest') list = [...list].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    if (sort === 'Most Saved') list = [...list].sort((a, b) => b.saves - a.saves);
    return list;
  }, [styleFilter, sort]);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScreenHeader title="Explore" />
      <View style={{ paddingHorizontal: SPACING.lg }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.sm }}>
          {SORTS.map(so => <Chip key={so} label={so} active={sort === so} onPress={() => setSort(so)} />)}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
          <Chip label="All Styles" active={!styleFilter} onPress={() => setStyleFilter(null)} />
          {STYLE_PRESETS.map(st => (
            <Chip key={st.id} label={st.name} active={styleFilter === st.name} onPress={() => setStyleFilter(st.name)} color={st.accent} />
          ))}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={s.grid}>
        {builds.map(b => {
          const liked = !!communityLikes[b.id];
          const saved = !!communitySaves[b.id];
          return (
            <TouchableOpacity key={b.id} style={s.card} activeOpacity={0.88} onPress={() => navigation.navigate('BuildDetail', { buildId: b.id })}>
              <View style={[s.thumb, { backgroundColor: b.accent + '22' }]}>
                <Icon name="home" size={26} color={b.accent} />
                {b.isNew && <View style={s.newBadge}><Text style={s.newBadgeText}>NEW</Text></View>}
              </View>
              <Text style={FONT.h3} numberOfLines={1}>{b.title}</Text>
              <Text style={FONT.bodyMuted} numberOfLines={1}>by {b.author}</Text>
              <View style={s.actionsRow}>
                <TouchableOpacity style={s.actionBtn} onPress={() => toggleLike(b.id)}>
                  <Icon name={liked ? 'heart-fill' : 'heart'} size={15} color={liked ? C.accent : C.textFaint} />
                  <Text style={s.actionText}>{b.likes + (liked ? 1 : 0)}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.actionBtn} onPress={() => toggleSave(b.id)}>
                  <Icon name={saved ? 'bookmark-fill' : 'bookmark'} size={15} color={saved ? C.accent : C.textFaint} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  grid: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl, flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  card: { width: '47%', backgroundColor: C.surface, borderRadius: RADIUS.lg, padding: SPACING.md },
  thumb: { height: 90, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  newBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: C.accent, borderRadius: RADIUS.pill, paddingVertical: 2, paddingHorizontal: 8 },
  newBadgeText: { color: C.textOnAccent, fontSize: 10, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm, gap: SPACING.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { ...FONT.caption },
});
