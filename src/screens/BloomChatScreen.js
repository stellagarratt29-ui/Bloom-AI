import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, SafeAreaView, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { callClaude, buildBloomSystem, getApiKey } from '../services/ai';

const STARTERS = [
  "What should I focus on today?",
  "Help me break down a big task.",
  "I'm feeling overwhelmed.",
  "How am I doing with my goal?",
];

function getInitialGreeting(userName, buddyName) {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const name = userName ? `, ${userName}` : '';
  return `${greet}${name}! I'm ${buddyName ?? 'Bloom'}. What's on your mind?`;
}

// Returns task text if message is an add-task request, otherwise null
function detectTaskAdd(msg) {
  const lower = msg.toLowerCase().trim();

  // Explicit: "add dentist appointment", "remind me to call mum", etc.
  const explicit = lower.match(
    /^(?:add|remind me to|put|i need to|don'?t let me forget to?|can you add|please add|schedule)\s+(.+?)(?:\s+(?:to|on|in)\s+(?:my\s+)?(?:list|calendar|cal|tasks?|schedule))?[.!?]?$/
  );
  if (explicit) return explicit[1].trim();

  // Short action phrases: "dentist appointment", "call mum", "buy milk"
  const shortAction = /^(?:dentist|doctor|hospital|meeting|appointment|call|email|text|pick up|buy|get|go to|visit|finish|complete|clean|tidy|pay|book|fix|check|ring)\b/.test(lower);
  if (shortAction && lower.split(' ').length <= 8) return msg.trim();

  return null;
}

function getFallback(msg, { userName, goals, tasks, buddyName }) {
  const m = msg.toLowerCase().trim();
  const name = userName ? ` ${userName}` : '';

  // Greetings
  if (/^(hi+|hey+|hello+|yo+|sup|howdy|good\s*(morning|afternoon|evening|night))[\s!?.]*$/.test(m))
    return `Hey${name}! What's on your mind today — tasks, worries, things you want to get done? I'm here to help.`;

  // Thanks / acknowledgements
  if (/^(thanks?|thank you|cheers|ok+|okay|got it|perfect|great|nice|cool|sounds good|awesome|fab)[\s!.]*$/.test(m))
    return `Anytime${name}! Is there anything else I can help you with?`;

  // Bye
  if (/^(bye|goodbye|see ya|cya|later|ttyl|gotta go)[\s!.]*$/.test(m))
    return `See you later${name}! Come back whenever you need to plan your day.`;

  // How are you?
  if (/how are you|how('re| are) you doing|you ok\??$/.test(m))
    return `I'm just here to help you! How are YOU doing — what's on your plate today?`;

  // Overwhelm / stress / anxiety
  if (/overwhelm|stress|too much|can'?t cope|anxious|anxiety|panic|freak/.test(m))
    return `That feeling is real, and it's okay. Here's what actually helps: pick just ONE task — the smallest thing — and only do that. What is it?`;

  // Tired / burnt out
  if (/tired|exhausted|no energy|drained|burnt? ?out|fatigue|sleep/.test(m))
    return `Your body is telling you something. Rest IS productive. If you must push through — what's the single most important thing you need to do today?`;

  // Can't start / procrastination
  if (/can'?t start|can'?t begin|procrastinat|don'?t know where to start|where do i start|stuck/.test(m))
    return `Start anywhere. Pick the task that feels smallest, set a 10-minute timer, and just begin. Which task do you want to try first?`;

  // Focus / distraction
  if (/focus|distract|keep getting distract|can'?t concentrate/.test(m))
    return `Try this: close every other tab, put your phone face-down, set a 25-minute timer, and work on ONE thing only. What's that one thing?`;

  // Goal / progress
  if (/goal|progress|how am i doing|on track|am i doing well/.test(m)) {
    const g = goals?.[0]?.text;
    if (g) return `Your goal is "${g}". Best way to make progress? One small action today. What could you do in the next hour toward it?`;
    return `Set a goal in the Goals tab and I can help you track it and figure out next steps!`;
  }

  // What should I do today
  if (/what should i (do|focus|work on)|today|my tasks|my list|where do i start/.test(m)) {
    const pending = (tasks || []).filter(t => !t.done);
    if (pending.length > 0) {
      const top = pending.find(t => t.priority === 'high') || pending[0];
      return `Your most important task right now: "${top.text}". Tap it on the Today tab to see how to do it step by step.`;
    }
    return `Your list is clear! Type anything in the chat bar on the Today tab — tasks, worries, or your whole morning brain dump.`;
  }

  // Calendar / schedule requests
  if (/calendar|cal|schedule/.test(m))
    return `I've added that to your task list! Check the Today tab. (Google Calendar sync is coming soon.)`;

  // Habit / routine
  if (/habit|routine|every day|daily|consistent/.test(m))
    return `The best habit is one you'll actually do. What's one tiny thing you could commit to doing every single day — even on bad days?`;

  // Motivation
  if (/motivat|can'?t be bothered|don'?t feel like|no motivation|lazy/.test(m))
    return `Motivation follows action — not the other way around. Start for just 2 minutes, you'll usually keep going. What's the first tiny step?`;

  // Questions about the buddy
  if (/what can you do|what are you|who are you|are you an ai|are you real/.test(m))
    return `I'm ${buddyName ?? 'Bloom'}, your productivity buddy! I can help you plan your day, add tasks, break things down, and talk through what's on your mind. What do you need?`;

  // "yes", "no", "maybe" alone
  if (/^(yes+|no+|nah|nope|yep|yeah|sure|maybe|idk|dunno)[\s!.?]*$/.test(m))
    return `Got it! What's the next thing on your mind?`;

  // Short random word (like "API", "BRU" etc.)
  if (m.split(' ').length <= 2 && m.length < 20)
    return `Got you! What are you working on today, or what's stressing you out?`;

  // Catch-all
  return `I hear you. What's the most important thing you need to get done today? Tell me and we'll figure it out together.`;
}

export default function BloomChatScreen({ navigation }) {
  const { userName, buddy, goals, tasks, currentStreak, totalPoints, momentum, addTask } = useApp();

  const [messages, setMessages] = useState([
    { id: 1, from: 'bloom', text: getInitialGreeting(userName, buddy?.name) },
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

  const send = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    const userMsg = { id: Date.now(), from: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    scrollToEnd();

    historyRef.current = [...historyRef.current, { role: 'user', content: trimmed }];

    if (!hasKey) {
      // Try to detect task-add intent first
      const taskText = detectTaskAdd(trimmed);
      let reply;
      if (taskText) {
        addTask(taskText, 'medium');
        reply = `Done! I've added "${taskText}" to your task list. Head to the Today tab to see it. Anything else?`;
      } else {
        reply = getFallback(trimmed, { userName, goals, tasks, buddyName: buddy?.name });
      }
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text: reply }]);
      historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }];
      scrollToEnd();
      return;
    }

    setThinking(true);
    try {
      const system = buildBloomSystem({ userName, buddy, goals, tasks, streak: currentStreak, totalPoints, momentum });
      const reply = await callClaude({ system, messages: historyRef.current, maxTokens: 350 });
      const bloomMsg = { id: Date.now() + 1, from: 'bloom', text: reply };
      setMessages(prev => [...prev, bloomMsg]);
      historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }];
    } catch (e) {
      const errText = e.code === 'AUTH'
        ? 'Your API key looks invalid — check it in Settings.'
        : 'I had trouble connecting. Check your internet and try again.';
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
          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={22} color={C.forest} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>{buddy?.name ?? 'Bloom'}</Text>
            <Text style={s.headerSub}>
              {hasKey === true ? 'AI · powered by Claude' : 'Your productivity buddy'}
            </Text>
          </View>
          <View style={s.headerRight} />
        </View>

        <ScrollView
          ref={scrollRef}
          style={s.messages}
          contentContainerStyle={s.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map(m => (
            <View key={m.id} style={[s.bubble, m.from === 'user' ? s.bubbleUser : s.bubbleBloom]}>
              <Text style={[s.bubbleText, m.from === 'user' ? s.bubbleTextUser : s.bubbleTextBloom]}>
                {m.text}
              </Text>
            </View>
          ))}

          {thinking && (
            <View style={[s.bubble, s.bubbleBloom, s.thinkingBubble]}>
              <ActivityIndicator size="small" color={C.sage} />
            </View>
          )}

          {messages.length <= 1 && !thinking && (
            <View style={s.starters}>
              {STARTERS.map(st => (
                <TouchableOpacity key={st} style={s.starterChip} onPress={() => send(st)}>
                  <Text style={s.starterText}>{st}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            placeholder={`Message ${buddy?.name ?? 'Bloom'}…`}
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
            <Feather name="send" size={16} color={C.white} />
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
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.white,
  },
  back: { width: 36, alignItems: 'flex-start' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.forest },
  headerSub: { fontSize: 11, color: C.muted, marginTop: 1 },
  headerRight: { width: 36 },

  messages: { flex: 1 },
  messagesContent: { padding: 20, gap: 12 },

  bubble: { maxWidth: '82%', borderRadius: 18, padding: 14 },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: C.forest, borderBottomRightRadius: 4 },
  bubbleBloom: {
    alignSelf: 'flex-start', backgroundColor: C.white,
    borderWidth: 1, borderColor: C.border, borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 23 },
  bubbleTextUser: { color: C.white },
  bubbleTextBloom: { color: C.forest },
  thinkingBubble: { paddingVertical: 16, paddingHorizontal: 20 },

  starters: { gap: 8, marginTop: 8 },
  starterChip: {
    backgroundColor: C.white, borderRadius: 20,
    paddingVertical: 10, paddingHorizontal: 16,
    borderWidth: 1, borderColor: C.border, alignSelf: 'flex-start',
  },
  starterText: { fontSize: 14, color: C.forest },

  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: C.border,
    backgroundColor: C.white,
  },
  input: {
    flex: 1, backgroundColor: C.cream, borderWidth: 1, borderColor: C.border,
    borderRadius: 22, paddingVertical: 10, paddingHorizontal: 16,
    fontSize: 15, color: C.forest,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.forest, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { opacity: 0.35 },
});
