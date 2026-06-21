import React, { useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, SafeAreaView, StyleSheet, Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { HOBBIES } from '../constants/data';

const PRIORITY_TAG = {
  high:   { label: 'Urgent', bg: '#FDECEA', text: '#C0392B' },
  medium: { label: 'Next',   bg: '#EAF0E8', text: '#2D6A4F' },
  low:    { label: 'Low',    bg: '#F5F0EB', text: '#8A9B8C' },
};

function TaskRow({ task, onToggle, onFocus }) {
  const tag = PRIORITY_TAG[task.priority] ?? PRIORITY_TAG.medium;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleCheck = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.94, duration: 70, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 70, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  return (
    <Animated.View style={[s.taskRow, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[s.circle, task.done && s.circleDone]}
        onPress={handleCheck}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {task.done && <Feather name="check" size={11} color={C.white} />}
      </TouchableOpacity>

      <TouchableOpacity style={s.taskBody} onPress={() => onFocus(task)} activeOpacity={0.7}>
        <Text style={[s.taskText, task.done && s.taskTextDone]} numberOfLines={2}>
          {task.text}
        </Text>
      </TouchableOpacity>

      <View style={[s.tag, { backgroundColor: tag.bg }]}>
        <Text style={[s.tagText, { color: tag.text }]}>{tag.label}</Text>
      </View>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }) {
  const {
    tasks, toggleTask, hasDoneJournalToday,
    selectedHobbies, hobbyProgress, goals, userName,
  } = useApp();

  useFocusEffect(
    useCallback(() => {
      const hour = new Date().getHours();
      if (!hasDoneJournalToday && hour < 20) {
        navigation.navigate('Journal');
      }
    }, [hasDoneJournalToday])
  );

  const pending = tasks.filter(t => !t.done);
  const done    = tasks.filter(t => t.done);

  const nudgeText = (() => {
    const goal = goals?.[0]?.text;
    if (goal) return `You said "${goal}" matters to you. Want to spend 15 minutes on it?`;
    const active = HOBBIES.find(h =>
      selectedHobbies.includes(h.id) && (hobbyProgress[h.id] ?? 0) < h.steps.length
    );
    if (active) return `Ready for your next step? "${active.steps[hobbyProgress[active.id] ?? 0]}"`;
    return 'Small progress is still progress. Which task feels lightest right now?';
  })();

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <Text style={s.greeting}>{greet}{userName ? `, ${userName}` : ''}</Text>
          <TouchableOpacity style={s.addMoreBtn} onPress={() => navigation.navigate('Journal')}>
            <View style={s.addMoreInner}>
              <Feather name="edit-3" size={12} color={C.forest} />
              <Text style={s.addMoreText}>Add more</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={s.title}>Today</Text>
        <Text style={s.sub}>Broken into small steps — one thing at a time.</Text>

        {tasks.length === 0 ? (
          <View style={s.emptyState}>
            <Feather name="feather" size={52} color={C.sageMid} style={{ marginBottom: 14 }} />
            <Text style={s.emptyTitle}>Your day is blank</Text>
            <Text style={s.emptySub}>
              Do a brain dump and Bloom will turn it into a prioritised checklist.
            </Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Journal')}>
              <Text style={s.emptyBtnText}>Start brain dump →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={s.taskList}>
              {pending.map(t => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onToggle={() => toggleTask(t.id)}
                  onFocus={task => navigation.navigate('Sprint', { task })}
                />
              ))}
            </View>

            {done.length > 0 && (
              <View style={s.doneSection}>
                <View style={s.doneDivider}>
                  <View style={s.doneLine} />
                  <Text style={s.doneLabel}>Done · {done.length}</Text>
                  <View style={s.doneLine} />
                </View>
                {done.map(t => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    onToggle={() => toggleTask(t.id)}
                    onFocus={task => navigation.navigate('Sprint', { task })}
                  />
                ))}
              </View>
            )}

            <View style={s.nudgeCard}>
              <View style={s.nudgeTop}>
                <Feather name="feather" size={16} color="#3D6B4A" />
                <Text style={s.nudgeLabel}>Bloom Nudge</Text>
              </View>
              <Text style={s.nudgeText}>{nudgeText}</Text>
              <TouchableOpacity
                style={[s.nudgeBtn, pending.length === 0 && { opacity: 0.4 }]}
                onPress={() => pending[0] && navigation.navigate('Sprint', { task: pending[0] })}
                disabled={pending.length === 0}
              >
                <Text style={s.nudgeBtnText}>Let's begin →</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.cream },
  scroll: { paddingHorizontal: 22, paddingTop: 18 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 18,
  },
  greeting: { fontSize: 14, color: C.muted, fontWeight: '500' },
  addMoreBtn: {
    backgroundColor: C.white, borderWidth: 1, borderColor: C.border,
    borderRadius: 20, paddingVertical: 7, paddingHorizontal: 14,
  },
  addMoreInner: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  addMoreText: { fontSize: 13, fontWeight: '600', color: C.forest },

  title: { fontSize: 36, fontWeight: '700', color: C.forest, letterSpacing: -0.5, marginBottom: 4 },
  sub:   { fontSize: 14, color: C.muted, lineHeight: 20, marginBottom: 22 },

  taskList: {},
  taskRow: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0EBE3',
  },
  circle: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: '#C8BFB5',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  circleDone: { backgroundColor: C.forest, borderColor: C.forest },
  taskBody: { flex: 1 },
  taskText: { fontSize: 15, color: C.forest, lineHeight: 22, fontWeight: '500' },
  taskTextDone: { color: '#B8AFA8', textDecorationLine: 'line-through', fontWeight: '400' },
  tag: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20, flexShrink: 0 },
  tagText: { fontSize: 11, fontWeight: '700' },

  doneSection: { marginTop: 4 },
  doneDivider: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginVertical: 16,
  },
  doneLine: { flex: 1, height: 1, backgroundColor: '#EDE6DF' },
  doneLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1.2 },

  emptyState: { alignItems: 'center', paddingVertical: 52 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: C.forest, marginBottom: 10 },
  emptySub: {
    fontSize: 14, color: C.muted, textAlign: 'center',
    lineHeight: 22, marginBottom: 28, paddingHorizontal: 12,
  },
  emptyBtn: {
    backgroundColor: C.forest, borderRadius: 28,
    paddingVertical: 14, paddingHorizontal: 28,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: C.white },

  nudgeCard: {
    backgroundColor: '#EAF0E8', borderRadius: 20,
    padding: 20, marginTop: 22,
    borderWidth: 1, borderColor: '#D3E3CF',
  },
  nudgeTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  nudgeLabel: {
    fontSize: 11, fontWeight: '700', color: '#3D6B4A',
    letterSpacing: 1.2, textTransform: 'uppercase',
  },
  nudgeText: { fontSize: 15, color: C.forest, lineHeight: 24, marginBottom: 16 },
  nudgeBtn: {
    alignSelf: 'flex-start', backgroundColor: C.forest,
    borderRadius: 22, paddingVertical: 10, paddingHorizontal: 20,
  },
  nudgeBtnText: { fontSize: 14, fontWeight: '700', color: C.white },
});
