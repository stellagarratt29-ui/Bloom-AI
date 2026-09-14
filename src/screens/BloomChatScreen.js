import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, SafeAreaView, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const MORNING_KEY = '@bloom_morning_seen';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getMorningGreeting(userName) {
  const h = new Date().getHours();
  const name = userName ? `, ${userName}` : '';
  if (h < 12) return `Good morning${name}.`;
  if (h < 17) return `Good afternoon${name}.`;
  return `Good evening${name}.`;
}

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
      return `Your most important task right now: "${top.text}". Head to Tasks to see everything.`;
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
      ? `Nice work. Your Tasks tab shows what's next.`
      : `Everything's done — well done${name}. Add more any time.`;
  }
  const keyWord = m.match(/\b(essay|homework|test|exam|dentist|doctor|appointment|project|presentation|email|call|meeting|gym|run|cook|clean)\b/)?.[0];
  if (keyWord) return `Got it — "${keyWord}" noted. Tell me everything else on your mind and I'll sort it all at once.`;
  if (isConversationalOrQuestion(msg)) {
    return `To answer that properly, add a Claude key in the You tab (console.anthropic.com → API Keys, starts with sk-ant-). Until then I can sort tasks from anything you dump here.`;
  }
  return `Got it${name}. Tell me everything that's on your mind and I'll turn it into a plan.`;
}

// ─── Morning check-in card ───────────────────────────
function MorningCard({ userName, onDismiss, t }) {
  const greeting = getMorningGreeting(userName);
  return (
    <View style={[mc.card, { borderColor: t.border }]}>
      <Text style={[mc.greeting, { color: t.text }]}>{greeting}</Text>
      <Text style={[mc.question, { color: t.text }]}>What's on your mind today?</Text>
      <Text style={[mc.sub, { color: t.subtext }]}>
        Type everything below — tasks, worries, plans. I'll sort it out.
      </Text>
      <TouchableOpacity onPress={onDismiss} style={mc.dismiss}>
        <Text style={[mc.dismissText, { color: t.muted }]}>Dismiss</Text>
      </TouchableOpacity>
    </View>
  );
}

const mc = StyleSheet.create({
  card: {
    marginHorizontal: 16, marginTop: 20, marginBottom: 8,
    borderRadius: 16, borderWidth: 1,
    paddingVertical: 24, paddingHorizontal: 22,
  },
  greeting: {
    fontSize: 13, fontWeight: '500', letterSpacing: 0.2,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? '"Plus Jakarta Sans", system-ui, sans-serif' : undefined,
  },
  question: {
    fontSize: 22, fontWeight: '600', letterSpacing: -0.3, lineHeight: 30,
    marginBottom: 10,
    fontFamily: Platform.OS === 'web' ? '"Plus Jakarta Sans", system-ui, sans-serif' : undefined,
  },
  sub: {
    fontSize: 13, lineHeight: 20,
    fontFamily: Platform.OS === 'web' ? '"Plus Jakarta Sans", system-ui, sans-serif' : undefined,
  },
  dismiss: { marginTop: 16, alignSelf: 'flex-start' },
  dismissText: { fontSize: 12 },
});

export default function BloomChatScreen() {
  const { userName, userOccupation, goals, tasks, addTask, processBrainDump, ndToggles, checkIn } = useApp();
  const { colors: t } = useTheme();

  const [messages, setMessages] = useState([
    { id: 1, from: 'bloom', text: getGreeting(userName) },
  ]);
  const [input,        setInput]        = useState('');
  const [thinking,     setThinking]     = useState(false);
  const [hasKey,       setHasKey]       = useState(null);
  const [voiceMode,    setVoiceMode]    = useState(false);
  const [showMorning,  setShowMorning]  = useState(false);
  const voiceModeRef = useRef(false);
  const scrollRef    = useRef(null);
  const historyRef   = useRef([]);

  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);

  // Show morning card once per day
  useEffect(() => {
    AsyncStorage.getItem(MORNING_KEY)
      .then(raw => {
        const last = raw ? JSON.parse(raw) : null;
        if (last !== todayStr()) setShowMorning(true);
      })
      .catch(() => {});
  }, []);

  const dismissMorning = useCallback(() => {
    setShowMorning(false);
    AsyncStorage.setItem(MORNING_KEY, JSON.stringify(todayStr())).catch(() => {});
  }, []);

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

    // Dismiss morning card on first message
    if (showMorning) dismissMorning();

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
          bloomReply(response ?? `Sorted ${parts.join(' and ')} — tap Tasks to see them.`);
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
        bloomReply(`Added "${taskText}" to your Tasks tab.`);
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
        ? "That key didn't work — go to You tab and paste your Claude key (starts with sk-ant-). Get one at console.anthropic.com → API Keys."
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

        {/* Header — minimal */}
        <View style={[s.header, { backgroundColor: t.bg, borderBottomColor: t.border }]}>
          <Text style={[s.headerTitle, { color: t.text }]}>Chat</Text>
          {hasTTS() && (
            <TouchableOpacity
              onPress={() => {
                const next = !voiceMode;
                setVoiceMode(next);
                if (!next) stopSpeaking();
              }}
              style={[s.voiceToggle, { borderColor: t.border }]}
              activeOpacity={0.7}
            >
              <Icon name={voiceMode ? 'volume-2' : 'volume-x'} size={14} color={t.subtext} />
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
          {/* Morning check-in card */}
          {showMorning && (
            <MorningCard userName={userName} onDismiss={dismissMorning} t={t} />
          )}

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
                <Text style={[s.bloomText, { color: t.text }]}>{m.text}</Text>
              </View>
            );
          })}

          {thinking && (
            <View style={s.bloomRow}>
              <ActivityIndicator size="small" color={t.accent} style={{ marginTop: 4 }} />
            </View>
          )}

          {hasKey === false && (
            <View style={[s.keyBanner, { backgroundColor: t.accentPale, borderColor: t.accentLight }]}>
              <Text style={[s.keyBannerText, { color: t.text }]}>
                Add your Claude key in the{' '}
                <Text style={{ fontWeight: '600' }}>You</Text>
                {' '}tab for full AI — free key at console.anthropic.com
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input bar */}
        <View style={[s.inputBar, { backgroundColor: t.bg, borderTopColor: t.border }]}>
          <VoiceMicButton
            onTranscript={(txt) => {
              if (voiceModeRef.current) { stopSpeaking(); send(txt); }
              else setInput(prev => prev ? prev + ' ' + txt : txt);
            }}
            color={t.card}
          />
          <TextInput
            style={[s.input, { backgroundColor: t.input, color: t.text }]}
            placeholder="What's on your mind…"
            placeholderTextColor={t.muted}
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
            <Icon name="send" size={15} color="#FFFFFF" />
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
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 17, fontWeight: '600', letterSpacing: -0.2,
    fontFamily: Platform.OS === 'web' ? '"Plus Jakarta Sans", system-ui, sans-serif' : undefined,
  },
  voiceToggle: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 18, gap: 4 },

  bloomRow: {
    alignSelf: 'flex-start',
    maxWidth: '88%',
    marginBottom: 12,
  },
  bloomText: {
    fontSize: 15, lineHeight: 26, fontWeight: '400',
    fontFamily: Platform.OS === 'web' ? '"Plus Jakarta Sans", system-ui, sans-serif' : undefined,
  },

  userRow: { alignItems: 'flex-end', marginBottom: 12 },
  userBubble: {
    borderRadius: 20, borderBottomRightRadius: 5,
    paddingVertical: 11, paddingHorizontal: 16, maxWidth: '80%',
  },
  userText: {
    fontSize: 15, color: '#FFFFFF', lineHeight: 22, fontWeight: '400',
    fontFamily: Platform.OS === 'web' ? '"Plus Jakarta Sans", system-ui, sans-serif' : undefined,
  },

  keyBanner: {
    borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 8, marginBottom: 4,
  },
  keyBannerText: { fontSize: 13, lineHeight: 20 },

  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 0.5,
  },
  input: {
    flex: 1, fontSize: 15, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 11,
    outlineStyle: 'none',
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { opacity: 0.3 },
});
