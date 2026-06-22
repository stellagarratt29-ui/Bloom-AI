import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  ScrollView, SafeAreaView, StyleSheet, Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { HOBBIES } from '../constants/data';
import { getApiKey, generateGoalAdvice } from '../services/ai';

const GOAL_ADVICE = [
  {
    match: /fit|gym|exercise|run|marathon|weight|muscle|diet|workout|swim|yoga|pilates|sport|health/i,
    nudge: 'Consistency beats intensity. One session today is worth more than a perfect plan tomorrow.',
    step: 'Put on your shoes and go for a 20-minute walk — that\'s how every fitness journey starts.',
    links: 'Couch to 5K: nhs.uk/couch-to-5k  ·  Calorie tracking: myfitnesspal.com  ·  Free workouts: youtube → "beginner home workout"',
  },
  {
    match: /learn|study|language|spanish|french|mandarin|code|program|guitar|piano|music|skill|course|degree/i,
    nudge: 'Learning compounds — 20 focused minutes a day beats a 3-hour weekend session.',
    step: 'Find one structured course and complete the very first lesson today.',
    links: 'Free courses: coursera.org (audit for free)  ·  Languages: duolingo.com  ·  Coding: freecodecamp.org',
  },
  {
    match: /job|career|promotion|business|startup|freelance|entrepreneur|salary|work/i,
    nudge: 'Careers move when you show up every week, not just when you feel ready.',
    step: 'Update your LinkedIn profile and reach out to one person in your target field this week.',
    links: 'Job search: linkedin.com / glassdoor.com  ·  Portfolio: notion.so (free)  ·  Business setup: gov.uk/set-up-business',
  },
  {
    match: /save|budget|debt|invest|house|property|pension|retirement|financial|money/i,
    nudge: 'Financial progress starts with one week of tracking every purchase.',
    step: 'Open your bank app and look at last month\'s spending — awareness comes first.',
    links: 'Budgeting: moneysavingexpert.com  ·  Investing basics: investopedia.com  ·  Reddit community: reddit.com/r/personalfinance',
  },
  {
    match: /write|book|novel|blog|creative|art|draw|paint|design|podcast|film|photo/i,
    nudge: 'Creative work grows by showing up daily, even if just for 15 minutes.',
    step: 'Create something small and imperfect today — post it, share it, ship it.',
    links: 'Writing: substack.com or medium.com  ·  Design: behance.net  ·  Creative community: reddit.com → search your craft',
  },
  {
    match: /travel|trip|holiday|adventure|abroad|country|visit/i,
    nudge: 'Great trips get planned one step at a time, months in advance.',
    step: 'Pick your destination and research the best time to go — then set a monthly savings target.',
    links: 'Flights: skyscanner.net  ·  Accommodation: booking.com  ·  Visa info: gov.uk/foreign-travel-advice',
  },
];

function getGoalAdvice(text) {
  if (!text) return null;
  return GOAL_ADVICE.find(a => a.match.test(text)) ?? {
    nudge: 'The best time to start is today, with one tiny action.',
    step: 'Write down the single next physical step you need to take.',
    links: 'Goal tracking: notion.so  ·  Habit building: jamesclear.com/atomic-habits',
  };
}

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
    tasks, toggleTask, addTask, hasDoneJournalToday,
    selectedHobbies, hobbyProgress, goals, userName,
  } = useApp();

  const [newTaskText, setNewTaskText] = useState('');
  const inputRef = useRef(null);
  const [aiAdvice, setAiAdvice] = useState(null);
  const adviceGoalRef = useRef('');

  useEffect(() => {
    const goalText = goals?.[0]?.text;
    if (!goalText || goalText === adviceGoalRef.current) return;
    adviceGoalRef.current = goalText;
    setAiAdvice(null);
    getApiKey().then(key => {
      if (!key) return;
      generateGoalAdvice(goalText)
        .then(advice => setAiAdvice(advice))
        .catch(() => {});
    });
  }, [goals]);

  const submitTask = () => {
    const trimmed = newTaskText.trim();
    if (!trimmed) return;
    addTask(trimmed, 'medium');
    setNewTaskText('');
  };

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

  const goalAdvice = aiAdvice ?? getGoalAdvice(goals?.[0]?.text);

  const genericNudge = (() => {
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

        <View style={s.addRow}>
          <TextInput
            ref={inputRef}
            style={s.addInput}
            placeholder="Add a task…"
            placeholderTextColor={C.muted}
            value={newTaskText}
            onChangeText={setNewTaskText}
            onSubmitEditing={submitTask}
            returnKeyType="done"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[s.addBtn, !newTaskText.trim() && s.addBtnOff]}
            onPress={submitTask}
            disabled={!newTaskText.trim()}
          >
            <Feather name="plus" size={18} color={C.white} />
          </TouchableOpacity>
        </View>

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

            {goalAdvice ? (
              <View style={s.nudgeCard}>
                <View style={s.nudgeTop}>
                  <Feather name="target" size={16} color="#3D6B4A" />
                  <Text style={s.nudgeLabel}>Your Goal</Text>
                </View>
                <Text style={s.nudgeGoal} numberOfLines={2}>{goals[0].text}</Text>
                <Text style={s.nudgeText}>{goalAdvice.nudge}</Text>
                <View style={s.nudgeStepBox}>
                  <Feather name="arrow-right" size={13} color={C.forest} />
                  <Text style={s.nudgeStepText}>{goalAdvice.step}</Text>
                </View>
                <Text style={s.nudgeLinks}>{goalAdvice.links}</Text>
                <TouchableOpacity style={s.nudgeBtn} onPress={() => navigation.navigate('Goals')}>
                  <Text style={s.nudgeBtnText}>See full plan →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.nudgeCard}>
                <View style={s.nudgeTop}>
                  <Feather name="feather" size={16} color="#3D6B4A" />
                  <Text style={s.nudgeLabel}>Bloom Nudge</Text>
                </View>
                <Text style={s.nudgeText}>{genericNudge}</Text>
                <TouchableOpacity
                  style={[s.nudgeBtn, pending.length === 0 && { opacity: 0.4 }]}
                  onPress={() => pending[0] && navigation.navigate('Sprint', { task: pending[0] })}
                  disabled={pending.length === 0}
                >
                  <Text style={s.nudgeBtnText}>Let's begin →</Text>
                </TouchableOpacity>
              </View>
            )}
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

  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18,
  },
  addInput: {
    flex: 1, backgroundColor: C.white,
    borderWidth: 1.5, borderColor: C.border, borderRadius: 22,
    paddingVertical: 11, paddingHorizontal: 16,
    fontSize: 15, color: C.forest,
  },
  addBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.forest, alignItems: 'center', justifyContent: 'center',
  },
  addBtnOff: { opacity: 0.35 },

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

  nudgeGoal: { fontSize: 16, fontWeight: '700', color: C.forest, marginBottom: 8, lineHeight: 22 },
  nudgeStepBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#D6E8D4', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 12, marginBottom: 10,
  },
  nudgeStepText: { fontSize: 14, color: C.forest, flex: 1, lineHeight: 20, fontWeight: '500' },
  nudgeLinks: { fontSize: 12, color: C.muted, lineHeight: 18, marginBottom: 14 },

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
