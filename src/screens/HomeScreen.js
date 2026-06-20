import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
  SafeAreaView, StyleSheet,
} from 'react-native';
import { C } from '../constants/colors';
import { NUDGE_MESSAGES } from '../constants/data';
import { useApp } from '../context/AppContext';
import TaskRow from '../components/TaskRow';
import IdeaCaptureModal from '../components/IdeaCaptureModal';
import DistractionModal from '../components/DistractionModal';
import BuddyAvatar from '../components/BuddyAvatar';
import BrainDumpModal from '../components/BrainDumpModal';
import HobbyModeModal from '../components/HobbyModeModal';

const PRIORITY_CFG = {
  high:   { label: 'High',   text: C.peach, bg: C.peachLight },
  medium: { label: 'Medium', text: C.sage,  bg: C.sageLight  },
  low:    { label: 'Low',    text: C.muted, bg: '#EDEBE7'    },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

export default function HomeScreen({ navigation }) {
  const {
    buddy, momentum,
    tasks, addTask, toggleTask,
    ideas, saveIdea, promoteIdea, deleteIdea, dismissSurfacedIdea,
    selectedHobbies, hobbyProgress,
  } = useApp();

  const [inputText, setInputText]       = useState('');
  const [priority, setPriority]         = useState('medium');
  const [showCapture, setShowCapture]   = useState(false);
  const [showDistract, setShowDistract] = useState(false);
  const [showDump, setShowDump]         = useState(false);
  const [showHobby, setShowHobby]       = useState(false);
  const [dumpDismissed, setDumpDismissed] = useState(false);
  const hobbyShownRef                   = useRef(false);
  const [toast, setToast]               = useState(null);
  const [nudge]                         = useState(() => NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)]);
  const inputRef                        = useRef(null);
  const isMorning = new Date().getHours() < 12;

  const pendingTasks = tasks.filter(t => !t.done);
  const pendingCount = pendingTasks.length;
  const allDone      = tasks.length > 0 && pendingCount === 0;
  const surfaceIdea  = allDone ? ideas.find(i => !i.surfaced) : null;

  const handleToggleTask = (id) => {
    toggleTask(id);
    // Show hobby modal once when all tasks become done
    const afterToggle = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    const stillPending = afterToggle.filter(t => !t.done).length;
    if (stillPending === 0 && afterToggle.length > 0 && !hobbyShownRef.current) {
      hobbyShownRef.current = true;
      setTimeout(() => setShowHobby(true), 600);
    }
  };

  const handleAddTask = () => {
    const text = inputText.trim();
    if (!text) return;
    const count = addTask(text, priority);
    setInputText('');
    inputRef.current?.blur();
    if (count === 3) setTimeout(() => setShowCapture(true), 400);
  };

  const handleDumpDone = ({ tasks: dumpTasks, ideas: dumpIdeas }) => {
    dumpTasks.forEach(t => addTask(t, 'medium'));
    dumpIdeas.forEach(idea => saveIdea(idea, "When you have some free time, explore this!"));
    setShowDump(false);
    setDumpDismissed(true);
  };

  const handleSaveIdea = (text, returnCondition) => {
    saveIdea(text, returnCondition);
    setShowCapture(false);
    setToast(returnCondition);
    setTimeout(() => setToast(null), 3500);
  };

  const handleStartSprint = (task) => {
    navigation.navigate('Sprint', { task });
  };

  const handleAlternative = () => {
    setShowDistract(false);
    navigation.navigate('Grow');
  };

  return (
    <SafeAreaView style={s.safe}>
      <IdeaCaptureModal
        visible={showCapture}
        hasPendingTasks={pendingCount > 0}
        onSave={handleSaveIdea}
        onDismiss={() => setShowCapture(false)}
      />
      <DistractionModal
        visible={showDistract}
        pendingTask={pendingTasks[0]}
        onStartTask={() => {
          setShowDistract(false);
          if (pendingTasks[0]) handleStartSprint(pendingTasks[0]);
        }}
        onAlternative={handleAlternative}
        onIgnore={() => setShowDistract(false)}
      />
      <BrainDumpModal
        visible={showDump}
        onDone={handleDumpDone}
        onDismiss={() => { setShowDump(false); setDumpDismissed(true); }}
      />
      <HobbyModeModal
        visible={showHobby}
        selectedHobbies={selectedHobbies}
        hobbyProgress={hobbyProgress}
        surfacedIdea={ideas.find(i => !i.surfaced) ?? null}
        onStartHobby={(id) => { setShowHobby(false); navigation.navigate('Grow'); }}
        onExploreIdea={(idea) => { promoteIdea(idea); setShowHobby(false); }}
        onDismiss={() => setShowHobby(false)}
      />

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={s.flex}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={s.headerRow}>
            <TouchableOpacity style={s.distractBtn} onPress={() => setShowDistract(true)}>
              <Text style={s.distractEmoji}>🌀</Text>
              <Text style={s.distractLabel}>Distracted?</Text>
            </TouchableOpacity>

            <View style={s.buddyCenter}>
              <BuddyAvatar buddy={buddy} momentum={momentum} size={76} />
              <Text style={s.buddyName}>{buddy?.name ?? 'Buddy'}</Text>
            </View>

            <TouchableOpacity style={s.ideaBtn} onPress={() => setShowCapture(true)}>
              <Text style={s.ideaEmoji}>💡</Text>
              <Text style={s.ideaLabel}>Idea</Text>
            </TouchableOpacity>
          </View>

          {/* ── Greeting ── */}
          <Text style={s.greetingBig}>{greeting()}!</Text>
          <Text style={s.greetingSub}>What matters today?</Text>

          {/* ── Morning brain dump card ── */}
          {isMorning && !dumpDismissed && (
            <TouchableOpacity style={s.dumpCard} onPress={() => setShowDump(true)}>
              <View style={s.dumpLeft}>
                <Text style={s.dumpEmoji}>🧠</Text>
                <View>
                  <Text style={s.dumpTitle}>Morning brain dump</Text>
                  <Text style={s.dumpSub}>Clear your head — type or dictate</Text>
                </View>
              </View>
              <Text style={s.dumpArrow}>→</Text>
            </TouchableOpacity>
          )}

          {/* ── Section ── */}
          <View style={s.sectionRow}>
            <Text style={s.sectionLabel}>TODAY'S FOCUS</Text>
            <View style={s.sectionRight}>
              {pendingCount > 0 && (
                <View style={s.countBubble}>
                  <Text style={s.countText}>{pendingCount}</Text>
                </View>
              )}
              {ideas.length > 0 && (
                <TouchableOpacity style={s.ideaPill} onPress={() => navigation.navigate('IdeaBank')}>
                  <Text style={s.ideaPillText}>💡 {ideas.length}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {tasks.length === 0 ? (
            <Text style={s.empty}>Nothing here yet — add your first task below!</Text>
          ) : (
            tasks.map(t => (
              <TaskRow
                key={t.id}
                task={t}
                onToggle={() => handleToggleTask(t.id)}
                onStartSprint={handleStartSprint}
              />
            ))
          )}

          {/* ── Add task ── */}
          <View style={s.addCard}>
            <View style={s.inputRow}>
              <TextInput
                ref={inputRef}
                style={s.input}
                placeholder="Add a task…"
                placeholderTextColor={C.muted}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleAddTask}
                returnKeyType="done"
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[s.addBtn, !inputText.trim() && s.addBtnOff]}
                onPress={handleAddTask}
                disabled={!inputText.trim()}
              >
                <Text style={s.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
            <View style={s.priorityRow}>
              <Text style={s.priorityLabel}>Priority</Text>
              {['high', 'medium', 'low'].map(p => {
                const cfg = PRIORITY_CFG[p];
                const active = priority === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[s.chip, { borderColor: active ? cfg.text : C.border }, active && { backgroundColor: cfg.bg }]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[s.chipText, { color: active ? cfg.text : C.muted }]}>
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Toast ── */}
          {toast && (
            <View style={s.toast}>
              <Text style={s.toastEmoji}>🌿</Text>
              <Text style={s.toastText}>Saved! {toast}</Text>
            </View>
          )}

          {/* ── Resurfaced idea ── */}
          {surfaceIdea && (
            <View style={[s.nudgeCard, s.resurface]}>
              <View style={s.nudgeTop}>
                <Text style={s.nudgeIcon}>💡</Text>
                <Text style={[s.nudgeTitle, { color: C.sage }]}>Remember this?</Text>
              </View>
              <Text style={s.nudgeBody}>"{surfaceIdea.text}"</Text>
              <Text style={s.resurfaceSub}>You saved this earlier. Want to explore it now?</Text>
              <View style={s.resurfaceRow}>
                <TouchableOpacity style={[s.nudgeBtn, { backgroundColor: C.sage }]} onPress={() => promoteIdea(surfaceIdea)}>
                  <Text style={s.nudgeBtnText}>Add as task →</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.laterBtn} onPress={() => dismissSurfacedIdea(surfaceIdea.id)}>
                  <Text style={s.laterText}>Maybe later</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Gentle nudge ── */}
          {!surfaceIdea && (
            <View style={s.nudgeCard}>
              <View style={s.nudgeTop}>
                <Text style={s.nudgeIcon}>🌱</Text>
                <Text style={s.nudgeTitle}>Gentle Nudge</Text>
              </View>
              <Text style={s.nudgeBody}>{nudge}</Text>
              <TouchableOpacity
                style={s.nudgeBtn}
                onPress={() => pendingTasks[0] && handleStartSprint(pendingTasks[0])}
              >
                <Text style={s.nudgeBtnText}>Let's begin →</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: C.cream },
  scroll: { paddingHorizontal: 22, paddingTop: 14 },

  headerRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 20,
  },
  buddyCenter: { alignItems: 'center' },
  buddyName: { fontSize: 11, fontWeight: '700', color: C.sage, marginTop: 6, letterSpacing: 1.4, textTransform: 'uppercase' },

  distractBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F5F0EB', borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10, width: 60,
  },
  distractEmoji: { fontSize: 18 },
  distractLabel: { fontSize: 9, fontWeight: '700', color: C.muted, marginTop: 2, letterSpacing: 0.5 },

  ideaBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.peachPale, borderWidth: 1.5, borderColor: C.peachLight,
    borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10, width: 60,
  },
  ideaEmoji: { fontSize: 18 },
  ideaLabel: { fontSize: 9, fontWeight: '700', color: C.peach, marginTop: 2, letterSpacing: 0.5 },

  greetingBig: { fontSize: 30, fontWeight: '700', color: C.forest, letterSpacing: -0.5 },
  greetingSub: { fontSize: 17, color: C.sage, marginTop: 4, marginBottom: 24 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1.8 },
  sectionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countBubble: { backgroundColor: C.sage, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 11, fontWeight: '700', color: C.white },
  ideaPill: { backgroundColor: C.peachPale, borderWidth: 1, borderColor: C.peachLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  ideaPillText: { fontSize: 12, fontWeight: '600', color: C.peach },

  empty: { fontSize: 15, color: C.muted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 20 },

  dumpCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.white, borderRadius: 16, padding: 16,
    marginBottom: 18, borderWidth: 1.5, borderColor: C.sageLight,
  },
  dumpLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dumpEmoji: { fontSize: 28 },
  dumpTitle: { fontSize: 15, fontWeight: '700', color: C.forest, marginBottom: 2 },
  dumpSub: { fontSize: 12, color: C.muted },
  dumpArrow: { fontSize: 18, color: C.sage, fontWeight: '700' },

  addCard: {
    backgroundColor: C.white, borderRadius: 16, padding: 14,
    marginTop: 6, marginBottom: 18, borderWidth: 1, borderColor: C.border,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  input: {
    flex: 1, backgroundColor: C.cream, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 13, fontSize: 15, color: C.forest,
  },
  addBtn: { backgroundColor: C.sage, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  addBtnOff: { opacity: 0.35 },
  addBtnText: { color: C.white, fontWeight: '700', fontSize: 15 },
  priorityRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  priorityLabel: { fontSize: 12, color: C.muted, fontWeight: '500', marginRight: 2 },
  chip: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontSize: 12, fontWeight: '600' },

  toast: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.sagePale, borderRadius: 12, padding: 14,
    marginBottom: 14, borderWidth: 1, borderColor: C.sageLight,
  },
  toastEmoji: { fontSize: 18, marginRight: 10 },
  toastText: { flex: 1, fontSize: 14, color: C.forest, lineHeight: 20 },

  nudgeCard: {
    backgroundColor: C.peachPale, borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: C.peachLight, marginBottom: 10,
  },
  resurface: { backgroundColor: C.sagePale, borderColor: C.sageLight },
  nudgeTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  nudgeIcon: { fontSize: 20, marginRight: 8 },
  nudgeTitle: { fontSize: 12, fontWeight: '700', color: C.peach, letterSpacing: 0.8, textTransform: 'uppercase' },
  nudgeBody: { fontSize: 16, color: C.forest, lineHeight: 25, marginBottom: 14 },
  nudgeBtn: {
    alignSelf: 'flex-end', backgroundColor: C.peach,
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 22,
  },
  nudgeBtnText: { color: C.white, fontWeight: '700', fontSize: 14 },
  resurfaceSub: { fontSize: 13, color: C.muted, marginBottom: 14 },
  resurfaceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  laterBtn: { paddingVertical: 8 },
  laterText: { fontSize: 14, color: C.muted },
});
