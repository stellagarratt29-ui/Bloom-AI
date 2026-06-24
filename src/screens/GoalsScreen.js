import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  SafeAreaView, StyleSheet, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';

function getNextAction(goalText) {
  const t = (goalText || '').toLowerCase();
  if (/10k|make money|earn|income|sell|business|freelance/.test(t))
    return 'Write down 3 ways you could realistically earn money given what you already know how to do.';
  if (/vet|veterinarian|doctor|nurse|medicine|medical/.test(t))
    return 'Research the exact qualifications needed and map out the school subjects that matter most.';
  if (/fit|gym|run|marathon|weight|workout|exercise/.test(t))
    return 'Do 10 minutes of movement today — just to start the habit.';
  if (/book|write|novel|blog|publish/.test(t))
    return 'Write one paragraph today, even a bad one. Starting is the whole game.';
  if (/learn|language|code|skill|course/.test(t))
    return 'Find one structured resource (YouTube, app, or course) and do the first lesson today.';
  if (/travel|trip|move|abroad/.test(t))
    return 'Pick a destination and research what it would realistically cost.';
  if (/save|invest|budget|house|property/.test(t))
    return 'Open your bank app and look at last month\'s spending — awareness is step one.';
  return 'Write down the single most important next step you could take this week.';
}

export default function GoalsScreen() {
  const { goals, addGoal, deleteGoal } = useApp();
  const [newGoal, setNewGoal] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = () => {
    const text = newGoal.trim();
    if (!text) return;
    addGoal(text, getNextAction(text));
    setNewGoal('');
    setShowAdd(false);
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.title}>Goals</Text>
        <Text style={s.sub}>Big things you're working toward.</Text>

        <View style={s.sectionRow}>
          <Text style={s.sectionLabel}>YOUR GOALS</Text>
          <TouchableOpacity onPress={() => setShowAdd(v => !v)}>
            <Text style={s.addBtn}>+ Add goal</Text>
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
              style={[s.saveBtn, !newGoal.trim() && s.saveBtnOff]}
              onPress={handleAdd}
              disabled={!newGoal.trim()}
            >
              <Text style={s.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}

        {goals.length === 0 ? (
          <View style={s.empty}>
            <Feather name="target" size={40} color={C.sageLight} style={{ marginBottom: 12 }} />
            <Text style={s.emptyHead}>No goals yet</Text>
            <Text style={s.emptyText}>
              Add a big goal above — something like "Make $10k" or "Become a vet." Bloom will give you the first step.
            </Text>
          </View>
        ) : (
          goals.map(g => (
            <View key={g.id} style={s.goalCard}>
              <View style={s.goalHeader}>
                <Text style={s.goalText}>{g.text}</Text>
                <TouchableOpacity onPress={() => deleteGoal(g.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name="x" size={16} color={C.muted} />
                </TouchableOpacity>
              </View>

              <View style={s.nextActionBox}>
                <Text style={s.nextActionLabel}>NEXT STEP</Text>
                <Text style={s.nextActionText}>{g.nextAction || getNextAction(g.text)}</Text>
              </View>

              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: `${Math.min(100, g.progress ?? 0)}%` }]} />
              </View>
            </View>
          ))
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.cream },
  scroll: { paddingHorizontal: 22, paddingTop: 22 },

  title: {
    fontSize: 30, fontWeight: '800', color: C.forest, marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : undefined,
  },
  sub: { fontSize: 14, color: C.muted, marginBottom: 20, lineHeight: 22 },

  sectionRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1.6 },
  addBtn: { fontSize: 14, fontWeight: '700', color: C.clay },

  addRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  addInput: {
    flex: 1, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14,
    fontSize: 15, color: C.forest,
  },
  saveBtn: {
    backgroundColor: C.forest, paddingVertical: 11,
    paddingHorizontal: 18, borderRadius: 12,
  },
  saveBtnOff: { opacity: 0.35 },
  saveBtnText: { color: C.white, fontWeight: '700', fontSize: 15 },

  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 16 },
  emptyHead: { fontSize: 18, fontWeight: '700', color: C.forest, marginBottom: 8 },
  emptyText: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22 },

  goalCard: {
    backgroundColor: C.white, borderRadius: 18,
    borderWidth: 1, borderColor: C.border,
    padding: 18, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  goalHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 10, marginBottom: 14,
  },
  goalText: { flex: 1, fontSize: 17, fontWeight: '700', color: C.forest, lineHeight: 26 },

  nextActionBox: {
    backgroundColor: C.clayPale, borderRadius: 12,
    padding: 13, marginBottom: 14,
    borderWidth: 1, borderColor: C.clayLight,
  },
  nextActionLabel: {
    fontSize: 10, fontWeight: '700', color: C.clay,
    letterSpacing: 1.2, marginBottom: 5,
  },
  nextActionText: { fontSize: 14, color: C.forest, lineHeight: 22 },

  progressTrack: {
    height: 4, backgroundColor: C.border, borderRadius: 2,
  },
  progressFill: {
    height: 4, backgroundColor: C.sage, borderRadius: 2,
    minWidth: 4,
  },
});
