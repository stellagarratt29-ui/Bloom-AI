import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView,
  StyleSheet, Platform, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import Icon from '../components/Icon';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { callClaude, getApiKey } from '../services/ai';

function getHobbyIcon(name) {
  const n = (name || '').toLowerCase();
  if (/guitar|piano|drum|violin|ukulele|bass/.test(n)) return 'music';
  if (/sing|choir|vocal/.test(n)) return 'mic';
  if (/paint|watercolou|watercolor|sketch|draw|art\b/.test(n)) return 'pen-tool';
  if (/photo|camera/.test(n)) return 'camera';
  if (/film|video/.test(n)) return 'film';
  if (/run|jog|sprint/.test(n)) return 'activity';
  if (/gym|lift|fitness/.test(n)) return 'trending-up';
  if (/yoga|meditat|mindful/.test(n)) return 'sun';
  if (/cook|bak|chef/.test(n)) return 'coffee';
  if (/read|book/.test(n)) return 'book-open';
  if (/writ|journal|blog/.test(n)) return 'edit-3';
  if (/code|program|dev/.test(n)) return 'code';
  if (/garden|plant|flower/.test(n)) return 'feather';
  if (/knit|sew|crochet/.test(n)) return 'scissors';
  if (/travel|explore/.test(n)) return 'globe';
  return 'star';
}

const todayStr = () => new Date().toISOString().slice(0, 10);

function fmtMins(mins) {
  if (!mins && mins !== 0) return '–';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function dayLabel(dateStr) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const d = new Date(dateStr + 'T12:00:00');
  return days[d.getDay()];
}

function last7Days() {
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

export default function ScreenAwarenessScreen({ navigation }) {
  const { hobbies, screenTimeLogs, screenTimeGoal, logScreenTime, setScreenTimeGoal, bloomTimeLogs } = useApp();
  const { colors: t } = useTheme();

  const today = todayStr();
  const bloomToday     = bloomTimeLogs.find(l => l.date === today);
  const bloomTodayMins = bloomToday ? Math.round(bloomToday.minutes) : null;
  const todayLog  = screenTimeLogs.find(l => l.date === today);
  const todayMins = todayLog?.minutes ?? null;

  const week      = last7Days();
  const weekLogs  = week.map(d => ({ date: d, minutes: screenTimeLogs.find(l => l.date === d)?.minutes ?? null }));
  const loggedDays = weekLogs.filter(l => l.minutes !== null);
  const weekAvg   = loggedDays.length > 0
    ? Math.round(loggedDays.reduce((s, l) => s + l.minutes, 0) / loggedDays.length)
    : null;
  const maxMins   = Math.max(...weekLogs.map(l => l.minutes ?? 0), screenTimeGoal, 60);

  const [showLog,     setShowLog]     = useState(false);
  const [logHours,    setLogHours]    = useState('');
  const [logMinutes,  setLogMinutes]  = useState('');
  const [showGoalEdit, setShowGoalEdit] = useState(false);
  const [goalHours,   setGoalHours]   = useState('');
  const [goalMins,    setGoalMins]    = useState('');
  const [insight,     setInsight]     = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    if (loggedDays.length === 0) return;
    setLoadingInsight(true);
    const avgStr   = weekAvg !== null ? fmtMins(weekAvg) : 'unknown';
    const goalStr  = fmtMins(screenTimeGoal);
    const todayStr2 = todayMins !== null ? fmtMins(todayMins) : 'not logged yet';
    const context  = `Daily screen time goal: ${goalStr}. Today: ${todayStr2}. 7-day average: ${avgStr}. Days logged this week: ${loggedDays.length}/7.`;

    getApiKey().then(key => {
      if (!key) {
        const overGoal = todayMins !== null && todayMins > screenTimeGoal;
        setInsight(overGoal
          ? `You've gone over your ${fmtMins(screenTimeGoal)} goal today. A hobby break could help reset.`
          : weekAvg !== null
            ? `Your weekly average is ${fmtMins(weekAvg)}. Keep logging to see your patterns.`
            : 'Log your screen time daily to start seeing patterns here.');
        setLoadingInsight(false);
        return;
      }
      callClaude({
        system: "You are Bloom. Write ONE short observational sentence about this person's screen time data. Be specific to the numbers. Warm but honest — no shame, no generic advice.",
        messages: [{ role: 'user', content: context }],
        maxTokens: 80,
      })
        .then(text => { setInsight(text.trim()); setLoadingInsight(false); })
        .catch(() => {
          setInsight(weekAvg !== null
            ? `Your average this week is ${fmtMins(weekAvg)} per day.`
            : 'Log each day to start building your screen time picture.');
          setLoadingInsight(false);
        });
    });
  }, [screenTimeLogs.length, today]);

  const handleLog = () => {
    const h = parseInt(logHours || '0', 10) || 0;
    const m = parseInt(logMinutes || '0', 10) || 0;
    const total = h * 60 + m;
    if (total <= 0) return;
    logScreenTime(total);
    setShowLog(false);
    setLogHours('');
    setLogMinutes('');
  };

  const handleSaveGoal = () => {
    const h = parseInt(goalHours || '0', 10) || 0;
    const m = parseInt(goalMins || '0', 10) || 0;
    const total = h * 60 + m;
    if (total > 0) setScreenTimeGoal(total);
    setShowGoalEdit(false);
  };

  const pctToday = todayMins !== null ? Math.min((todayMins / screenTimeGoal) * 100, 100) : 0;
  const overGoal = todayMins !== null && todayMins > screenTimeGoal;
  const redirectHobbies = hobbies.slice(0, 3);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={[s.title, { color: C.lavDark }]}>Screen{'\n'}Time</Text>
        <Text style={[s.sub, { color: t.subtext }]}>Bloom tracks your time here automatically. Log your total phone screen time to see the full picture.</Text>

        {/* In Bloom auto-tracking card */}
        <View style={[s.bloomCard, { backgroundColor: t.card, borderColor: C.lavDark }]}>
          <View style={s.bloomCardHeader}>
            <View style={[s.autoBadge, { backgroundColor: C.lavWash }]}>
              <View style={[s.autoDot, { backgroundColor: C.lavDark }]} />
              <Text style={[s.autoBadgeText, { color: C.lavDark }]}>auto</Text>
            </View>
            <Text style={[s.bloomCardLabel, { color: t.subtext }]}>IN BLOOM TODAY</Text>
          </View>
          <Text style={[s.bloomCardTime, { color: C.lavDark }]}>
            {bloomTodayMins !== null ? fmtMins(bloomTodayMins) : '–'}
          </Text>
          <Text style={[s.bloomCardHint, { color: t.subtext }]}>
            {bloomTodayMins !== null
              ? `Updated as you use Bloom — ${bloomTodayMins < 10 ? 'just getting started' : 'tracking your session'}`
              : 'Tracking starts automatically when you open Bloom'}
          </Text>
        </View>

        {/* Today card */}
        <View style={[s.todayCard, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={s.todayHeader}>
            <View>
              <Text style={[s.todayLabel, { color: t.subtext }]}>TOTAL PHONE TIME</Text>
              <Text style={[s.todayTime, { color: overGoal ? C.clay : C.lavDark }]}>
                {todayMins !== null ? fmtMins(todayMins) : '–'}
              </Text>
              <Text style={[s.goalLine, { color: t.subtext }]}>goal: {fmtMins(screenTimeGoal)}</Text>
            </View>
            <TouchableOpacity
              style={[s.logBtn, {
                backgroundColor: todayMins !== null ? t.bg : C.moss,
                borderColor: todayMins !== null ? t.border : C.moss,
              }]}
              onPress={() => setShowLog(true)}
            >
              <Icon name={todayMins !== null ? 'edit-2' : 'plus'} size={14} color={todayMins !== null ? t.subtext : C.white} />
              <Text style={[s.logBtnText, { color: todayMins !== null ? t.subtext : C.white }]}>
                {todayMins !== null ? 'Edit' : 'Log today'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={[s.progressTrack, { backgroundColor: t.border }]}>
            <View style={[s.progressFill, { width: `${pctToday}%`, backgroundColor: overGoal ? C.clay : C.moss }]} />
          </View>
          {todayMins !== null && (
            <Text style={[s.progressNote, { color: overGoal ? C.clay : C.moss }]}>
              {overGoal
                ? `${fmtMins(todayMins - screenTimeGoal)} over goal`
                : `${fmtMins(screenTimeGoal - todayMins)} under goal`}
            </Text>
          )}
        </View>

        {/* 7-day chart */}
        <View style={[s.chartCard, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={s.chartHeader}>
            <Text style={[s.chartTitle, { color: t.text }]}>This week</Text>
            {weekAvg !== null && (
              <Text style={[s.avgBadge, { backgroundColor: C.lavWash, color: C.lavDark }]}>
                avg {fmtMins(weekAvg)}
              </Text>
            )}
          </View>
          <View style={s.barsRow}>
            {weekLogs.map(({ date, minutes }) => {
              const isToday = date === today;
              const barPct  = minutes !== null ? Math.min(minutes / maxMins, 1) : 0;
              const over    = minutes !== null && minutes > screenTimeGoal;
              return (
                <View key={date} style={s.barCol}>
                  <View style={s.barWrap}>
                    <View style={[s.goalMarker, {
                      bottom: `${Math.min((screenTimeGoal / maxMins) * 100, 96)}%`,
                      borderColor: t.subtext,
                    }]} />
                    <View style={[s.bar, {
                      height: minutes !== null ? `${Math.max(barPct * 100, 5)}%` : '3%',
                      backgroundColor: minutes === null ? t.border
                        : over ? C.clayLight
                        : isToday ? C.lavDark
                        : C.lavWash,
                    }]} />
                  </View>
                  <Text style={[s.barLabel, { color: isToday ? C.lavDark : t.subtext, fontWeight: isToday ? '700' : '500' }]}>
                    {dayLabel(date)}
                  </Text>
                  <Text style={[s.barVal, { color: minutes === null ? t.border : t.subtext }]}>
                    {minutes !== null ? fmtMins(minutes) : '·'}
                  </Text>
                </View>
              );
            })}
          </View>
          {loggedDays.length === 0 && (
            <Text style={[s.chartEmpty, { color: t.subtext }]}>Log a few days to see your weekly pattern here.</Text>
          )}
        </View>

        {/* Goal row */}
        <TouchableOpacity
          style={[s.goalCard, { backgroundColor: t.card, borderColor: t.border }]}
          onPress={() => {
            setGoalHours(String(Math.floor(screenTimeGoal / 60)));
            setGoalMins(String(screenTimeGoal % 60));
            setShowGoalEdit(true);
          }}
          activeOpacity={0.7}
        >
          <View style={[s.goalIcon, { backgroundColor: C.lavWash }]}>
            <Icon name="target" size={16} color={C.lavDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.goalCardLabel, { color: t.subtext }]}>DAILY GOAL</Text>
            <Text style={[s.goalCardValue, { color: t.text }]}>{fmtMins(screenTimeGoal)}</Text>
          </View>
          <Icon name="chevron-right" size={16} color={t.subtext} />
        </TouchableOpacity>

        {/* Bloom insight */}
        {(loggedDays.length > 0 || insight) ? (
          <View style={[s.insightCard, { borderLeftColor: C.lavDark, backgroundColor: t.card, borderColor: t.border }]}>
            <Text style={[s.insightLabel, { color: C.lavDark }]}>BLOOM NOTICED</Text>
            {loadingInsight
              ? <ActivityIndicator size="small" color={C.lavDark} style={{ marginVertical: 8 }} />
              : <Text style={[s.insightText, { color: t.text }]}>{insight}</Text>}
          </View>
        ) : null}

        {/* Take a break */}
        {redirectHobbies.length > 0 ? (
          <>
            <Text style={[s.breakTitle, { color: t.subtext }]}>NEED A BREAK FROM THE PHONE?</Text>
            {redirectHobbies.map((h) => (
              <TouchableOpacity
                key={h.id}
                style={[s.breakBtn, { borderColor: C.clay, backgroundColor: t.card }]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('GrowTab', { screen: 'HobbyDetail', params: { hobby: h } })}
              >
                <Icon name={getHobbyIcon(h.name)} size={16} color={C.clay} />
                <Text style={[s.breakText, { color: C.clay }]}>{h.name} instead?</Text>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <TouchableOpacity
            style={[s.noHobbiesHint, { borderColor: C.clay, backgroundColor: t.card }]}
            onPress={() => navigation.navigate('GrowTab')}
            activeOpacity={0.7}
          >
            <Icon name="plus-circle" size={16} color={C.clay} />
            <Text style={[s.noHobbiesText, { color: C.clay }]}>Add hobbies in Grow — they'll appear here as offline alternatives →</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* Log today modal */}
      <Modal visible={showLog} transparent animationType="slide" onRequestClose={() => setShowLog(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: t.card }]}>
            <Text style={[s.modalTitle, { color: t.text }]}>How long was your screen time today?</Text>
            <View style={s.timeInputRow}>
              <View style={s.timeInputBlock}>
                <TextInput
                  style={[s.timeInput, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={t.subtext}
                  value={logHours}
                  onChangeText={setLogHours}
                  maxLength={2}
                  autoFocus
                />
                <Text style={[s.timeUnit, { color: t.subtext }]}>hours</Text>
              </View>
              <Text style={[s.timeSep, { color: t.subtext }]}>:</Text>
              <View style={s.timeInputBlock}>
                <TextInput
                  style={[s.timeInput, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
                  keyboardType="number-pad"
                  placeholder="00"
                  placeholderTextColor={t.subtext}
                  value={logMinutes}
                  onChangeText={setLogMinutes}
                  maxLength={2}
                />
                <Text style={[s.timeUnit, { color: t.subtext }]}>mins</Text>
              </View>
            </View>
            <Text style={[s.modalHint, { color: t.subtext }]}>
              iPhone: Settings → Screen Time → see "All Activity". Android: Settings → Digital Wellbeing. Enter your total from today.
            </Text>
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.modalCancel, { borderColor: t.border }]} onPress={() => setShowLog(false)}>
                <Text style={[s.modalCancelText, { color: t.subtext }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalSave, { opacity: (parseInt(logHours || '0') + parseInt(logMinutes || '0')) > 0 ? 1 : 0.4 }]}
                onPress={handleLog}
              >
                <Text style={s.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Goal edit modal */}
      <Modal visible={showGoalEdit} transparent animationType="slide" onRequestClose={() => setShowGoalEdit(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: t.card }]}>
            <Text style={[s.modalTitle, { color: t.text }]}>Set your daily screen time goal</Text>
            <View style={s.timeInputRow}>
              <View style={s.timeInputBlock}>
                <TextInput
                  style={[s.timeInput, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
                  keyboardType="number-pad"
                  placeholder="2"
                  placeholderTextColor={t.subtext}
                  value={goalHours}
                  onChangeText={setGoalHours}
                  maxLength={2}
                  autoFocus
                />
                <Text style={[s.timeUnit, { color: t.subtext }]}>hours</Text>
              </View>
              <Text style={[s.timeSep, { color: t.subtext }]}>:</Text>
              <View style={s.timeInputBlock}>
                <TextInput
                  style={[s.timeInput, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
                  keyboardType="number-pad"
                  placeholder="00"
                  placeholderTextColor={t.subtext}
                  value={goalMins}
                  onChangeText={setGoalMins}
                  maxLength={2}
                />
                <Text style={[s.timeUnit, { color: t.subtext }]}>mins</Text>
              </View>
            </View>
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.modalCancel, { borderColor: t.border }]} onPress={() => setShowGoalEdit(false)}>
                <Text style={[s.modalCancelText, { color: t.subtext }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSave} onPress={handleSaveGoal}>
                <Text style={s.modalSaveText}>Save goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingHorizontal: 22, paddingTop: 22 },

  title: {
    fontSize: 30, fontWeight: '800', lineHeight: 38, marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined,
  },
  sub: { fontSize: 14, lineHeight: 22, marginBottom: 24 },

  bloomCard: {
    borderRadius: 18, borderWidth: 1.5, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  bloomCardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  autoBadge:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  autoDot:          { width: 6, height: 6, borderRadius: 3 },
  autoBadgeText:    { fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  bloomCardLabel:   { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  bloomCardTime:    { fontSize: 44, fontWeight: '800', lineHeight: 52, marginBottom: 4 },
  bloomCardHint:    { fontSize: 12, lineHeight: 18 },

  todayCard: {
    borderRadius: 18, borderWidth: 1, padding: 20, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  todayHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  todayLabel:   { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  todayTime:    { fontSize: 38, fontWeight: '800', lineHeight: 44 },
  goalLine:     { fontSize: 12, marginTop: 2 },
  logBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 9, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5,
  },
  logBtnText:    { fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill:  { height: 6, borderRadius: 3 },
  progressNote:  { fontSize: 12, fontWeight: '600' },

  chartCard: {
    borderRadius: 18, borderWidth: 1, padding: 20, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  chartTitle:  { fontSize: 15, fontWeight: '700' },
  avgBadge:    { fontSize: 11, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  barsRow:     { flexDirection: 'row', alignItems: 'flex-end', height: 100 },
  barCol:      { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barWrap:     { width: '80%', height: 70, justifyContent: 'flex-end', position: 'relative' },
  bar:         { width: '100%', borderRadius: 4 },
  goalMarker:  {
    position: 'absolute', left: '-10%', right: '-10%', height: 0,
    borderTopWidth: 1, borderStyle: 'dashed', opacity: 0.4,
  },
  barLabel:  { fontSize: 9, marginTop: 5 },
  barVal:    { fontSize: 9, marginTop: 1 },
  chartEmpty: { fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },

  goalCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  goalIcon:      { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  goalCardLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 2 },
  goalCardValue: { fontSize: 18, fontWeight: '800' },

  insightCard: {
    paddingLeft: 16, paddingRight: 14, paddingVertical: 14,
    borderLeftWidth: 3, borderWidth: 1, borderRadius: 14,
    marginBottom: 24,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  insightLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.3, marginBottom: 8 },
  insightText:  { fontSize: 14, lineHeight: 22 },

  breakTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },
  breakBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: 20,
    paddingVertical: 14, paddingHorizontal: 20, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  breakText: { fontSize: 15, fontWeight: '600' },

  noHobbiesHint: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 14, padding: 16,
  },
  noHobbiesText: { flex: 1, fontSize: 13, lineHeight: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 44,
  },
  modalTitle:  { fontSize: 17, fontWeight: '700', marginBottom: 20 },
  timeInputRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  timeInputBlock: { flex: 1, alignItems: 'center' },
  timeInput: {
    width: '100%', textAlign: 'center',
    fontSize: 28, fontWeight: '800',
    borderWidth: 1.5, borderRadius: 14,
    paddingVertical: 14,
  },
  timeUnit: { fontSize: 12, marginTop: 6, fontWeight: '600' },
  timeSep:  { fontSize: 28, fontWeight: '300', paddingBottom: 20 },
  modalHint:       { fontSize: 12, lineHeight: 18, marginBottom: 20, fontStyle: 'italic' },
  modalActions:    { flexDirection: 'row', gap: 10 },
  modalCancel: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    borderWidth: 1.5, alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600' },
  modalSave: {
    flex: 2, paddingVertical: 13, borderRadius: 12,
    backgroundColor: C.moss, alignItems: 'center',
  },
  modalSaveText: { fontSize: 14, fontWeight: '700', color: C.white },
});
