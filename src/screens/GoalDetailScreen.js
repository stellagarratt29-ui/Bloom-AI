import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { callClaude, getApiKey, generateGoalAction } from '../services/ai';

export default function GoalDetailScreen({ route, navigation }) {
  const { goal: initialGoal } = route.params ?? {};
  const { goals, advanceGoalAction } = useApp();

  const goal = goals.find(g => g.id === initialGoal?.id) ?? initialGoal;

  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const scrollRef  = useRef(null);
  const historyRef = useRef([]);

  useEffect(() => { loadGuidance(); }, []);

  const scrollToEnd = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);

  const loadGuidance = async () => {
    if (!goal) return;
    setThinking(true);
    try {
      const key = await getApiKey();
      if (!key) throw new Error('no key');
      const reply = await callClaude({
        system: `You are Bloom, a direct and practical productivity coach. The user has a goal and a specific next action.
Explain clearly:
1. Why this action is the right next step for their specific goal
2. Exactly how to do it — specific, not vague
3. What "done" looks like so they know when to stop
Keep it concise: 3–5 sentences. End with one practical tip.`,
        messages: [{ role: 'user', content: `Goal: ${goal.text}\nNext action: ${goal.currentAction}\nCompleted so far: ${goal.completedActions?.length ?? 0} actions.\n\nWhy is this the right next step and how do I do it?` }],
        maxTokens: 500,
      });
      const msg = { id: 1, from: 'bloom', text: reply };
      setMessages([msg]);
      historyRef.current = [{ role: 'assistant', content: reply }];
    } catch {
      const fallback = `This is the right next step because it's the smallest concrete action that moves your goal forward right now. Do it in one focused session — set a timer for 45 minutes and start. When you're done, you'll know exactly what the next step should be. Tip: don't aim for perfect — aim for done.`;
      const msg = { id: 1, from: 'bloom', text: fallback };
      setMessages([msg]);
      historyRef.current = [{ role: 'assistant', content: fallback }];
    } finally {
      setThinking(false);
      scrollToEnd();
    }
  };

  const send = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    const userMsg = { id: Date.now(), from: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    scrollToEnd();
    historyRef.current = [...historyRef.current, { role: 'user', content: trimmed }];

    setThinking(true);
    try {
      const key = await getApiKey();
      if (!key) throw new Error('no key');
      const reply = await callClaude({
        system: `You are Bloom, helping someone work toward their goal: "${goal?.text}". Their current action: "${goal?.currentAction}". Answer their question directly and specifically. 2–4 sentences.`,
        messages: historyRef.current,
        maxTokens: 350,
      });
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text: reply }]);
      historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }];
    } catch {
      const fallback = `Focus on the specific action in front of you. Break it into the smallest possible first step and start with just that. What's the first thing you'd physically do?`;
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text: fallback }]);
      historyRef.current = [...historyRef.current, { role: 'assistant', content: fallback }];
    } finally {
      setThinking(false);
      scrollToEnd();
    }
  };

  const handleMarkDone = async () => {
    if (!goal || advancing) return;
    setAdvancing(true);
    try {
      const nextAction = await generateGoalAction({
        goalText: goal.text,
        completedActions: [...(goal.completedActions ?? []), goal.currentAction],
      });
      advanceGoalAction(goal.id, nextAction);
      navigation.goBack();
    } catch {
      advanceGoalAction(goal.id, `Reflect on your progress so far on "${goal.text}" and write the single most important thing still standing between you and the finish line.`);
      navigation.goBack();
    } finally {
      setAdvancing(false);
    }
  };

  const doneCount = goal?.completedActions?.length ?? 0;

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Feather name="arrow-left" size={22} color={C.forest} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerGoal} numberOfLines={1}>{goal?.text ?? 'Goal'}</Text>
            <Text style={s.headerAction} numberOfLines={2}>{goal?.currentAction}</Text>
          </View>
          <TouchableOpacity
            style={[s.doneBtn, advancing && { opacity: 0.6 }]}
            onPress={handleMarkDone}
            disabled={advancing}
          >
            {advancing ? (
              <ActivityIndicator size="small" color={C.white} />
            ) : (
              <>
                <Feather name="check" size={14} color={C.white} />
                <Text style={s.doneBtnText}>Done</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {doneCount > 0 && (
          <View style={s.progressBanner}>
            <Feather name="trending-up" size={13} color={C.sage} />
            <Text style={s.progressText}>{doneCount} action{doneCount !== 1 ? 's' : ''} completed toward this goal</Text>
          </View>
        )}

        <ScrollView
          ref={scrollRef}
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {thinking && messages.length === 0 && (
            <View style={s.loadingWrap}>
              <ActivityIndicator color={C.sage} size="small" />
              <Text style={s.loadingText}>Working out your next step…</Text>
            </View>
          )}

          {messages.map(m => (
            m.from === 'bloom' ? (
              <View key={m.id} style={s.bloomBubble}>
                <Text style={s.bloomText}>{m.text}</Text>
              </View>
            ) : (
              <View key={m.id} style={s.userRow}>
                <View style={s.userBubble}>
                  <Text style={s.userText}>{m.text}</Text>
                </View>
              </View>
            )
          ))}

          {thinking && messages.length > 0 && (
            <View style={[s.bloomBubble, { paddingVertical: 16 }]}>
              <ActivityIndicator color={C.sage} size="small" />
            </View>
          )}
        </ScrollView>

        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            placeholder="Ask Bloom about this step…"
            placeholderTextColor={C.muted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
            editable={!thinking}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || thinking) && s.sendBtnOff]}
            onPress={() => send(input)}
            disabled={!input.trim() || thinking}
          >
            <Feather name="arrow-up" size={17} color={C.white} />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: C.cream },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.white,
  },
  backBtn: { padding: 4, flexShrink: 0 },
  headerCenter: { flex: 1 },
  headerGoal: { fontSize: 11, fontWeight: '700', color: C.clay, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3 },
  headerAction: { fontSize: 13, color: C.forest, lineHeight: 18, fontWeight: '500' },
  doneBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.forest, borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 14, flexShrink: 0, minWidth: 70, justifyContent: 'center',
  },
  doneBtnText: { fontSize: 13, fontWeight: '700', color: C.white },

  progressBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.sagePale, paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: C.sageLight,
  },
  progressText: { fontSize: 12, color: C.forest },

  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 14, paddingBottom: 32 },

  loadingWrap: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 14, color: C.muted },

  bloomBubble: {
    backgroundColor: C.white, borderRadius: 18, borderBottomLeftRadius: 6,
    padding: 16, borderWidth: 1, borderColor: C.border,
  },
  bloomText: { fontSize: 15, color: C.forest, lineHeight: 26 },

  userRow: { alignItems: 'flex-end' },
  userBubble: {
    backgroundColor: C.forest, borderRadius: 18, borderBottomRightRadius: 6,
    paddingVertical: 12, paddingHorizontal: 16, maxWidth: '80%',
  },
  userText: { fontSize: 15, color: C.white, lineHeight: 22 },

  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.cream,
  },
  input: {
    flex: 1, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 24, paddingVertical: 11, paddingHorizontal: 18,
    fontSize: 15, color: C.forest,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.forest, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { opacity: 0.3 },
});
