import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  SafeAreaView, StyleSheet, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { getGoalPlan } from '../utils/goalPlans';

export default function GoalsScreen() {
  const { goals, addGoal, advanceGoalStep, deleteGoal } = useApp();
  const [newGoal, setNewGoal] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = () => {
    const text = newGoal.trim();
    if (!text) return;
    addGoal(text);
    setNewGoal('');
    setShowAdd(false);
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.title}>Goals</Text>
        <Text style={s.sub}>Big things you're working toward — with a real plan to get there.</Text>

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
              Add a big goal — something like "Make $10k" or "Become a vet." Bloom will give you a real step-by-step plan, one action at a time.
            </Text>
          </View>
        ) : (
          goals.map(g => {
            const plan = getGoalPlan(g.text);
            const step = g.step ?? 0;
            const currentAction = g.nextAction || plan[step] || plan[0];
            const planDone = step >= plan.length;
            const pct = Math.min(100, Math.round((step / plan.length) * 100));
            const stepLabel = planDone ? 'Plan complete' : `Step ${step + 1} of ${plan.length}`;

            return (
              <View key={g.id} style={s.goalCard}>
                <View style={s.goalHeader}>
                  <Text style={s.goalText}>{g.text}</Text>
                  <TouchableOpacity onPress={() => deleteGoal(g.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Feather name="x" size={16} color={C.muted} />
                  </TouchableOpacity>
                </View>

                <Text style={s.stepLabel}>{stepLabel.toUpperCase()}</Text>

                <View style={s.nextActionBox}>
                  <Text style={s.nextActionText}>{currentAction}</Text>
                </View>

                {!planDone && (
                  <TouchableOpacity style={s.doneStepBtn} onPress={() => advanceGoalStep(g.id)}>
                    <Feather name="check" size={14} color={C.white} />
                    <Text style={s.doneStepBtnText}>This step is done →</Text>
                  </TouchableOpacity>
                )}

                <View style={s.progressTrack}>
                  <View style={[s.progressFill, { width: `${pct}%` }]} />
                </View>
                <Text style={s.progressLabel}>{pct}% through the plan</Text>
              </View>
            );
          })
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
    padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  goalHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 10, marginBottom: 10,
  },
  goalText: { flex: 1, fontSize: 17, fontWeight: '700', color: C.forest, lineHeight: 26 },

  stepLabel: { fontSize: 10, fontWeight: '700', color: C.clay, letterSpacing: 1.2, marginBottom: 8 },

  nextActionBox: {
    backgroundColor: C.clayPale, borderRadius: 12,
    padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: C.clayLight,
  },
  nextActionText: { fontSize: 14, color: C.forest, lineHeight: 22 },

  doneStepBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.forest, borderRadius: 20,
    paddingVertical: 10, paddingHorizontal: 16,
    alignSelf: 'flex-start', marginBottom: 16,
  },
  doneStepBtnText: { fontSize: 13, fontWeight: '700', color: C.white },

  progressTrack: {
    height: 4, backgroundColor: C.border, borderRadius: 2, marginBottom: 6,
  },
  progressFill: {
    height: 4, backgroundColor: C.sage, borderRadius: 2, minWidth: 4,
  },
  progressLabel: { fontSize: 11, color: C.muted },
});
