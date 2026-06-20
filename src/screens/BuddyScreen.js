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

const LEVELS = [
  { min: 0,    label: 'Seedling',   emoji: '🌱', next: 50   },
  { min: 50,   label: 'Sprout',     emoji: '🌿', next: 150  },
  { min: 150,  label: 'Bloom',      emoji: '🌸', next: 300  },
  { min: 300,  label: 'Garden',     emoji: '🌺', next: 500  },
  { min: 500,  label: 'Forest',     emoji: '🌳', next: 1000 },
  { min: 1000, label: 'Rainforest', emoji: '🌴', next: null },
];

function getLevel(pts) {
  return LEVELS.slice().reverse().find(l => pts >= l.min) ?? LEVELS[0];
}

function buddyMessage(buddy, momentum, totalPoints, hour, streak) {
  const name = buddy?.name ?? 'I';
  if (streak >= 7) return `${streak} days in a row — you're incredible. ${name} is so proud of you.`;
  if (streak >= 3) return `${streak} days running! Every day you show up, you grow stronger.`;
  if (momentum >= 80) return `You're glowing right now! ${name} can feel your energy from here.`;
  if (momentum >= 60) return `${name} thinks you're doing brilliantly. Keep that momentum going!`;
  if (momentum >= 35) return `Steady progress is real progress. ${name} sees every bit of your effort.`;
  if (hour >= 21) return `Rest well tonight. Tomorrow, ${name} will be right here waiting for you.`;
  if (hour < 9)  return `Good morning! ${name} is excited to see what you'll do today.`;
  if (totalPoints === 0) return `${name} is ready whenever you are. No rush — just begin.`;
  return `${totalPoints} pts and counting! ${name} is rooting for you every step of the way.`;
}

function WeekChart({ dailyPoints }) {
  const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const today  = new Date();
  const maxPts = Math.max(...dailyPoints, 1);
  const BAR_H  = 52;
  return (
    <View style={s.chartRow}>
      {dailyPoints.map((pts, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        const label   = DAY_LABELS[date.getDay()];
        const isToday = i === 6;
        const barH    = Math.max(4, Math.round((pts / maxPts) * BAR_H));
        return (
          <View key={i} style={s.chartCol}>
            <View style={[s.chartBarWrap, { height: BAR_H }]}>
              <View style={[s.chartBar, { height: barH }, isToday && s.chartBarToday]} />
            </View>
            <Text style={[s.chartLabel, isToday && s.chartLabelToday]}>{label}</Text>
            {pts > 0 && <Text style={s.chartPts}>{pts}</Text>}
          </View>
        );
      })}
    </View>
  );
}

export default function BuddyScreen({ navigation }) {
  const { buddy, setBuddy, totalPoints, momentum, dailyPoints, currentStreak, tasksCompleted } = useApp();

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.titleRow}>
          <View>
            <Text style={s.title}>Your Buddy</Text>
            <Text style={s.sub}>Your companion reflects your effort.</Text>
          </View>
          <TouchableOpacity style={s.settingsBtn} onPress={() => navigation.navigate('Settings')}>
            <Text style={s.settingsEmoji}>⚙️</Text>
            <Text style={s.settingsLabel}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Buddy display */}
        <View style={s.buddySection}>
          <BuddyAvatar buddy={buddy} momentum={momentum} size={110} />
          <Text style={s.buddyName}>{buddy?.name}</Text>
          <Text style={s.buddySubtitle}>{buddy?.subtitle}</Text>
          <View style={s.moodPill}>
            <Text style={s.moodText}>Mood: {moodLabel(momentum)}</Text>
          </View>
        </View>

        {/* Buddy speech bubble */}
        <View style={s.speechCard}>
          <BuddyAvatar buddy={buddy} momentum={momentum} size={44} />
          <View style={s.speechBubble}>
            <Text style={s.speechText}>
              {buddyMessage(buddy, momentum, totalPoints, new Date().getHours(), currentStreak ?? 0)}
            </Text>
          </View>
        </View>

        {/* Momentum */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <Text style={s.cardTitle}>Momentum Score</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.momentumValue}>{momentum}</Text>
              {(currentStreak ?? 0) > 0 && (
                <View style={s.streakBadge}>
                  <Text style={s.streakText}>🔥 {currentStreak} day{currentStreak !== 1 ? 's' : ''}</Text>
                </View>
              )}
            </View>
          </View>
          <MomentumBar value={momentum} />
          <Text style={s.cardNote}>
            7-day rolling effort score. It never resets to zero — missing a day just nudges it gently down.
          </Text>
          {(tasksCompleted ?? 0) > 0 && (
            <View style={s.tasksStat}>
              <Text style={s.tasksStatText}>✅ {tasksCompleted} task{tasksCompleted !== 1 ? 's' : ''} completed all-time</Text>
            </View>
          )}
          <Text style={[s.cardTitle, { marginTop: 16, marginBottom: 8, fontSize: 12, color: C.muted, letterSpacing: 1 }]}>THIS WEEK</Text>
          <WeekChart dailyPoints={dailyPoints ?? [0,0,0,0,0,0,0]} />
        </View>

        {/* Level + Points */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <Text style={s.cardTitle}>Total Points</Text>
            <Text style={s.pointsValue}>{totalPoints} pts</Text>
          </View>
          {(() => {
            const lvl = getLevel(totalPoints);
            const pct = lvl.next
              ? Math.min(100, Math.round(((totalPoints - lvl.min) / (lvl.next - lvl.min)) * 100))
              : 100;
            return (
              <View style={s.levelSection}>
                <View style={s.levelRow}>
                  <Text style={s.levelEmoji}>{lvl.emoji}</Text>
                  <View style={s.levelInfo}>
                    <Text style={s.levelName}>{lvl.label}</Text>
                    <Text style={s.levelSub}>
                      {lvl.next ? `${totalPoints}/${lvl.next} pts to next level` : 'Max level reached!'}
                    </Text>
                  </View>
                  <Text style={s.levelPct}>{pct}%</Text>
                </View>
                <View style={s.levelTrack}>
                  <View style={[s.levelFill, { width: `${pct}%` }]} />
                </View>
              </View>
            );
          })()}
          <Text style={[s.cardTitle, { fontSize: 12, color: C.muted, letterSpacing: 1, marginTop: 16, marginBottom: 8 }]}>
            HOW TO EARN
          </Text>
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

  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 },
  title: { fontSize: 30, fontWeight: '700', color: C.forest, marginBottom: 4 },
  sub:   { fontSize: 15, color: C.sage, lineHeight: 22 },
  settingsBtn: {
    alignItems: 'center', backgroundColor: C.white,
    borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12,
    borderWidth: 1, borderColor: C.border,
  },
  settingsEmoji: { fontSize: 18 },
  settingsLabel: { fontSize: 9, fontWeight: '700', color: C.muted, marginTop: 2, letterSpacing: 0.5 },

  buddySection: { alignItems: 'center', marginBottom: 28 },
  buddyName: { fontSize: 22, fontWeight: '700', color: C.forest, marginTop: 14 },
  buddySubtitle: { fontSize: 14, color: C.muted, marginTop: 2 },
  moodPill: {
    marginTop: 10, backgroundColor: C.sagePale,
    borderRadius: 20, paddingVertical: 6, paddingHorizontal: 16,
    borderWidth: 1, borderColor: C.sageLight,
  },
  moodText: { fontSize: 14, fontWeight: '600', color: C.sage },

  speechCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    marginBottom: 18,
  },
  speechBubble: {
    flex: 1, backgroundColor: C.white, borderRadius: 16,
    padding: 14, borderWidth: 1, borderColor: C.border,
    borderTopLeftRadius: 4,
  },
  speechText: { fontSize: 15, color: C.forest, lineHeight: 23, fontStyle: 'italic' },

  streakBadge: {
    marginTop: 4, backgroundColor: '#FFF3E0', borderRadius: 12,
    paddingVertical: 2, paddingHorizontal: 8,
    borderWidth: 1, borderColor: '#FFB74D',
  },
  streakText: { fontSize: 11, fontWeight: '700', color: '#E65100' },

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

  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 4 },
  chartCol: { flex: 1, alignItems: 'center' },
  chartBarWrap: { justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  chartBar: { width: 14, backgroundColor: C.sageLight, borderRadius: 4 },
  chartBarToday: { backgroundColor: C.sage },
  chartLabel: { fontSize: 10, color: C.muted, marginTop: 4, fontWeight: '600' },
  chartLabelToday: { color: C.sage },
  chartPts: { fontSize: 9, color: C.muted, marginTop: 1 },
  tasksStat: {
    marginTop: 10, backgroundColor: C.sagePale, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 12,
    borderWidth: 1, borderColor: C.sageLight,
  },
  tasksStatText: { fontSize: 13, fontWeight: '600', color: C.sage },

  pointsValue: { fontSize: 28, fontWeight: '700', color: C.peach },
  levelSection: { marginTop: 4, marginBottom: 4 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  levelEmoji: { fontSize: 26, flexShrink: 0 },
  levelInfo: { flex: 1 },
  levelName: { fontSize: 15, fontWeight: '700', color: C.forest },
  levelSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  levelPct: { fontSize: 14, fontWeight: '700', color: C.peach, flexShrink: 0 },
  levelTrack: { height: 8, backgroundColor: C.peachLight, borderRadius: 4, overflow: 'hidden' },
  levelFill: { height: 8, backgroundColor: C.peach, borderRadius: 4 },
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
