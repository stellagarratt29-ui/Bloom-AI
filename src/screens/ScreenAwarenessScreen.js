import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { generateScreenInsight } from '../services/ai';

// PLACEHOLDER: real screen time requires native device APIs not available in Expo Go/web.
// These values are mocked. Replace with actual ScreenTime/UsageStats API integration.
const MOCK_SCREEN_TIME = '3h 42m';
const MOCK_UNLOCKS = 28;

export default function ScreenAwarenessScreen({ navigation }) {
  const { hobbies } = useApp();
  const [insight, setInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(true);

  useEffect(() => {
    const hobbyNames = hobbies.map(h => h.name);
    generateScreenInsight({
      screenTime: MOCK_SCREEN_TIME,
      unlocks: MOCK_UNLOCKS,
      hobbies: hobbyNames,
    }).then(text => {
      setInsight(text);
      setLoadingInsight(false);
    }).catch(() => {
      setInsight('Noticing your patterns is the most useful first step.');
      setLoadingInsight(false);
    });
  }, []);

  // Redirect suggestions come from the user's actual saved hobbies
  const redirectHobbies = hobbies.slice(0, 3);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.title}>Screen{'\n'}Awareness</Text>
        <Text style={s.sub}>Awareness is the first step.</Text>

        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statValue}>{MOCK_SCREEN_TIME}</Text>
            <Text style={s.statLabel}>Screen time today</Text>
            {/* PLACEHOLDER — replace with real device API */}
            <Text style={s.statNote}>Mock data</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{MOCK_UNLOCKS}</Text>
            <Text style={s.statLabel}>Unlocks today</Text>
            {/* PLACEHOLDER — replace with real device API */}
            <Text style={s.statNote}>Mock data</Text>
          </View>
        </View>

        <View style={s.insightCard}>
          <Text style={s.insightLabel}>BLOOM NOTICED</Text>
          {loadingInsight ? (
            <ActivityIndicator size="small" color={C.sage} style={{ marginVertical: 8 }} />
          ) : (
            <Text style={s.insightText}>{insight}</Text>
          )}
        </View>

        {redirectHobbies.length > 0 && (
          <>
            <Text style={s.redirectLabel}>INSTEAD, WORK ON</Text>
            <View style={s.redirectRow}>
              {redirectHobbies.map(h => (
                <TouchableOpacity
                  key={h.id}
                  style={s.redirectChip}
                  onPress={() => navigation?.navigate?.('GrowTab')}
                  activeOpacity={0.75}
                >
                  <Feather name="sun" size={20} color={C.forest} style={{ marginBottom: 6 }} />
                  <Text style={s.redirectText}>{h.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={s.noteCard}>
          <Feather name="info" size={14} color={C.muted} style={{ marginRight: 8, marginTop: 1 }} />
          <Text style={s.noteText}>
            Screen time and unlock data shown here is currently mocked. Real data requires native device APIs — Bloom never blocks or restricts any app.
          </Text>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.cream },
  scroll: { paddingHorizontal: 22, paddingTop: 22 },

  title: {
    fontSize: 30, fontWeight: '800', color: C.forest, lineHeight: 38, marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : undefined,
  },
  sub: { fontSize: 14, color: C.muted, lineHeight: 22, marginBottom: 24 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  statCard: {
    flex: 1, backgroundColor: C.white, borderRadius: 18,
    padding: 18, alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  statValue: { fontSize: 28, fontWeight: '700', color: C.forest, marginBottom: 4 },
  statLabel: { fontSize: 12, color: C.muted, fontWeight: '600', letterSpacing: 0.3, textAlign: 'center' },
  statNote:  { fontSize: 10, color: C.sageLight, marginTop: 4 },

  insightCard: {
    backgroundColor: C.white, borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: C.border, marginBottom: 22,
    borderLeftWidth: 4, borderLeftColor: C.sky,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  insightLabel: { fontSize: 10, fontWeight: '700', color: C.sky, letterSpacing: 1.3, marginBottom: 10 },
  insightText:  { fontSize: 14, color: C.ink, lineHeight: 22 },

  redirectLabel: {
    fontSize: 10, fontWeight: '700', color: C.muted,
    letterSpacing: 1.4, marginBottom: 12,
  },
  redirectRow: { flexDirection: 'row', gap: 10, marginBottom: 22, flexWrap: 'wrap' },
  redirectChip: {
    flex: 1, minWidth: 80, backgroundColor: C.white, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  redirectText: { fontSize: 13, fontWeight: '600', color: C.forest },

  noteCard: {
    flexDirection: 'row', backgroundColor: C.sagePale, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: C.sageLight,
  },
  noteText: { flex: 1, fontSize: 12, color: C.muted, lineHeight: 18 },
});
