import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { generateScreenInsight } from '../services/ai';

const MOCK_SCREEN_TIME = '3h 42m';
const MOCK_UNLOCKS = 28;

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

        <Text style={[s.title, { color: C.skyDark }]}>Screen{'\n'}Awareness</Text>
        <Text style={[s.sub, { color: t.subtext }]}>Awareness is the first step.</Text>

        <View style={s.statsRow}>
          <View style={[s.statCard, { backgroundColor: C.pillMintBg, borderColor: C.pillMintBg }]}>
            <Feather name="clock" size={18} color={C.mintDark} style={{ marginBottom: 6 }} />
            <Text style={[s.statValue, { color: C.mintDark }]}>{MOCK_SCREEN_TIME}</Text>
            <Text style={[s.statLabel, { color: C.mintDark }]}>Screen time today</Text>
            <Text style={[s.statNote, { color: C.mintDark, opacity: 0.6 }]}>Mock data</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: C.pillPinkBg, borderColor: C.pillPinkBg }]}>
            <Feather name="unlock" size={18} color={C.pinkDark} style={{ marginBottom: 6 }} />
            <Text style={[s.statValue, { color: C.pinkDark }]}>{MOCK_UNLOCKS}</Text>
            <Text style={[s.statLabel, { color: C.pinkDark }]}>Unlocks today</Text>
            <Text style={[s.statNote, { color: C.pinkDark, opacity: 0.6 }]}>Mock data</Text>
          </View>
        </View>

        <View style={[s.insightCard, { backgroundColor: t.card, borderColor: t.border }]}>
          <Text style={[s.insightLabel, { color: C.sky }]}>BLOOM NOTICED</Text>
          {loadingInsight
            ? <ActivityIndicator size="small" color={C.sky} style={{ marginVertical: 8 }} />
            : <Text style={[s.insightText, { color: t.text }]}>{insight}</Text>}
        </View>

        {redirectHobbies.length > 0 && (
          <>
            <Text style={[s.redirectLabel, { color: t.subtext }]}>INSTEAD, WORK ON</Text>
            <View style={s.redirectRow}>
              {redirectHobbies.map(h => (
                <View key={h.id} style={[s.redirectChip, { backgroundColor: t.card, borderColor: t.border }]}>
                  <Feather name="sun" size={20} color={C.moss} style={{ marginBottom: 6 }} />
                  <Text style={[s.redirectText, { color: t.text }]}>{h.name}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={[s.noteCard, { backgroundColor: t.sagePale, borderColor: C.sageLight }]}>
          <Feather name="info" size={14} color={t.subtext} style={{ marginRight: 8, marginTop: 1 }} />
          <Text style={[s.noteText, { color: t.subtext }]}>
            Screen time and unlock data shown here is currently mocked. Real data requires native device APIs — Bloom never blocks or restricts any app.
          </Text>
        </View>

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
  sub: { fontSize: 14, lineHeight: 22, marginBottom: 24 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  statCard: {
    flex: 1, borderRadius: 18,
    padding: 18, alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  statValue: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3, textAlign: 'center' },
  statNote:  { fontSize: 10, marginTop: 4 },

  insightCard: {
    borderRadius: 18, padding: 18,
    borderWidth: 1, marginBottom: 22,
    borderLeftWidth: 4, borderLeftColor: C.sky,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  insightLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.3, marginBottom: 10 },
  insightText:  { fontSize: 14, lineHeight: 22 },

  redirectLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 12,
  },
  redirectRow: { flexDirection: 'row', gap: 10, marginBottom: 22, flexWrap: 'wrap' },
  redirectChip: {
    flex: 1, minWidth: 80, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 1,
  },
  redirectText: { fontSize: 13, fontWeight: '600' },

  noteCard: {
    flexDirection: 'row', borderRadius: 14,
    padding: 14, borderWidth: 1,
  },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
