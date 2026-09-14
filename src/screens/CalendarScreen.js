import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet, Platform, ActivityIndicator,
} from 'react-native';
import Icon from '../components/Icon';
import VoiceMicButton from '../components/VoiceMicButton';
import { useTheme } from '../context/ThemeContext';
import {
  processCalendarRequest,
  startCalendarOAuth,
  isCalendarConnected,
  getUpcomingEvents,
  clearCalendarToken,
  getCalendarClientId,
} from '../services/calendar';
import { callClaude, getApiKey } from '../services/ai';
import { getSavedLocation, geocodeAddress, getTravelTime } from '../services/location';

// ── Leave-time resolver ──────────────────────────────────────────────────────
async function resolveLeaveTime(text, events) {
  const m =
    text.match(/(?:what time|when)[\w\s,']*?(?:leave|head|go|set off)[\w\s]*?(?:for|to)\s+(.+?)(?:\s+(?:today|td|tomorrow|now)|[?.!,]|$)/i) ||
    text.match(/leave[\w\s]*?for\s+(.+?)(?:\s+(?:today|td|tomorrow|now)|[?.!,]|$)/i);

  const keyword = (m?.[1] ?? '').trim().toLowerCase().replace(/\b(today|td|tomorrow|now)\b/gi, '').trim();
  if (!keyword) return null;

  const match = events.find(e => {
    const title = (e.summary ?? '').toLowerCase().replace(/^[^:]+:\s*/, '');
    return title.includes(keyword) || keyword.includes(title);
  });
  if (!match?.start?.dateTime) return null;

  const eventTime = new Date(match.start.dateTime);
  const dateStr   = eventTime.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeStr   = eventTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const name      = match.summary;

  try {
    const origin = await getSavedLocation();
    if (!origin) return `${name} is on ${dateStr} at ${timeStr}. Allow location access in Settings and I can work out exactly when you need to leave.`;
    if (match.location) {
      const dest = await geocodeAddress(match.location);
      if (dest) {
        const travelMins = await getTravelTime(origin, dest);
        if (travelMins !== null) {
          const leaveBy  = new Date(eventTime.getTime() - travelMins * 60000);
          const leaveStr = leaveBy.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          const travelStr = travelMins < 60 ? `${travelMins} min` : `${Math.floor(travelMins / 60)}h ${travelMins % 60}m`;
          return `${name} is on ${dateStr} at ${timeStr}. Leave by ${leaveStr} — about ${travelStr} from your location.`;
        }
      }
    }
    return `${name} is on ${dateStr} at ${timeStr}. Add the venue address to the event and I'll tell you exactly when to leave.`;
  } catch {
    return `${name} is on ${dateStr} at ${timeStr}.`;
  }
}

// ── Date helpers ─────────────────────────────────────────────────────────────
const DAY_SHORT  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function todayLabel() {
  const d = new Date();
  return `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

function getWeekDays() {
  const today = new Date();
  const dow   = today.getDay(); // 0=Sun
  const days  = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - dow + i);
    days.push({ date: d, isToday: i === dow });
  }
  return days;
}

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

function groupEventsByDay(events) {
  const map = new Map();
  events.forEach(ev => {
    const key = (ev.start.dateTime ?? ev.start.date ?? '').slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(ev);
  });
  return [...map.entries()].map(([dateKey, evs]) => {
    const d = new Date(dateKey + 'T12:00:00');
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const isTomorrow = d.toDateString() === new Date(today.getTime() + 86400000).toDateString();
    let label = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
    return { dateKey, label, isToday, events: evs };
  });
}

// ── Week strip ───────────────────────────────────────────────────────────────
function WeekStrip({ events, t }) {
  const week = getWeekDays();
  const eventDays = new Set(events.map(e => (e.start.dateTime ?? e.start.date ?? '').slice(0, 10)));
  return (
    <View style={[ws.row, { borderBottomColor: t.border }]}>
      {week.map(({ date, isToday }) => {
        const key   = date.toISOString().slice(0, 10);
        const hasDot = eventDays.has(key);
        return (
          <View key={key} style={ws.col}>
            <Text style={[ws.dayLabel, { color: isToday ? t.accent : t.muted }]}>
              {DAY_SHORT[date.getDay()]}
            </Text>
            <View style={[ws.dateCircle, isToday && { backgroundColor: t.accent }]}>
              <Text style={[ws.dateNum, { color: isToday ? '#FFF' : t.text }]}>
                {date.getDate()}
              </Text>
            </View>
            {hasDot && (
              <View style={[ws.dot, { backgroundColor: isToday ? t.accent : t.accentLight }]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const ws = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  col:        { flex: 1, alignItems: 'center', gap: 4 },
  dayLabel:   { fontSize: 10, fontWeight: '500', letterSpacing: 0.3 },
  dateCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dateNum:    { fontSize: 14, fontWeight: '500' },
  dot:        { width: 4, height: 4, borderRadius: 2 },
});

// ── Event row ─────────────────────────────────────────────────────────────────
function EventRow({ event, t, isLast }) {
  const time = fmtTime(event);
  return (
    <View style={[er.row, !isLast && { borderBottomWidth: 0.5, borderBottomColor: t.border }]}>
      <View style={er.timeCol}>
        <Text style={[er.time, { color: t.subtext }]}>{time}</Text>
      </View>
      <View style={[er.stripe, { backgroundColor: t.accent }]} />
      <View style={er.body}>
        <Text style={[er.title, { color: t.text }]} numberOfLines={1}>{event.summary ?? 'Untitled'}</Text>
        {!!event.location && (
          <Text style={[er.loc, { color: t.subtext }]} numberOfLines={1}>
            <Icon name="map-pin" size={10} color={t.muted} /> {event.location}
          </Text>
        )}
      </View>
    </View>
  );
}

const er = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 18, gap: 12 },
  timeCol: { width: 64, alignItems: 'flex-end' },
  time:    { fontSize: 12, fontWeight: '500', fontVariant: ['tabular-nums'] },
  stripe:  { width: 2, height: 36, borderRadius: 1, flexShrink: 0 },
  body:    { flex: 1 },
  title:   { fontSize: 14, fontWeight: '500', marginBottom: 2 },
  loc:     { fontSize: 11, marginTop: 1 },
});

// ── Day group ─────────────────────────────────────────────────────────────────
function DayGroup({ group, t }) {
  return (
    <View style={[dg.wrap, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={[dg.header, { borderBottomColor: t.border }]}>
        <Text style={[dg.label, { color: group.isToday ? t.accent : t.text }]}>
          {group.label}
        </Text>
        {group.isToday && (
          <View style={[dg.todayBadge, { backgroundColor: t.accentPale }]}>
            <Text style={[dg.todayBadgeText, { color: t.accent }]}>Today</Text>
          </View>
        )}
      </View>
      {group.events.map((ev, i) => (
        <EventRow key={ev.id ?? i} event={ev} t={t} isLast={i === group.events.length - 1} />
      ))}
    </View>
  );
}

const dg = StyleSheet.create({
  wrap: {
    borderRadius: 12, borderWidth: 0.5,
    marginHorizontal: 16, marginBottom: 10, overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: 0.5,
  },
  label:          { fontSize: 13, fontWeight: '600' },
  todayBadge:     { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  todayBadgeText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.2 },
});

// ── Empty day (no events today) ───────────────────────────────────────────────
function EmptyToday({ t }) {
  return (
    <View style={[ets.wrap, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={ets.timeCol}>
        <Text style={[ets.time, { color: t.border }]}>—</Text>
      </View>
      <View style={[ets.stripe, { backgroundColor: t.border }]} />
      <Text style={[ets.text, { color: t.muted }]}>Nothing scheduled today</Text>
    </View>
  );
}

const ets = StyleSheet.create({
  wrap:    { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 0.5, marginHorizontal: 16, padding: 16, marginBottom: 10 },
  timeCol: { width: 64, alignItems: 'flex-end' },
  time:    { fontSize: 12, fontWeight: '500' },
  stripe:  { width: 2, height: 28, borderRadius: 1, flexShrink: 0 },
  text:    { fontSize: 13 },
});

// ── Connect state ─────────────────────────────────────────────────────────────
function ConnectView({ onConnect, connectErr, t }) {
  const overlayBg = t.bg.startsWith('#1') || t.bg.startsWith('#0')
    ? 'rgba(17,17,17,0.88)'
    : 'rgba(255,255,255,0.88)';
  return (
    <View style={cv.wrap}>
      {/* Preview of a connected week — three ghost event rows */}
      <View style={[cv.preview, { borderColor: t.border }]}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[cv.ghostRow, i < 2 && { borderBottomWidth: 0.5, borderBottomColor: t.border }]}>
            <View style={[cv.ghostBar, { backgroundColor: t.accentLight }]} />
            <View style={[cv.ghostText, { backgroundColor: t.border, width: `${55 + i * 12}%` }]} />
          </View>
        ))}
        <View style={[cv.blurOverlay, { backgroundColor: overlayBg }]}>
          <View style={[cv.pill, { backgroundColor: t.bg, borderColor: t.border }]}>
            <Icon name="calendar" size={14} color={t.accent} />
            <Text style={[cv.pillText, { color: t.text }]}>Connect Google Calendar</Text>
          </View>
          <Text style={[cv.sub, { color: t.subtext }]}>See your real schedule, get leave-time reminders, and let Bloom plan around your commitments.</Text>
          <TouchableOpacity style={[cv.btn, { backgroundColor: t.accent }]} onPress={onConnect} activeOpacity={0.85}>
            <Text style={cv.btnText}>Allow access</Text>
          </TouchableOpacity>
          {!!connectErr && <Text style={[cv.err, { color: '#B85050' }]}>{connectErr}</Text>}
        </View>
      </View>
    </View>
  );
}

const cv = StyleSheet.create({
  wrap:       { paddingTop: 8, paddingBottom: 4 },
  preview:    { marginHorizontal: 16, borderRadius: 14, borderWidth: 0.5, overflow: 'hidden', position: 'relative' },
  ghostRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  ghostBar:   { width: 3, height: 28, borderRadius: 2 },
  ghostText:  { height: 10, borderRadius: 5 },
  blurOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, gap: 10,
  },
  pill:       { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  pillText:   { fontSize: 14, fontWeight: '600' },
  sub:        { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  btn:        { paddingVertical: 13, paddingHorizontal: 28, borderRadius: 10, alignSelf: 'stretch', alignItems: 'center' },
  btnText:    { fontSize: 14, fontWeight: '600', color: '#FFF' },
  err:        { fontSize: 12, textAlign: 'center' },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function CalendarScreen() {
  const { colors: t } = useTheme();

  const [connected,     setConnected]     = useState(false);
  const [savedId,       setSavedId]       = useState(null);
  const [clientIdInput, setClientIdInput] = useState('');
  const [events,        setEvents]        = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [connectErr,    setConnectErr]    = useState('');
  const [messages,      setMessages]      = useState([]);
  const [input,         setInput]         = useState('');
  const [thinking,      setThinking]      = useState(false);
  const scrollRef = useRef(null);

  const scrollToEnd = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);

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
      if (e.code === 'NO_CAL_AUTH') { setConnected(false); setEvents([]); }
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  const handleConnect = async () => {
    setConnectErr('');
    const id = clientIdInput.trim() || savedId;
    try {
      await startCalendarOAuth(id || undefined);
    } catch (e) {
      if (e.message === 'NO_CLIENT_ID') setConnectErr('Google Client ID required to connect.');
      else setConnectErr(e.message);
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
      if (connected && events.length > 0) {
        const leaveReply = await resolveLeaveTime(trimmed, events);
        if (leaveReply) {
          setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text: leaveReply }]);
          return;
        }
      }
      const reply = await processCalendarRequest(trimmed);
      if (reply) {
        setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text: reply }]);
        return;
      }
      if (connected && events.length > 0) {
        const aiKey = await getApiKey();
        if (aiKey) {
          const evSummary = events.map(e => {
            const dt = e.start.dateTime
              ? new Date(e.start.dateTime).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
              : e.start.date;
            return `${dt}: ${e.summary}${e.location ? ' at ' + e.location : ''}`;
          }).join('\n');
          const aiReply = await callClaude({
            system: `You are Bloom, a personal productivity assistant. Today is ${new Date().toDateString()}. The user's upcoming calendar events:\n${evSummary}\n\nAnswer their question using their actual events. Be specific. Plain text only — no markdown, no bullet points. 1-3 sentences.`,
            messages: [{ role: 'user', content: trimmed }],
            maxTokens: 200,
          });
          if (aiReply) {
            setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text: aiReply }]);
            return;
          }
        }
      }
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text: "I can help you plan — what are you working with?" }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text: "Something went wrong. Try again?" }]);
    } finally {
      setThinking(false);
      scrollToEnd();
    }
  };

  const grouped  = groupEventsByDay(events);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayGroup = grouped.find(g => g.dateKey === todayKey);
  const upcomingGroups = grouped.filter(g => g.dateKey !== todayKey);

  const QUICK_PROMPTS = connected
    ? ['What do I have today?', 'When should I leave for my next event?', 'Block time for deep work']
    : ['Help me plan my week', 'What should I prioritise?', 'I have too much on'];

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: t.border }]}>
        <View>
          <Text style={[s.title, { color: t.text }]}>Schedule</Text>
          <Text style={[s.dateLabel, { color: t.subtext }]}>{todayLabel()}</Text>
        </View>
        {connected && (
          <View style={s.headerActions}>
            <TouchableOpacity onPress={loadEvents} style={[s.iconBtn, { borderColor: t.border }]} activeOpacity={0.7}>
              <Icon name="refresh-cw" size={13} color={t.subtext} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDisconnect} style={[s.iconBtn, { borderColor: t.border }]} activeOpacity={0.7}>
              <Icon name="log-out" size={13} color={t.subtext} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Week strip */}
      <WeekStrip events={events} t={t} />

      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Connection state */}
        {!connected && (
          <ConnectView onConnect={handleConnect} connectErr={connectErr} t={t} />
        )}

        {/* Connected: events */}
        {connected && (
          <>
            {loadingEvents ? (
              <View style={s.loadingWrap}>
                <ActivityIndicator color={t.accent} />
              </View>
            ) : (
              <>
                {/* Today */}
                {todayGroup ? (
                  <DayGroup group={todayGroup} t={t} />
                ) : (
                  <EmptyToday t={t} />
                )}
                {/* Upcoming */}
                {upcomingGroups.length > 0 && (
                  <>
                    <Text style={[s.sectionHead, { color: t.subtext }]}>Upcoming</Text>
                    {upcomingGroups.map(g => <DayGroup key={g.dateKey} group={g} t={t} />)}
                  </>
                )}
                {events.length === 0 && (
                  <View style={[s.noEvents, { borderColor: t.border }]}>
                    <Text style={[s.noEventsText, { color: t.muted }]}>No events in the next 14 days</Text>
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* Chat section */}
        <View style={[s.chatDivider, { marginTop: connected ? 16 : 12 }]}>
          <Text style={[s.chatDividerText, { color: t.muted }]}>Ask Bloom about your schedule</Text>
        </View>

        {messages.length === 0 && (
          <View style={s.promptsWrap}>
            {QUICK_PROMPTS.map(p => (
              <TouchableOpacity
                key={p}
                style={[s.promptChip, { borderColor: t.border }]}
                onPress={() => sendChat(p)}
                activeOpacity={0.65}
              >
                <Text style={[s.promptText, { color: t.text }]}>{p}</Text>
                <Icon name="arrow-right" size={12} color={t.muted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {messages.map(m =>
          m.from === 'user' ? (
            <View key={m.id} style={s.userRow}>
              <View style={[s.userBubble, { backgroundColor: t.chatBubble }]}>
                <Text style={s.userText}>{m.text}</Text>
              </View>
            </View>
          ) : (
            <Text key={m.id} style={[s.bloomText, { color: t.text }]}>{m.text}</Text>
          )
        )}

        {thinking && (
          <ActivityIndicator size="small" color={t.accent} style={{ marginVertical: 16, alignSelf: 'flex-start', marginLeft: 18 }} />
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Input bar */}
      <View style={[s.inputBar, { backgroundColor: t.bg, borderTopColor: t.border }]}>
        <VoiceMicButton onTranscript={(txt) => setInput(prev => prev ? prev + ' ' + txt : txt)} color={t.input} />
        <TextInput
          style={[s.input, { backgroundColor: t.input, color: t.text }]}
          placeholder="Ask about your schedule…"
          placeholderTextColor={t.muted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => sendChat(input)}
          returnKeyType="send"
          editable={!thinking}
        />
        <TouchableOpacity
          style={[s.sendBtn, { backgroundColor: input.trim() ? t.text : t.input }]}
          onPress={() => sendChat(input)}
          disabled={!input.trim() || thinking}
        >
          <Icon name="arrow-up" size={16} color={input.trim() ? (t.bg) : t.muted} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  title: {
    fontSize: 22, fontWeight: '600', letterSpacing: -0.3,
    fontFamily: Platform.OS === 'web' ? '"Plus Jakarta Sans", system-ui, sans-serif' : undefined,
  },
  dateLabel: { fontSize: 12, fontWeight: '400', marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  scrollContent: { paddingTop: 12, paddingBottom: 8 },

  loadingWrap:    { alignItems: 'center', paddingVertical: 32 },
  sectionHead:    { fontSize: 11, fontWeight: '600', letterSpacing: 0.4, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8 },

  noEvents:    { borderRadius: 12, borderWidth: 0.5, marginHorizontal: 16, padding: 20, alignItems: 'center' },
  noEventsText:{ fontSize: 13 },

  chatDivider:     { paddingHorizontal: 18, paddingBottom: 10 },
  chatDividerText: { fontSize: 11, fontWeight: '500', letterSpacing: 0.3 },

  promptsWrap: { paddingHorizontal: 16, gap: 6, marginBottom: 16 },
  promptChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 0.5, borderRadius: 10,
  },
  promptText: { fontSize: 14, fontWeight: '400' },

  bloomText: { fontSize: 15, lineHeight: 24, paddingHorizontal: 18, marginBottom: 14 },
  userRow:   { alignItems: 'flex-end', marginBottom: 12, paddingHorizontal: 16 },
  userBubble:{ borderRadius: 18, borderBottomRightRadius: 4, paddingVertical: 10, paddingHorizontal: 14, maxWidth: '82%' },
  userText:  { fontSize: 15, color: '#FFF', lineHeight: 22 },

  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 0.5,
  },
  input: {
    flex: 1, borderRadius: 22,
    paddingVertical: 10, paddingHorizontal: 16, fontSize: 15,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
});
