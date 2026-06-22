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

function getFallback(msg) {
  const m = msg.toLowerCase();
  if (/overwhelm|stress|too much|can't cope/.test(m))
    return "That's okay. When everything piles up, pick just ONE task — the smallest one you can do right now. What is it?";
  if (/habit|routine|daily/.test(m))
    return "The best habit is one you'll actually stick to. What's something small you could do every single day?";
  if (/goal|aim|want to/.test(m))
    return "Goals happen one small step at a time. What's the next physical action you need to take toward yours?";
  if (/focus|distract|procrastinat/.test(m))
    return "Try the 2-minute rule: if it takes less than 2 minutes, do it now. Otherwise pick one task and set a 15-minute timer.";
  return "Tell me more — what's the most pressing thing on your mind right now?";
}

export default function BloomChatScreen({ navigation }) {
  const { userName, buddy, goals, tasks, currentStreak, totalPoints, momentum } = useApp();

  const [messages, setMessages] = useState([
    { id: 1, from: 'bloom', text: `Hey${userName ? ` ${userName}` : ''}! I'm ${buddy?.name ?? 'Bloom'}. What's on your mind?` },
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
      const fallback = getFallback(trimmed);
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text: fallback }]);
      historyRef.current = [...historyRef.current, { role: 'assistant', content: fallback }];
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
            {hasKey === true  && <Text style={s.headerSub}>AI · powered by Claude</Text>}
            {hasKey === false && <Text style={s.headerSub}>Add API key in Settings for real AI</Text>}
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
