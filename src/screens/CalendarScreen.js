import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet, Platform, ActivityIndicator,
} from 'react-native';
import Icon from '../components/Icon';
import VoiceMicButton from '../components/VoiceMicButton';
import { C } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import {
  processCalendarRequest,
  startCalendarOAuth,
  isCalendarConnected,
  getUpcomingEvents,
  clearCalendarToken,
  getCalendarClientId,
} from '../services/calendar';

export default function CalendarScreen() {
  const { colors: t } = useTheme();

  const [connected,     setConnected]     = useState(false);
  const [savedId,       setSavedId]       = useState(null);
  const [clientIdInput, setClientIdInput] = useState('');
  const [showIdSetup,   setShowIdSetup]   = useState(false);
  const [events,        setEvents]        = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [connectErr,    setConnectErr]    = useState('');
  const [messages,      setMessages]      = useState([]);
  const [input,         setInput]         = useState('');
  const [thinking,      setThinking]      = useState(false);
  const scrollRef = useRef(null);

  const scrollToEnd = () =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);

  // Check connection + load saved Client ID on mount
  useEffect(() => {
    let alive = true;
    (async () => {
      const [conn, id] = await Promise.all([isCalendarConnected(), getCalendarClientId()]);
      if (!alive) return;
      setSavedId(id);
      setClientIdInput(id ?? '');
      setConnected(conn);
      if (conn) loadEvents();
    })();
    return () => { alive = false; };
  }, []);

  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const ev = await getUpcomingEvents(14);
      setEvents(ev);
    } catch (e) {
      if (e.code === 'NO_CAL_AUTH') {
        setConnected(false);
        setEvents([]);
      }
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  const handleConnect = async () => {
    setConnectErr('');
    const id = clientIdInput.trim() || savedId;
    try {
      await startCalendarOAuth(id || undefined);
      // startCalendarOAuth redirects the page — nothing runs after this
    } catch (e) {
      if (e.message === 'NO_CLIENT_ID') {
        setShowIdSetup(true);
        setConnectErr('Paste your Google Client ID below, then tap Connect.');
      } else {
        setConnectErr(e.message);
      }
    }
  };

  const handleDisconnect = async () => {
    await clearCalendarToken();
    setConnected(false);
    setEvents([]);
    setMessages([]);
  };

  const sendChat = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text: trimmed }]);
    setThinking(true);
    scrollToEnd();
    try {
      const reply = await processCalendarRequest(trimmed);
      setMessages(prev => [...prev, {
        id: Date.now() + 1, from: 'bloom',
        text: reply ?? "I can help you plan — what are you working with?",
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, from: 'bloom',
        text: "Something went wrong. Try again?",
      }]);
    } finally {
      setThinking(false);
      scrollToEnd();
    }
  };

  // ─── CONNECTED ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>

      <View style={[s.header, { borderBottomColor: t.border, backgroundColor: t.bg }]}>
        <Text style={[s.title, { color: t.chatBubble ?? C.clay }]}>Calendar</Text>
        {connected && (
          <View style={s.headerActions}>
            <TouchableOpacity onPress={loadEvents} style={[s.headerIconBtn, { backgroundColor: t.border }]} activeOpacity={0.7}>
              <Icon name="refresh-cw" size={14} color={t.subtext} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDisconnect} style={[s.disconnectBtn, { borderColor: t.border }]} activeOpacity={0.7}>
              <Text style={[s.disconnectText, { color: t.subtext }]}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Events — only when Google Calendar is connected */}
        {connected && (
          <>
            <Text style={[s.sectionLabel, { color: t.subtext }]}>NEXT 14 DAYS</Text>
            {loadingEvents ? (
              <ActivityIndicator color={t.chatBubble ?? C.clay} style={{ marginVertical: 24 }} />
            ) : events.length === 0 ? (
              <View style={[s.noEventsCard, { backgroundColor: t.card, borderColor: t.border }]}>
                <Text style={[s.noEventsText, { color: t.subtext }]}>No events in the next 14 days.</Text>
              </View>
            ) : (
              events.map(ev => <EventCard key={ev.id} event={ev} t={t} />)
            )}
          </>
        )}

        {/* Planning chat — always visible */}
        <View style={[s.dividerWrap, { borderTopColor: connected ? t.border : 'transparent' }]}>
          <Text style={[s.dividerText, { color: t.subtext }]}>
            {connected ? 'Ask Bloom about your schedule' : 'Plan your schedule with Bloom'}
          </Text>
        </View>

        {/* Quick prompts */}
        {messages.length === 0 && (
          <View style={s.promptsWrap}>
            {[
              'Help me plan my day',
              'What should I focus on this week?',
              'How do I fit everything in?',
            ].map(p => (
              <TouchableOpacity
                key={p}
                style={[s.promptChip, { borderColor: t.border, backgroundColor: t.card }]}
                onPress={() => sendChat(p)}
                activeOpacity={0.7}
              >
                <Text style={[s.promptText, { color: t.text }]}>{p}</Text>
                <Icon name="chevron-right" size={14} color={t.subtext} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Chat messages */}
        {messages.map(m =>
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
        )}

        {thinking && (
          <View style={[s.bloomBubble, { paddingVertical: 18, backgroundColor: t.card, borderColor: t.border }]}>
            <ActivityIndicator size="small" color={t.chatBubble ?? C.moss} />
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={[s.inputBar, { backgroundColor: t.bg, borderTopColor: t.border }]}>
        {!!input.trim() && (
          <TouchableOpacity style={s.clearBtn} onPress={() => setInput('')}>
            <Icon name="x" size={16} color={C.muted} />
          </TouchableOpacity>
        )}
        <VoiceMicButton onTranscript={(txt) => setInput(prev => prev ? prev + ' ' + txt : txt)} color={t.card} />
        <TextInput
          style={[s.input, { backgroundColor: t.card, borderColor: t.border, color: t.text }]}
          placeholder="Ask about your schedule…"
          placeholderTextColor={t.subtext}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => sendChat(input)}
          returnKeyType="send"
          editable={!thinking}
        />
        <TouchableOpacity
          style={[s.sendBtn, { backgroundColor: t.chatBubble ?? C.moss }, (!input.trim() || thinking) && s.sendBtnOff]}
          onPress={() => sendChat(input)}
          disabled={!input.trim() || thinking}
        >
          <Icon name="send" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Event card ─────────────────────────────────────────────────────────────

function fmtDate(event) {
  const raw = event.start.dateTime ?? event.start.date;
  const d   = event.start.dateTime ? new Date(raw) : new Date(raw + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' });
}

function fmtTime(event) {
  if (!event.start.dateTime) return 'All day';
  const start = new Date(event.start.dateTime);
  const end   = event.end?.dateTime ? new Date(event.end.dateTime) : null;
  const fmt   = d => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
}

function EventCard({ event, t }) {
  return (
    <View style={[s.eventCard, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={[s.eventDot, { backgroundColor: t.chatBubble ?? C.clay }]} />
      <View style={s.eventInfo}>
        <Text style={[s.eventTitle, { color: t.text }]}>{event.summary ?? 'Untitled event'}</Text>
        <Text style={[s.eventMeta, { color: t.subtext }]}>
          {fmtDate(event)} · {fmtTime(event)}
        </Text>
        {!!event.location && (
          <Text style={[s.eventLocation, { color: t.subtext }]} numberOfLines={1}>
            {event.location}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { flex: 1 },

  setupScroll: { paddingHorizontal: 20, paddingTop: 22 },

  title: {
    fontSize: 28, fontWeight: '800', marginBottom: 20,
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined,
  },

  // Hero connect card
  card: {
    borderRadius: 20, borderWidth: 1, padding: 22, marginBottom: 18,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  calIconRound: {
    width: 60, height: 60, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: { fontSize: 19, fontWeight: '700', marginBottom: 8 },
  cardSub:   { fontSize: 14, lineHeight: 22, marginBottom: 16 },

  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  featureText: { fontSize: 13, lineHeight: 20 },

  // Client ID setup
  idBlock: { marginTop: 18, paddingTop: 18, borderTopWidth: 1 },
  idLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.3, marginBottom: 8 },
  idInput: {
    borderWidth: 1.5, borderRadius: 12,
    paddingVertical: 11, paddingHorizontal: 14,
    fontSize: 13, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    marginBottom: 4,
  },

  savedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 18, paddingTop: 14, borderTopWidth: 1,
  },
  savedText:  { flex: 1, fontSize: 12 },
  changeLink: { fontSize: 12, fontWeight: '600' },

  connectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 20, paddingVertical: 15, borderRadius: 14,
  },
  connectBtnDisabled: { opacity: 0.45 },
  connectBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  errText: { fontSize: 12, color: '#C94B6B', marginTop: 10, textAlign: 'center' },

  // Setup guide
  guideCard: {
    borderRadius: 18, borderWidth: 1, padding: 20, marginBottom: 18,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  guideTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  guideSub:   { fontSize: 12, lineHeight: 18, marginBottom: 14 },
  guideRow:   { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  guideNum:   { fontSize: 12, fontWeight: '700', minWidth: 16 },
  guideStep:  { fontSize: 12, lineHeight: 18, flex: 1 },

  // Connected header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconBtn: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  disconnectBtn: {
    borderWidth: 1, borderRadius: 10,
    paddingVertical: 6, paddingHorizontal: 12,
  },
  disconnectText: { fontSize: 12, fontWeight: '600' },

  scrollContent: { paddingHorizontal: 18, paddingTop: 16 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.3,
    marginBottom: 10,
  },

  // Events
  eventCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    borderRadius: 14, borderWidth: 1,
    padding: 14, marginBottom: 8, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  eventDot:  { width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0 },
  eventInfo: { flex: 1 },
  eventTitle:    { fontSize: 14, fontWeight: '600', marginBottom: 3 },
  eventMeta:     { fontSize: 12, lineHeight: 18 },
  eventLocation: { fontSize: 11, marginTop: 2 },

  noEventsCard: {
    borderWidth: 1, borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 16,
  },
  noEventsText: { fontSize: 13, lineHeight: 20, textAlign: 'center' },

  // Chat divider
  dividerWrap: {
    marginTop: 20, marginBottom: 16, paddingTop: 18, borderTopWidth: 1,
    alignItems: 'center',
  },
  dividerText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },

  promptsWrap: { gap: 8, marginBottom: 12 },
  promptChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  promptText: { fontSize: 14, fontWeight: '500', flex: 1 },

  bloomBubble: {
    borderRadius: 18, borderBottomLeftRadius: 5,
    padding: 16, borderWidth: 1, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
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
  clearBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: C.border,
    alignItems: 'center', justifyContent: 'center', marginRight: 2,
  },
});
