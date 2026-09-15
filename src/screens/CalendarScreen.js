import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet, Platform, ActivityIndicator,
} from 'react-native';
import Icon from '../components/Icon';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { isSignedIn, fetchEventsForDate } from '../services/google';

const DAYS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getWeekDates(anchor = new Date()) {
  const d = new Date(anchor);
  const day = d.getDay(); // 0=Sun
  // Week starting Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    return x;
  });
}

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

function fmt12(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  let h = d.getHours(), m = d.getMinutes(), ampm = 'am';
  if (h >= 12) { ampm = 'pm'; if (h > 12) h -= 12; }
  if (h === 0) h = 12;
  return m === 0 ? `${h}${ampm}` : `${h}:${String(m).padStart(2,'0')}${ampm}`;
}

// Merge calendar events and tasks into a sorted timeline
function buildTimeline(events, tonightTasks) {
  const rows = [];

  events.forEach(ev => {
    if (ev.allDay) {
      rows.push({ type: 'event', allDay: true, ...ev });
    } else {
      rows.push({ type: 'event', allDay: false, ...ev, sortKey: ev.start });
    }
  });

  if (tonightTasks.length > 0) {
    rows.push({
      type:    'tasks',
      sortKey: new Date().toISOString().slice(0,10) + 'T19:00:00',
      tasks:   tonightTasks,
    });
  }

  rows.sort((a, b) => {
    if (!a.sortKey) return -1;
    if (!b.sortKey) return 1;
    return a.sortKey.localeCompare(b.sortKey);
  });

  return rows;
}

export default function CalendarScreen({ navigation }) {
  const { tasks, googleUser } = useApp();
  const { colors: t } = useTheme();

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(toDateStr(today));
  const [weekDates,    setWeekDates]    = useState(() => getWeekDates(today));
  const [events,       setEvents]       = useState([]);
  const [loading,      setLoading]      = useState(false);

  const tonightTasks = tasks.filter(tk => (tk.urgency ?? 'whenever') === 'tonight' && !tk.done);
  const isToday = selectedDate === toDateStr(today);

  const loadEvents = useCallback(async (dateStr) => {
    if (!isSignedIn()) { setEvents([]); return; }
    setLoading(true);
    try {
      const evs = await fetchEventsForDate(dateStr);
      setEvents(evs);
    } catch { setEvents([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadEvents(selectedDate); }, [selectedDate, loadEvents]);

  const selectDay = (d) => {
    const str = toDateStr(d);
    setSelectedDate(str);
    // Rebuild week if selected date is outside current week
    const week = weekDates;
    if (str < toDateStr(week[0]) || str > toDateStr(week[6])) {
      setWeekDates(getWeekDates(d));
    }
  };

  const shiftWeek = (dir) => {
    const anchor = new Date(weekDates[0]);
    anchor.setDate(anchor.getDate() + dir * 7);
    setWeekDates(getWeekDates(anchor));
  };

  const timeline = buildTimeline(events, isToday ? tonightTasks : []);
  const allDayEvents = events.filter(e => e.allDay);
  const timedRows = timeline.filter(r => !r.allDay);

  const selectedDt = new Date(selectedDate + 'T00:00:00');
  const headerLabel = `${DAYS[(selectedDt.getDay() + 1) % 7 === 0 ? 6 : selectedDt.getDay()]}, ${selectedDt.getDate()} ${MONTHS[selectedDt.getMonth()]}`;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: t.border }]}>
        <View>
          <Text style={[s.title, { color: t.text }]}>Calendar</Text>
          <Text style={[s.sub, { color: t.subtext }]}>{headerLabel}</Text>
        </View>
        <TouchableOpacity
          style={s.gearBtn}
          onPress={() => navigation.navigate('Settings')}
        >
          <Icon name="settings" size={20} color={t.subtext} />
        </TouchableOpacity>
      </View>

      {/* Week strip */}
      <View style={[s.weekRow, { backgroundColor: t.bg, borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={() => shiftWeek(-1)} style={s.weekArrow} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
          <Icon name="chevron-left" size={16} color={t.muted} />
        </TouchableOpacity>
        {weekDates.map((d, i) => {
          const str      = toDateStr(d);
          const isActive = str === selectedDate;
          const isTod    = str === toDateStr(today);
          return (
            <TouchableOpacity
              key={i}
              style={[s.dayCell, isActive && { backgroundColor: t.text }]}
              onPress={() => selectDay(d)}
              activeOpacity={0.7}
            >
              <Text style={[s.dayLabel, { color: isActive ? (t.bg) : t.muted }]}>
                {['M','T','W','T','F','S','S'][i]}
              </Text>
              <Text style={[s.dayNum, { color: isActive ? t.bg : (isTod ? t.accent : t.text) }]}>
                {d.getDate()}
              </Text>
              {isTod && !isActive && <View style={[s.todayDot, { backgroundColor: t.accent }]} />}
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity onPress={() => shiftWeek(1)} style={s.weekArrow} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
          <Icon name="chevron-right" size={16} color={t.muted} />
        </TouchableOpacity>
      </View>

      {/* Google Calendar badge or connect prompt */}
      {isSignedIn() ? (
        <View style={[s.gcalBadge, { backgroundColor: t.accentPale }]}>
          <View style={s.gcalDot} />
          <Text style={[s.gcalText, { color: t.accent }]}>
            {googleUser?.name ? `${googleUser.name.split(' ')[0]}'s Google Calendar` : 'Google Calendar'}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[s.connectBar, { backgroundColor: t.card, borderColor: t.border }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Icon name="calendar" size={14} color={t.muted} />
          <Text style={[s.connectText, { color: t.subtext }]}>Connect Google Calendar in Settings →</Text>
        </TouchableOpacity>
      )}

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <View style={[s.allDayRow, { borderBottomColor: t.border }]}>
          {allDayEvents.map(ev => (
            <View key={ev.id} style={[s.allDayChip, { backgroundColor: t.accentPale }]}>
              <Text style={[s.allDayText, { color: t.accent }]} numberOfLines={1}>{ev.title}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Timeline */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <View style={s.loadingRow}>
            <ActivityIndicator size="small" color={t.accent} />
          </View>
        )}

        {!loading && timedRows.length === 0 && (
          <View style={s.emptyDay}>
            <View style={[s.emptyIcon, { backgroundColor: t.accentPale }]}>
              <Icon name="sun" size={28} color={t.accent} />
            </View>
            <Text style={[s.emptyHead, { color: t.text }]}>
              {isToday ? 'Nothing scheduled today' : 'Nothing on this day'}
            </Text>
            {isToday && tonightTasks.length === 0 && (
              <Text style={[s.emptyBody, { color: t.subtext }]}>
                Brain dump in Chat and Bloom will populate your plan.
              </Text>
            )}
          </View>
        )}

        {timedRows.map((row, idx) => (
          <View key={row.id ?? `tasks-${idx}`} style={s.timeRow}>
            <Text style={[s.timeLabel, { color: t.muted }]}>
              {row.type === 'tasks' ? '7 pm' : fmt12(row.start)}
            </Text>
            <View style={s.timeContent}>
              {row.type === 'event' ? (
                <View style={[s.eventCard, { backgroundColor: t.accentPale, borderLeftColor: t.accent }]}>
                  <Text style={[s.eventTitle, { color: t.text }]}>{row.title}</Text>
                  <Text style={[s.eventSub, { color: t.muted }]}>
                    {fmt12(row.start)} – {fmt12(row.end)} · from Google
                  </Text>
                </View>
              ) : (
                <View style={[s.eventCard, { backgroundColor: t.clayPale, borderLeftColor: t.clay }]}>
                  <Text style={[s.eventTitle, { color: t.text }]}>Tonight tasks</Text>
                  <Text style={[s.eventSub, { color: t.muted }]}>
                    {row.tasks.map(tk => tk.text).join(' · ')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 20, paddingBottom: 12, borderBottomWidth: 0,
  },
  title: {
    fontSize: 28, fontWeight: '700', letterSpacing: -0.5,
    fontFamily: Platform.OS === 'web' ? '"Plus Jakarta Sans", system-ui, sans-serif' : undefined,
  },
  sub:    { fontSize: 13, marginTop: 2, fontWeight: '400' },
  gearBtn: { padding: 6, marginTop: 4 },

  weekRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 6, paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  weekArrow: { paddingHorizontal: 6 },
  dayCell: {
    flex: 1, alignItems: 'center', paddingVertical: 6,
    borderRadius: 10, gap: 4,
  },
  dayLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.05, textTransform: 'uppercase' },
  dayNum:   { fontSize: 14, fontWeight: '700' },
  todayDot: { width: 4, height: 4, borderRadius: 2 },

  gcalBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    marginHorizontal: 22, marginTop: 12, marginBottom: 2,
    paddingHorizontal: 11, paddingVertical: 6,
    borderRadius: 8, alignSelf: 'flex-start',
  },
  gcalDot:  { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4285F4' },
  gcalText: { fontSize: 12, fontWeight: '600' },

  connectBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 22, marginTop: 12, marginBottom: 2,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1,
  },
  connectText: { fontSize: 13, fontWeight: '500' },

  allDayRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: 22, paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  allDayChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  allDayText: { fontSize: 12, fontWeight: '600' },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 22, paddingTop: 16 },

  loadingRow: { alignItems: 'center', paddingVertical: 32 },

  emptyDay:  { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 24 },
  emptyIcon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyHead: { fontSize: 18, fontWeight: '600', marginBottom: 8, letterSpacing: -0.3 },
  emptyBody: { fontSize: 14, textAlign: 'center', lineHeight: 22, maxWidth: 260 },

  timeRow: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  timeLabel: {
    width: 38, fontSize: 11, fontWeight: '500',
    paddingTop: 8, textAlign: 'right', flexShrink: 0,
  },
  timeContent: { flex: 1 },
  eventCard: {
    borderRadius: 10, borderLeftWidth: 3,
    paddingVertical: 9, paddingHorizontal: 12,
  },
  eventTitle: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  eventSub:   { fontSize: 11, marginTop: 2 },
});
