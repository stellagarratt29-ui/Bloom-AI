import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { generateScreenInsight } from '../services/ai';

const MOCK_SCREEN_TIME = '3h 42m';
const MOCK_UNLOCKS = 28;

const HOBBY_EMOJIS = ['🎨', '🎵', '🌱', '✨', '🎯', '📚', '🏃', '🎭', '🍳', '💻', '📷', '🎸'];

export default function ScreenAwarenessScreen() {
  const { hobbies } = useApp();
  const { colors: t } = useTheme();
  const [insight, setInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(true);

  useEffect(() => {
    const hobbyNames = hobbies.map(h => h.name);
    generateScreenInsight({ screenTime: MOCK_SCREEN_TIME, unlocks: MOCK_UNLOCKS, hobbies: hobbyNames })
      .then(text => { setInsight(text); setLoadingInsight(false); })
      .catch(() => { setInsight('Noticing your patterns is the most useful first step.'); setLoadingInsight(false); });
  }, []);

  const redirectHobbies = hobbies.slice(0, 3);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={[s.title, { color: C.mintDark }]}>Screen{'\n'}Awareness</Text>
        <Text style={[s.sub, { color: t.subtext }]}>Awareness is the first step.</Text>

        <View style={s.statsRow}>
          <View style={s.statBlock}>
            <Text style={[s.statValue, { color: C.mintDark }]}>{MOCK_SCREEN_TIME}</Text>
            <Text style={[s.statLabel, { color: t.subtext }]}>SCREEN TIME</Text>
          </View>
          <View style={[s.statDivider, { backgroundColor: t.border }]} />
          <View style={s.statBlock}>
            <Text style={[s.statValue, { color: C.pinkDark }]}>{MOCK_UNLOCKS}</Text>
            <Text style={[s.statLabel, { color: t.subtext }]}>UNLOCKS</Text>
          </View>
        </View>

        <View style={[s.insightCard, { borderLeftColor: C.sky }]}>
          <Text style={[s.insightLabel, { color: C.sky }]}>BLOOM NOTICED</Text>
          {loadingInsight
            ? <ActivityIndicator size="small" color={C.sky} style={{ marginVertical: 8 }} />
            : <Text style={[s.insightText, { color: t.text }]}>{insight}</Text>}
        </View>

        {redirectHobbies.length > 0 && redirectHobbies.map((h, idx) => (
          <TouchableOpacity
            key={h.id}
            style={[s.redirectBtn, { borderColor: C.clay }]}
            activeOpacity={0.7}
          >
            <Text style={s.redirectEmoji}>{HOBBY_EMOJIS[idx % HOBBY_EMOJIS.length]}</Text>
            <Text style={[s.redirectText, { color: C.clay }]}>{h.name} instead?</Text>
          </TouchableOpacity>
        ))}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingHorizontal: 22, paddingTop: 22 },

  title: {
    fontSize: 30, fontWeight: '800', lineHeight: 38, marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined,
  },
  sub: { fontSize: 14, lineHeight: 22, marginBottom: 28 },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 28,
  },
  statBlock: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 40, marginHorizontal: 8 },
  statValue: { fontSize: 32, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },

  insightCard: {
    paddingLeft: 16, paddingVertical: 10,
    borderLeftWidth: 3, marginBottom: 24,
  },
  insightLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.3, marginBottom: 8 },
  insightText:  { fontSize: 14, lineHeight: 22 },

  redirectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: 20,
    paddingVertical: 14, paddingHorizontal: 20,
    marginBottom: 12,
  },
  redirectEmoji: { fontSize: 20 },
  redirectText: { fontSize: 15, fontWeight: '600' },
});
