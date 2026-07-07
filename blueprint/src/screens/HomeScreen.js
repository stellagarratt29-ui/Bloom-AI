import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import PhotoCard from '../components/PhotoCard';
import { Button, ProgressBar, SectionHeader } from '../components/UI';
import { C, SPACING, FONT, RADIUS } from '../constants/theme';
import { useGame } from '../context/AppContext';
import { COMMUNITY_BUILDS, DESIGN_CHALLENGES } from '../constants/mockData';

export default function HomeScreen({ navigation }) {
  const { profile, worlds, activeWorldId } = useGame();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
  const activeWorld = worlds.find(w => w.id === activeWorldId) || worlds[0];
  const featured = COMMUNITY_BUILDS.slice(0, 3);
  const xpToNext = profile.level * 200;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView contentContainerStyle={[s.scroll, isDesktop && s.scrollDesktop]} showsVerticalScrollIndicator={false}>
        {!isDesktop && (
          <View style={s.topRow}>
            <View>
              <Text style={FONT.logo}>BLUEPRINT</Text>
              <Text style={FONT.caption}>Design your dream world.</Text>
            </View>
            <View style={s.topIcons}>
              <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Notifications')}>
                <Icon name="bell" size={18} color={C.text} />
              </TouchableOpacity>
              <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Settings')}>
                <Icon name="settings" size={18} color={C.text} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <PhotoCard
          icon={activeWorld ? 'home' : 'plus-circle'}
          accent={activeWorld ? activeWorld.theme.palette : C.accent}
          height={isDesktop ? 320 : 200}
          style={{ marginTop: isDesktop ? 0 : SPACING.lg }}
          overlay={false}
        >
          <View style={s.heroTopBar}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={s.heroIconBtn} onPress={() => navigation.navigate('Notifications')}>
              <Icon name="bell" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={s.heroIconBtn} onPress={() => navigation.navigate('Settings')}>
              <Icon name="settings" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={s.heroBottom}>
            <Text style={s.heroKicker}>{activeWorld ? 'Continue Building' : 'Start Your First World'}</Text>
            <Text style={s.heroTitle}>{activeWorld ? activeWorld.name : 'Describe your dream world'}</Text>
            <Button
              label={activeWorld ? 'Open Project' : 'Start Building'}
              icon="chevron-right"
              onPress={() => activeWorld ? navigation.navigate('World', { worldId: activeWorld.id }) : navigation.navigate('NewWorld')}
              style={{ alignSelf: 'flex-start', marginTop: SPACING.sm, backgroundColor: '#fff' }}
            />
          </View>
        </PhotoCard>

        <View style={{ marginTop: SPACING.lg }}>
          <View style={s.levelRow}>
            <Text style={FONT.label}>LEVEL {profile.level}</Text>
            <Text style={FONT.caption}>{profile.xp} / {xpToNext} XP</Text>
          </View>
          <ProgressBar progress={profile.xp / xpToNext} />
        </View>

        <View style={{ marginTop: SPACING.xl }}>
          <SectionHeader title="Featured Builds" action="See All" onAction={() => navigation.navigate('ExploreTab')} />
          <View style={[s.featuredRow, isDesktop && s.featuredRowDesktop]}>
            {featured.map(b => (
              <PhotoCard
                key={b.id}
                icon="home"
                accent={b.accent}
                height={150}
                title={b.title}
                subtitle={`by ${b.author} · ♥ ${b.likes}`}
                style={isDesktop ? s.featuredCardDesktop : s.featuredCardMobile}
                onPress={() => navigation.navigate('BuildDetail', { buildId: b.id })}
              />
            ))}
          </View>
        </View>

        <View style={{ marginTop: SPACING.xl, marginBottom: SPACING.xxl }}>
          <SectionHeader title="This Week's Challenges" action="See all" onAction={() => navigation.navigate('Challenges')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {DESIGN_CHALLENGES.slice(0, 3).map(c => (
              <View key={c.id} style={s.challengeCard}>
                <Text style={FONT.h3} numberOfLines={1}>{c.title}</Text>
                <Text style={[FONT.bodyMuted, { marginTop: 4 }]} numberOfLines={2}>{c.desc}</Text>
                <Text style={[FONT.caption, { marginTop: SPACING.md, color: C.accent }]}>{c.endsInDays}d left · {c.entries} entries</Text>
              </View>
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
  scrollDesktop: { paddingHorizontal: SPACING.xxl, paddingTop: SPACING.xl, maxWidth: 1100, width: '100%', alignSelf: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: SPACING.sm },
  topIcons: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  heroTopBar: { flexDirection: 'row', padding: SPACING.md, gap: 8 },
  heroIconBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.28)', alignItems: 'center', justifyContent: 'center' },
  heroBottom: { padding: SPACING.lg },
  heroKicker: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '700' },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  featuredRow: { gap: SPACING.md },
  featuredRowDesktop: { flexDirection: 'row' },
  featuredCardMobile: { marginBottom: SPACING.md },
  featuredCardDesktop: { flex: 1 },
  challengeCard: { width: 220, marginRight: SPACING.md, backgroundColor: C.surface, borderRadius: RADIUS.lg, padding: SPACING.lg },
});
