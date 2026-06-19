import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

// ─── Color palette ───────────────────────────────────────────────────────────
const C = {
  cream: '#FAF8F4',
  forest: '#2D4A35',
  sage: '#7B9E87',
  sageMid: '#A8C5A0',
  sageLight: '#D6E8D4',
  sagePale: '#EBF4E9',
  peach: '#C8795E',
  peachMid: '#E4A892',
  peachLight: '#F2D4C8',
  peachPale: '#FBF0EB',
  muted: '#8A9B8C',
  border: '#E5DED6',
  white: '#FFFFFF',
};

// ─── Priority config ──────────────────────────────────────────────────────────
const PRIORITY = {
  high: { label: 'High', text: C.peach, bg: C.peachLight },
  medium: { label: 'Medium', text: C.sage, bg: C.sageLight },
  low: { label: 'Low', text: C.muted, bg: '#EDEBE7' },
};

// ─── Nudge messages ───────────────────────────────────────────────────────────
const NUDGES = [
  'You said this was important to you — want a little help getting started?',
  'Progress, not perfection. Even one small step counts today.',
  'Your future self will thank you for starting now, not later.',
  "What's one tiny thing you can do in the next five minutes?",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

let _id = 1;
function makeTask(text, priority) {
  return { id: _id++, text, priority, done: false };
}

// ─── TaskRow ──────────────────────────────────────────────────────────────────
function TaskRow({ task, onToggle }) {
  const p = PRIORITY[task.priority];
  return (
    <TouchableOpacity
      style={styles.taskRow}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, task.done && styles.checkboxDone]}>
        {task.done && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text
        style={[styles.taskText, task.done && styles.taskTextDone]}
        numberOfLines={2}
      >
        {task.text}
      </Text>
      <View style={[styles.badge, { backgroundColor: p.bg }]}>
        <Text style={[styles.badgeText, { color: p.text }]}>{p.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tasks, setTasks] = useState([
    makeTask('Work on my passion project', 'high'),
    makeTask('Go for a 20-minute walk', 'medium'),
    makeTask('Read for 15 minutes', 'low'),
  ]);
  const [inputText, setInputText] = useState('');
  const [priority, setPriority] = useState('medium');
  const [nudge] = useState(() => NUDGES[Math.floor(Math.random() * NUDGES.length)]);
  const inputRef = useRef(null);

  const addTask = () => {
    const text = inputText.trim();
    if (!text) return;
    setTasks(prev => [...prev, makeTask(text, priority)]);
    setInputText('');
    inputRef.current?.blur();
  };

  const toggleTask = id =>
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)));

  const pendingCount = tasks.filter(t => !t.done).length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Buddy ────────────────────────────────────────────────────── */}
          <View style={styles.buddyWrapper}>
            <View style={styles.buddyRing}>
              <View style={styles.buddyCircle}>
                <Text style={styles.buddyEmoji}>🌿</Text>
              </View>
            </View>
            <Text style={styles.buddyName}>Buddy</Text>
          </View>

          {/* ── Greeting ─────────────────────────────────────────────────── */}
          <Text style={styles.greetingBig}>{greeting()}!</Text>
          <Text style={styles.greetingSub}>What matters today?</Text>

          {/* ── Task section ─────────────────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>TODAY'S FOCUS</Text>
            {pendingCount > 0 && (
              <View style={styles.countBubble}>
                <Text style={styles.countText}>{pendingCount}</Text>
              </View>
            )}
          </View>

          {tasks.length === 0 ? (
            <Text style={styles.empty}>Nothing here yet — add your first task below!</Text>
          ) : (
            tasks.map(t => (
              <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t.id)} />
            ))
          )}

          {/* ── Add task ─────────────────────────────────────────────────── */}
          <View style={styles.addCard}>
            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Add a task…"
                placeholderTextColor={C.muted}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={addTask}
                returnKeyType="done"
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[styles.addBtn, !inputText.trim() && styles.addBtnDisabled]}
                onPress={addTask}
                disabled={!inputText.trim()}
              >
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.priorityRow}>
              <Text style={styles.priorityLabel}>Priority</Text>
              {['high', 'medium', 'low'].map(p => {
                const cfg = PRIORITY[p];
                const active = priority === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityChip,
                      { borderColor: active ? cfg.text : C.border },
                      active && { backgroundColor: cfg.bg },
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text
                      style={[
                        styles.priorityChipText,
                        { color: active ? cfg.text : C.muted },
                      ]}
                    >
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Gentle Nudge card ────────────────────────────────────────── */}
          <View style={styles.nudgeCard}>
            <View style={styles.nudgeTop}>
              <Text style={styles.nudgeLeaf}>🌱</Text>
              <Text style={styles.nudgeTitle}>Gentle Nudge</Text>
            </View>
            <Text style={styles.nudgeBody}>{nudge}</Text>
            <TouchableOpacity style={styles.nudgeBtn}>
              <Text style={styles.nudgeBtnText}>Let's begin →</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 48 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: {
    flex: 1,
    backgroundColor: C.cream,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  // Buddy
  buddyWrapper: {
    alignItems: 'center',
    marginBottom: 28,
  },
  buddyRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: C.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: C.sageMid,
    shadowColor: C.forest,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  buddyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buddyEmoji: {
    fontSize: 30,
  },
  buddyName: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: C.sage,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Greeting
  greetingBig: {
    fontSize: 34,
    fontWeight: '700',
    color: C.forest,
    letterSpacing: -0.5,
  },
  greetingSub: {
    fontSize: 19,
    color: C.sage,
    marginTop: 4,
    marginBottom: 36,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 1.8,
  },
  countBubble: {
    marginLeft: 8,
    backgroundColor: C.sage,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.white,
  },
  empty: {
    fontSize: 15,
    color: C.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Task row
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: C.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  checkboxDone: {
    backgroundColor: C.sage,
    borderColor: C.sage,
  },
  checkmark: {
    color: C.white,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 15,
  },
  taskText: {
    flex: 1,
    fontSize: 16,
    color: C.forest,
    lineHeight: 22,
  },
  taskTextDone: {
    color: C.muted,
    textDecorationLine: 'line-through',
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 10,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Add task card
  addCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: C.cream,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontSize: 15,
    color: C.forest,
  },
  addBtn: {
    backgroundColor: C.sage,
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  addBtnDisabled: {
    opacity: 0.35,
  },
  addBtnText: {
    color: C.white,
    fontWeight: '700',
    fontSize: 15,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityLabel: {
    fontSize: 13,
    color: C.muted,
    fontWeight: '500',
    marginRight: 2,
  },
  priorityChip: {
    paddingVertical: 5,
    paddingHorizontal: 13,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  priorityChipText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Nudge card
  nudgeCard: {
    backgroundColor: C.peachPale,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: C.peachLight,
    shadowColor: C.peach,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  nudgeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  nudgeLeaf: {
    fontSize: 20,
    marginRight: 8,
  },
  nudgeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.peach,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  nudgeBody: {
    fontSize: 17,
    color: C.forest,
    lineHeight: 26,
    marginBottom: 18,
  },
  nudgeBtn: {
    alignSelf: 'flex-end',
    backgroundColor: C.peach,
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 24,
  },
  nudgeBtnText: {
    color: C.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
