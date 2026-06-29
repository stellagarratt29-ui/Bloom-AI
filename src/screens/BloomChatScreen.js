import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, SafeAreaView, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import Icon from '../components/Icon';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { callClaude, buildBloomSystem, getApiKey, parseBrainDump, generateGoalAction, detectCalendarAction } from '../services/ai';
import { processCalendarRequest } from '../services/calendar';

function getGreeting(userName) {
  const h = new Date().getHours();
  const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  const name = userName ? `, ${userName}` : '';
  return `Good ${time}${name}. How are you feeling today, and what's on your mind? Just tell me everything — tasks, worries, plans — and I'll sort it out.`;
}

// Returns true when the message is clearly a direct question or conversation —
// NOT a description of tasks/worries the user wants sorted. When true, skip
// brain-dump extraction entirely and respond as a real assistant.
function isConversationalOrQuestion(text) {
  const t = text.trim();
  const lower = t.toLowerCase();

  // Any question mark → definitely a question
  if (t.includes('?')) return true;

  // WH- question starters
  if (/^(what|how|why|when|where|who|which|whose|whom)\b/i.test(t)) return true;

  // "What's / how's" contractions
  if (/^(what'?s|who'?s|how'?s|where'?s|when'?s)\b/i.test(t)) return true;

  // Auxiliary verb questions directed at Bloom or general
  if (/^(can you|could you|will you|would you|do you|does bloom|are you|is bloom|have you|should i|may i)\b/i.test(lower)) return true;

  // Imperative requests directed at Bloom (not task-listing imperatives)
  if (/^(show me|tell me|explain|help me|give me|find me|describe|summarise|summarize|list my|remind me of|walk me through)\b/i.test(lower)) return true;

  // Casual chat / greetings / acknowledgments
  if (/^(hey|hi|hello|sup|yo|hiya|howdy|good morning|good afternoon|good evening)\b/i.test(lower)) return true;
  if (/^(thanks|thank you|cheers|ok|okay|got it|sounds good|perfect|great|nice|awesome|cool|sure|yep|yeah|nope)[\s!?.]*$/i.test(lower)) return true;
  if (/^(bye|goodbye|see ya|later|talk soon)[\s!?.]*$/i.test(lower)) return true;

  return false;
}

function looksLikeTaskDump(text) {
  const t = text.toLowerCase();
  if (/here'?s? (what i|my) (need|have|want|tasks|list|to.?do)/i.test(text)) return true;
  if (/i (need|have|gotta|want) to .{5,} and (i )?(also )?(need|have|gotta|want)/i.test(t)) return true;
  if (text.includes('\n') && text.trim().split('\n').length >= 2) return true;
  if ((text.match(/\band\b/gi) || []).length >= 2 && text.length > 40) return true;
  if ((text.match(/,/g) || []).length >= 2 && text.length > 30) return true;
  return false;
}

function detectTaskAdd(msg) {
  const lower = msg.toLowerCase().trim();
  const m = lower.match(
    /^(?:add|remind me to|put|i need to|don'?t let me forget to?|can you add|please add|schedule)\s+(.+?)(?:\s+(?:to|on|in)\s+(?:my\s+)?(?:list|tasks?|schedule))?[.!?]?$/
  );
  if (m) return m[1].trim();
  const shortAction = /^(?:dentists?|doctors?|hospital|meetings?|appointments?|appts?|calls?|emails?|texts?|pick up|buy|get|go to|visit|finish|complete|clean|tidy|pay|book|fix|check|ring)\b/.test(lower);
  if (shortAction && lower.split(' ').length <= 8) return msg.trim();
  return null;
}

function getFallback(msg, { userName, goals, tasks }) {
  const m = msg.toLowerCase().trim();
  const name = userName ? ` ${userName}` : '';

  if (/^(hi+|hey+|hello+|yo+|good\s*(morning|afternoon|evening))[\s!?.]*$/.test(m))
    return `Hey${name}. What's on your mind? Tell me everything and I'll sort it.`;
  if (/^(thanks?|thank you|cheers|ok+|okay|got it|sounds good)[\s!.]*$/.test(m))
    return `Anytime${name}. What else?`;
  if (/^(bye|goodbye|see ya|later)[\s!.]*$/.test(m)) return `Talk soon${name}.`;
  if (/how are you/.test(m)) return `I'm here and ready. How are YOU doing today?`;
  if (/what (time|day|date) is it/.test(m)) {
    const now = new Date();
    return `It's ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on ${now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}.`;
  }
  if (/what should i (do|focus on|work on)|what('s| is) (most important|next|first)|my tasks|my list/.test(m)) {
    const pending = (tasks || []).filter(t => !t.done);
    if (pending.length > 0) {
      const top = pending.find(t => t.priority === 'high') || pending[0];
      return `Your most important task right now: "${top.text}". Head to your Tasks tab to see everything.`;
    }
    return `Nothing on your list yet${name}. Tell me what's on your mind.`;
  }
  if (/overwhelm|stress|too much|anxious|worried/.test(m)) {
    const aboutMatch = m.match(/(?:about|with|for|over)\s+(.{3,40}?)(?:\s+(?:and|but|,)|[.!?]|$)/);
    const topic = aboutMatch?.[1]?.trim();
    return topic
      ? `That's a lot — especially with "${topic}" hanging over you. Pick just one tiny thing to do next and do only that.`
      : `That feeling is real. Pick the single smallest possible action and do just that. What is it?`;
  }
  if (/can'?t start|procrastinat|stuck|don'?t know where to start/.test(m))
    return `Set a 10-minute timer and just begin — it doesn't have to be good, it just has to start. Which task?`;
  if (/done|finished|completed|just did|just finished/.test(m)) {
    const pending = (tasks || []).filter(t => !t.done);
    return pending.length > 0
      ? `Nice work. Check your Tasks tab for what's next.`
      : `Everything's done — well done${name}. Add more any time.`;
  }
  if (/goal|progress/.test(m)) {
    const g = goals?.[0]?.text;
    return g ? `Your goal: "${g}". Check the Goals tab for your next step.` : `Head to Goals to set a big goal — I'll build you a real plan.`;
  }
  const keyWord = m.match(/\b(essay|homework|test|exam|dentist|doctor|appointment|project|presentation|email|call|meeting|paint|draw|gym|run|cook|clean)\b/)?.[0];
  if (keyWord) return `Got it — "${keyWord}" noted. Tell me everything else on your mind and I'll sort it all at once.`;

  // Question or conversational message without an AI key — be upfront
  if (isConversationalOrQuestion(msg)) {
    return `To answer that properly I need an AI connection — add a Claude API key in Settings and I'll give you a real response. Until then I can help you capture and sort tasks.`;
  }

  return `Got it${name}. Tell me everything that's on your mind and I'll turn it into a plan.`;
}

export default function BloomChatScreen() {
  const { userName, goals, tasks, addTask, processBrainDump, ndToggles } = useApp();
  const { colors: t } = useTheme();
  const [messages, setMessages] = useState([
    { id: 1, from: 'bloom', text: getGreeting(userName) },
  ]);
  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);
  const [hasKey, setHasKey]     = useState(null);
  const scrollRef  = useRef(null);
  const historyRef = useRef([]);

  useEffect(() => { getApiKey().then(k => setHasKey(!!k)); }, []);

  const scrollToEnd = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);

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
      // Calendar action path
      if (detectCalendarAction(trimmed)) {
        const calReply = await processCalendarRequest(trimmed);
        if (calReply !== null) {
          setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text: calReply }]);
          historyRef.current = [...historyRef.current, { role: 'assistant', content: calReply }];
          setThinking(false);
          scrollToEnd();
          return;
        }
      }

      // Brain dump path — only if the message is clearly task/worry listing, not a question
      if (!isConversationalOrQuestion(trimmed) && looksLikeTaskDump(trimmed)) {
        const { items, response } = await parseBrainDump(trimmed, userName, ndToggles);
        if (items.length > 0) {
          const goalItems = items.filter(i => i.category === 'goal');
          const goalActionsMap = {};
          await Promise.all(
            goalItems.map(async g => {
              goalActionsMap[g.text] = await generateGoalAction({ goalText: g.text });
            })
          );

          processBrainDump(items, goalActionsMap);
          const taskCount = items.filter(i => i.category !== 'goal').length;
          const goalCount = goalItems.length;
          const parts = [];
          if (taskCount > 0) parts.push(`${taskCount} task${taskCount !== 1 ? 's' : ''}`);
          if (goalCount > 0) parts.push(`${goalCount} goal${goalCount !== 1 ? 's' : ''}`);
          const replyText = response ?? `Sorted ${parts.join(' and ')} — head to your Tasks tab to see them.`;

          setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text: replyText }]);
          historyRef.current = [...historyRef.current, { role: 'assistant', content: replyText }];
          setThinking(false);
          scrollToEnd();
          return;
        }
      }

      // Single task add — skip if it's a question/conversation
      const taskText = !isConversationalOrQuestion(trimmed) ? detectTaskAdd(trimmed) : null;
      if (taskText && !hasKey) {
        addTask(taskText, 'medium');
        const reply = `Added "${taskText}" to your Tasks tab.`;
        setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text: reply }]);
        historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }];
        setThinking(false);
        scrollToEnd();
        return;
      }

      // AI chat
      if (hasKey) {
        const system = buildBloomSystem({ userName, goals, tasks, ndToggles });
        const reply = await callClaude({ system, messages: historyRef.current, maxTokens: 350 });
        setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text: reply }]);
        historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }];
      } else {
        const reply = getFallback(trimmed, { userName, goals, tasks });
        setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text: reply }]);
        historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }];
      }
    } catch (e) {
      const err = e.code === 'AUTH' ? 'API key looks invalid.' : getFallback(trimmed, { userName, goals, tasks });
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text: err }]);
    } finally {
      setThinking(false);
      scrollToEnd();
    }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <View style={[s.header, { backgroundColor: t.bg, borderBottomColor: t.border }]}>
          <Text style={s.headerTitle}>Bloom</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map(m => {
            if (m.from === 'user') {
              return (
                <View key={m.id} style={s.userRow}>
                  <View style={[s.userBubble, { backgroundColor: t.chatBubble }]}>
                    <Text style={s.userText}>{m.text}</Text>
                  </View>
                </View>
              );
            }
            return (
              <View key={m.id} style={s.bloomRow}>
                <View style={[s.bloomBubble, { backgroundColor: t.card, borderColor: t.border }]}>
                  <Text style={[s.bloomText, { color: t.text }]}>{m.text}</Text>
                </View>
              </View>
            );
          })}

          {thinking && (
            <View style={s.bloomRow}>
              <View style={[s.bloomBubble, { paddingVertical: 18 }]}>
                <ActivityIndicator size="small" color={C.moss} />
              </View>
            </View>
          )}

          {messages.length <= 1 && !thinking && (
            <View style={s.hint}>
              <Text style={s.hintText}>
                Type everything on your mind — tasks, feelings, plans, worries. Bloom will sort them into your Tasks tab.
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={[s.inputBar, { backgroundColor: t.bg, borderTopColor: t.border }]}>
          <TextInput
            style={[s.input, { backgroundColor: t.card, borderColor: t.border, color: t.text }]}
            placeholder="Tell Bloom what's on your mind…"
            placeholderTextColor={t.subtext}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
            multiline={false}
            editable={!thinking}
          />
          <TouchableOpacity
            style={[s.sendBtn, { backgroundColor: t.chatBubble }, (!input.trim() || thinking) && s.sendBtnOff]}
            onPress={() => send(input)}
            disabled={!input.trim() || thinking}
          >
            <Icon name="send" size={16} color={C.white} />
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
    paddingHorizontal: 22, paddingTop: 18, paddingBottom: 14,
    backgroundColor: C.cream, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: {
    fontSize: 30, fontWeight: '700', color: C.clay, letterSpacing: -0.5,
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingVertical: 16, gap: 14 },

  bloomRow: { alignSelf: 'stretch' },
  bloomBubble: {
    backgroundColor: C.white, borderRadius: 18, borderBottomLeftRadius: 5,
    padding: 16, borderWidth: 1, borderColor: C.border, maxWidth: '90%',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  bloomText: { fontSize: 15, color: C.ink, lineHeight: 26 },

  userRow: { alignItems: 'flex-end' },
  userBubble: {
    backgroundColor: C.moss, borderRadius: 18, borderBottomRightRadius: 5,
    paddingVertical: 11, paddingHorizontal: 15, maxWidth: '80%',
  },
  userText: { fontSize: 15, color: C.white, lineHeight: 22 },

  hint: {
    backgroundColor: C.sagePale, borderRadius: 14, padding: 16,
    marginTop: 8, borderWidth: 1, borderColor: C.sageLight,
  },
  hintText: { fontSize: 14, color: C.ink, lineHeight: 22, textAlign: 'center' },

  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.cream,
  },
  input: {
    flex: 1, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 24, paddingVertical: 11, paddingHorizontal: 16,
    fontSize: 15, color: C.ink,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.moss, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { opacity: 0.3 },
});
