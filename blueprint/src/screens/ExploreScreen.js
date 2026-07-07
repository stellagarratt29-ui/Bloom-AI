import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import PhotoCard from '../components/PhotoCard';
import { Chip, ScreenHeader } from '../components/UI';
import { C, SPACING, FONT, RADIUS } from '../constants/theme';
import { useGame } from '../context/AppContext';
import { COMMUNITY_BUILDS } from '../constants/mockData';
import { STYLE_PRESETS } from '../constants/catalog';

const SORTS = ['Popular', 'Newest', 'Most Saved'];

export default function ExploreScreen({ navigation }) {
  const { communityLikes, communitySaves, toggleLike, toggleSave } = useGame();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
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
      <ScreenHeader title="Explore Community" onBack={!isDesktop ? () => navigation.canGoBack() && navigation.goBack() : undefined} />
      <View style={[s.filters, isDesktop && s.filtersDesktop]}>
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
      <ScrollView contentContainerStyle={[s.grid, isDesktop && s.gridDesktop]}>
        {builds.map(b => {
          const liked = !!communityLikes[b.id];
          const saved = !!communitySaves[b.id];
          return (
            <PhotoCard
              key={b.id}
              icon="home"
              accent={b.accent}
              height={190}
              title={b.title}
              subtitle={`by ${b.author}`}
              badge={b.isNew ? 'NEW' : undefined}
              style={isDesktop ? s.cardDesktop : s.cardMobile}
              onPress={() => navigation.navigate('BuildDetail', { buildId: b.id })}
            >
              <View style={s.actionsRow}>
                <TouchableOpacity style={s.actionBtn} onPress={() => toggleLike(b.id)}>
                  <Icon name={liked ? 'heart-fill' : 'heart'} size={14} color="#fff" />
                  <Text style={s.actionText}>{b.likes + (liked ? 1 : 0)}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.actionBtn} onPress={() => toggleSave(b.id)}>
                  <Icon name={saved ? 'bookmark-fill' : 'bookmark'} size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            </PhotoCard>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  filters: { paddingHorizontal: SPACING.lg },
  filtersDesktop: { paddingHorizontal: SPACING.xxl, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  grid: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl, flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  gridDesktop: { paddingHorizontal: SPACING.xxl, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  cardMobile: { width: '47%' },
  cardDesktop: { width: '23%', minWidth: 220 },
  actionsRow: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.32)', borderRadius: RADIUS.pill, paddingVertical: 4, paddingHorizontal: 8 },
  actionText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
