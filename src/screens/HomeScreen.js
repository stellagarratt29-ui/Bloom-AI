import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, SafeAreaView, StyleSheet,
} from 'react-native';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { HOBBIES } from '../constants/data';

const TAG_COLORS = {
  high:   { bg: '#FDECEA', text: '#C0392B', label: 'High' },
  medium: { bg: '#EBF4E9', text: '#2D6A4F', label: 'Next' },
  low:    { bg: '#F5F0EB', text: '#8A9B8C', label: 'Low'  },
};

function TaskItem({ task, onToggle, onStartSprint }) {
  const tag = TAG_COLORS[task.priority] ?? TAG_COLORS.medium;
  return (
    <View style={s.taskRow}>
      <TouchableOpacity style={[s.circle, task.done && s.circleDone]} onPress={onToggle}>
        {task.done && <Text style={s.checkMark}>✓</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={s.taskLabel} onPress={() => onStartSprint(task)} activeOpacity={0.7}>
        <Text style={[s.taskText, task.done && s.taskTextDone]} numberOfLines={2}>
          {task.text}
        </Text>
      </TouchableOpacity>
      <View style={[s.tag, { backgroundColor: tag.bg }]}>
        <Text style={[s.tagText, { color: tag.text }]}>{tag.label}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const {
    tasks, addTask, toggleTask,
    selectedHobbies, hobbyProgress,
    userName, goals, totalPoints,
  } = useApp();

  const [newTask, setNewTask] = useState('');

  const pending = tasks.filter(t => !t.done);
  const done    = tasks.filter(t => t.done);

  const handleAdd = () => {
    if (!newTask.trim()) return;
    addTask(newTask.trim(), 'medium');
    setNewTask('');
  };

  const handleStartSprint = (task) => navigation.navigate('Sprint', { task });

  const nudgeGoal = goals?.[0]?.text ?? null;
  const nudgeHobby = (() => {
    const active = HOBBIES.find(h =>
      selectedHobbies.includes(h.id) && (hobbyProgress[h.id] ?? 0) < h.steps.length
    );
    return active ? active.steps[hobbyProgress[active.id] ?? 0] : null;
  })();

  const nudgeText = nudgeGoal
    ? `You said "${nudgeGoal}" matters to you. Want to spend fifteen minutes on it?`
    : nudgeHobby
    ? `Ready for your next step? "${nudgeHobby}"`
    : 'Small progress is still progress. What will you do first today?';

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={s.headerRow}>
          <TouchableOpacity style={s.journalBtn} onPress={() => navigation.navigate('Journal')}>
            <Text style={s.journalBtnText}>✍ Journal</Text>
          </TouchableOpacity>
          <View style={s.headerRight}>
            <Text style={s.ptsLabel}>⚡ {totalPoints} pts</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={s.title}>Today</Text>
        <Text style={s.sub}>
          Broken into small steps — overwhelmed days call for tiny wins.
        </Text>

        {/* Task list */}
        <View style={s.taskList}>
          {tasks.length === 0 && (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>🌱</Text>
              <Text style={s.emptyText}>Nothing here yet. Add a task below.</Text>
            </View>
          )}
          {pending.map(t => (
            <TaskItem
              key={t.id}
              task={t}
              onToggle={() => toggleTask(t.id)}
              onStartSprint={handleStartSprint}
            />
          ))}
          {done.length > 0 && (
            <View style={s.doneSection}>
              <Text style={s.doneSeparatorLabel}>Done ({done.length})</Text>
              {done.map(t => (
                <TaskItem
                  key={t.id}
                  task={t}
                  onToggle={() => toggleTask(t.id)}
                  onStartSprint={handleStartSprint}
                />
              ))}
            </View>
          )}
        </View>

        {/* Add task */}
        <TouchableOpacity
          style={s.addTaskRow}
          onPress={() => {}}
          activeOpacity={1}
        >
          <TextInput
            style={s.addInput}
            placeholder="+ Add Task"
            placeholderTextColor={C.muted}
            value={newTask}
            onChangeText={setNewTask}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
        </TouchableOpacity>

        {/* Claude Nudge */}
        <View style={s.nudgeCard}>
          <View style={s.nudgeHeader}>
            <Text style={s.nudgeIcon}>🌿</Text>
            <Text style={s.nudgeLabel}>Claude Nudge</Text>
          </View>
          <Text style={s.nudgeText}>{nudgeText}</Text>
          <TouchableOpacity
            style={s.nudgeBtn}
            onPress={() => pending[0] && handleStartSprint(pending[0])}
          >
            <Text style={s.nudgeBtnText}>Let's begin →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  scroll: { paddingHorizontal: 22, paddingTop: 16 },

  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  journalBtn: {
    backgroundColor: C.white, borderWidth: 1, borderColor: C.border,
    borderRadius: 20, paddingVertical: 7, paddingHorizontal: 14,
  },
  journalBtnText: { fontSize: 13, fontWeight: '600', color: C.forest },
  headerRight: {},
  ptsLabel: { fontSize: 13, fontWeight: '600', color: C.muted },

  title: { fontSize: 34, fontWeight: '700', color: C.forest, marginBottom: 6 },
  sub:   { fontSize: 14, color: C.muted, lineHeight: 21, marginBottom: 24 },

  taskList: { marginBottom: 4 },

  taskRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  circle: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  circleDone: { backgroundColor: C.forest, borderColor: C.forest },
  checkMark: { fontSize: 12, color: C.white, fontWeight: '800' },
  taskLabel: { flex: 1 },
  taskText: { fontSize: 15, color: C.forest, lineHeight: 22 },
  taskTextDone: { color: C.muted, textDecorationLine: 'line-through' },
  tag: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20 },
  tagText: { fontSize: 11, fontWeight: '700' },

  doneSection: { marginTop: 8 },
  doneSeparatorLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1.2, marginBottom: 4, marginTop: 8 },

  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyEmoji: { fontSize: 32, marginBottom: 10 },
  emptyText: { fontSize: 14, color: C.muted },

  addTaskRow: {
    borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 4,
    marginTop: 8, marginBottom: 20,
    backgroundColor: C.white,
  },
  addInput: { fontSize: 15, color: C.forest, paddingVertical: 12 },

  nudgeCard: {
    backgroundColor: '#EAF0E8', borderRadius: 18,
    padding: 20, borderWidth: 1, borderColor: '#D0DFD0',
  },
  nudgeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  nudgeIcon: { fontSize: 18 },
  nudgeLabel: {
    fontSize: 11, fontWeight: '700', color: C.forest,
    letterSpacing: 1, textTransform: 'uppercase',
  },
  nudgeText: { fontSize: 15, color: C.forest, lineHeight: 24, marginBottom: 16 },
  nudgeBtn: {
    alignSelf: 'flex-start', backgroundColor: C.forest,
    borderRadius: 20, paddingVertical: 10, paddingHorizontal: 20,
  },
  nudgeBtnText: { fontSize: 14, fontWeight: '700', color: C.white },
});
