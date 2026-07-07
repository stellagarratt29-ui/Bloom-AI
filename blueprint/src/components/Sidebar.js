import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from './Icon';
import { Avatar } from './UI';
import { C, SPACING, FONT, RADIUS } from '../constants/theme';
import { useGame } from '../context/AppContext';

const NAV_ITEMS = [
  { key: 'continue', label: 'Continue Building', icon: 'home', go: (nav, activeWorld) => nav.navigate(activeWorld ? 'World' : 'NewWorld', activeWorld ? { worldId: activeWorld.id } : undefined) },
  { key: 'explore', label: 'Explore Community', icon: 'users', go: (nav) => nav.navigate('ExploreTab') },
  { key: 'inspiration', label: 'Inspiration', icon: 'sparkles', go: (nav) => nav.navigate('Inspiration') },
  { key: 'challenges', label: 'Design Challenges', icon: 'award', go: (nav) => nav.navigate('Challenges') },
  { key: 'marketplace', label: 'Marketplace', icon: 'shopping-bag', go: (nav) => nav.navigate('MarketplaceTab') },
  { key: 'friends', label: 'Friends', icon: 'users', go: (nav) => nav.navigate('Friends') },
  { key: 'messages', label: 'Messages', icon: 'message-circle', go: (nav) => nav.navigate('Messages') },
];

export default function Sidebar({ navigationRef, activeRouteName }) {
  const { profile, worlds, activeWorldId } = useGame();
  const activeWorld = worlds.find(w => w.id === activeWorldId) || worlds[0];

  return (
    <View style={s.sidebar}>
      <View>
        <Text style={FONT.logo}>BLUEPRINT</Text>
        <Text style={s.tagline}>Design your dream world.</Text>
      </View>

      <View style={{ marginTop: SPACING.xxl }}>
        {NAV_ITEMS.map(item => {
          const active = activeRouteName === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[s.navRow, active && s.navRowActive]}
              onPress={() => item.go(navigationRef, activeWorld)}
            >
              <Icon name={item.icon} size={17} color={active ? C.accent : C.textMuted} />
              <Text style={[s.navLabel, active && s.navLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={s.profileRow} onPress={() => navigationRef.navigate('ProfileTab')}>
        <Avatar name={profile.name} size={36} />
        <View style={{ marginLeft: SPACING.sm }}>
          <Text style={FONT.h3}>{profile.name}</Text>
          <Text style={FONT.caption}>Level {profile.level}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  sidebar: {
    width: 240, backgroundColor: C.surface, borderRightWidth: 1, borderRightColor: C.border,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.lg,
    justifyContent: 'space-between', height: '100%',
  },
  tagline: { ...FONT.caption, marginTop: 2 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 10, paddingHorizontal: 10, borderRadius: RADIUS.md, marginBottom: 2 },
  navRowActive: { backgroundColor: C.accentSoft },
  navLabel: { ...FONT.body, fontWeight: '600', color: C.textMuted, fontSize: 14 },
  navLabelActive: { color: C.accentDeep },
  profileRow: { flexDirection: 'row', alignItems: 'center', paddingTop: SPACING.lg, borderTopWidth: 1, borderTopColor: C.border },
});
