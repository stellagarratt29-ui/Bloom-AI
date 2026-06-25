import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { callClaude, getApiKey } from '../services/ai';

export default function TaskGuideScreen({ route, navigation }) {
  const { task } = route.params ?? {};
  const { toggleTask } = useApp();

  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);
  const [taskDone, setTaskDone] = useState(task?.done ?? false);
  const scrollRef  = useRef(null);
  const historyRef = useRef([]);

  useEffect(() => { loadInitialGuide(); }, []);

  const scrollToEnd = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);

  const loadInitialGuide = async () => {
    setThinking(true);
    try {
      const key = await getApiKey();
      if (!key) throw new Error('no key');
      const reply = await callClaude({
        system: `You are Bloom, a warm and practical productivity coach helping someone complete a specific task.
Give a detailed, personalised breakdown of how to do this exact task:
- 5–7 numbered steps, each specific and actionable for this particular task
- Include real resources (websites, YouTube channels, apps, tools) where relevant
- Match depth to complexity: a simple task gets a short answer; a complex task gets a real breakdown
- End with a warm open question inviting them to ask more
Write in plain text. No markdown headers. Be encouraging but not generic.`,
        messages: [{ role: 'user', content: `My task: "${task?.text}"` }],
        maxTokens: 650,
      });
      const msg = { id: 1, from: 'bloom', text: reply };
      setMessages([msg]);
      historyRef.current = [{ role: 'assistant', content: reply }];
    } catch {
      const guide = getTaskGuideFallback(task?.text);
      const msg = { id: 1, from: 'bloom', text: guide };
      setMessages([msg]);
      historyRef.current = [{ role: 'assistant', content: guide }];
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
        system: `You are Bloom, a practical productivity coach. The user is working on: "${task?.text}". Answer their follow-up question helpfully and specifically. Keep replies to 3–5 sentences. Be direct.`,
        messages: historyRef.current,
        maxTokens: 350,
      });
      const msg = { id: Date.now() + 1, from: 'bloom', text: reply };
      setMessages(prev => [...prev, msg]);
      historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }];
    } catch {
      const m = trimmed.toLowerCase();
      let reply;
      if (/how long|time|take/.test(m)) reply = `It depends on your focus, but set a 25-minute timer to start — you can always do more.`;
      else if (/what do i need|materials|tools|supplies/.test(m)) reply = `Write down everything you think you'll need before starting. Better to gather it upfront than stop mid-task.`;
      else if (/can'?t|don't know|stuck|help/.test(m)) reply = `Start with the very first physical action — even something tiny. Momentum builds from there.`;
      else if (/why|should i|worth it/.test(m)) reply = `You added this for a reason. What made you want to do it?`;
      else reply = `For "${task?.text}": break it into smaller pieces and do one at a time. Which part feels most manageable right now?`;
      const msg = { id: Date.now() + 1, from: 'bloom', text: reply };
      setMessages(prev => [...prev, msg]);
      historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }];
    } finally {
      setThinking(false);
      scrollToEnd();
    }
  };

  const handleMarkDone = () => {
    if (task && !taskDone) {
      toggleTask(task.id);
      setTaskDone(true);
    }
    navigation.goBack();
  };

  const PRIORITY_COLOR = { high: '#C0392B', medium: C.moss, low: C.muted };
  const priorityColor = PRIORITY_COLOR[task?.priority] ?? C.moss;

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Feather name="arrow-left" size={22} color={C.forest} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <View style={[s.priorityDot, { backgroundColor: priorityColor }]} />
            <Text style={s.headerTask} numberOfLines={2}>{task?.text ?? 'Task'}</Text>
          </View>
          <TouchableOpacity
            style={[s.doneBtn, taskDone && s.doneBtnDone]}
            onPress={handleMarkDone}
          >
            <Feather name="check" size={15} color={taskDone ? C.sage : C.white} />
            <Text style={[s.doneBtnText, taskDone && s.doneBtnTextDone]}>
              {taskDone ? 'Done ✓' : 'Mark done — +5 pts'}
            </Text>
          </TouchableOpacity>
        </View>

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
              <Text style={s.loadingText}>Working out how to do this…</Text>
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
            placeholder="Ask Bloom anything about this task…"
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
            <Feather name="send" size={16} color={C.white} />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getTaskGuideFallback(text) {
  const t = (text || '').toLowerCase();

  if (/paint.*nail|nail.*paint/.test(t))
    return `Here's how to get a clean nail paint:\n\n1. Remove old polish with acetone remover\n2. File and shape your nails — do all 10 before painting\n3. Apply a clear base coat and let it dry fully (2 min)\n4. Apply colour in 2 thin coats — thin is key, thick coats peel\n5. Wait 2 minutes between each coat\n6. Finish with a clear top coat\n7. Clean up edges with a cotton bud dipped in remover\n\nTip: do it while watching something so you don't fidget!\n\nWhat colour are you going for?`;

  if (/doctor|dentist|hospital|appointment|clinic/.test(t))
    return `Here's how to prepare:\n\n1. Confirm the time, date, and location — add it to your calendar with a 1-hour reminder\n2. Write down your symptoms, questions, or concerns before you go\n3. Bring: insurance card, previous test results, list of medications you take\n4. Arrive 10–15 minutes early if it's a new clinic\n5. During the appointment: take notes on what they say — even on your phone\n6. After: write down next steps while it's fresh\n\nWhat's the appointment for? I can help you prepare specific questions.`;

  if (/homework|essay|assignment|study|revision|exam|test/.test(t))
    return `Here's how to actually get through it:\n\n1. Clear your space first — a messy desk means a distracted brain\n2. Write down exactly what you need to produce in one sentence\n3. Set a 25-minute timer and work on only that\n4. Take a 5-minute break when it goes off, then go again\n5. Start with the hardest part while your brain is fresh\n\nFree tools: Grammarly for writing, Khan Academy for maths and science, Quizlet for revision cards.\n\nWhat subject is it? I can give more specific help.`;

  if (/clean|tidy|organise|organize|kitchen|room|bedroom|bathroom/.test(t))
    return `Here's how to make cleaning actually happen:\n\n1. Set a 15-minute timer — commit to stopping when it goes off (you'll usually keep going)\n2. Pick ONE area to start, not the whole space\n3. Clear surfaces first: everything goes into a pile\n4. Sort the pile: put away, bin, or donate\n5. Wipe surfaces after they're clear\n6. Vacuum or sweep last\n\nSecret: put on a podcast or playlist you love. Cleaning goes 10x faster.\n\nWhich area are you starting with?`;

  if (/cook|bake|recipe|meal|dinner|lunch|breakfast/.test(t))
    return `Here's how to cook it well:\n\n1. Read the entire recipe before starting — no surprises mid-cook\n2. Prep everything first (chop, measure) before you turn on any heat\n3. Taste as you go — season in layers, not all at the end\n4. Heat the pan before adding oil, add oil before adding food\n5. Don't crowd the pan — things steam instead of browning\n\nResources: "Basics with Babish" on YouTube, BBC Good Food for reliable recipes.\n\nWhat are you making?`;

  if (/email|message|reply|respond/.test(t))
    return `Here's how to write and actually send it:\n\n1. Open a draft and write the subject line first — it focuses your whole email\n2. Write a bad first draft with no editing — just get words out\n3. Three-part structure: why you're emailing → what you need → thanks\n4. Read it once out loud, fix anything that sounds odd\n5. Hit send — don't overthink it\n\nTip: if you're stuck, start with "I'm writing to…" and just finish the sentence.\n\nWho's it to and what do you need to say?`;

  if (/call|phone|ring/.test(t))
    return `Here's how to make the call without dreading it:\n\n1. Write down the 2–3 things you need to say or ask before dialling\n2. Call when you have good signal and a quiet spot\n3. Introduce yourself: "Hi, my name is [name], I'm calling about…"\n4. It's always shorter than you think it'll be\n5. Write down anything important immediately after\n\nWho are you calling and what do you need to sort out?`;

  return `Let's break this down:\n\n1. Decide exactly when today you'll do this — a specific time, not "later"\n2. Write down what you actually need to start (materials, info, who to contact)\n3. Do the first physical action right now, even if it's tiny\n4. Set a 20-minute timer and work only on this\n5. Anything you don't finish: schedule a specific time to come back to it\n\nWhat's making this feel hard, or shall I break it down further?`;
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: C.cream },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.white,
  },
  backBtn: { padding: 4, flexShrink: 0 },
  headerCenter: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8,
  },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0 },
  headerTask: { flex: 1, fontSize: 15, fontWeight: '700', color: C.forest, lineHeight: 22 },
  doneBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.moss, borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 14, flexShrink: 0,
  },
  doneBtnDone: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: C.moss },
  doneBtnText: { fontSize: 13, fontWeight: '700', color: C.white },
  doneBtnTextDone: { color: C.moss },

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
    backgroundColor: C.moss, borderRadius: 18, borderBottomRightRadius: 6,
    paddingVertical: 12, paddingHorizontal: 16, maxWidth: '80%',
  },
  userText: { fontSize: 15, color: C.white, lineHeight: 22 },

  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: C.border,
    backgroundColor: C.cream,
  },
  input: {
    flex: 1, backgroundColor: C.white,
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: 24, paddingVertical: 11, paddingHorizontal: 18,
    fontSize: 15, color: C.ink,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.moss, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { opacity: 0.3 },
});
