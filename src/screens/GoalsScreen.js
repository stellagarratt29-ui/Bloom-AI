import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  SafeAreaView, StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';

const GOLD = '#C4A96E';
const GOLD_LIGHT = '#F5EDD8';

function CircularScore({ score, max }) {
  const pct = Math.min(1, score / max);

  return (
    <View style={{ alignItems: 'center', marginVertical: 32 }}>
      <View style={[gaugeS.ring, { opacity: 0.15 }]} />
      <View style={[gaugeS.ring, { opacity: pct }]} />
      <View style={gaugeS.center}>
        <Text style={gaugeS.score}>{score}</Text>
        <Text style={gaugeS.max}>of {max}</Text>
      </View>
    </View>
  );
}

const gaugeS = StyleSheet.create({
  ring: {
    position: 'absolute',
    width: 180, height: 180, borderRadius: 90,
    borderWidth: 14, borderColor: GOLD,
  },
  center: { alignItems: 'center' },
  score: { fontSize: 52, fontWeight: '300', color: C.forest, letterSpacing: -2 },
  max:   { fontSize: 14, color: C.muted, marginTop: 2 },
});

const EARN_ROWS = [
  { icon: 'check',       label: 'Complete a task', pts: '5–20 pts' },
  { icon: 'sun',         label: 'Hobby step',      pts: '15 pts'   },
  { icon: 'clock',       label: 'Focus sprint',    pts: '10 pts'   },
];

export default function GoalsScreen() {
  const { totalPoints, goals, addGoal, deleteGoal, addTask } = useApp();
  const [newGoal, setNewGoal] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const target = 250;

  const handleAdd = () => {
    if (!newGoal.trim()) return;
    addGoal(newGoal.trim());
    setNewGoal('');
    setShowAdd(false);
  };

  const insightText = totalPoints >= target
    ? "You've hit your goal! Set a new target to keep growing."
    : totalPoints >= target * 0.8
    ? `Almost there! Just ${target - totalPoints} pts to go.`
    : "You've been consistently making progress lately. Keep it up!";

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.title}>Growth</Text>
        <Text style={s.sub}>No streaks. Just real, gentle progress.</Text>

        <View style={s.scoreCard}>
          <CircularScore score={totalPoints} max={target} />
          <View style={s.insightCard}>
            <Feather name="star" size={18} color={GOLD} style={{ flexShrink: 0 }} />
            <Text style={s.insightText}>{insightText}</Text>
          </View>
        </View>

        <View style={s.sectionRow}>
          <Text style={s.sectionLabel}>YOUR GOALS</Text>
          <TouchableOpacity onPress={() => setShowAdd(v => !v)}>
            <Text style={s.addGoalBtn}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {showAdd && (
          <View style={s.addRow}>
            <TextInput
              style={s.addInput}
              placeholder="What are you working toward?"
              placeholderTextColor={C.muted}
              value={newGoal}
              onChangeText={setNewGoal}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
              autoFocus
            />
            <TouchableOpacity
              style={[s.addBtn, !newGoal.trim() && s.addBtnOff]}
              onPress={handleAdd}
              disabled={!newGoal.trim()}
            >
              <Text style={s.addBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}

        {goals.length === 0 ? (
          <View style={s.empty}>
            <Feather name="target" size={36} color={C.muted} style={{ marginBottom: 10 }} />
            <Text style={s.emptyText}>
              Add a big goal — Bloom will help you take the first step.
            </Text>
          </View>
        ) : (
          goals.map(g => (
            <View key={g.id} style={s.goalCard}>
              <View style={s.goalRow}>
                <Text style={s.goalText}>{g.text}</Text>
                <TouchableOpacity onPress={() => deleteGoal(g.id)} style={s.deleteBtn}>
                  <Feather name="x" size={16} color={C.muted} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={s.firstStepBtn}
                onPress={() => addTask(`Work on: ${g.text}`, 'high')}
              >
                <Text style={s.firstStepText}>Add to Today →</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={s.earnCard}>
          <Text style={s.earnTitle}>HOW TO EARN POINTS</Text>
          {EARN_ROWS.map(row => (
            <View key={row.label} style={s.earnRow}>
              <Feather name={row.icon} size={16} color={C.forest} style={s.earnIcon} />
              <Text style={s.earnLabel}>{row.label}</Text>
              <Text style={s.earnPts}>{row.pts}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.cream },
  scroll: { paddingHorizontal: 22, paddingTop: 22 },

  title: { fontSize: 30, fontWeight: '700', color: C.forest, marginBottom: 4 },
  sub:   { fontSize: 14, color: C.muted, marginBottom: 4 },

  scoreCard: {
    backgroundColor: C.white, borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 24, paddingBottom: 20,
    alignItems: 'center', marginTop: 16, marginBottom: 24,
  },
  insightCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: GOLD_LIGHT, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#EADCBC', width: '100%',
  },
  insightText: { flex: 1, fontSize: 14, color: C.forest, lineHeight: 22 },

  sectionRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1.6 },
  addGoalBtn: { fontSize: 14, fontWeight: '700', color: C.forest },

  addRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  addInput: {
    flex: 1, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14,
    fontSize: 15, color: C.forest,
  },
  addBtn: { backgroundColor: C.forest, paddingVertical: 11, paddingHorizontal: 18, borderRadius: 12 },
  addBtnOff: { opacity: 0.35 },
  addBtnText: { color: C.white, fontWeight: '700', fontSize: 15 },

  empty: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22 },

  goalCard: {
    backgroundColor: C.white, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 10,
  },
  goalRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  goalText: { flex: 1, fontSize: 16, fontWeight: '600', color: C.forest, lineHeight: 24 },
  deleteBtn: { padding: 4 },
  firstStepBtn: {
    alignSelf: 'flex-start', backgroundColor: '#EAF0E8',
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16,
  },
  firstStepText: { fontSize: 13, fontWeight: '700', color: C.forest },

  earnCard: {
    backgroundColor: C.white, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, padding: 18, marginTop: 4,
  },
  earnTitle: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1.5, marginBottom: 14 },
  earnRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  earnIcon: { width: 24, textAlign: 'center' },
  earnLabel: { flex: 1, fontSize: 14, color: C.forest },
  earnPts: { fontSize: 13, fontWeight: '700', color: C.muted },
});
