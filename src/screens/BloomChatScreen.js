import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, SafeAreaView, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { callClaude, buildBloomSystem, getApiKey, parseTasksWithAI } from '../services/ai';

const STARTERS = [
  "What should I focus on today?",
  "Help me break down a big task.",
  "I'm feeling overwhelmed.",
  "How am I doing with my goal?",
];

function getInitialGreeting(userName) {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const name = userName ? `, ${userName}` : '';
  return `${greet}${name}. What's on your mind?`;
}

function detectTaskAdd(msg) {
  const lower = msg.toLowerCase().trim();
  const explicit = lower.match(
    /^(?:add|remind me to|put|i need to|don'?t let me forget to?|can you add|please add|schedule)\s+(.+?)(?:\s+(?:to|on|in)\s+(?:my\s+)?(?:list|calendar|cal|tasks?|schedule))?[.!?]?$/
  );
  if (explicit) return explicit[1].trim();
  const shortAction = /^(?:dentist|doctor|hospital|meeting|appointment|call|email|text|pick up|buy|get|go to|visit|finish|complete|clean|tidy|pay|book|fix|check|ring)\b/.test(lower);
  if (shortAction && lower.split(' ').length <= 8) return msg.trim();
  return null;
}

function getFallback(msg, { userName, goals, tasks }) {
  const m = msg.toLowerCase().trim();
  const name = userName ? ` ${userName}` : '';

  // Greetings
  if (/^(hi+|hey+|hello+|yo+|sup|howdy|good\s*(morning|afternoon|evening|night))[\s!?.]*$/.test(m))
    return `Hey${name}. What's on your mind today — tasks, worries, things you want to get done?`;

  // Thanks / acknowledgements
  if (/^(thanks?|thank you|cheers|ok+|okay|got it|perfect|great|nice|cool|sounds good|awesome|fab)[\s!.]*$/.test(m))
    return `Anytime${name}. Anything else?`;

  // Bye
  if (/^(bye|goodbye|see ya|cya|later|ttyl|gotta go)[\s!.]*$/.test(m))
    return `Talk soon${name}.`;

  // How are you
  if (/how are you|how('re| are) you doing|you ok\??/.test(m))
    return `I'm here for you. How are YOU doing — what's on your plate?`;

  // Time / date questions — can't answer, redirect nicely
  if (/what (time|day|date|month|year) is it|what's the (time|date)|current time|today's date/.test(m)) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    return `It's ${timeStr} on ${dateStr}. Anything on your mind for today?`;
  }

  // What should I focus on / what to do today — check tasks FIRST
  if (/what should i (do|focus on|work on)|what('s| is) (most important|next|first)|where (do i|should i) start|my tasks|my list/.test(m)) {
    const pending = (tasks || []).filter(t => !t.done);
    if (pending.length > 0) {
      const top = pending.find(t => t.priority === 'high') || pending[0];
      return `Your most important task right now: "${top.text}". Head to Today and tap it — I'll break it into steps for you.`;
    }
    return `Your list is clear${name}. What do you need to get done today? Tell me and I'll add it.`;
  }

  // Overwhelm / stress
  if (/overwhelm|stress|too much|can'?t cope|anxious|anxiety|panic/.test(m))
    return `That feeling is real. Here's what helps: pick just ONE task — the smallest thing — and only do that. What is it?`;

  // Tired / burnt out
  if (/tired|exhausted|no energy|drained|burnt? ?out|fatigue/.test(m))
    return `Your body is telling you something. Rest is productive. If you must push through — what's the single most important thing today?`;

  // Can't start / stuck
  if (/can'?t start|can'?t begin|procrastinat|don'?t know where to start|stuck/.test(m))
    return `Start anywhere. Pick the smallest task, set a 10-minute timer, and just begin. Which task?`;

  // Focus / distraction (must come AFTER the "what should I focus on" check above)
  if (/can'?t focus|hard to focus|keep getting distract|can'?t concentrate|losing focus/.test(m))
    return `Close every other tab. Phone face-down. 25-minute timer. One thing only. What's that one thing?`;

  // Goal / progress
  if (/goal|progress|how am i doing|on track|am i doing well/.test(m)) {
    const g = goals?.[0]?.text;
    if (g) return `Your goal is "${g}". What could you do in the next hour toward it?`;
    return `Set a goal — tap the target icon top right — and I can help you track it and figure out next steps.`;
  }

  // Motivation
  if (/motivat|can'?t be bothered|don'?t feel like|no motivation|lazy/.test(m))
    return `Motivation follows action. Start for just 2 minutes — you'll usually keep going. First tiny step?`;

  // Habit / routine
  if (/habit|routine|every day|daily|consistent/.test(m))
    return `The best habit is one you'll actually do. What's one tiny thing you could commit to every single day?`;

  // Calendar / schedule
  if (/calendar|schedule/.test(m))
    return `Google Calendar sync is coming soon. For now, tell me what's on your schedule and I'll add it to Today.`;

  // Who/what am I
  if (/what can you do|what are you|who are you|are you an ai|are you real/.test(m))
    return `I'm Bloom — your AI productivity assistant. I can help you plan your day, add tasks, break things down, and talk through what's on your mind.`;

  // Yes/no alone
  if (/^(yes+|no+|nah|nope|yep|yeah|sure|maybe|idk|dunno)[\s!.?]*$/.test(m))
    return `Got it. What's next?`;

  // Very short messages
  if (m.split(' ').length <= 2 && m.length < 20)
    return `What are you working on today${name}?`;

  // Catch-all
  return `Got it${name}. What's the most important thing you need to get done today?`;
}

export default function BloomChatScreen({ navigation }) {
  const { userName, goals, tasks, currentStreak, totalPoints, momentum, addTask, processBrainDump } = useApp();

  const [messages, setMessages] = useState([
    { id: 1, from: 'bloom', text: getInitialGreeting(userName) },
  ]);
  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);
  const [hasKey, setHasKey]     = useState(null);
  const scrollRef  = useRef(null);
  const historyRef = useRef([]);

  useEffect(() => {
    getApiKey().then(k => setHasKey(!!k));
  }, []);

  const scrollToEnd = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);

  // Detect when the user is brain-dumping a list of tasks into the chat
  function looksLikeTaskDump(text) {
    const t = text.toLowerCase();
    if (/here'?s? (what i|my) (need|have|want|gotta|tasks|list|to.?do)/i.test(text)) return true;
    if (/i (need|have|gotta|want) to .{5,} and (i )?(also )?(need|have|gotta|want)/i.test(t)) return true;
    if (text.includes('\n') && text.trim().split('\n').length >= 2) return true;
    if ((text.match(/\band\b/gi) || []).length >= 2 && text.length > 40) return true;
    return false;
  }

  function buildDumpReply(items, name) {
    const n = name ? ` ${name}` : '';
    const high = items.filter(i => i.priority === 'high');
    const med  = items.filter(i => i.priority === 'medium');
    const low  = items.filter(i => i.priority === 'low');
    const goals = items.filter(i => i.category === 'goal');

    let lines = [`Got it${n}. Added to Today:\n`];
    if (high.length) lines.push(...high.map(i => `  - ${i.text}  [urgent]`));
    if (med.length)  lines.push(...med.map(i =>  `  - ${i.text}`));
    if (low.length)  lines.push(...low.map(i =>  `  - ${i.text}  [when you can]`));
    if (goals.length) lines.push(`\nGoal spotted: "${goals[0].text}" — added to your Goals.`);

    const top = high[0] || med[0];
    if (top) lines.push(`\nStart with "${top.text}" — tap it on Today for a step-by-step guide.`);

    return lines.join('\n');
  }

  const send = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    const userMsg = { id: Date.now(), from: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    scrollToEnd();
    historyRef.current = [...historyRef.current, { role: 'user', content: trimmed }];

    if (!hasKey) {
      let reply;

      // Brain dump detection — parse and add all tasks at once
      if (looksLikeTaskDump(trimmed)) {
        try {
          const items = await parseTasksWithAI(trimmed);
          if (items.length > 0) {
            processBrainDump(items);
            reply = buildDumpReply(items, userName);
          }
        } catch {}
      }

      if (!reply) {
        const taskText = detectTaskAdd(trimmed);
        if (taskText) {
          addTask(taskText, 'medium');
          reply = `Done — "${taskText}" is on your Today list. Anything else?`;
        } else {
          reply = getFallback(trimmed, { userName, goals, tasks });
        }
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text: reply }]);
      historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }];
      scrollToEnd();
      return;
    }

    setThinking(true);
    try {
      const system = buildBloomSystem({ userName, goals, tasks, streak: currentStreak, totalPoints, momentum });
      const reply = await callClaude({ system, messages: historyRef.current, maxTokens: 350 });
      const bloomMsg = { id: Date.now() + 1, from: 'bloom', text: reply };
      setMessages(prev => [...prev, bloomMsg]);
      historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }];
    } catch (e) {
      const errText = e.code === 'AUTH'
        ? 'Your API key looks invalid — check it in Settings.'
        : 'Trouble connecting. Check your internet and try again.';
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text: errText }]);
    } finally {
      setThinking(false);
      scrollToEnd();
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>Bloom</Text>
            <Text style={s.headerSub}>
              {hasKey === true ? 'Powered by Claude' : 'AI companion'}
            </Text>
          </View>
          <View style={s.headerIcons}>
            <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Goals')}>
              <Feather name="target" size={20} color={C.muted} />
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Settings')}>
              <Feather name="settings" size={20} color={C.muted} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map(m => (
            m.from === 'bloom' ? (
              <View key={m.id} style={s.bloomRow}>
                <View style={s.bloomBubble}>
                  <Text style={s.bloomText}>{m.text}</Text>
                </View>
              </View>
            ) : (
              <View key={m.id} style={s.userRow}>
                <View style={s.userBubble}>
                  <Text style={s.userText}>{m.text}</Text>
                </View>
              </View>
            )
          ))}

          {thinking && (
            <View style={s.bloomRow}>
              <View style={[s.bloomBubble, s.thinkingBubble]}>
                <ActivityIndicator size="small" color={C.sage} />
              </View>
            </View>
          )}

          {messages.length <= 1 && !thinking && (
            <View style={s.starterWrap}>
              <Text style={s.starterLabel}>Try asking</Text>
              {STARTERS.map(st => (
                <TouchableOpacity key={st} style={s.starterChip} onPress={() => send(st)}>
                  <Text style={s.starterText}>{st}</Text>
                  <Feather name="arrow-right" size={13} color={C.sage} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            placeholder="Message Bloom…"
            placeholderTextColor={C.muted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
            multiline={false}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 18, paddingBottom: 16,
    backgroundColor: C.cream,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: {
    fontSize: 32, fontWeight: '800', color: C.forest, letterSpacing: -0.8,
  },
  headerSub: { fontSize: 12, color: C.muted, marginTop: 1, fontWeight: '500' },
  headerIcons: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 8 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 24, gap: 16 },

  bloomRow: { alignSelf: 'stretch' },
  bloomBubble: {
    backgroundColor: C.white,
    borderRadius: 20, borderBottomLeftRadius: 6,
    paddingVertical: 14, paddingHorizontal: 18,
    borderWidth: 1, borderColor: C.border,
    maxWidth: '88%',
  },
  bloomText: {
    fontSize: 16, color: C.forest, lineHeight: 26, fontWeight: '400',
  },
  thinkingBubble: { paddingVertical: 16, paddingHorizontal: 22 },

  userRow: { alignItems: 'flex-end' },
  userBubble: {
    backgroundColor: C.forest,
    borderRadius: 20, borderBottomRightRadius: 6,
    paddingVertical: 12, paddingHorizontal: 16,
    maxWidth: '78%',
  },
  userText: { fontSize: 15, color: C.white, lineHeight: 23 },

  starterWrap: { marginTop: 8, gap: 10 },
  starterLabel: {
    fontSize: 11, fontWeight: '700', color: C.muted,
    letterSpacing: 1.2, marginBottom: 4,
  },
  starterChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.white, borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 16,
    borderWidth: 1, borderColor: C.border,
  },
  starterText: { fontSize: 14, color: C.forest, fontWeight: '500', flex: 1 },

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
    fontSize: 15, color: C.forest,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.forest, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { opacity: 0.3 },
});
