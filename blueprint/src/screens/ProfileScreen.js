import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { ScreenHeader, Card, Avatar, ProgressBar, SectionHeader, Button } from '../components/UI';
import { C, SPACING, FONT, RADIUS } from '../constants/theme';
import { useGame } from '../context/AppContext';

export default function ProfileScreen({ navigation }) {
  const { profile, worlds } = useGame();
  const totalLots = worlds.reduce((s, w) => s + w.lots.length, 0);
  const xpToNext = profile.level * 200;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScreenHeader title="Profile" right={
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Icon name="settings" size={20} color={C.text} />
        </TouchableOpacity>
      } />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxl }}>
        <View style={s.headerRow}>
          <Avatar name={profile.name} size={64} />
          <View style={{ marginLeft: SPACING.md, flex: 1 }}>
            <Text style={FONT.h2}>{profile.name}</Text>
            <Text style={FONT.bodyMuted}>{profile.bio}</Text>
          </View>
        </View>

        <View style={s.statsRow}>
          <View style={s.statItem}><Text style={FONT.h3}>{worlds.length}</Text><Text style={FONT.caption}>Worlds</Text></View>
          <View style={s.statItem}><Text style={FONT.h3}>{totalLots}</Text><Text style={FONT.caption}>Lots Built</Text></View>
          <View style={s.statItem}><Text style={FONT.h3}>{profile.followers}</Text><Text style={FONT.caption}>Followers</Text></View>
          <View style={s.statItem}><Text style={FONT.h3}>{profile.following}</Text><Text style={FONT.caption}>Following</Text></View>
        </View>

        <Card style={{ marginTop: SPACING.lg }}>
          <View style={s.levelRow}>
            <Text style={FONT.label}>LEVEL {profile.level}</Text>
            <Text style={FONT.caption}>{profile.xp} / {xpToNext} XP</Text>
          </View>
          <ProgressBar progress={profile.xp / xpToNext} />
          <Text style={[FONT.bodyMuted, { marginTop: SPACING.sm }]}>
            Earn XP by building, decorating, completing challenges, and winning competitions.
          </Text>
        </Card>

        <View style={{ marginTop: SPACING.xl }}>
          <SectionHeader title="My Worlds" />
          {worlds.length === 0 ? (
            <Card><Text style={FONT.bodyMuted}>You haven't started a world yet.</Text></Card>
          ) : worlds.map(w => (
            <TouchableOpacity key={w.id} onPress={() => navigation.navigate('World', { worldId: w.id })}>
              <Card style={s.worldRow}>
                <View style={[s.worldGlyph, { backgroundColor: w.theme.palette + '22' }]}><Icon name="map" size={18} color={w.theme.palette} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={FONT.h3}>{w.name}</Text>
                  <Text style={FONT.bodyMuted}>{w.lots.length} lot{w.lots.length === 1 ? '' : 's'}</Text>
                </View>
                <Icon name="chevron-right" size={18} color={C.textFaint} />
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ marginTop: SPACING.xl, gap: SPACING.sm }}>
          <Button label="Friends" icon="users" variant="secondary" onPress={() => navigation.navigate('Friends')} />
          <Button label="Inspiration Boards" icon="bookmark" variant="secondary" onPress={() => navigation.navigate('InspirationBoard')} />
          <Button label="Notifications" icon="bell" variant="secondary" onPress={() => navigation.navigate('Notifications')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xl, backgroundColor: C.surface, borderRadius: RADIUS.lg, paddingVertical: SPACING.md },
  statItem: { alignItems: 'center', flex: 1 },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  worldRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  worldGlyph: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
