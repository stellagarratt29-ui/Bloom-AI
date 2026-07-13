import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Modal, Platform, ActivityIndicator,
  TextInput, SafeAreaView,
} from 'react-native';
import Icon from '../components/Icon';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import {
  rankTasksForDowntime, taskReason, taskReasonAI,
  getSnoozed, snoozeTask, pickHobbyActivity,
  getStruggleWindows, saveStruggleWindows,
  getDistractionApps, saveDistractionApps,
} from '../services/downtime';

const TIME_OPTIONS = [
  { label: '5 min',  value: 5  },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hr',   value: 60 },
  { label: 'Any',    value: null },
];

const SECTION_LABELS = { high: 'School & Health', medium: 'Tasks', low: 'Fun & Leisure' };

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
  return 'star';
}

// ── Struggle Window Picker ───────────────────────────────────────────────────

function parseHHMM(str) {
  const [h, m] = (str || '').split(':').map(Number);
  if (isNaN(h)) return null;
  return h * 60 + (m || 0);
}

function WindowEditor({ onClose }) {
  const { colors: t } = useTheme();
  const [windows, setWindows]   = useState([]);
  const [apps, setApps]         = useState([]);
  const [newApp, setNewApp]     = useState('');
  const [newStart, setNewStart] = useState('21:00');
  const [newEnd, setNewEnd]     = useState('23:00');

  useEffect(() => {
    getStruggleWindows().then(setWindows);
    getDistractionApps().then(setApps);
  }, []);

  const addWindow = () => {
    const s = parseHHMM(newStart);
    const e = parseHHMM(newEnd);
    if (s === null || e === null) return;
    const updated = [...windows, { startHHMM: s, endHHMM: e, label: `${newStart}–${newEnd}` }];
    setWindows(updated);
    saveStruggleWindows(updated);
  };

  const removeWindow = (i) => {
    const updated = windows.filter((_, idx) => idx !== i);
    setWindows(updated);
    saveStruggleWindows(updated);
  };

  const addApp = () => {
    const name = newApp.trim();
    if (!name || apps.includes(name)) return;
    const updated = [...apps, name];
    setApps(updated);
    saveDistractionApps(updated);
    setNewApp('');
  };

  const removeApp = (app) => {
    const updated = apps.filter(a => a !== app);
    setApps(updated);
    saveDistractionApps(updated);
  };

  return (
    <SafeAreaView style={[we.safe, { backgroundColor: t.bg }]}>
      <View style={[we.header, { borderBottomColor: t.border }]}>
        <Text style={[we.title, { color: t.text }]}>Struggle settings</Text>
        <TouchableOpacity onPress={onClose} style={we.closeBtn}>
          <Icon name="x" size={22} color={t.subtext} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={we.scroll}>

        <Text style={[we.sectionHead, { color: t.subtext }]}>STRUGGLE WINDOWS</Text>
        <Text style={[we.sectionSub, { color: t.subtext }]}>Times when you tend to reach for a distraction app. Bloom will surface task suggestions proactively during these windows.</Text>

        {windows.map((w, i) => (
          <View key={i} style={[we.chip, { backgroundColor: C.clayPale, borderColor: C.clay }]}>
            <Icon name="clock" size={14} color={C.clay} />
            <Text style={[we.chipText, { color: C.clayDark }]}>{w.label}</Text>
            <TouchableOpacity onPress={() => removeWindow(i)}>
              <Icon name="x" size={14} color={C.clay} />
            </TouchableOpacity>
          </View>
        ))}

        <View style={[we.addRow, { backgroundColor: t.card, borderColor: t.border }]}>
          <TextInput
            style={[we.timeInput, { color: t.text, borderColor: t.border }]}
            value={newStart} onChangeText={setNewStart} placeholder="21:00"
            placeholderTextColor={t.subtext}
          />
          <Text style={[we.dash, { color: t.subtext }]}>–</Text>
          <TextInput
            style={[we.timeInput, { color: t.text, borderColor: t.border }]}
            value={newEnd} onChangeText={setNewEnd} placeholder="23:00"
            placeholderTextColor={t.subtext}
          />
          <TouchableOpacity style={[we.addBtn, { backgroundColor: C.moss }]} onPress={addWindow}>
            <Icon name="plus" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={[we.sectionHead, { color: t.subtext, marginTop: 28 }]}>DISTRACTION APPS</Text>
        <Text style={[we.sectionSub, { color: t.subtext }]}>Apps you tend to open instead of doing things. Bloom can't intercept them automatically yet — but knowing you've named them helps you catch yourself.</Text>

        <View style={we.appChips}>
          {apps.map(app => (
            <View key={app} style={[we.chip, { backgroundColor: C.sagePale, borderColor: C.sage }]}>
              <Text style={[we.chipText, { color: t.text }]}>{app}</Text>
              <TouchableOpacity onPress={() => removeApp(app)}>
                <Icon name="x" size={14} color={t.subtext} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={[we.addRow, { backgroundColor: t.card, borderColor: t.border }]}>
          <TextInput
            style={[we.appInput, { color: t.text }]}
            value={newApp} onChangeText={setNewApp}
            placeholder="e.g. TikTok, Netflix, Instagram"
            placeholderTextColor={t.subtext}
            returnKeyType="done" onSubmitEditing={addApp}
          />
          <TouchableOpacity style={[we.addBtn, { backgroundColor: C.moss }]} onPress={addApp}>
            <Icon name="plus" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={[we.noteCard, { backgroundColor: C.skyWash, borderColor: C.sky }]}>
          <Icon name="info" size={14} color={C.skyDark} />
          <Text style={[we.noteText, { color: C.skyDark }]}>
            Full Screen Time interception (showing this screen BEFORE you open another app) requires a native iOS build. It's on the roadmap.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Main Downtime Sheet ──────────────────────────────────────────────────────

export default function DowntimeSheet({ visible, onClose }) {
  const { tasks, toggleTask, hobbies } = useApp();
  const { colors: t } = useTheme();

  const [timeMins,       setTimeMins]       = useState(null);   // selected time limit
  const [suggestions,    setSuggestions]    = useState([]);
  const [reasons,        setReasons]        = useState({});
  const [loading,        setLoading]        = useState(false);
  const [tier,           setTier]           = useState('tasks'); // 'tasks' | 'hobby'
  const [hobbyPick,      setHobbyPick]      = useState(null);
  const [showSettings,   setShowSettings]   = useState(false);
  const [snoozed,        setSnoozed]        = useState({});

  const load = useCallback(async (mins) => {
    setLoading(true);
    const sn = await getSnoozed();
    setSnoozed(sn);
    const ranked = rankTasksForDowntime(tasks, mins, sn);
    setSuggestions(ranked);
    // Async-load AI reasons
    const r = {};
    ranked.forEach(task => { r[task.id] = taskReason(task); });
    setReasons(r);
    setLoading(false);
    // Fire AI reasons in parallel
    ranked.forEach(async task => {
      const aiReason = await taskReasonAI(task, mins);
      setReasons(prev => ({ ...prev, [task.id]: aiReason }));
    });
  }, [tasks]);

  useEffect(() => {
    if (visible) { setTier('tasks'); setTimeMins(null); setSuggestions([]); }
  }, [visible]);

  const handleSelectTime = (mins) => {
    setTimeMins(mins);
    load(mins);
  };

  const handleDone = (task) => {
    toggleTask(task.id);
    setSuggestions(prev => prev.filter(t => t.id !== task.id));
  };

  const handleSnooze = async (task) => {
    await snoozeTask(task.id, 30);
    setSuggestions(prev => prev.filter(t => t.id !== task.id));
  };

  const handleNext = () => load(timeMins);

  const handleNoneFit = () => {
    const hobby = pickHobbyActivity(hobbies);
    setHobbyPick(hobby);
    setTier('hobby');
  };

  if (showSettings) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <WindowEditor onClose={() => setShowSettings(false)} />
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>
        {/* Header */}
        <View style={[s.header, { borderBottomColor: t.border }]}>
          <View>
            <Text style={[s.headerTitle, { color: t.text }]}>
              {tier === 'hobby' ? 'Hobby Mode' : 'Free moment?'}
            </Text>
            <Text style={[s.headerSub, { color: t.subtext }]}>
              {tier === 'hobby'
                ? 'Tasks are done — time to create.'
                : 'Pick a quick win from your list.'}
            </Text>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.settingsBtn} onPress={() => setShowSettings(true)}>
              <Icon name="settings" size={18} color={t.subtext} />
            </TouchableOpacity>
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Icon name="x" size={20} color={t.subtext} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Tier 1: Tasks ── */}
          {tier === 'tasks' && (
            <>
              {/* Time selector */}
              {!timeMins && (
                <>
                  <Text style={[s.promptText, { color: t.text }]}>How much time do you have?</Text>
                  <View style={s.timeRow}>
                    {TIME_OPTIONS.map(opt => (
                      <TouchableOpacity
                        key={opt.label}
                        style={[s.timeChip, { borderColor: t.border, backgroundColor: t.card }]}
                        onPress={() => handleSelectTime(opt.value)}
                        activeOpacity={0.75}
                      >
                        <Text style={[s.timeChipText, { color: t.text }]}>{opt.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Selected time label */}
              {timeMins && (
                <View style={s.selectedTimeRow}>
                  <TouchableOpacity onPress={() => { setTimeMins(null); setSuggestions([]); }}>
                    <Icon name="chevron-left" size={16} color={t.subtext} />
                  </TouchableOpacity>
                  <Text style={[s.selectedTimeText, { color: t.subtext }]}>
                    {timeMins ? `${timeMins} min window` : 'Any amount of time'}
                  </Text>
                </View>
              )}

              {/* Loading */}
              {loading && <ActivityIndicator color={C.moss} style={{ marginTop: 32 }} />}

              {/* Suggestions */}
              {!loading && suggestions.length > 0 && (
                <>
                  {suggestions.map(task => (
                    <View key={task.id} style={[s.taskCard, { backgroundColor: t.card, borderColor: t.border }]}>
                      <View style={[s.effortDot, { backgroundColor: task._effort <= 10 ? C.moss : task._effort <= 25 ? C.clay : C.sage }]} />
                      <View style={s.taskCardBody}>
                        <Text style={[s.taskText, { color: t.text }]}>{task.text}</Text>
                        <Text style={[s.taskReason, { color: t.subtext }]}>{reasons[task.id]}</Text>
                      </View>
                      <View style={s.taskActions}>
                        <TouchableOpacity style={[s.doneBtn, { backgroundColor: C.moss }]} onPress={() => handleDone(task)}>
                          <Icon name="check" size={14} color="#fff" />
                          <Text style={s.doneBtnText}>Done</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.snoozeBtn, { borderColor: t.border }]} onPress={() => handleSnooze(task)}>
                          <Text style={[s.snoozeBtnText, { color: t.subtext }]}>30m</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  <View style={s.bottomActions}>
                    <TouchableOpacity style={[s.nextBtn, { borderColor: t.border }]} onPress={handleNext}>
                      <Icon name="refresh-cw" size={14} color={t.subtext} />
                      <Text style={[s.nextBtnText, { color: t.subtext }]}>Different suggestions</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.noneBtn} onPress={handleNoneFit}>
                      <Text style={[s.noneBtnText, { color: t.subtext }]}>None of these fit →</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* No tasks fit */}
              {!loading && timeMins && suggestions.length === 0 && (
                <View style={s.emptyState}>
                  <Icon name="check-circle" size={36} color={C.moss} />
                  <Text style={[s.emptyHead, { color: t.text }]}>
                    {tasks.filter(tk => !tk.done).length === 0
                      ? 'All tasks done!'
                      : 'Nothing fits that time window.'}
                  </Text>
                  <Text style={[s.emptySub, { color: t.subtext }]}>
                    {tasks.filter(tk => !tk.done).length === 0
                      ? "Your list is clear. Switch to Hobby Mode?"
                      : 'Try a wider time window, or switch to Hobby Mode.'}
                  </Text>
                  <TouchableOpacity
                    style={[s.hobbyModeBtn, { backgroundColor: C.clay }]}
                    onPress={handleNoneFit}
                  >
                    <Icon name="feather" size={15} color="#fff" />
                    <Text style={s.hobbyModeBtnText}>Open Hobby Mode</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* ── Tier 2: Hobby Mode ── */}
          {tier === 'hobby' && (
            <>
              <View style={[s.hobbyGate, { backgroundColor: C.clayPale, borderColor: C.clay }]}>
                <Icon name="feather" size={20} color={C.clay} />
                <Text style={[s.hobbyGateText, { color: C.clayDark }]}>
                  Hobby Mode unlocked — tasks have been offered first.
                </Text>
              </View>

              {hobbyPick ? (
                <View style={[s.hobbyCard, { backgroundColor: t.card, borderColor: t.border }]}>
                  <View style={[s.hobbyIconBox, { backgroundColor: C.clayPale }]}>
                    <Icon name={getHobbyIcon(hobbyPick.name)} size={24} color={C.clay} />
                  </View>
                  <Text style={[s.hobbyName, { color: t.text }]}>{hobbyPick.name}</Text>
                  {hobbyPick.currentMilestone ? (
                    <>
                      <Text style={[s.hobbyMilestoneLabel, { color: t.subtext }]}>NEXT MILESTONE</Text>
                      <Text style={[s.hobbyMilestone, { color: t.text }]}>{hobbyPick.currentMilestone}</Text>
                    </>
                  ) : (
                    <Text style={[s.hobbyMilestone, { color: t.subtext }]}>Pick up where you left off.</Text>
                  )}
                </View>
              ) : (
                <View style={s.emptyState}>
                  <Icon name="sun" size={36} color={C.clay} />
                  <Text style={[s.emptyHead, { color: t.text }]}>No hobbies set up yet.</Text>
                  <Text style={[s.emptySub, { color: t.subtext }]}>Add some in the Grow tab and they'll show here.</Text>
                </View>
              )}

              <TouchableOpacity
                style={[s.backToTasks, { borderColor: t.border }]}
                onPress={() => { setTier('tasks'); setSuggestions([]); setTimeMins(null); }}
              >
                <Icon name="arrow-left" size={14} color={t.subtext} />
                <Text style={[s.backToTasksText, { color: t.subtext }]}>Back to task suggestions</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:      { flex: 1 },
  header:    { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 20, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '700', fontFamily: 'Georgia', marginBottom: 2 },
  headerSub:   { fontSize: 13 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingsBtn: { padding: 6 },
  closeBtn:    { padding: 6 },
  scroll:      { padding: 20, gap: 12 },
  promptText:  { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  timeRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip:    { borderRadius: 10, borderWidth: 1.5, paddingVertical: 10, paddingHorizontal: 18 },
  timeChipText:{ fontSize: 14, fontWeight: '600' },
  selectedTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  selectedTimeText:{ fontSize: 13 },

  taskCard:    { borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  effortDot:   { width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0 },
  taskCardBody:{ flex: 1, gap: 4 },
  taskText:    { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  taskReason:  { fontSize: 12, lineHeight: 17 },
  taskActions: { flexDirection: 'column', gap: 6, flexShrink: 0 },
  doneBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  doneBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  snoozeBtn:   { borderRadius: 8, borderWidth: 1.5, paddingVertical: 6, paddingHorizontal: 10, alignItems: 'center' },
  snoozeBtnText:{ fontSize: 12, fontWeight: '600' },

  bottomActions:{ gap: 6, marginTop: 4 },
  nextBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, borderWidth: 1.5, paddingVertical: 10, paddingHorizontal: 14 },
  nextBtnText: { fontSize: 13, fontWeight: '500' },
  noneBtn:     { paddingVertical: 8, alignItems: 'center' },
  noneBtnText: { fontSize: 13 },

  emptyState:  { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyHead:   { fontSize: 17, fontWeight: '700' },
  emptySub:    { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  hobbyModeBtn:{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, marginTop: 8 },
  hobbyModeBtnText:{ color: '#fff', fontSize: 14, fontWeight: '700' },

  hobbyGate:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1.5, padding: 12 },
  hobbyGateText:{ flex: 1, fontSize: 13, fontWeight: '500' },
  hobbyCard:   { borderRadius: 16, borderWidth: 1, padding: 20, gap: 10, alignItems: 'center' },
  hobbyIconBox:{ width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  hobbyName:   { fontSize: 20, fontWeight: '700', fontFamily: 'Georgia' },
  hobbyMilestoneLabel:{ fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  hobbyMilestone:{ fontSize: 15, lineHeight: 22, textAlign: 'center' },
  backToTasks: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, borderWidth: 1.5, paddingVertical: 10, paddingHorizontal: 14 },
  backToTasksText:{ fontSize: 13, fontWeight: '500' },
});

const we = StyleSheet.create({
  safe:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
  title:       { fontSize: 18, fontWeight: '700' },
  closeBtn:    { padding: 6 },
  scroll:      { padding: 20, gap: 8 },
  sectionHead: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 8 },
  sectionSub:  { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  chip:        { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 20, borderWidth: 1.5, paddingVertical: 6, paddingHorizontal: 12, marginBottom: 6 },
  chipText:    { fontSize: 13, fontWeight: '600' },
  appChips:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  addRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, padding: 10 },
  timeInput:   { width: 70, fontSize: 15, fontWeight: '600', borderBottomWidth: 1, paddingBottom: 2, textAlign: 'center' },
  dash:        { fontSize: 16 },
  appInput:    { flex: 1, fontSize: 14 },
  addBtn:      { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  noteCard:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, borderWidth: 1.5, padding: 12, marginTop: 16 },
  noteText:    { flex: 1, fontSize: 12, lineHeight: 17 },
});
