import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';

const REDIRECTS = [
  { icon: 'book-open', label: 'Read',   tab: null },
  { icon: 'pen-tool',  label: 'Create', tab: null },
  { icon: 'sun',       label: 'Grow',   tab: 'Grow' },
];

export default function ScreenAwarenessScreen({ navigation }) {
  const { dailyPoints } = useApp();
  const todayPts = dailyPoints?.[6] ?? 0;

  const hour = new Date().getHours();
  const isEvening = hour >= 18;
  const insight = isEvening
    ? 'You tend to scroll most in the evening. Try putting your phone down 30 minutes before bed.'
    : todayPts > 0
    ? `You've already earned ${todayPts} pts today — you're making real progress.`
    : 'You haven\'t started your tasks yet today. Opening Bloom was a good first step.';

  const showRedirects = isEvening;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.title}>Screen{'\n'}Awareness</Text>
        <Text style={s.sub}>Awareness is the first step.</Text>

        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statValue}>—</Text>
            <Text style={s.statLabel}>Screen time</Text>
            <Text style={s.statNote}>Requires device API</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>—</Text>
            <Text style={s.statLabel}>Unlocks today</Text>
            <Text style={s.statNote}>Requires device API</Text>
          </View>
        </View>

        <View style={s.insightCard}>
          <Text style={s.insightLabel}>BLOOM NOTICED</Text>
          <Text style={s.insightText}>{insight}</Text>
        </View>

        {showRedirects && (
          <>
            <Text style={s.redirectLabel}>INSTEAD, TRY</Text>
            <View style={s.redirectRow}>
              {REDIRECTS.map(r => (
                <TouchableOpacity
                  key={r.label}
                  style={s.redirectChip}
                  onPress={() => r.tab && navigation?.navigate?.(r.tab)}
                  activeOpacity={0.75}
                >
                  <Feather name={r.icon} size={22} color={C.forest} style={{ marginBottom: 6 }} />
                  <Text style={s.redirectText}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={s.noteCard}>
          <Feather name="info" size={14} color={C.muted} style={{ marginRight: 8, marginTop: 1 }} />
          <Text style={s.noteText}>
            Full screen time data requires native device access. Bloom never blocks or restricts any app — it only observes and gently suggests.
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
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  statValue: { fontSize: 30, fontWeight: '700', color: C.forest, marginBottom: 4 },
  statLabel: { fontSize: 12, color: C.muted, fontWeight: '600', letterSpacing: 0.3 },
  statNote:  { fontSize: 10, color: C.sageLight, marginTop: 4, textAlign: 'center' },

  insightCard: {
    backgroundColor: C.white, borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: C.border, marginBottom: 22,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  insightLabel: { fontSize: 10, fontWeight: '700', color: C.sage, letterSpacing: 1.3, marginBottom: 8 },
  insightText:  { fontSize: 14, color: C.forest, lineHeight: 22 },

  redirectLabel: {
    fontSize: 10, fontWeight: '700', color: C.muted,
    letterSpacing: 1.4, marginBottom: 12,
  },
  redirectRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  redirectChip: {
    flex: 1, backgroundColor: C.white, borderRadius: 14,
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
