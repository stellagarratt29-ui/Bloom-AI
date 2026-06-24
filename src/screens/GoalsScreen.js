import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  SafeAreaView, StyleSheet, Platform, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { generateGoalAction } from '../services/ai';

export default function GoalsScreen({ navigation }) {
  const { goals, addGoal, deleteGoal } = useApp();
  const [newGoal, setNewGoal]   = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [creating, setCreating] = useState(false);

  const handleAdd = async () => {
    const text = newGoal.trim();
    if (!text || creating) return;
    setCreating(true);
    try {
      const firstAction = await generateGoalAction({ goalText: text, completedActions: [] });
      addGoal(text, firstAction);
    } catch {
      addGoal(text, `Write down exactly what "${text}" looks like when it's done — be as specific as possible.`);
    } finally {
      setNewGoal('');
      setShowAdd(false);
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.title}>Goals</Text>
        <Text style={s.sub}>Big things you're working toward — with a real evolving plan.</Text>

        <View style={s.sectionRow}>
          <Text style={s.sectionLabel}>YOUR GOALS</Text>
          <TouchableOpacity onPress={() => setShowAdd(v => !v)}>
            <Text style={s.addBtn}>+ Add goal</Text>
          </TouchableOpacity>
        </View>

        {showAdd && (
          <View style={s.addCard}>
            <TextInput
              style={s.addInput}
              placeholder="What big thing are you working toward?"
              placeholderTextColor={C.muted}
              value={newGoal}
              onChangeText={setNewGoal}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
              autoFocus
              editable={!creating}
            />
            <TouchableOpacity
              style={[s.saveBtn, (!newGoal.trim() || creating) && s.saveBtnOff]}
              onPress={handleAdd}
              disabled={!newGoal.trim() || creating}
            >
              {creating ? (
                <ActivityIndicator size="small" color={C.white} />
              ) : (
                <Text style={s.saveBtnText}>Build my plan →</Text>
              )}
            </TouchableOpacity>
            {creating && <Text style={s.creatingNote}>Building your first action…</Text>}
          </View>
        )}

        {goals.length === 0 && !showAdd ? (
          <View style={s.empty}>
            <Feather name="target" size={44} color={C.sageLight} style={{ marginBottom: 14 }} />
            <Text style={s.emptyHead}>No goals yet</Text>
            <Text style={s.emptyText}>
              Add something big — "Start a business", "Get fit", "Write a book". Bloom will generate a real step-by-step plan, one action at a time.
            </Text>
          </View>
        ) : (
          goals.map(g => {
            const done = g.completedActions?.length ?? 0;
            return (
              <TouchableOpacity
                key={g.id}
                style={s.goalCard}
                onPress={() => navigation.navigate('GoalDetail', { goal: g })}
                activeOpacity={0.82}
              >
                <View style={s.goalHeader}>
                  <Text style={s.goalText}>{g.text}</Text>
                  <TouchableOpacity
                    onPress={() => deleteGoal(g.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="x" size={16} color={C.muted} />
                  </TouchableOpacity>
                </View>

                <Text style={s.stepLabel}>NEXT ACTION</Text>
                <View style={s.nextActionBox}>
                  <Text style={s.nextActionText}>{g.currentAction || 'Tap to generate your first action.'}</Text>
                </View>

                <View style={s.goalFooter}>
                  <Text style={s.doneCount}>{done} action{done !== 1 ? 's' : ''} completed</Text>
                  <View style={s.chevronWrap}>
                    <Text style={s.tapHint}>Tap for guidance</Text>
                    <Feather name="chevron-right" size={14} color={C.muted} />
                  </View>
                </View>
              </TouchableOpacity>
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

  addCard: {
    backgroundColor: C.white, borderRadius: 16, borderWidth: 1.5, borderColor: C.border,
    padding: 16, marginBottom: 16, gap: 10,
  },
  addInput: {
    backgroundColor: C.cream, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14,
    fontSize: 15, color: C.forest,
  },
  saveBtn: {
    backgroundColor: C.forest, paddingVertical: 13,
    paddingHorizontal: 18, borderRadius: 12, alignItems: 'center',
  },
  saveBtnOff: { opacity: 0.35 },
  saveBtnText: { color: C.white, fontWeight: '700', fontSize: 15 },
  creatingNote: { fontSize: 12, color: C.muted, textAlign: 'center' },

  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 16 },
  emptyHead: { fontSize: 18, fontWeight: '700', color: C.forest, marginBottom: 8 },
  emptyText: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22, maxWidth: 300 },

  goalCard: {
    backgroundColor: C.white, borderRadius: 18,
    borderWidth: 1, borderColor: C.border,
    padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  goalHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 10, marginBottom: 12,
  },
  goalText: { flex: 1, fontSize: 17, fontWeight: '700', color: C.forest, lineHeight: 26 },

  stepLabel: { fontSize: 10, fontWeight: '700', color: C.clay, letterSpacing: 1.2, marginBottom: 8 },

  nextActionBox: {
    backgroundColor: C.clayPale, borderRadius: 12,
    padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: C.clayLight,
  },
  nextActionText: { fontSize: 14, color: C.forest, lineHeight: 22 },

  goalFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  doneCount: { fontSize: 11, color: C.muted },
  chevronWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tapHint: { fontSize: 11, color: C.muted },
});
