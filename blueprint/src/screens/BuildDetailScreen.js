import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { ScreenHeader, Button, Avatar, Card } from '../components/UI';
import { C, SPACING, FONT, RADIUS } from '../constants/theme';
import { useGame } from '../context/AppContext';
import { COMMUNITY_BUILDS } from '../constants/mockData';

export default function BuildDetailScreen({ navigation, route }) {
  const { buildId } = route.params;
  const build = COMMUNITY_BUILDS.find(b => b.id === buildId);
  const { communityLikes, communitySaves, followingCreators, toggleLike, toggleSave, toggleFollow, addToBoard, boards } = useGame();

  if (!build) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <ScreenHeader title="Build" onBack={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  const liked = !!communityLikes[build.id];
  const saved = !!communitySaves[build.id];
  const following = !!followingCreators[build.author];

  const saveToBoard = () => {
    toggleSave(build.id);
    if (!saved) addToBoard(boards[0].id, { kind: 'build', refId: build.id, title: build.title, accent: build.accent, category: build.style });
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScreenHeader title="Build" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: SPACING.xxl }}>
        <View style={[s.hero, { backgroundColor: build.accent + '22' }]}>
          <Icon name="home" size={48} color={build.accent} />
        </View>
        <View style={s.body}>
          <Text style={FONT.h1}>{build.title}</Text>
          <View style={s.authorRow}>
            <Avatar name={build.author} size={34} color={build.accent} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={FONT.h3}>{build.author}</Text>
              <Text style={FONT.bodyMuted}>{build.style}</Text>
            </View>
            <Button label={following ? 'Following' : 'Follow'} variant={following ? 'secondary' : 'primary'} onPress={() => toggleFollow(build.author)} />
          </View>

          <View style={s.statsRow}>
            <TouchableOpacity style={s.statBtn} onPress={() => toggleLike(build.id)}>
              <Icon name={liked ? 'heart-fill' : 'heart'} size={20} color={liked ? C.accent : C.textMuted} />
              <Text style={s.statNum}>{build.likes + (liked ? 1 : 0)}</Text>
              <Text style={FONT.caption}>Likes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.statBtn} onPress={saveToBoard}>
              <Icon name={saved ? 'bookmark-fill' : 'bookmark'} size={20} color={saved ? C.accent : C.textMuted} />
              <Text style={s.statNum}>{build.saves + (saved ? 1 : 0)}</Text>
              <Text style={FONT.caption}>Saves</Text>
            </TouchableOpacity>
            <View style={s.statBtn}>
              <Icon name="download" size={20} color={C.textMuted} />
              <Text style={s.statNum}>Import</Text>
              <Text style={FONT.caption}>Floor Plan</Text>
            </View>
          </View>

          <Card style={{ marginTop: SPACING.lg }}>
            <Text style={FONT.h3}>About this build</Text>
            <Text style={[FONT.bodyMuted, { marginTop: 6 }]}>
              A {build.style.toLowerCase()} design by {build.author}, shared with the Blueprint community. Save it to your
              inspiration board or import the shell to start customizing right away.
            </Text>
          </Card>

          <Text style={[FONT.label, { marginTop: SPACING.xl, marginBottom: SPACING.sm }]}>COMMENTS</Text>
          <Card>
            <Text style={FONT.bodyMuted}>Comments are coming soon — for now, likes and saves keep the community running.</Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  hero: { height: 200, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: SPACING.xl, backgroundColor: C.surface, borderRadius: RADIUS.lg, paddingVertical: SPACING.md },
  statBtn: { alignItems: 'center' },
  statNum: { ...FONT.h3, marginTop: 4 },
});
