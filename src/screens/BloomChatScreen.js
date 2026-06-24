import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, SafeAreaView, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { callClaude, buildBloomSystem, getApiKey, parseBrainDump, generateGoalAction } from '../services/ai';

const PRIORITY_DOT = { high: '#C0392B', medium: C.sage, low: C.clay };

function getGreeting(userName) {
  const h = new Date().getHours();
  const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  const name = userName ? `, ${userName}` : '';
  return `Good ${time}${name}. How are you feeling today, and what's on your mind? Just tell me everything — tasks, worries, plans — and I'll sort it out.`;
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
      return `Your most important task right now: "${top.text}". Tap it for step-by-step help.`;
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
      ? `Nice work. Next up: "${pending[0].text}". Tap it to see how to do it.`
      : `Everything's done — well done${name}. Add more any time.`;
  }
  if (/goal|progress/.test(m)) {
    const g = goals?.[0]?.text;
    return g ? `Your goal: "${g}". Check the Goals tab for your next step.` : `Head to Goals to set a big goal — I'll build you a real plan.`;
  }
  const keyWord = m.match(/\b(essay|homework|test|exam|dentist|doctor|appointment|project|presentation|email|call|meeting|paint|draw|gym|run|cook|clean)\b/)?.[0];
  return keyWord
    ? `Got it — "${keyWord}" noted. Tell me everything else on your mind and I'll sort it all at once.`
    : `Got it${name}. Tell me everything that's on your mind and I'll turn it into a plan.`;
}

const SECTION_LABEL = { high: 'School & Health', medium: 'Tasks', low: 'Fun & Leisure' };

export default function BloomChatScreen({ navigation }) {
  const { userName, goals, tasks, totalPoints, addTask, processBrainDump } = useApp();
  const [messages, setMessages] = useState([
    { id: 1, from: 'bloom', text: getGreeting(userName) },
  ]);
  const [input, setInput]     = useState('');
  const [thinking, setThinking] = useState(false);
  const [hasKey, setHasKey]   = useState(null);
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
      // Brain dump path
      if (looksLikeTaskDump(trimmed)) {
        const { items, response } = await parseBrainDump(trimmed, userName);
        if (items.length > 0) {
          // Generate goal actions in parallel
          const goalItems = items.filter(i => i.category === 'goal');
          const goalActionsMap = {};
          await Promise.all(
            goalItems.map(async g => {
              goalActionsMap[g.text] = await generateGoalAction({ goalText: g.text });
            })
          );

          const createdTasks = processBrainDump(items, goalActionsMap);
          const replyText = response ?? `Got ${createdTasks.length} things sorted. Tap any task for step-by-step help.`;

          const bloomMsg = {
            id: Date.now() + 1, from: 'bloom', type: 'tasks',
            taskList: createdTasks, text: replyText,
          };
          setMessages(prev => [...prev, bloomMsg]);
          historyRef.current = [...historyRef.current, { role: 'assistant', content: replyText }];
          setThinking(false);
          scrollToEnd();
          return;
        }
      }

      // Single task add
      const taskText = detectTaskAdd(trimmed);
      if (taskText && !hasKey) {
        addTask(taskText, 'medium');
        const reply = `Added "${taskText}" to your list. Tap it when you're ready to start.`;
        setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text: reply }]);
        historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }];
        setThinking(false);
        scrollToEnd();
        return;
      }

      // AI chat
      if (hasKey) {
        const system = buildBloomSystem({ userName, goals, tasks, totalPoints });
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

  function renderTaskSections(taskList) {
    const high = taskList.filter(t => t.priority === 'high');
    const med  = taskList.filter(t => t.priority === 'medium');
    const low  = taskList.filter(t => t.priority === 'low');
    const groups = [
      { key: 'high', label: SECTION_LABEL.high, items: high },
      { key: 'medium', label: SECTION_LABEL.medium, items: med },
      { key: 'low', label: SECTION_LABEL.low, items: low },
    ].filter(g => g.items.length > 0);

    return (
      <View style={s.taskSections}>
        {groups.map(g => (
          <View key={g.key} style={s.taskGroup}>
            <Text style={s.taskGroupLabel}>{g.label.toUpperCase()}</Text>
            {g.items.map(task => (
              <TouchableOpacity
                key={task.id}
                style={s.taskCard}
                onPress={() => navigation.navigate('TaskGuide', { task })}
                activeOpacity={0.7}
              >
                <View style={[s.taskDot, { backgroundColor: PRIORITY_DOT[task.priority] ?? C.sage }]} />
                <Text style={s.taskCardText} numberOfLines={2}>{task.text}</Text>
                <View style={s.taskPts}><Text style={s.taskPtsText}>+5</Text></View>
                <Feather name="chevron-right" size={14} color={C.muted} />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <View style={s.header}>
          <Text style={s.headerTitle}>Bloom</Text>
          <View style={s.ptsWrap}>
            <Text style={s.ptsText}>{totalPoints} pts</Text>
          </View>
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
                  <View style={s.userBubble}>
                    <Text style={s.userText}>{m.text}</Text>
                  </View>
                </View>
              );
            }
            if (m.type === 'tasks') {
              return (
                <View key={m.id} style={s.bloomRow}>
                  <View style={s.taskBubble}>
                    <Text style={s.bloomText}>{m.text}</Text>
                    {renderTaskSections(m.taskList)}
                  </View>
                </View>
              );
            }
            return (
              <View key={m.id} style={s.bloomRow}>
                <View style={s.bloomBubble}>
                  <Text style={s.bloomText}>{m.text}</Text>
                </View>
              </View>
            );
          })}

          {thinking && (
            <View style={s.bloomRow}>
              <View style={[s.bloomBubble, { paddingVertical: 18 }]}>
                <ActivityIndicator size="small" color={C.sage} />
              </View>
            </View>
          )}

          {messages.length <= 1 && !thinking && (
            <View style={s.hint}>
              <Text style={s.hintText}>
                Type everything on your mind — tasks, feelings, plans, worries. Bloom will sort it into your day.
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={s.inputBar}>
          <TouchableOpacity
            style={s.voiceBtn}
            onPress={() => Alert.alert('Coming soon', 'Voice input will be available in a future update.')}
          >
            <Feather name="mic" size={18} color={C.muted} />
          </TouchableOpacity>
          <TextInput
            style={s.input}
            placeholder="Tell Bloom what's on your mind…"
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
    paddingHorizontal: 22, paddingTop: 18, paddingBottom: 14,
    backgroundColor: C.cream, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: {
    fontSize: 30, fontWeight: '800', color: C.clay, letterSpacing: -0.5,
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : undefined,
  },
  ptsWrap: { backgroundColor: C.sagePale, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  ptsText: { fontSize: 13, fontWeight: '700', color: C.sage },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingVertical: 20, gap: 14 },

  bloomRow: { alignSelf: 'stretch' },
  bloomBubble: {
    backgroundColor: C.white, borderRadius: 18, borderBottomLeftRadius: 5,
    padding: 16, borderWidth: 1, borderColor: C.border, maxWidth: '90%',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  bloomText: { fontSize: 15, color: C.forest, lineHeight: 26 },

  taskBubble: {
    backgroundColor: C.white, borderRadius: 18, borderBottomLeftRadius: 5,
    padding: 16, borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  taskSections: { marginTop: 14, gap: 16 },
  taskGroup: { gap: 6 },
  taskGroupLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.4, marginBottom: 2 },
  taskCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.cream, borderRadius: 12,
    paddingVertical: 11, paddingHorizontal: 13,
    borderWidth: 1, borderColor: C.border,
  },
  taskDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  taskCardText: { flex: 1, fontSize: 14, color: C.forest, fontWeight: '500', lineHeight: 20 },
  taskPts: { backgroundColor: C.goldPale, borderRadius: 8, paddingVertical: 2, paddingHorizontal: 6 },
  taskPtsText: { fontSize: 11, fontWeight: '700', color: C.gold },

  userRow: { alignItems: 'flex-end' },
  userBubble: {
    backgroundColor: C.forest, borderRadius: 18, borderBottomRightRadius: 5,
    paddingVertical: 11, paddingHorizontal: 15, maxWidth: '80%',
  },
  userText: { fontSize: 15, color: C.white, lineHeight: 22 },

  hint: {
    backgroundColor: C.sagePale, borderRadius: 14, padding: 16,
    marginTop: 8, borderWidth: 1, borderColor: C.sageLight,
  },
  hintText: { fontSize: 14, color: C.forest, lineHeight: 22, textAlign: 'center' },

  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.cream,
  },
  voiceBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  input: {
    flex: 1, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 24, paddingVertical: 11, paddingHorizontal: 16,
    fontSize: 15, color: C.forest,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.forest, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { opacity: 0.3 },
});
