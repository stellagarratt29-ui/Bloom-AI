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

  const [dumpText, setDumpText]   = useState('');
  const [dumping, setDumping]     = useState(false);
  const [aiAdvice, setAiAdvice]   = useState(null);
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

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

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

  return (
    <SafeAreaView style={s.safe}>
      {/* Sticky chat bar at top */}
      <View style={s.chatBar}>
        <TextInput
          ref={inputRef}
          style={s.chatInput}
          placeholder={dumping ? 'Bloom is sorting…' : "What's on your mind? Type one task or dump it all…"}
          placeholderTextColor={C.muted}
          value={dumpText}
          onChangeText={setDumpText}
          multiline
          editable={!dumping}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[s.sendBtn, (!dumpText.trim() || dumping) && s.sendBtnOff]}
          onPress={handleSend}
          disabled={!dumpText.trim() || dumping}
        >
          <Feather name={dumping ? 'loader' : 'send'} size={18} color={C.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.greeting}>{greet}{userName ? `, ${userName}` : ''}</Text>
        </View>

        <Text style={s.title}>Today</Text>
        <Text style={s.sub}>Tap a task to see how to do it.</Text>

        {tasks.length === 0 ? (
          <View style={s.emptyState}>
            <Feather name="feather" size={52} color={C.sageMid} style={{ marginBottom: 14 }} />
            <Text style={s.emptyTitle}>Your day is blank</Text>
            <Text style={s.emptySub}>
              Type everything on your mind above — tasks, worries, ideas. Bloom will sort them for you.
            </Text>
          </View>
        ) : (
          <>
            <View style={s.taskList}>
              {pending.map(t => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onToggle={() => toggleTask(t.id)}
                  onFocus={task => navigation.navigate('TaskGuide', { task })}
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
                    onFocus={task => navigation.navigate('TaskGuide', { task })}
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

  chatBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.white,
  },
  chatInput: {
    flex: 1, backgroundColor: C.cream,
    borderWidth: 1.5, borderColor: C.border, borderRadius: 18,
    paddingVertical: 10, paddingHorizontal: 14,
    fontSize: 15, color: C.forest, maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.forest, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnOff: { opacity: 0.35 },

  scroll: { paddingHorizontal: 22, paddingTop: 18 },
  header: { marginBottom: 6 },
  greeting: { fontSize: 14, color: C.muted, fontWeight: '500' },

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
