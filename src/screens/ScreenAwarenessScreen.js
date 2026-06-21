import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { C } from '../constants/colors';

const SUGGESTIONS = [
  { emoji: '📖', label: 'Read' },
  { emoji: '🎨', label: 'Create' },
  { emoji: '🖍', label: 'Color' },
];

export default function ScreenAwarenessScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.title}>Screen{'\n'}Awareness</Text>
        <Text style={s.sub}>Awareness is the first step toward change.</Text>

        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statValue}>2h 14m</Text>
            <Text style={s.statLabel}>Today</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>47×</Text>
            <Text style={s.statLabel}>Opens</Text>
          </View>
        </View>

        <View style={s.insightCard}>
          <Text style={s.insightEmoji}>📱</Text>
          <Text style={s.insightTitle}>Screen Habits</Text>
          <Text style={s.insightText}>
            You usually scroll after dinner when you're memory tired.
          </Text>
        </View>

        <View style={s.insightCardAlt}>
          <Text style={s.insightText}>
            💛 Looks like you're looking for a little break.
          </Text>
        </View>

        <Text style={s.suggestLabel}>INSTEAD, TRY</Text>
        <View style={s.suggestRow}>
          {SUGGESTIONS.map(sg => (
            <TouchableOpacity key={sg.label} style={s.suggestChip} activeOpacity={0.8}>
              <Text style={s.suggestEmoji}>{sg.emoji}</Text>
              <Text style={s.suggestText}>{sg.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.note}>
          Screen time data requires iOS Screen Time API access — this shows a sample.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },

  title: { fontSize: 34, fontWeight: '700', color: C.forest, lineHeight: 42, marginBottom: 8 },
  sub:   { fontSize: 14, color: C.muted, lineHeight: 22, marginBottom: 24 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: C.white, borderRadius: 16,
    padding: 20, alignItems: 'center', borderWidth: 1, borderColor: C.border,
  },
  statValue: { fontSize: 32, fontWeight: '700', color: C.forest, marginBottom: 4 },
  statLabel: { fontSize: 12, color: C.muted, fontWeight: '600', letterSpacing: 0.5 },

  insightCard: {
    backgroundColor: '#FEF3F2', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#FDD8D6', marginBottom: 10,
  },
  insightEmoji: { fontSize: 20, marginBottom: 6 },
  insightTitle: { fontSize: 13, fontWeight: '700', color: '#C0392B', marginBottom: 4 },
  insightText: { fontSize: 14, color: C.forest, lineHeight: 22 },

  insightCardAlt: {
    backgroundColor: C.white, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border, marginBottom: 24,
  },

  suggestLabel: {
    fontSize: 11, fontWeight: '700', color: C.muted,
    letterSpacing: 1.6, marginBottom: 12,
  },
  suggestRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  suggestChip: {
    flex: 1, backgroundColor: C.white, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  suggestEmoji: { fontSize: 24, marginBottom: 6 },
  suggestText: { fontSize: 13, fontWeight: '600', color: C.forest },

  note: { fontSize: 12, color: C.muted, fontStyle: 'italic', textAlign: 'center', lineHeight: 18 },
});
