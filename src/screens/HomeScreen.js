import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  ScrollView, SafeAreaView, StyleSheet, Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { HOBBIES } from '../constants/data';
import { getApiKey, generateGoalAdvice, parseTasksWithAI } from '../services/ai';

const GOAL_ADVICE = [
  {
    match: /fit|gym|exercise|run|marathon|weight|muscle|diet|workout|swim|yoga|pilates|sport|health/i,
    nudge: 'Consistency beats intensity. One session today beats a perfect plan tomorrow.',
    step: 'Put on your shoes and go for a 20-minute walk — that\'s how every fitness journey starts.',
    links: 'Couch to 5K: nhs.uk/couch-to-5k  ·  Free workouts: youtube → "beginner home workout"',
  },
  {
    match: /learn|study|language|spanish|french|mandarin|code|program|guitar|piano|music|skill|course|degree/i,
    nudge: '20 focused minutes a day beats a 3-hour weekend session.',
    step: 'Find one structured resource and do the first lesson today.',
    links: 'Free courses: coursera.org  ·  Languages: duolingo.com  ·  Coding: freecodecamp.org',
  },
  {
    match: /job|career|promotion|business|startup|freelance|entrepreneur|salary/i,
    nudge: 'Careers move when you show up every week, not just when you feel ready.',
    step: 'Update your LinkedIn and reach out to one person in your field this week.',
    links: 'Job search: linkedin.com / glassdoor.com  ·  Portfolio: notion.so',
  },
  {
    match: /save|budget|debt|invest|house|property|pension|retirement|financial|money/i,
    nudge: 'Financial progress starts with one week of tracking every purchase.',
    step: 'Open your bank app and look at last month\'s spending — awareness comes first.',
    links: 'Budgeting: moneysavingexpert.com  ·  Basics: investopedia.com',
  },
  {
    match: /write|book|novel|blog|creative|art|draw|paint|design|podcast/i,
    nudge: 'Creative work grows by showing up daily, even just for 15 minutes.',
    step: 'Create something small and imperfect today — post it, share it, ship it.',
    links: 'Writing: substack.com  ·  Design: behance.net',
  },
  {
    match: /travel|trip|holiday|adventure|abroad|country|visit/i,
    nudge: 'Great trips get planned one step at a time, months in advance.',
    step: 'Pick your destination and set a monthly savings target today.',
    links: 'Flights: skyscanner.net  ·  Stays: booking.com',
  },
];

function getGoalAdvice(text) {
  if (!text) return null;
  return GOAL_ADVICE.find(a => a.match.test(text)) ?? {
    nudge: 'The best time to start is today, with one small action.',
    step: 'Write down the single next physical step you need to take.',
    links: 'Goal tracking: notion.so  ·  Habit building: jamesclear.com/atomic-habits',
  };
}

const PRIORITY_TAG = {
  high:   { label: 'Urgent', bg: '#FDECEA', text: '#C0392B' },
  medium: { label: 'Next',   bg: '#EAF0E8', text: '#2D6A4F' },
  low:    { label: 'Low',    bg: '#F2EDE8', text: '#8A7F77' },
};

function TaskRow({ task, onToggle, onPress }) {
  const tag = PRIORITY_TAG[task.priority] ?? PRIORITY_TAG.medium;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleCheck = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 60, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 60, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  return (
    <Animated.View style={[s.taskRow, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[s.circle, task.done && s.circleDone]}
        onPress={handleCheck}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        {task.done && <Feather name="check" size={11} color={C.white} />}
      </TouchableOpacity>

      <TouchableOpacity style={s.taskBody} onPress={() => onPress(task)} activeOpacity={0.7}>
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

function isMultiTaskDump(text) {
  return text.includes('\n') || text.includes(';')
    || (text.match(/\band\b/gi) || []).length >= 2
    || text.length > 90;
}

export default function HomeScreen({ navigation }) {
  const {
    tasks, toggleTask, addTask, processDump, loadTasks,
    selectedHobbies, hobbyProgress, goals, userName,
  } = useApp();

  const [dumpText, setDumpText] = useState('');
  const [dumping, setDumping]   = useState(false);
  const [aiAdvice, setAiAdvice] = useState(null);
  const adviceGoalRef = useRef('');
  const inputRef = useRef(null);

  useEffect(() => {
    const goalText = goals?.[0]?.text;
    if (!goalText || goalText === adviceGoalRef.current) return;
    adviceGoalRef.current = goalText;
    setAiAdvice(null);
    getApiKey().then(key => {
      if (!key) return;
      generateGoalAdvice(goalText).then(setAiAdvice).catch(() => {});
    });
  }, [goals]);

  const handleSend = useCallback(async () => {
    const trimmed = dumpText.trim();
    if (!trimmed || dumping) return;
    setDumpText('');

    if (!isMultiTaskDump(trimmed)) {
      addTask(trimmed, 'medium');
      return;
    }

    setDumping(true);
    try {
      const key = await getApiKey();
      if (key) {
        const parsed = await parseTasksWithAI(trimmed);
        loadTasks(parsed);
      } else {
        processDump(trimmed);
      }
    } catch {
      processDump(trimmed);
    } finally {
      setDumping(false);
    }
  }, [dumpText, dumping, addTask, loadTasks, processDump]);

  const pending = tasks.filter(t => !t.done);
  const done    = tasks.filter(t => t.done);
  const goalAdvice = aiAdvice ?? getGoalAdvice(goals?.[0]?.text);

  const genericNudge = (() => {
    const active = HOBBIES.find(h =>
      selectedHobbies.includes(h.id) && (hobbyProgress[h.id] ?? 0) < h.steps.length
    );
    if (active) return `Next step: "${active.steps[hobbyProgress[active.id] ?? 0]}"`;
    return 'Small progress is still progress. Which task feels lightest right now?';
  })();

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={s.safe}>
      {/* Brain dump bar */}
      <View style={s.chatBar}>
        <TextInput
          ref={inputRef}
          style={s.chatInput}
          placeholder={dumping ? 'Bloom is sorting…' : "What's on your mind? One task or dump it all…"}
          placeholderTextColor={C.muted}
          value={dumpText}
          onChangeText={setDumpText}
          multiline
          editable={!dumping}
        />
        <TouchableOpacity
          style={[s.sendBtn, (!dumpText.trim() || dumping) && s.sendBtnOff]}
          onPress={handleSend}
          disabled={!dumpText.trim() || dumping}
        >
          <Feather name={dumping ? 'loader' : 'arrow-up'} size={17} color={C.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.greeting}>{greet}{userName ? `, ${userName}` : ''}</Text>
        <Text style={s.title}>Today</Text>
        <Text style={s.sub}>
          {pending.length === 0
            ? 'Your day is clear — type above to add tasks.'
            : 'Tap a task to see exactly how to get it done.'}
        </Text>

        {tasks.length > 0 && (
          <View style={s.taskList}>
            {pending.map(t => (
              <TaskRow
                key={t.id}
                task={t}
                onToggle={() => toggleTask(t.id)}
                onPress={task => navigation.navigate('TaskGuide', { task })}
              />
            ))}

            {/* Dashed add task button */}
            <TouchableOpacity style={s.addDashed} onPress={() => inputRef.current?.focus()}>
              <Feather name="plus" size={14} color={C.muted} />
              <Text style={s.addDashedText}>Add task</Text>
            </TouchableOpacity>

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
                    onPress={task => navigation.navigate('TaskGuide', { task })}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {tasks.length === 0 && (
          <View style={s.emptyState}>
            <Feather name="feather" size={40} color={C.border} style={{ marginBottom: 16 }} />
            <Text style={s.emptyTitle}>Start with a brain dump</Text>
            <Text style={s.emptySub}>
              Type everything on your mind in the bar above — tasks, worries, ideas. Bloom will sort and prioritise them.
            </Text>
          </View>
        )}

        {/* Nudge card */}
        {goalAdvice ? (
          <View style={s.nudgeCard}>
            <Text style={s.nudgeEyebrow}>BLOOM NUDGE</Text>
            <Text style={s.nudgeGoal} numberOfLines={2}>{goals[0].text}</Text>
            <Text style={s.nudgeText}>{goalAdvice.nudge}</Text>
            <View style={s.nudgeStep}>
              <Feather name="arrow-right" size={13} color={C.forest} />
              <Text style={s.nudgeStepText}>{goalAdvice.step}</Text>
            </View>
            {goalAdvice.links ? (
              <Text style={s.nudgeLinks}>{goalAdvice.links}</Text>
            ) : null}
            <TouchableOpacity
              style={s.nudgeBtn}
              onPress={() => pending[0] && navigation.navigate('TaskGuide', { task: pending[0] })}
            >
              <Text style={s.nudgeBtnText}>Let's begin →</Text>
            </TouchableOpacity>
          </View>
        ) : tasks.length > 0 ? (
          <View style={s.nudgeCard}>
            <Text style={s.nudgeEyebrow}>BLOOM NUDGE</Text>
            <Text style={s.nudgeText}>{genericNudge}</Text>
            <TouchableOpacity
              style={[s.nudgeBtn, pending.length === 0 && { opacity: 0.4 }]}
              onPress={() => pending[0] && navigation.navigate('TaskGuide', { task: pending[0] })}
              disabled={pending.length === 0}
            >
              <Text style={s.nudgeBtnText}>Let's begin →</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },

  chatBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 18, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.white,
  },
  chatInput: {
    flex: 1, backgroundColor: C.cream,
    borderWidth: 1, borderColor: C.border, borderRadius: 20,
    paddingVertical: 9, paddingHorizontal: 14,
    fontSize: 14, color: C.forest, maxHeight: 90,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.forest, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sendBtnOff: { opacity: 0.3 },

  scroll: { paddingHorizontal: 22, paddingTop: 24 },

  greeting: { fontSize: 13, color: C.muted, fontWeight: '500', marginBottom: 4 },
  title:    { fontSize: 38, fontWeight: '800', color: C.forest, letterSpacing: -1, marginBottom: 6 },
  sub:      { fontSize: 14, color: C.muted, lineHeight: 20, marginBottom: 24 },

  taskList: { marginBottom: 8 },
  taskRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0EAE2',
  },
  circle: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: '#C4B8AE',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  circleDone: { backgroundColor: C.forest, borderColor: C.forest },
  taskBody: { flex: 1 },
  taskText: { fontSize: 15, color: C.forest, lineHeight: 22, fontWeight: '500' },
  taskTextDone: { color: '#BDB4AB', textDecorationLine: 'line-through', fontWeight: '400' },
  tag: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 20, flexShrink: 0 },
  tagText: { fontSize: 11, fontWeight: '700' },

  addDashed: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 13, paddingHorizontal: 4,
    borderWidth: 1, borderColor: C.border, borderStyle: 'dashed', borderRadius: 10,
    marginTop: 10, justifyContent: 'center',
  },
  addDashedText: { fontSize: 13, color: C.muted, fontWeight: '500' },

  doneSection: { marginTop: 4 },
  doneDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  doneLine:    { flex: 1, height: 1, backgroundColor: '#EDE6DF' },
  doneLabel:   { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1.2 },

  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.forest, marginBottom: 10 },
  emptySub:   { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22 },

  nudgeCard: {
    backgroundColor: '#E8EFE5', borderRadius: 18,
    padding: 20, marginTop: 24,
    borderWidth: 1, borderColor: '#CFDECB',
  },
  nudgeEyebrow: {
    fontSize: 10, fontWeight: '700', color: '#3D6B4A',
    letterSpacing: 1.5, marginBottom: 8,
  },
  nudgeGoal: { fontSize: 15, fontWeight: '700', color: C.forest, marginBottom: 8, lineHeight: 21 },
  nudgeText: { fontSize: 14, color: '#2D4A35', lineHeight: 22, marginBottom: 12 },
  nudgeStep: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 10,
    paddingVertical: 9, paddingHorizontal: 12, marginBottom: 10,
  },
  nudgeStepText: { fontSize: 13, color: C.forest, flex: 1, lineHeight: 19, fontWeight: '500' },
  nudgeLinks:    { fontSize: 11, color: '#5A7A5C', lineHeight: 17, marginBottom: 14 },
  nudgeBtn: {
    alignSelf: 'flex-start', backgroundColor: C.forest,
    borderRadius: 20, paddingVertical: 9, paddingHorizontal: 18,
  },
  nudgeBtnText: { fontSize: 13, fontWeight: '700', color: C.white },
});
