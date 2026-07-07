import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { Card, Avatar, ProgressBar, SectionHeader } from '../components/UI';
import { C, SPACING, FONT, RADIUS } from '../constants/theme';
import { useGame } from '../context/AppContext';
import { COMMUNITY_BUILDS, DESIGN_CHALLENGES } from '../constants/mockData';

const QUICK_ACTIONS = [
  { key: 'Explore', label: 'Explore Community', icon: 'compass', color: C.sky, soft: C.skySoft },
  { key: 'Challenges', label: 'Design Challenges', icon: 'award', color: C.gold, soft: C.goldSoft },
  { key: 'Inspiration', label: 'Inspiration', icon: 'sparkles', color: C.clay, soft: C.claySoft },
  { key: 'Marketplace', label: 'Marketplace', icon: 'shopping-bag', color: C.sage, soft: C.sageSoft },
  { key: 'Friends', label: 'Friends', icon: 'users', color: C.accent, soft: C.accentSoft },
];

export default function HomeScreen({ navigation }) {
  const { profile, worlds, activeWorldId } = useGame();
  const activeWorld = worlds.find(w => w.id === activeWorldId) || worlds[0];
  const [galleryIndex, setGalleryIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setGalleryIndex(i => (i + 1) % COMMUNITY_BUILDS.length);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, []);

  const featured = COMMUNITY_BUILDS[galleryIndex];
  const xpToNext = profile.level * 200;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.topRow}>
          <View>
            <Text style={FONT.bodyMuted}>Welcome back</Text>
            <Text style={FONT.h1}>{profile.name}</Text>
          </View>
          <View style={s.topIcons}>
            <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Notifications')}>
              <Icon name="bell" size={20} color={C.text} />
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Messages')}>
              <Icon name="mail" size={20} color={C.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Avatar name={profile.name} size={38} />
            </TouchableOpacity>
          </View>
        </View>

        <Card style={{ marginTop: SPACING.lg }}>
          <View style={s.levelRow}>
            <Text style={FONT.label}>LEVEL {profile.level}</Text>
            <Text style={FONT.caption}>{profile.xp} / {xpToNext} XP</Text>
          </View>
          <ProgressBar progress={profile.xp / xpToNext} />
        </Card>

        <Card style={{ marginTop: SPACING.lg, padding: 0, overflow: 'hidden' }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => activeWorld ? navigation.navigate('World', { worldId: activeWorld.id }) : navigation.navigate('NewWorld')}
            style={s.continueCard}
          >
            <View style={[s.continueGlyph, { backgroundColor: activeWorld ? activeWorld.theme.palette + '22' : C.accentSoft }]}>
              <Icon name={activeWorld ? 'map' : 'plus-circle'} size={26} color={activeWorld ? activeWorld.theme.palette : C.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={FONT.h3}>{activeWorld ? 'Continue Building' : 'Start Your First World'}</Text>
              <Text style={FONT.bodyMuted} numberOfLines={1}>
                {activeWorld ? `${activeWorld.name} · ${activeWorld.lots.length} lot${activeWorld.lots.length === 1 ? '' : 's'}` : 'Describe your dream world and Blueprint will build it'}
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={C.textFaint} />
          </TouchableOpacity>
        </Card>

        <View style={{ marginTop: SPACING.xl }}>
          <SectionHeader title="Today's Inspiration" />
          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('BuildDetail', { buildId: featured.id })}>
            <Card style={[s.galleryCard, { borderColor: featured.accent + '55', borderWidth: 1 }]}>
              <View style={[s.galleryGlyph, { backgroundColor: featured.accent + '22' }]}>
                <Icon name="home" size={32} color={featured.accent} />
              </View>
              <Text style={FONT.h3}>{featured.title}</Text>
              <Text style={FONT.bodyMuted}>by {featured.author} · {featured.style}</Text>
              <View style={s.galleryStats}>
                <Icon name="heart" size={13} color={C.textFaint} />
                <Text style={s.galleryStatText}>{featured.likes}</Text>
                <Icon name="bookmark" size={13} color={C.textFaint} style={{ marginLeft: 12 }} />
                <Text style={s.galleryStatText}>{featured.saves}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: SPACING.xl }}>
          <SectionHeader title="Explore Blueprint" />
          <View style={s.quickGrid}>
            {QUICK_ACTIONS.map(a => (
              <TouchableOpacity key={a.key} style={s.quickItem} activeOpacity={0.85} onPress={() => navigation.navigate(a.key)}>
                <View style={[s.quickGlyph, { backgroundColor: a.soft }]}>
                  <Icon name={a.icon} size={20} color={a.color} />
                </View>
                <Text style={s.quickLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ marginTop: SPACING.xl, marginBottom: SPACING.xxl }}>
          <SectionHeader title="This Week's Challenges" action="See all" onAction={() => navigation.navigate('Challenges')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {DESIGN_CHALLENGES.slice(0, 3).map(c => (
              <Card key={c.id} style={s.challengeCard}>
                <Text style={FONT.h3} numberOfLines={1}>{c.title}</Text>
                <Text style={[FONT.bodyMuted, { marginTop: 4 }]} numberOfLines={2}>{c.desc}</Text>
                <Text style={[FONT.caption, { marginTop: SPACING.md, color: C.accent }]}>{c.endsInDays}d left · {c.entries} entries</Text>
              </Card>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm },
  topIcons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  continueCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, gap: SPACING.md },
  continueGlyph: { width: 52, height: 52, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  galleryCard: { alignItems: 'center', paddingVertical: SPACING.xl },
  galleryGlyph: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  galleryStats: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm },
  galleryStatText: { ...FONT.caption, marginLeft: 4 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  quickItem: { width: '31%', alignItems: 'center', backgroundColor: C.surface, borderRadius: RADIUS.md, paddingVertical: SPACING.md },
  quickGlyph: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  quickLabel: { ...FONT.caption, textAlign: 'center', color: C.textMuted, fontWeight: '600', paddingHorizontal: 4 },
  challengeCard: { width: 220, marginRight: SPACING.md },
});
