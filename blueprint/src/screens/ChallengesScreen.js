import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { ScreenHeader, Card, Button } from '../components/UI';
import { C, SPACING, FONT, RADIUS } from '../constants/theme';
import { DESIGN_CHALLENGES } from '../constants/mockData';
import { useGame } from '../context/AppContext';

export default function ChallengesScreen({ navigation }) {
  const { worlds, activeWorldId, awardXP } = useGame();
  const activeWorld = worlds.find(w => w.id === activeWorldId) || worlds[0];

  const enter = (challenge) => {
    if (!activeWorld || !activeWorld.lots.length) {
      navigation.navigate('NewWorld');
      return;
    }
    awardXP(20);
    navigation.navigate('Build', { worldId: activeWorld.id, lotId: activeWorld.lots[0].id });
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScreenHeader title="Design Challenges" onBack={() => navigation.canGoBack() && navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        {DESIGN_CHALLENGES.map(c => (
          <Card key={c.id} style={{ marginBottom: SPACING.md }}>
            <View style={s.rowTop}>
              <View style={s.glyph}><Icon name="award" size={20} color={C.gold} /></View>
              <View style={{ flex: 1 }}>
                <Text style={FONT.h3}>{c.title}</Text>
                <Text style={FONT.bodyMuted}>{c.desc}</Text>
              </View>
            </View>
            <View style={s.metaRow}>
              <Text style={FONT.caption}>{c.endsInDays}d left</Text>
              <Text style={FONT.caption}>·  {c.entries} entries</Text>
              <Text style={[FONT.caption, { color: C.accent }]}>·  {c.prize}</Text>
            </View>
            <Button label="Enter Challenge" variant="secondary" onPress={() => enter(c)} style={{ marginTop: SPACING.md, alignSelf: 'flex-start' }} />
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  rowTop: { flexDirection: 'row', gap: SPACING.md },
  glyph: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center' },
  metaRow: { flexDirection: 'row', gap: 6, marginTop: SPACING.sm, flexWrap: 'wrap' },
});
