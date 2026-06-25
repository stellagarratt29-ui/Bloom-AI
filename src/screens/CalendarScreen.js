import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet, Platform, ActivityIndicator,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import {
  isCalendarConnected, getCalendarClientId, saveCalendarClientId,
  startCalendarOAuth, getUpcomingEvents, clearCalendarToken, saveCalendarToken,
  extractTokenFromHash,
} from '../services/calendar';
import { processCalendarRequest } from '../services/calendar';

function groupByDay(events) {
  const groups = {};
  for (const e of events) {
    const day = (e.start.dateTime ?? e.start.date ?? '').substring(0, 10);
    if (!groups[day]) groups[day] = [];
    groups[day].push(e);
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

function formatDayLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatEventTime(event) {
  if (event.start.dateTime) {
    return new Date(event.start.dateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  return 'All day';
}

export default function CalendarScreen() {
  const { calendarConnected, setCalendarConnected } = useApp();

  const [connected, setConnected] = useState(false);
  const [clientId, setClientId]   = useState('');
  const [events, setEvents]       = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [thinking, setThinking]   = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const scrollRef = useRef(null);

  // Check connection status on mount and whenever calendarConnected changes
  useEffect(() => {
    checkConnection();
  }, [calendarConnected]);

  const checkConnection = async () => {
    const ok = await isCalendarConnected();
    setConnected(ok);
    const savedId = await getCalendarClientId();
    if (savedId) setClientId(savedId);
    if (ok) loadEvents();
  };

  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const evts = await getUpcomingEvents(14);
      setEvents(evts);
    } catch (e) {
      if (e.code === 'NO_CAL_AUTH') {
        setConnected(false);
        setCalendarConnected(false);
        await clearCalendarToken();
      }
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleConnect = async () => {
    if (!clientId.trim()) return;
    await saveCalendarClientId(clientId.trim());
    try {
      await startCalendarOAuth();
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now(), from: 'bloom', text: e.message }]);
    }
  };

  const handleDisconnect = async () => {
    await clearCalendarToken();
    setConnected(false);
    setCalendarConnected(false);
    setEvents([]);
    setMessages([]);
  };

  const send = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text: trimmed }]);
    setThinking(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);

    try {
      const reply = await processCalendarRequest(trimmed);
      const responseText = reply ?? "I'm not sure what you mean — try asking about specific events or dates.";
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text: responseText }]);
      // Refresh events after potential write actions
      if (/create|add|update|delete|move|reschedule|cancel/i.test(trimmed)) {
        await loadEvents();
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text: `Something went wrong: ${e.message}` }]);
    } finally {
      setThinking(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    }
  };

  const grouped = groupByDay(events);

  // --- Not connected: setup screen ---
  if (!connected) {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.setupScroll} showsVerticalScrollIndicator={false}>
          <Text style={s.title}>Calendar</Text>
          <Text style={s.sub}>Connect Google Calendar to see your events and manage your schedule with Bloom.</Text>

          {clientId ? (
            <TouchableOpacity style={s.connectBtn} onPress={handleConnect}>
              <Feather name="calendar" size={16} color={C.white} />
              <Text style={s.connectBtnText}>Connect Google Calendar</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.setupCard}>
              <Text style={s.setupCardTitle}>Paste your Google OAuth Client ID</Text>
              <Text style={s.setupStep}>
                Create one at <Text style={s.setupLink} onPress={() => Linking.openURL('https://console.cloud.google.com')}>console.cloud.google.com</Text> → APIs & Services → Credentials → OAuth 2.0 Client ID (Web app). Add <Text style={s.setupCode}>https://stellagarratt29-ui.github.io</Text> as the authorised JavaScript origin.
              </Text>
              <TextInput
                style={s.clientInput}
                placeholder="123456789-abc…apps.googleusercontent.com"
                placeholderTextColor={C.muted}
                value={clientId}
                onChangeText={setClientId}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[s.connectBtn, !clientId.trim() && s.connectBtnOff]}
                onPress={handleConnect}
                disabled={!clientId.trim()}
              >
                <Feather name="calendar" size={16} color={C.white} />
                <Text style={s.connectBtnText}>Connect Google Calendar</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={s.noteCard}>
            <Feather name="lock" size={13} color={C.muted} style={{ marginRight: 8, marginTop: 1, flexShrink: 0 }} />
            <Text style={s.noteText}>
              Bloom reads your events to answer questions and writes events only when you ask. Your data goes directly to Google's servers.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- Connected: events + chat ---
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Calendar</Text>
          <View style={s.connectedBadge}>
            <View style={s.connectedDot} />
            <Text style={s.connectedText}>Google Calendar</Text>
          </View>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity style={s.refreshBtn} onPress={loadEvents} disabled={loadingEvents}>
            {loadingEvents
              ? <ActivityIndicator size="small" color={C.moss} />
              : <Feather name="refresh-cw" size={16} color={C.moss} />}
          </TouchableOpacity>
          <TouchableOpacity style={s.disconnectBtn} onPress={handleDisconnect}>
            <Text style={s.disconnectText}>Disconnect</Text>
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
        {/* Events grouped by day */}
        {loadingEvents && events.length === 0 ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="small" color={C.sage} />
            <Text style={s.loadingText}>Loading your events…</Text>
          </View>
        ) : grouped.length === 0 ? (
          <View style={s.emptyEvents}>
            <Feather name="calendar" size={36} color={C.sageLight} style={{ marginBottom: 12 }} />
            <Text style={s.emptyEventsText}>No events in the next 2 weeks.</Text>
            <Text style={s.emptyEventsSub}>Ask Bloom to add something, or check a wider date range.</Text>
          </View>
        ) : (
          grouped.map(([day, dayEvents]) => (
            <View key={day} style={s.dayGroup}>
              <Text style={s.dayLabel}>{formatDayLabel(day)}</Text>
              {dayEvents.map(e => (
                <View key={e.id} style={s.eventCard}>
                  <View style={s.eventTime}>
                    <Text style={s.eventTimeText}>{formatEventTime(e)}</Text>
                  </View>
                  <View style={s.eventBody}>
                    <Text style={s.eventTitle}>{e.summary}</Text>
                    {e.location ? <Text style={s.eventLocation} numberOfLines={1}>{e.location}</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          ))
        )}

        {/* Chat messages below events */}
        {messages.length > 0 && (
          <View style={s.chatDivider}>
            <Text style={s.chatDividerText}>BLOOM</Text>
          </View>
        )}

        {messages.map(m => (
          m.from === 'user' ? (
            <View key={m.id} style={s.userRow}>
              <View style={s.userBubble}>
                <Text style={s.userText}>{m.text}</Text>
              </View>
            </View>
          ) : (
            <View key={m.id} style={s.bloomBubble}>
              <Text style={s.bloomText}>{m.text}</Text>
            </View>
          )
        ))}

        {thinking && (
          <View style={[s.bloomBubble, { paddingVertical: 18 }]}>
            <ActivityIndicator size="small" color={C.sage} />
          </View>
        )}

        {messages.length === 0 && !loadingEvents && (
          <View style={s.chatHint}>
            <Text style={s.chatHintText}>
              Ask Bloom about your schedule — "what do I have this week", "am I free Friday afternoon", or "add dentist Thursday at 2pm".
            </Text>
          </View>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      <View style={s.inputBar}>
        <TextInput
          style={s.input}
          placeholder="Ask about your calendar…"
          placeholderTextColor={C.muted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => send(input)}
          returnKeyType="send"
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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.cream },
  scroll: { flex: 1 },

  // Setup
  setupScroll: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 48 },
  title: {
    fontSize: 30, fontWeight: '800', color: C.ink, marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : undefined,
  },
  sub: { fontSize: 14, color: C.muted, lineHeight: 22, marginBottom: 24 },

  setupCard: {
    backgroundColor: C.white, borderRadius: 18, borderWidth: 1, borderColor: C.border,
    padding: 20, marginBottom: 16,
  },
  setupCardTitle: { fontSize: 15, fontWeight: '700', color: C.ink, marginBottom: 12 },
  setupStep: { fontSize: 13, color: C.ink, lineHeight: 22, marginBottom: 14 },
  setupLink: { color: C.moss, textDecorationLine: 'underline' },
  setupCode: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 11, color: C.clay,
  },
  clientInput: {
    backgroundColor: C.cream, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14,
    fontSize: 13, color: C.ink, marginBottom: 14,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  connectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.moss, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 18, justifyContent: 'center',
    marginBottom: 16,
  },
  connectBtnOff: { opacity: 0.4 },
  connectBtnText: { color: C.white, fontWeight: '700', fontSize: 15 },
  noteCard: {
    flexDirection: 'row', backgroundColor: C.sagePale, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: C.sageLight,
  },
  noteText: { flex: 1, fontSize: 12, color: C.muted, lineHeight: 18 },

  // Connected header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 18, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.cream,
  },
  headerTitle: {
    fontSize: 26, fontWeight: '800', color: C.ink, marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : undefined,
  },
  connectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  connectedDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: C.moss },
  connectedText:  { fontSize: 11, color: C.moss, fontWeight: '600' },
  headerActions:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  refreshBtn: { padding: 8 },
  disconnectBtn: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  disconnectText: { fontSize: 12, color: C.muted, fontWeight: '600' },

  scrollContent: { paddingHorizontal: 18, paddingVertical: 16 },

  loadingWrap: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  loadingText: { fontSize: 14, color: C.muted },

  emptyEvents: { alignItems: 'center', paddingVertical: 40 },
  emptyEventsText: { fontSize: 16, fontWeight: '700', color: C.ink, marginBottom: 6 },
  emptyEventsSub:  { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },

  dayGroup:  { marginBottom: 20 },
  dayLabel:  { fontSize: 11, fontWeight: '700', color: C.clay, letterSpacing: 1.2, marginBottom: 8 },
  eventCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: C.white, borderRadius: 14, padding: 14, marginBottom: 6,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  eventTime: {
    backgroundColor: C.sagePale, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, flexShrink: 0,
  },
  eventTimeText: { fontSize: 12, fontWeight: '700', color: C.moss },
  eventBody:     { flex: 1 },
  eventTitle:    { fontSize: 14, fontWeight: '600', color: C.ink, lineHeight: 20 },
  eventLocation: { fontSize: 12, color: C.muted, marginTop: 2 },

  chatDivider: { alignItems: 'center', marginVertical: 16 },
  chatDividerText: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.5 },

  bloomBubble: {
    backgroundColor: C.white, borderRadius: 18, borderBottomLeftRadius: 5,
    padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  bloomText: { fontSize: 15, color: C.ink, lineHeight: 26 },

  userRow:   { alignItems: 'flex-end', marginBottom: 12 },
  userBubble: {
    backgroundColor: C.moss, borderRadius: 18, borderBottomRightRadius: 5,
    paddingVertical: 11, paddingHorizontal: 15, maxWidth: '80%',
  },
  userText: { fontSize: 15, color: C.white, lineHeight: 22 },

  chatHint: {
    backgroundColor: C.sagePale, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.sageLight, marginTop: 8,
  },
  chatHintText: { fontSize: 13, color: C.ink, lineHeight: 22, textAlign: 'center' },

  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12,
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
