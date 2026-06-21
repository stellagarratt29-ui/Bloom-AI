import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, SafeAreaView, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { C } from '../constants/colors';

const STARTERS = [
  "What's one small thing I can do today?",
  "Help me break down a big task.",
  "I'm feeling overwhelmed. What should I do?",
  "What habit should I focus on this week?",
];

const BLOOM_RESPONSES = {
  default: "I hear you. Let's break it down together — what's the very first step that comes to mind?",
  overwhelmed: "That's okay. When everything feels like a lot, pick just ONE thing. What's the most important task right now?",
  calendar: "Done! I've added that to your calendar. Want me to set a reminder beforehand?",
  habit: "Great question. The best habit to focus on is the one you'll actually do. What's something small you can do every day?",
};

function getResponse(msg) {
  const m = msg.toLowerCase();
  if (m.includes('calendar') || m.includes('appointment') || m.includes('add')) return BLOOM_RESPONSES.calendar;
  if (m.includes('overwhelm') || m.includes('stressed') || m.includes('too much')) return BLOOM_RESPONSES.overwhelmed;
  if (m.includes('habit') || m.includes('routine') || m.includes('daily')) return BLOOM_RESPONSES.habit;
  return BLOOM_RESPONSES.default;
}

export default function BloomChatScreen({ navigation }) {
  const [messages, setMessages] = useState([
    { id: 1, from: 'bloom', text: "Hey! I'm Bloom. I can help you organize your day, set calendar events, or just talk through what's on your mind. What do you need?" },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  const send = (text) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now(), from: 'user', text: text.trim() };
    const bloomMsg = { id: Date.now() + 1, from: 'bloom', text: getResponse(text) };
    setMessages(prev => [...prev, userMsg, bloomMsg]);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Bloom Chat</Text>
          <View style={s.headerRight} />
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={s.messages}
          contentContainerStyle={s.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map(m => (
            <View
              key={m.id}
              style={[s.bubble, m.from === 'user' ? s.bubbleUser : s.bubbleBloom]}
            >
              <Text style={[s.bubbleText, m.from === 'user' ? s.bubbleTextUser : s.bubbleTextBloom]}>
                {m.text}
              </Text>
            </View>
          ))}

          {/* Quick reply starters (only at the start) */}
          {messages.length <= 1 && (
            <View style={s.starters}>
              {STARTERS.map(st => (
                <TouchableOpacity key={st} style={s.starterChip} onPress={() => send(st)}>
                  <Text style={s.starterText}>{st}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            placeholder="Message Bloom..."
            placeholderTextColor={C.muted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
            multiline={false}
          />
          <TouchableOpacity
            style={[s.sendBtn, !input.trim() && s.sendBtnOff]}
            onPress={() => send(input)}
            disabled={!input.trim()}
          >
            <Text style={s.sendIcon}>↑</Text>
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
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.white,
  },
  back: { width: 36, alignItems: 'flex-start' },
  backText: { fontSize: 22, color: C.forest },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: C.forest },
  headerRight: { width: 36 },

  messages: { flex: 1 },
  messagesContent: { padding: 20, gap: 12 },

  bubble: { maxWidth: '82%', borderRadius: 18, padding: 14 },
  bubbleUser: {
    alignSelf: 'flex-end', backgroundColor: C.forest,
    borderBottomRightRadius: 4,
  },
  bubbleBloom: {
    alignSelf: 'flex-start', backgroundColor: C.white,
    borderWidth: 1, borderColor: C.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 23 },
  bubbleTextUser: { color: C.white },
  bubbleTextBloom: { color: C.forest },

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
  sendIcon: { fontSize: 18, color: C.white, fontWeight: '700' },
});
