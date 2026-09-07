import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, SafeAreaView, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import Icon from '../components/Icon';
import VoiceMicButton from '../components/VoiceMicButton';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import {
  callClaude, buildBloomSystem, getApiKey, parseBrainDump,
  generateGoalAction,
} from '../services/ai';
import { speak, stopSpeaking, hasTTS } from '../services/speech';

function getGreeting(userName) {
  const h = new Date().getHours();
  const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  const name = userName ? `, ${userName}` : '';
  return `Good ${time}${name}. What's on your mind? Tell me everything — tasks, worries, plans — and I'll sort it out.`;
}

function isConversationalOrQuestion(text) {
  const t = text.trim();
  const lower = t.toLowerCase();
  if (t.includes('?')) return true;
  if (/^(what|how|why|when|where|who|which)\b/i.test(t)) return true;
  if (/^(what'?s|how'?s|where'?s)\b/i.test(t)) return true;
  if (/^(can you|could you|will you|would you|do you|are you|should i)\b/i.test(lower)) return true;
  if (/^(show me|tell me|explain|help me|give me|find me|summarize|list my)\b/i.test(lower)) return true;
  if (/^(hey|hi|hello|sup|yo|good morning|good afternoon|good evening)\b/i.test(lower)) return true;
  if (/^(thanks|thank you|cheers|ok|okay|got it|sounds good|perfect|great|nice|cool|sure|yep|yeah|nope)[\s!?.]*$/i.test(lower)) return true;
  if (/^(bye|goodbye|see ya|later)[\s!?.]*$/i.test(lower)) return true;
  if (/^(that'?s?\s*(it|all|everything)|nothing else|done for now|just those|all of (it|them))[\s!?.]*$/i.test(lower)) return true;
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
  const shortAction = /^(?:dentists?|doctors?|hospital|meetings?|appointments?|calls?|emails?|texts?|pick up|buy|get|go to|visit|finish|complete|clean|tidy|pay|book|fix|check|ring)\b/.test(lower);
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
  if (/what should i (do|focus on|work on)|what('s| is) (most important|next|first)|my tasks/.test(m)) {
    const pending = (tasks || []).filter(t => !t.done);
    if (pending.length > 0) {
      const top = pending.find(t => t.priority === 'high') || pending[0];
      return `Your most important task right now: "${top.text}". Head to Today to see everything.`;
    }
    return `Nothing on your list yet${name}. Tell me what's on your mind.`;
  }
  if (/overwhelm|stress|too much|anxious|worried/.test(m)) {
    const aboutMatch = m.match(/(?:about|with|for|over)\s+(.{3,40}?)(?:\s+(?:and|but|,)|[.!?]|$)/);
    const topic = aboutMatch?.[1]?.trim();
    return topic
      ? `That's a lot — especially with "${topic}" on your plate. Pick one tiny thing to do next.`
      : `That feeling is real. What's the single smallest possible action you could take right now?`;
  }
  if (/can'?t start|procrastinat|stuck|don'?t know where to start/.test(m))
    return `Set a 10-minute timer and just begin — it doesn't have to be good, it just has to start. Which task?`;
  if (/done|finished|completed|just did|just finished/.test(m)) {
    const pending = (tasks || []).filter(t => !t.done);
    return pending.length > 0
      ? `Nice work. Your Today tab shows what's next.`
      : `Everything's done — well done${name}. Add more any time.`;
  }
  const keyWord = m.match(/\b(essay|homework|test|exam|dentist|doctor|appointment|project|presentation|email|call|meeting|gym|run|cook|clean)\b/)?.[0];
  if (keyWord) return `Got it — "${keyWord}" noted. Tell me everything else on your mind and I'll sort it all at once.`;
  if (isConversationalOrQuestion(msg)) {
    return `To answer that properly, add a Groq key in the You tab — free at groq.com. Until then I can sort tasks from anything you dump here.`;
  }
  return `Got it${name}. Tell me everything that's on your mind and I'll turn it into a plan.`;
}

export default function BloomChatScreen() {
  const { userName, userOccupation, goals, tasks, addTask, processBrainDump, ndToggles, checkIn } = useApp();
  const { colors: t } = useTheme();

  const [messages, setMessages] = useState([
    { id: 1, from: 'bloom', text: getGreeting(userName) },
  ]);
  const [input,     setInput]     = useState('');
  const [thinking,  setThinking]  = useState(false);
  const [hasKey,    setHasKey]    = useState(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const voiceModeRef = useRef(false);
  const scrollRef    = useRef(null);
  const historyRef   = useRef([]);

  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);

  useFocusEffect(useCallback(() => {
    getApiKey().then(k => setHasKey(!!k));
    return () => stopSpeaking();
  }, []));

  const scrollToEnd = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);

  const bloomReply = useCallback((text) => {
    setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text }]);
    historyRef.current = [...historyRef.current, { role: 'assistant', content: text }];
    if (voiceModeRef.current) speak(text);
  }, []);

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
      if (!isConversationalOrQuestion(trimmed) && looksLikeTaskDump(trimmed)) {
        const { items, response } = await parseBrainDump(trimmed, userName, ndToggles, userOccupation);
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
          bloomReply(response ?? `Sorted ${parts.join(' and ')} — tap Today to see them.`);
          setThinking(false);
          scrollToEnd();
          return;
        } else if (response) {
          bloomReply(response);
          setThinking(false);
          scrollToEnd();
          return;
        }
      }

      // Single task add
      const taskText = !isConversationalOrQuestion(trimmed) ? detectTaskAdd(trimmed) : null;
      if (taskText && !hasKey) {
        addTask(taskText, 'medium');
        bloomReply(`Added "${taskText}" to your Today tab.`);
        setThinking(false);
        scrollToEnd();
        return;
      }

      // AI chat
      if (hasKey) {
        const system = buildBloomSystem({ userName, goals, tasks, ndToggles, checkIn });
        const reply = await callClaude({ system, messages: historyRef.current, maxTokens: 350 });
        bloomReply(reply);
      } else {
        bloomReply(getFallback(trimmed, { userName, goals, tasks }));
      }
    } catch (e) {
      const err = e.code === 'AUTH'
        ? "That API key didn't work — go to the You tab and paste your Groq key (starts with gsk_). Get one free at groq.com."
        : getFallback(trimmed, { userName, goals, tasks });
      bloomReply(err);
    } finally {
      setThinking(false);
      scrollToEnd();
    }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Header */}
        <View style={[s.header, { backgroundColor: t.bg, borderBottomColor: t.border }]}>
          <View>
            <Text style={[s.headerTitle, { color: t.accent }]}>Chat</Text>
            <Text style={[s.headerTagline, { color: t.subtext }]}>dump it all here</Text>
          </View>
          {hasTTS() && (
            <TouchableOpacity
              onPress={() => {
                const next = !voiceMode;
                setVoiceMode(next);
                if (!next) stopSpeaking();
              }}
              style={[
                s.voiceToggle,
                {
                  backgroundColor: voiceMode ? t.accent : t.card,
                  borderColor: voiceMode ? t.accent : t.border,
                },
              ]}
              activeOpacity={0.75}
            >
              <Icon
                name={voiceMode ? 'volume-2' : 'volume-x'}
                size={15}
                color={voiceMode ? '#fff' : t.subtext}
              />
              <Text style={[s.voiceToggleLabel, { color: voiceMode ? '#fff' : t.subtext }]}>
                {voiceMode ? 'Voice on' : 'Voice off'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Messages */}
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
              <View style={[s.bloomBubble, { backgroundColor: t.card, borderColor: t.border, paddingVertical: 18 }]}>
                <ActivityIndicator size="small" color={t.accent} />
              </View>
            </View>
          )}

          {hasKey === false && (
            <View style={[s.keyBanner, { backgroundColor: t.accentPale, borderColor: t.accentLight }]}>
              <Icon name="zap" size={14} color={t.accent} />
              <Text style={[s.keyBannerText, { color: t.text }]}>
                Add a free Groq key in the{' '}
                <Text style={{ fontWeight: '700' }}>You</Text>
                {' '}tab for full AI — free at groq.com, no card needed.
              </Text>
            </View>
          )}

          {messages.length <= 1 && !thinking && (
            <View style={[s.hint, { backgroundColor: t.accentPale, borderColor: t.accentLight }]}>
              <Text style={[s.hintText, { color: t.text }]}>
                Type everything on your mind — tasks, feelings, plans, worries. Bloom will sort them into your Today tab.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input bar */}
        <View style={[s.inputBar, { backgroundColor: t.bg, borderTopColor: t.border }]}>
          <VoiceMicButton
            onTranscript={(txt) => {
              if (voiceModeRef.current) {
                stopSpeaking();
                send(txt);
              } else {
                setInput(prev => prev ? prev + ' ' + txt : txt);
              }
            }}
            color={voiceMode ? t.accent : t.card}
          />
          <TextInput
            style={[s.input, { backgroundColor: t.card, borderColor: t.border, color: t.text }]}
            placeholder="What's on your mind…"
            placeholderTextColor={t.subtext}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
            multiline={false}
            editable={!thinking}
          />
          <TouchableOpacity
            style={[
              s.sendBtn,
              { backgroundColor: t.chatBubble },
              (!input.trim() || thinking) && s.sendBtnOff,
            ]}
            onPress={() => send(input)}
            disabled={!input.trim() || thinking}
          >
            <Icon name="send" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28, fontWeight: '800', letterSpacing: -0.5,
    fontFamily: Platform.OS === 'web' ? '"Outfit", system-ui, sans-serif' : undefined,
    lineHeight: 32,
  },
  headerTagline: { fontSize: 11, fontWeight: '500', letterSpacing: 0.2 },

  voiceToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  voiceToggleLabel: { fontSize: 12, fontWeight: '600' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 18, gap: 12 },

  bloomRow: { alignSelf: 'stretch', maxWidth: '88%' },
  bloomBubble: {
    borderRadius: 20, borderBottomLeftRadius: 4,
    padding: 15, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  bloomText: { fontSize: 15, lineHeight: 25, fontWeight: '400' },

  userRow: { alignItems: 'flex-end' },
  userBubble: {
    borderRadius: 20, borderBottomRightRadius: 4,
    paddingVertical: 12, paddingHorizontal: 16, maxWidth: '82%',
  },
  userText: { fontSize: 15, color: '#FFFFFF', lineHeight: 22, fontWeight: '500' },

  keyBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 4,
  },
  keyBannerText: { flex: 1, fontSize: 13, lineHeight: 20 },

  hint: {
    borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 4,
  },
  hintText: { fontSize: 14, lineHeight: 22 },

  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1, fontSize: 15, borderRadius: 22, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 11,
    outlineStyle: 'none',
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { opacity: 0.35 },
});
