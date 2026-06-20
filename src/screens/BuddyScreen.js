import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet,
} from 'react-native';
import { C } from '../constants/colors';
import { BUDDIES } from '../constants/data';
import { useApp } from '../context/AppContext';
import BuddyAvatar from '../components/BuddyAvatar';

function MomentumBar({ value }) {
  return (
    <View style={s.momentumWrap}>
      <View style={[s.momentumFill, { width: `${value}%` }]} />
    </View>
  );
}

function moodLabel(m) {
  if (m >= 75) return 'Glowing ✨';
  if (m >= 50) return 'Happy 😊';
  if (m >= 25) return 'Calm 😌';
  return 'Resting 😴';
}

export default function BuddyScreen() {
  const { buddy, setBuddy, totalPoints, momentum } = useApp();

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.title}>Your Buddy</Text>
        <Text style={s.sub}>Your companion reflects your effort — not your perfection.</Text>

        {/* Buddy display */}
        <View style={s.buddySection}>
          <BuddyAvatar buddy={buddy} momentum={momentum} size={110} />
          <Text style={s.buddyName}>{buddy?.name}</Text>
          <Text style={s.buddySubtitle}>{buddy?.subtitle}</Text>
          <View style={s.moodPill}>
            <Text style={s.moodText}>Mood: {moodLabel(momentum)}</Text>
          </View>
        </View>

        {/* Momentum */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <Text style={s.cardTitle}>Momentum Score</Text>
            <Text style={s.momentumValue}>{momentum}</Text>
          </View>
          <MomentumBar value={momentum} />
          <Text style={s.cardNote}>
            Your 7-day rolling effort score. Missing a day nudges it down slightly — it never resets to zero.
          </Text>
        </View>

        {/* Points */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <Text style={s.cardTitle}>Total Points</Text>
            <Text style={s.pointsValue}>{totalPoints} pts</Text>
          </View>
          <View style={s.pointsBreakdown}>
            <Text style={s.pointsRow}>✅ Low priority task · 5 pts</Text>
            <Text style={s.pointsRow}>✅ Medium priority task · 10 pts</Text>
            <Text style={s.pointsRow}>✅ High priority task · 20 pts</Text>
            <Text style={s.pointsRow}>🌱 Hobby step complete · 15 pts</Text>
            <Text style={s.pointsRow}>⚡ Completed a sprint · 10 pts</Text>
          </View>
        </View>

        {/* Switch buddy */}
        <Text style={s.switchTitle}>Switch companion</Text>
        <View style={s.buddyGrid}>
          {BUDDIES.map(b => (
            <TouchableOpacity
              key={b.id}
              style={[s.buddyCard, buddy?.id === b.id && s.buddyCardActive]}
              onPress={() => setBuddy(b)}
            >
              <BuddyAvatar buddy={b} momentum={momentum} size={56} />
              <Text style={s.buddyCardName}>{b.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.comingSoon}>
          <Text style={s.comingSoonEmoji}>🎨</Text>
          <Text style={s.comingSoonText}>
            Buddy outfits, accessories, and room decor are coming — unlocked with your points!
          </Text>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.cream },
  scroll: { paddingHorizontal: 22, paddingTop: 20 },

  title: { fontSize: 30, fontWeight: '700', color: C.forest, marginBottom: 4 },
  sub:   { fontSize: 15, color: C.sage, marginBottom: 24, lineHeight: 22 },

  buddySection: { alignItems: 'center', marginBottom: 28 },
  buddyName: { fontSize: 22, fontWeight: '700', color: C.forest, marginTop: 14 },
  buddySubtitle: { fontSize: 14, color: C.muted, marginTop: 2 },
  moodPill: {
    marginTop: 10, backgroundColor: C.sagePale,
    borderRadius: 20, paddingVertical: 6, paddingHorizontal: 16,
    borderWidth: 1, borderColor: C.sageLight,
  },
  moodText: { fontSize: 14, fontWeight: '600', color: C.sage },

  card: {
    backgroundColor: C.white, borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: C.border, marginBottom: 14,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.forest },
  cardNote: { fontSize: 13, color: C.muted, lineHeight: 20, marginTop: 10 },

  momentumWrap: {
    height: 10, backgroundColor: C.sageLight,
    borderRadius: 5, overflow: 'hidden',
  },
  momentumFill: { height: 10, backgroundColor: C.sage, borderRadius: 5 },
  momentumValue: { fontSize: 28, fontWeight: '700', color: C.sage },

  pointsValue: { fontSize: 28, fontWeight: '700', color: C.peach },
  pointsBreakdown: { gap: 6 },
  pointsRow: { fontSize: 13, color: C.muted },

  switchTitle: { fontSize: 14, fontWeight: '700', color: C.muted, letterSpacing: 1.4, marginBottom: 12 },
  buddyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  buddyCard: {
    width: '47%', alignItems: 'center', padding: 16,
    backgroundColor: C.white, borderRadius: 16,
    borderWidth: 2, borderColor: C.border,
  },
  buddyCardActive: { borderColor: C.sage, backgroundColor: C.sagePale },
  buddyCardName: { fontSize: 14, fontWeight: '700', color: C.forest, marginTop: 8 },

  comingSoon: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.peachPale, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: C.peachLight,
  },
  comingSoonEmoji: { fontSize: 24, flexShrink: 0 },
  comingSoonText: { flex: 1, fontSize: 14, color: C.forest, lineHeight: 21 },
});
