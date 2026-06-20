import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  SafeAreaView, StyleSheet, Alert,
} from 'react-native';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';

const MONTHLY_TARGETS = [100, 250, 500];

const WEEKLY_ACTIONS = [
  'Spend 15 focused minutes on this today',
  'Find one person who\'s already done this and learn from them',
  'Break it into the smallest possible first step and do just that',
  'Track what you actually did this week — even tiny wins count',
  'Remove one obstacle that\'s been slowing you down',
];

const HOW_TO_BREAKDOWNS = {
  money:    ['Open a separate savings account today', 'Track every pound you spend for one week', 'Find one skill you can offer for income', 'Set an auto-transfer for savings on payday', 'Research one side income idea this week'],
  learn:    ['Find the best free/paid resource for this skill', 'Commit to 20 minutes of practice daily', 'Join a community of people learning the same thing', 'Build something small with what you\'ve learned', 'Teach someone else — it locks in the knowledge'],
  health:   ['Start with just 10 minutes of movement today', 'Prep one healthy meal this week', 'Sleep 30 minutes earlier than usual tonight', 'Drink water before every meal this week', 'Walk instead of sitting for your next break'],
  creative: ['Do one tiny creative act today — even 5 minutes', 'Share your work with one person, however rough', 'Study someone whose work you love', 'Give yourself permission to make something bad', 'Finish something — don\'t start something new yet'],
  travel:   ['Research one destination that excites you right now', 'Open a dedicated travel savings pot today', 'Find someone who\'s been there and message them', 'Set a departure date — even a rough one', 'Book just the first thing: a flight, hotel, or activity'],
  social:   ['Reach out to one person you\'ve been meaning to contact', 'Schedule something specific — not "sometime soon"', 'Join one community or group this week', 'Show up to one event even if you don\'t feel like it', 'Ask one honest question in a conversation today'],
  career:   ['Update your CV or portfolio with one recent thing', 'Reach out to one person in the role you want', 'Apply to one opportunity — done is better than perfect', 'Identify the one skill gap holding you back most', 'Shadow or interview someone already doing what you want'],
  default:  ['Write down exactly what success looks like', 'Do one small thing toward this goal today', 'Tell someone about this goal to make it real', 'Set a calendar reminder to check in next week', 'Ask: what would make this feel effortless?'],
};

function getBreakdown(goalText) {
  const t = goalText.toLowerCase();
  if (t.includes('money') || t.includes('$') || t.includes('£') || t.includes('earn') || t.includes('income') || t.includes('salary') || t.includes('save')) return HOW_TO_BREAKDOWNS.money;
  if (t.includes('learn') || t.includes('study') || t.includes('skill') || t.includes('course') || t.includes('degree')) return HOW_TO_BREAKDOWNS.learn;
  if (t.includes('fit') || t.includes('health') || t.includes('weight') || t.includes('run') || t.includes('gym') || t.includes('sleep')) return HOW_TO_BREAKDOWNS.health;
  if (t.includes('write') || t.includes('draw') || t.includes('paint') || t.includes('music') || t.includes('creat') || t.includes('art')) return HOW_TO_BREAKDOWNS.creative;
  if (t.includes('travel') || t.includes('trip') || t.includes('visit') || t.includes('holiday') || t.includes('vacation') || t.includes('abroad')) return HOW_TO_BREAKDOWNS.travel;
  if (t.includes('friend') || t.includes('social') || t.includes('connect') || t.includes('relation') || t.includes('network') || t.includes('meet')) return HOW_TO_BREAKDOWNS.social;
  if (t.includes('job') || t.includes('career') || t.includes('promot') || t.includes('business') || t.includes('work') || t.includes('hire')) return HOW_TO_BREAKDOWNS.career;
  return HOW_TO_BREAKDOWNS.default;
}

function GoalCard({ goal, onDelete, onAddStep, onAchieve }) {
  const [expanded, setExpanded] = useState(false);
  const [showHow, setShowHow]   = useState(false);
  const breakdown = getBreakdown(goal.text);
  const offset    = (typeof goal.id === 'number' ? goal.id : 0) % WEEKLY_ACTIONS.length;
  const rotatedActions = [
    ...WEEKLY_ACTIONS.slice(offset),
    ...WEEKLY_ACTIONS.slice(0, offset),
  ];

  return (
    <View style={s.goalCard}>
      <View style={s.goalHeader}>
        <Text style={s.goalText}>{goal.text}</Text>
        <TouchableOpacity onPress={() => onDelete(goal.id)}>
          <Text style={s.deleteBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.weeklyTitle}>WEEKLY ACTIONS</Text>
      {rotatedActions.slice(0, expanded ? 5 : 2).map((a, i) => (
        <TouchableOpacity key={i} style={s.actionRow} onPress={() => onAddStep(a)}>
          <View style={s.actionDot} />
          <Text style={s.actionText}>{a}</Text>
          <Text style={s.actionAdd}>+ Task</Text>
        </TouchableOpacity>
      ))}

      {!expanded && (
        <TouchableOpacity onPress={() => setExpanded(true)}>
          <Text style={s.showMore}>Show more actions ↓</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={s.achieveBtn} onPress={() => onAchieve?.(goal)}>
        <Text style={s.achieveBtnText}>✓ Mark as achieved · +50 pts</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.howBtn} onPress={() => setShowHow(h => !h)}>
        <Text style={s.howBtnText}>How do I actually do this? {showHow ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {showHow && (
        <View style={s.howSection}>
          <Text style={s.howTitle}>Practical steps →</Text>
          {breakdown.map((step, i) => (
            <View key={i} style={s.howRow}>
              <Text style={s.howNum}>{i + 1}</Text>
              <Text style={s.howText}>{step}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function GoalsScreen() {
  const { totalPoints, monthlyPoints, goals, addGoal, deleteGoal, monthlyGoalTarget, addTask, addPoints } = useApp();
  const [newGoal, setNewGoal] = useState('');

  const pct = Math.min(100, Math.round((monthlyPoints / monthlyGoalTarget) * 100));

  const handleAddGoal = () => {
    if (!newGoal.trim()) return;
    addGoal(newGoal.trim());
    setNewGoal('');
  };

  const handleAddStep = (text) => addTask(text, 'medium');

  const handleAchieve = (goal) => {
    Alert.alert(
      '🎉 Mark as achieved?',
      `"${goal.text.length > 60 ? goal.text.slice(0, 60) + '…' : goal.text}"`,
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Yes! I did it! 🎉',
          onPress: () => { deleteGoal(goal.id); addPoints(50); },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.pageTitle}>Goals</Text>
        <Text style={s.pageSub}>Big picture. Weekly steps. Real progress.</Text>

        {/* Monthly points */}
        <View style={s.monthCard}>
          <View style={s.monthTop}>
            <View>
              <Text style={s.monthLabel}>THIS MONTH</Text>
              <Text style={s.monthPoints}>{monthlyPoints} pts</Text>
            </View>
            <View style={s.monthTarget}>
              <Text style={s.monthTargetLabel}>Target</Text>
              <Text style={s.monthTargetVal}>{monthlyGoalTarget} pts</Text>
            </View>
          </View>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={s.progressPct}>
            {pct === 0
              ? 'Every task you complete earns points 🌱'
              : pct >= 100
              ? 'Goal reached! You crushed it this month 🎉'
              : pct >= 67
              ? `${pct}% there · Almost there! 🌸`
              : pct >= 34
              ? `${pct}% there · Building real momentum ⚡`
              : `${pct}% there · Keep going, every point counts 💪`}
          </Text>
        </View>

        {/* Vision Board */}
        <Text style={s.sectionLabel}>VISION BOARD</Text>
        <Text style={s.sectionSub}>What are you working toward this year?</Text>

        {/* Add goal */}
        <View style={s.addRow}>
          <TextInput
            style={s.addInput}
            placeholder="Add a big goal…"
            placeholderTextColor={C.muted}
            value={newGoal}
            onChangeText={setNewGoal}
            onSubmitEditing={handleAddGoal}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[s.addBtn, !newGoal.trim() && s.addBtnOff]}
            onPress={handleAddGoal}
            disabled={!newGoal.trim()}
          >
            <Text style={s.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {goals.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>🌟</Text>
            <Text style={s.emptyText}>
              Add a big goal and Bloom will help you break it into weekly steps.{'\n'}
              e.g. "Save £2,000" · "Learn to code" · "Run a 5K"
            </Text>
          </View>
        ) : (
          goals.map(g => (
            <GoalCard
              key={g.id}
              goal={g}
              onDelete={deleteGoal}
              onAddStep={handleAddStep}
              onAchieve={handleAchieve}
            />
          ))
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.cream },
  scroll: { paddingHorizontal: 22, paddingTop: 20 },

  pageTitle: { fontSize: 30, fontWeight: '700', color: C.forest, marginBottom: 4 },
  pageSub:   { fontSize: 15, color: C.sage, marginBottom: 22 },

  monthCard: {
    backgroundColor: C.white, borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: C.border, marginBottom: 28,
  },
  monthTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
  monthLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1.6 },
  monthPoints: { fontSize: 36, fontWeight: '700', color: C.sage, marginTop: 2 },
  monthTarget: { alignItems: 'flex-end' },
  monthTargetLabel: { fontSize: 11, color: C.muted },
  monthTargetVal: { fontSize: 18, fontWeight: '700', color: C.forest },
  progressTrack: { height: 10, backgroundColor: C.sageLight, borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: 10, backgroundColor: C.sage, borderRadius: 5 },
  progressPct: { fontSize: 13, color: C.muted },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1.8, marginBottom: 4 },
  sectionSub:   { fontSize: 14, color: C.muted, marginBottom: 14 },

  addRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  addInput: {
    flex: 1, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14,
    fontSize: 15, color: C.forest,
  },
  addBtn: { backgroundColor: C.sage, paddingVertical: 11, paddingHorizontal: 18, borderRadius: 12 },
  addBtnOff: { opacity: 0.35 },
  addBtnText: { color: C.white, fontWeight: '700', fontSize: 15 },

  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22 },

  goalCard: {
    backgroundColor: C.white, borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: C.border, marginBottom: 14,
  },
  goalHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  goalText: { flex: 1, fontSize: 17, fontWeight: '700', color: C.forest, lineHeight: 24 },
  deleteBtn: { fontSize: 14, color: C.muted, padding: 4 },

  weeklyTitle: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.5, marginBottom: 8 },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  actionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.sageMid, flexShrink: 0 },
  actionText: { flex: 1, fontSize: 14, color: C.forest, lineHeight: 20 },
  actionAdd: { fontSize: 12, fontWeight: '600', color: C.sage, flexShrink: 0 },
  showMore: { fontSize: 13, color: C.sage, fontWeight: '600', paddingVertical: 8 },

  achieveBtn: {
    marginTop: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: C.border,
    alignItems: 'center',
  },
  achieveBtnText: { fontSize: 13, fontWeight: '700', color: C.sage },

  howBtn: {
    paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  howBtnText: { fontSize: 13, fontWeight: '600', color: C.peach },
  howSection: { paddingTop: 10 },
  howTitle: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1.3, marginBottom: 8 },
  howRow: { flexDirection: 'row', gap: 10, paddingVertical: 6 },
  howNum: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.peachLight, textAlign: 'center', lineHeight: 20, fontSize: 11, fontWeight: '700', color: C.peach, flexShrink: 0 },
  howText: { flex: 1, fontSize: 14, color: C.forest, lineHeight: 21 },
});
