import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
  StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { callClaude, getApiKey } from '../services/ai';

function genericSteps(text) {
  const t = (text || '').toLowerCase();
  if (/doctor|dentist|hospital|appointment|clinic/.test(t))
    return [
      { step: 'Check the time and location of your appointment' },
      { step: 'Gather any documents or referral letters you need to bring' },
      { step: 'Leave 10–15 minutes earlier than you think you need to' },
    ];
  if (/email|message|reply/.test(t))
    return [
      { step: 'Open your email and find the relevant thread' },
      { step: 'Write a quick draft — don\'t aim for perfect, aim for sent' },
      { step: 'Read it once, then hit send' },
    ];
  if (/call|phone|ring/.test(t))
    return [
      { step: 'Note down what you need to say or ask before calling' },
      { step: 'Make the call — it\'s always faster than you expect' },
      { step: 'Write down anything important from the conversation' },
    ];
  if (/study|read|research|learn/.test(t))
    return [
      { step: 'Clear your space and silence notifications' },
      { step: 'Set a 25-minute timer and read actively (take notes)' },
      { step: 'Take a 5-minute break, then decide if you continue' },
    ];
  if (/clean|tidy|organise|organize/.test(t))
    return [
      { step: 'Set a 10-minute timer — only work until it goes off' },
      { step: 'Start with the most visible area first' },
      { step: 'Put things away as you go, don\'t just move the mess' },
    ];
  return [
    { step: 'Decide exactly when you\'ll start this (a specific time today)' },
    { step: 'Break it into the first physical action you need to take' },
    { step: 'Do that first action — momentum will carry you forward' },
  ];
}

export default function TaskGuideScreen({ route, navigation }) {
  const { task } = route.params ?? {};
  const { toggleTask } = useApp();

  const [steps, setSteps]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState({});
  const [taskDone, setTaskDone] = useState(task?.done ?? false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const key = await getApiKey();
        if (!key) throw new Error('no key');
        const reply = await callClaude({
          system: `You help people complete tasks by breaking them into clear steps.
Return ONLY a JSON array — no markdown, no explanation.
Schema: [{"step": "concrete action", "detail": "optional 1-line clarification"}]
Give 3–5 steps. Be specific and practical. Match the complexity to the task — a simple errand gets 3 steps, a complex project gets 5.`,
          messages: [{ role: 'user', content: `How do I complete this task: "${task?.text}"` }],
          maxTokens: 500,
        });
        const clean = reply.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
        const parsed = JSON.parse(clean);
        if (!cancelled && Array.isArray(parsed)) setSteps(parsed);
      } catch {
        if (!cancelled) setSteps(genericSteps(task?.text));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [task?.text]);

  const handleMarkDone = () => {
    if (task && !taskDone) {
      toggleTask(task.id);
      setTaskDone(true);
    }
    navigation.goBack();
  };

  const toggleCheck = (i) => setChecked(prev => ({ ...prev, [i]: !prev[i] }));

  const PRIORITY_COLOR = { high: '#C0392B', medium: C.sage, low: C.muted };
  const PRIORITY_LABEL = { high: 'Urgent', medium: 'Next', low: 'Low' };
  const priorityColor = PRIORITY_COLOR[task?.priority] ?? C.sage;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color={C.forest} />
        </TouchableOpacity>
        <Text style={s.headerLabel}>How to do it</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.taskCard}>
          <View style={[s.priorityDot, { backgroundColor: priorityColor }]} />
          <Text style={s.taskText}>{task?.text ?? 'Task'}</Text>
          {task?.priority && (
            <View style={[s.priorityTag, { backgroundColor: priorityColor + '1A' }]}>
              <Text style={[s.priorityTagText, { color: priorityColor }]}>
                {PRIORITY_LABEL[task.priority]}
              </Text>
            </View>
          )}
        </View>

        <View style={s.stepsSection}>
          <Text style={s.stepsLabel}>
            {loading ? 'Working out the steps…' : 'Here\'s how to get it done'}
          </Text>

          {loading ? (
            <View style={s.loadingWrap}>
              <ActivityIndicator size="large" color={C.sage} />
              <Text style={s.loadingText}>Bloom is thinking…</Text>
            </View>
          ) : (
            steps.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[s.stepRow, checked[i] && s.stepRowDone]}
                onPress={() => toggleCheck(i)}
                activeOpacity={0.7}
              >
                <View style={[s.stepCircle, checked[i] && s.stepCircleDone]}>
                  {checked[i]
                    ? <Feather name="check" size={12} color={C.white} />
                    : <Text style={s.stepNum}>{i + 1}</Text>
                  }
                </View>
                <View style={s.stepContent}>
                  <Text style={[s.stepText, checked[i] && s.stepTextDone]}>{item.step}</Text>
                  {item.detail ? (
                    <Text style={s.stepDetail}>{item.detail}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={s.sprintBtn}
          onPress={() => navigation.navigate('Sprint', { task })}
        >
          <Feather name="clock" size={16} color={C.forest} />
          <Text style={s.sprintBtnText}>Focus timer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.doneBtn, taskDone && s.doneBtnOff]}
          onPress={handleMarkDone}
          disabled={taskDone}
        >
          <Feather name="check" size={16} color={C.white} />
          <Text style={s.doneBtnText}>{taskDone ? 'Done!' : 'Mark as done'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.cream },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.white,
  },
  back: { width: 36, alignItems: 'flex-start' },
  headerLabel: { fontSize: 16, fontWeight: '700', color: C.forest },

  scroll: { padding: 22, paddingBottom: 40 },

  taskCard: {
    backgroundColor: C.white, borderRadius: 18,
    borderWidth: 1, borderColor: C.border,
    padding: 18, marginBottom: 24, gap: 10,
  },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  taskText: { fontSize: 20, fontWeight: '700', color: C.forest, lineHeight: 28 },
  priorityTag: {
    alignSelf: 'flex-start', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20,
  },
  priorityTagText: { fontSize: 12, fontWeight: '700' },

  stepsSection: { gap: 0 },
  stepsLabel: { fontSize: 13, fontWeight: '700', color: C.muted, letterSpacing: 0.5, marginBottom: 16, textTransform: 'uppercase' },

  loadingWrap: { alignItems: 'center', paddingVertical: 40, gap: 14 },
  loadingText: { fontSize: 15, color: C.muted },

  stepRow: {
    flexDirection: 'row', gap: 14, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0EBE3',
    alignItems: 'flex-start',
  },
  stepRowDone: { opacity: 0.5 },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.forest, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepCircleDone: { backgroundColor: C.sage },
  stepNum: { color: C.white, fontWeight: '700', fontSize: 13 },
  stepContent: { flex: 1, paddingTop: 3 },
  stepText: { fontSize: 15, color: C.forest, lineHeight: 22, fontWeight: '500' },
  stepTextDone: { textDecorationLine: 'line-through', color: C.muted },
  stepDetail: { fontSize: 13, color: C.muted, lineHeight: 20, marginTop: 4 },

  footer: {
    flexDirection: 'row', gap: 10, padding: 16,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.white,
  },
  sprintBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    flex: 1, justifyContent: 'center',
    borderWidth: 1.5, borderColor: C.border, borderRadius: 28,
    paddingVertical: 14,
  },
  sprintBtnText: { fontSize: 15, fontWeight: '600', color: C.forest },
  doneBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    flex: 1, justifyContent: 'center',
    backgroundColor: C.forest, borderRadius: 28, paddingVertical: 14,
  },
  doneBtnOff: { backgroundColor: C.sage },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: C.white },
});
