import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';

const SECTION_LABEL = { high: 'School & Health', medium: 'Tasks', low: 'Fun & Leisure' };
const PRIORITY_DOT  = { high: '#C0392B', medium: C.moss, low: C.clay };

export default function TasksScreen({ navigation }) {
  const { tasks, totalPoints } = useApp();

  const pendingTasks = tasks.filter(t => !t.done);
  const doneTasks    = tasks.filter(t => t.done);

  function renderSections(taskList) {
    const high = taskList.filter(t => t.priority === 'high');
    const med  = taskList.filter(t => t.priority === 'medium');
    const low  = taskList.filter(t => t.priority === 'low');
    const groups = [
      { key: 'high',   label: SECTION_LABEL.high,   items: high },
      { key: 'medium', label: SECTION_LABEL.medium,  items: med  },
      { key: 'low',    label: SECTION_LABEL.low,     items: low  },
    ].filter(g => g.items.length > 0);

    return groups.map(g => (
      <View key={g.key} style={s.group}>
        <Text style={s.groupLabel}>{g.label.toUpperCase()}</Text>
        {g.items.map(task => (
          <TouchableOpacity
            key={task.id}
            style={s.taskCard}
            onPress={() => navigation.navigate('TaskGuide', { task })}
            activeOpacity={0.72}
          >
            <View style={[s.dot, { backgroundColor: PRIORITY_DOT[task.priority] ?? C.moss }]} />
            <Text style={s.taskText} numberOfLines={2}>{task.text}</Text>
            <View style={s.pts}><Text style={s.ptsText}>+5</Text></View>
            <Feather name="chevron-right" size={14} color={C.muted} />
          </TouchableOpacity>
        ))}
      </View>
    ));
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Tasks</Text>
        <View style={s.ptsWrap}>
          <Text style={s.ptsTotal}>{totalPoints} pts</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {pendingTasks.length === 0 ? (
          <View style={s.empty}>
            <Feather name="check-circle" size={44} color={C.sage} style={{ marginBottom: 14 }} />
            <Text style={s.emptyHead}>All clear</Text>
            <Text style={s.emptyText}>
              Go to Chat, tell Bloom what's on your mind, and your tasks will appear here sorted by priority.
            </Text>
          </View>
        ) : (
          renderSections(pendingTasks)
        )}

        {doneTasks.length > 0 && (
          <View style={s.doneSection}>
            <Text style={s.doneLabel}>DONE</Text>
            {doneTasks.slice(-5).reverse().map(task => (
              <View key={task.id} style={s.doneCard}>
                <Feather name="check" size={13} color={C.moss} />
                <Text style={s.doneText} numberOfLines={1}>{task.text}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 18, paddingBottom: 14,
    backgroundColor: C.cream, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  title: {
    fontSize: 30, fontWeight: '800', color: C.ink,
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined,
  },
  ptsWrap: {
    backgroundColor: C.sagePale, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  ptsTotal: { fontSize: 13, fontWeight: '700', color: C.moss },

  scroll: { paddingHorizontal: 18, paddingTop: 20 },

  group: { marginBottom: 20 },
  groupLabel: {
    fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.4, marginBottom: 8,
  },
  taskCard: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    backgroundColor: C.white, borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 6,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  dot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  taskText: { flex: 1, fontSize: 14, fontWeight: '500', color: C.ink, lineHeight: 20 },
  pts: {
    backgroundColor: C.goldPale, borderRadius: 8, paddingVertical: 2, paddingHorizontal: 6,
  },
  ptsText: { fontSize: 11, fontWeight: '700', color: C.gold },

  empty: {
    alignItems: 'center', paddingTop: 60, paddingBottom: 32, paddingHorizontal: 24,
  },
  emptyHead: { fontSize: 18, fontWeight: '700', color: C.ink, marginBottom: 10 },
  emptyText: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22 },

  doneSection: { marginTop: 8, marginBottom: 4 },
  doneLabel: {
    fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.4, marginBottom: 8,
  },
  doneCard: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: C.sagePale, marginBottom: 4,
  },
  doneText: { flex: 1, fontSize: 13, color: C.muted, fontWeight: '500' },
});
