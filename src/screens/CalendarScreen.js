import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet, Platform, ActivityIndicator,
} from 'react-native';
import Icon from '../components/Icon';
import { C } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { processCalendarRequest } from '../services/calendar';

export default function CalendarScreen() {
  const { colors: t } = useTheme();
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);

  const scrollToEnd = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);

  const send = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text: trimmed }]);
    setThinking(true);
    scrollToEnd();
    try {
      const reply = await processCalendarRequest(trimmed);
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text: reply ?? "I can help you plan your schedule — what are you working with?" }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text: "Something went wrong. Try again?" }]);
    } finally {
      setThinking(false);
      scrollToEnd();
    }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>

      <View style={[s.header, { borderBottomColor: t.border, backgroundColor: t.bg }]}>
        <Text style={[s.title, { color: t.chatBubble ?? C.skyDark }]}>Calendar</Text>
        <View style={[s.badge, { backgroundColor: t.border }]}>
          <Text style={[s.badgeText, { color: t.subtext }]}>AI Planning</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && (
          <View style={s.emptyState}>
            <View style={[s.calIconWrap, { backgroundColor: t.border }]}>
              <Icon name="calendar" size={32} color={t.chatBubble ?? C.skyDark} />
            </View>
            <Text style={[s.emptyTitle, { color: t.text }]}>Plan your schedule with Bloom</Text>
            <Text style={[s.emptySub, { color: t.subtext }]}>
              Ask anything about your day or week — Bloom will help you think through timing, priorities, and what to tackle first.
            </Text>

            <View style={s.promptsWrap}>
              {[
                'What should I focus on today?',
                'Help me plan my week',
                'I have 2 hours free — what should I do?',
              ].map(p => (
                <TouchableOpacity
                  key={p}
                  style={[s.promptChip, { borderColor: t.border, backgroundColor: t.card }]}
                  onPress={() => send(p)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.promptText, { color: t.text }]}>{p}</Text>
                  <Icon name="chevron-right" size={14} color={t.subtext} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={[s.syncNotice, { borderColor: t.border, backgroundColor: t.card }]}>
              <Icon name="calendar" size={14} color={t.subtext} style={{ marginRight: 6 }} />
              <Text style={[s.syncText, { color: t.subtext }]}>Google Calendar sync coming soon</Text>
            </View>
          </View>
        )}

        {messages.map(m => (
          m.from === 'user' ? (
            <View key={m.id} style={s.userRow}>
              <View style={[s.userBubble, { backgroundColor: t.chatBubble ?? C.moss }]}>
                <Text style={s.userText}>{m.text}</Text>
              </View>
            </View>
          ) : (
            <View key={m.id} style={[s.bloomBubble, { backgroundColor: t.card, borderColor: t.border }]}>
              <Text style={[s.bloomText, { color: t.text }]}>{m.text}</Text>
            </View>
          )
        ))}

        {thinking && (
          <View style={[s.bloomBubble, { paddingVertical: 18, backgroundColor: t.card, borderColor: t.border }]}>
            <ActivityIndicator size="small" color={t.chatBubble ?? C.moss} />
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={[s.inputBar, { backgroundColor: t.bg, borderTopColor: t.border }]}>
        <TextInput
          style={[s.input, { backgroundColor: t.card, borderColor: t.border, color: t.text }]}
          placeholder="Ask about your schedule…"
          placeholderTextColor={t.subtext}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => send(input)}
          returnKeyType="send"
          editable={!thinking}
        />
        <TouchableOpacity
          style={[s.sendBtn, { backgroundColor: t.chatBubble ?? C.moss }, (!input.trim() || thinking) && s.sendBtnOff]}
          onPress={() => send(input)}
          disabled={!input.trim() || thinking}
        >
          <Icon name="send" size={16} color={C.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 18, paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 26, fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined,
  },
  badge: {
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },

  scrollContent: { paddingHorizontal: 18, paddingTop: 20 },

  emptyState: { alignItems: 'center', paddingBottom: 20 },
  calIconWrap: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  emptySub: {
    fontSize: 14, lineHeight: 22, textAlign: 'center',
    maxWidth: 300, marginBottom: 24,
  },

  promptsWrap: { width: '100%', gap: 8, marginBottom: 20 },
  promptChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  promptText: { fontSize: 14, fontWeight: '500', flex: 1 },

  syncNotice: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  syncText: { fontSize: 12 },

  bloomBubble: {
    borderRadius: 18, borderBottomLeftRadius: 5,
    padding: 16, borderWidth: 1, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  bloomText: { fontSize: 15, lineHeight: 26 },

  userRow:    { alignItems: 'flex-end', marginBottom: 12 },
  userBubble: {
    borderRadius: 18, borderBottomRightRadius: 5,
    paddingVertical: 11, paddingHorizontal: 15, maxWidth: '82%',
  },
  userText: { fontSize: 15, color: '#fff', lineHeight: 22 },

  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1,
  },
  input: {
    flex: 1, borderWidth: 1.5, borderRadius: 24,
    paddingVertical: 11, paddingHorizontal: 16, fontSize: 15,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { opacity: 0.3 },
});
