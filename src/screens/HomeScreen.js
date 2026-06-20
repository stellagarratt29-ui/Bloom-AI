import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
  SafeAreaView, StyleSheet,
} from 'react-native';
import { C } from '../constants/colors';
import { NUDGE_MESSAGES, DAILY_TIPS, HOBBIES } from '../constants/data';
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

function greeting(name) {
  const h = new Date().getHours();
  const base =
    h < 12 ? 'Good morning' :
    h < 17 ? 'Good afternoon' :
    h < 21 ? 'Good evening' : 'Good night';
  return name ? `${base}, ${name}` : base;
}

function greetingSub(pendingCount, doneTasks, allDone) {
  const h = new Date().getHours();
  if (allDone) return "You've done everything — well done today!";
  if (doneTasks > 0 && h >= 17) return `${doneTasks} done so far. Keep that going!`;
  if (h >= 21) return "Rest is part of the process. Take it easy.";
  if (h < 12) return "What matters most today?";
  if (pendingCount > 4) return "Big list — just pick one to start.";
  return "You've got this.";
}

export default function HomeScreen({ navigation }) {
  const {
    buddy, momentum,
    tasks, addTask, toggleTask, deleteTask, clearDoneTasks,
    ideas, saveIdea, promoteIdea, deleteIdea, dismissSurfacedIdea,
    selectedHobbies, hobbyProgress,
    userName, dailyPoints, currentStreak,
    latestMilestone, dismissMilestone,
  } = useApp();

  const [inputText, setInputText]         = useState('');
  const [priority, setPriority]           = useState('medium');
  const [showCapture, setShowCapture]     = useState(false);
  const [showDistract, setShowDistract]   = useState(false);
  const [showDump, setShowDump]           = useState(false);
  const [showHobby, setShowHobby]         = useState(false);
  const [dumpDismissed, setDumpDismissed] = useState(false);
  const [showTip, setShowTip]             = useState(true);
  const [showAllDone, setShowAllDone]     = useState(false);
  const hobbyShownRef                     = useRef(false);
  const [toast, setToast]                 = useState(null);
  const [nudge]                           = useState(() => NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)]);
  const inputRef                          = useRef(null);

  const isMorning = new Date().getHours() < 12;
  const todayTip  = DAILY_TIPS[new Date().getDay()];

  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
  const pendingTasks = tasks
    .filter(t => !t.done)
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1));
  const doneTasks    = tasks.filter(t => t.done);
  const pendingCount = pendingTasks.length;
  const allDone      = tasks.length > 0 && pendingCount === 0;
  const surfaceIdea  = allDone ? ideas.find(i => !i.surfaced) : null;
  const todayPts     = dailyPoints?.[6] ?? 0;

  const handleToggleTask = (id) => {
    const taskBeingToggled = tasks.find(t => t.id === id);
    const willBecomeDone   = taskBeingToggled && !taskBeingToggled.done;
    toggleTask(id);
    if (willBecomeDone) {
      const remainingPending = pendingTasks.filter(t => t.id !== id).length;
      if (remainingPending === 0 && !hobbyShownRef.current) {
        hobbyShownRef.current = true;
        setTimeout(() => setShowHobby(true), 600);
      }
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

  const handleSaveIdea = (text, returnCondition) => {
    saveIdea(text, returnCondition);
    setShowCapture(false);
    setToast(returnCondition);
    setTimeout(() => setToast(null), 3500);
  };

  const handleStartSprint = (task) => navigation.navigate('Sprint', { task });

  const handleAlternative = () => {
    setShowDistract(false);
    navigation.navigate('Grow');
  };

  const handleDumpDone = ({ tasks: dumpTasks, ideas: dumpIdeas }) => {
    dumpTasks.forEach(t => addTask(t, 'medium'));
    dumpIdeas.forEach(idea => saveIdea(idea, "When you have some free time, revisit this!"));
    setShowDump(false);
    setDumpDismissed(true);
    const parts = [];
    if (dumpTasks.length)  parts.push(`${dumpTasks.length} task${dumpTasks.length !== 1 ? 's' : ''} added`);
    if (dumpIdeas.length)  parts.push(`${dumpIdeas.length} idea${dumpIdeas.length !== 1 ? 's' : ''} saved`);
    if (parts.length) {
      setToast(parts.join(' · '));
      setTimeout(() => setToast(null), 3500);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <IdeaCaptureModal
        visible={showCapture}
        hasPendingTasks={pendingCount > 0}
        taskCount={pendingCount}
        onSave={handleSaveIdea}
        onDismiss={() => setShowCapture(false)}
      />
      <DistractionModal
        visible={showDistract}
        pendingTask={pendingTasks[0]}
        onStartTask={() => { setShowDistract(false); if (pendingTasks[0]) handleStartSprint(pendingTasks[0]); }}
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
        onStartHobby={() => { setShowHobby(false); navigation.navigate('Grow'); }}
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
            <TouchableOpacity style={s.headerBtn} onPress={() => setShowDistract(true)}>
              <Text style={s.headerBtnEmoji}>🌀</Text>
              <Text style={s.headerBtnLabel}>Distracted?</Text>
            </TouchableOpacity>

            <View style={s.buddyCenter}>
              <BuddyAvatar buddy={buddy} momentum={momentum} size={76} />
              <Text style={s.buddyName}>{buddy?.name ?? 'Buddy'}</Text>
            </View>

            <TouchableOpacity style={[s.headerBtn, s.ideaBtn]} onPress={() => setShowCapture(true)}>
              <Text style={s.headerBtnEmoji}>💡</Text>
              <Text style={[s.headerBtnLabel, { color: C.peach }]}>Idea</Text>
            </TouchableOpacity>
          </View>

          {/* ── Greeting ── */}
          <View style={s.greetingRow}>
            <Text style={s.greetingBig}>{greeting(userName)}!</Text>
            {(currentStreak ?? 0) >= 2 && (
              <View style={s.streakPill}>
                <Text style={s.streakPillText}>🔥 {currentStreak}</Text>
              </View>
            )}
          </View>
          <Text style={s.greetingSub}>{greetingSub(pendingCount, doneTasks.length, allDone)}</Text>

          {/* ── Milestone celebration ── */}
          {latestMilestone && (
            <View style={s.milestoneCard}>
              <Text style={s.milestoneEmoji}>🏆</Text>
              <View style={s.milestoneText}>
                <Text style={s.milestoneTitle}>{latestMilestone} points reached!</Text>
                <Text style={s.milestoneSub}>You're on a roll — keep going!</Text>
              </View>
              <TouchableOpacity style={s.milestoneDismiss} onPress={dismissMilestone}>
                <Text style={s.milestoneDismissText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Morning brain dump card ── */}
          {isMorning && !dumpDismissed && (
            <TouchableOpacity style={s.dumpCard} onPress={() => setShowDump(true)} activeOpacity={0.85}>
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

          {/* ── Daily tip ── */}
          {showTip && (
            <View style={s.tipCard}>
              <Text style={s.tipEmoji}>{todayTip.emoji}</Text>
              <Text style={s.tipText}>{todayTip.text}</Text>
              <TouchableOpacity style={s.tipClose} onPress={() => setShowTip(false)}>
                <Text style={s.tipCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Task section ── */}
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

          {/* ── Task progress bar ── */}
          {tasks.length > 0 && (
            <View style={s.taskProgress}>
              <View style={s.taskProgressTrack}>
                <View style={[s.taskProgressFill, { width: `${Math.round((doneTasks.length / tasks.length) * 100)}%` }]} />
              </View>
              <Text style={s.taskProgressLabel}>
                {doneTasks.length}/{tasks.length} done
              </Text>
            </View>
          )}

          {/* ── Hobby next-step quick-add ── */}
          {(() => {
            const activeHobbies = HOBBIES.filter(h =>
              selectedHobbies.includes(h.id) && (hobbyProgress[h.id] ?? 0) < h.steps.length
            );
            if (!activeHobbies.length) return null;
            return (
              <View style={s.hobbyQuickSection}>
                <Text style={s.hobbyQuickLabel}>NEXT HOBBY STEPS</Text>
                {activeHobbies.map(h => {
                  const nextStep = h.steps[hobbyProgress[h.id] ?? 0];
                  return (
                    <TouchableOpacity
                      key={h.id}
                      style={s.hobbyQuickChip}
                      onPress={() => addTask(nextStep, 'medium')}
                      activeOpacity={0.75}
                    >
                      <Text style={s.hobbyQuickEmoji}>{h.emoji}</Text>
                      <Text style={s.hobbyQuickText} numberOfLines={2}>{nextStep}</Text>
                      <Text style={s.hobbyQuickAdd}>+ Add</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })()}

          {tasks.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyEmoji}>🌱</Text>
              <Text style={s.empty}>Nothing here yet!{'\n'}Add your first task below.</Text>
            </View>
          ) : (
            <>
              {pendingTasks.map(t => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onToggle={() => handleToggleTask(t.id)}
                  onStartSprint={handleStartSprint}
                  onDelete={deleteTask}
                />
              ))}

              {doneTasks.length > 0 && (
                <>
                  <View style={s.doneSeparator}>
                    <View style={s.doneLine} />
                    <Text style={s.doneLabel}>Done ({doneTasks.length})</Text>
                    <View style={s.doneLine} />
                    <TouchableOpacity onPress={clearDoneTasks} style={s.clearBtn}>
                      <Text style={s.clearBtnText}>Clear all</Text>
                    </TouchableOpacity>
                  </View>
                  {(showAllDone ? doneTasks : doneTasks.slice(0, 3)).map(t => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      onToggle={() => handleToggleTask(t.id)}
                      onStartSprint={handleStartSprint}
                      onDelete={deleteTask}
                    />
                  ))}
                  {doneTasks.length > 3 && (
                    <TouchableOpacity style={s.showMoreDone} onPress={() => setShowAllDone(v => !v)}>
                      <Text style={s.showMoreDoneText}>
                        {showAllDone ? 'Show less ▲' : `Show ${doneTasks.length - 3} more ▼`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              {todayPts > 0 && (
                <View style={s.todayPts}>
                  <Text style={s.todayPtsText}>⚡ {todayPts} pts earned today</Text>
                </View>
              )}
            </>
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

          {/* ── All done celebration ── */}
          {allDone && !surfaceIdea && (
            <View style={s.allDoneCard}>
              <Text style={s.allDoneEmoji}>🌸</Text>
              <Text style={s.allDoneTitle}>
                {userName ? `Amazing, ${userName}!` : 'Amazing!'}
              </Text>
              <Text style={s.allDoneSub}>
                You've done everything on your list today.{todayPts > 0 ? ` That's ${todayPts} pts earned!` : ''}
              </Text>
              <TouchableOpacity style={s.allDoneBtn} onPress={() => navigation.navigate('Grow')}>
                <Text style={s.allDoneBtnText}>Explore your hobbies →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Gentle nudge ── */}
          {!surfaceIdea && !allDone && (
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

  headerBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F5F0EB', borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10, width: 60,
  },
  ideaBtn: { backgroundColor: C.peachPale, borderColor: C.peachLight },
  headerBtnEmoji: { fontSize: 18 },
  headerBtnLabel: { fontSize: 9, fontWeight: '700', color: C.muted, marginTop: 2, letterSpacing: 0.5 },

  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greetingBig: { fontSize: 30, fontWeight: '700', color: C.forest, letterSpacing: -0.5 },
  greetingSub: { fontSize: 17, color: C.sage, marginTop: 4, marginBottom: 18 },
  streakPill: {
    backgroundColor: '#FFF3E0', borderRadius: 20,
    paddingVertical: 3, paddingHorizontal: 10,
    borderWidth: 1, borderColor: '#FFB74D',
  },
  streakPillText: { fontSize: 13, fontWeight: '700', color: '#E65100' },

  dumpCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.white, borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1.5, borderColor: C.sageLight,
  },
  dumpLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dumpEmoji: { fontSize: 28 },
  dumpTitle: { fontSize: 15, fontWeight: '700', color: C.forest, marginBottom: 2 },
  dumpSub: { fontSize: 12, color: C.muted },
  dumpArrow: { fontSize: 18, color: C.sage, fontWeight: '700' },

  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: C.peachPale, borderRadius: 14, padding: 14,
    marginBottom: 18, borderWidth: 1, borderColor: C.peachLight, gap: 10,
  },
  tipEmoji: { fontSize: 20, marginTop: 1 },
  tipText: { flex: 1, fontSize: 13, color: C.forest, lineHeight: 20 },
  tipClose: { padding: 2 },
  tipCloseText: { fontSize: 12, color: C.muted },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1.8 },
  sectionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countBubble: { backgroundColor: C.sage, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 11, fontWeight: '700', color: C.white },
  ideaPill: { backgroundColor: C.peachPale, borderWidth: 1, borderColor: C.peachLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  ideaPillText: { fontSize: 12, fontWeight: '600', color: C.peach },

  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  empty: { fontSize: 15, color: C.muted, fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },

  doneSeparator: { flexDirection: 'row', alignItems: 'center', marginVertical: 10, gap: 8 },
  doneLine: { flex: 1, height: 1, backgroundColor: C.border },
  doneLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1 },
  clearBtn: { paddingHorizontal: 8, paddingVertical: 2 },
  clearBtnText: { fontSize: 12, color: C.muted, fontWeight: '600' },
  showMoreDone: { alignItems: 'center', paddingVertical: 8 },
  showMoreDoneText: { fontSize: 13, color: C.sage, fontWeight: '600' },

  todayPts: { alignSelf: 'center', backgroundColor: C.sagePale, borderRadius: 20, paddingVertical: 5, paddingHorizontal: 14, marginTop: 4, marginBottom: 8 },
  todayPtsText: { fontSize: 13, fontWeight: '700', color: C.sage },

  taskProgress: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  taskProgressTrack: { flex: 1, height: 6, backgroundColor: C.sageLight, borderRadius: 3, overflow: 'hidden' },
  taskProgressFill: { height: 6, backgroundColor: C.sage, borderRadius: 3 },
  taskProgressLabel: { fontSize: 12, color: C.muted, fontWeight: '600', width: 54, textAlign: 'right' },

  allDoneCard: {
    backgroundColor: C.sagePale, borderRadius: 20, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: C.sageLight, marginBottom: 12,
  },
  allDoneEmoji: { fontSize: 48, marginBottom: 10 },
  allDoneTitle: { fontSize: 22, fontWeight: '700', color: C.forest, marginBottom: 6 },
  allDoneSub: { fontSize: 15, color: C.muted, textAlign: 'center', lineHeight: 22, marginBottom: 18 },
  allDoneBtn: {
    backgroundColor: C.sage, borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 28,
  },
  allDoneBtnText: { color: C.white, fontWeight: '700', fontSize: 15 },

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

  milestoneCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFF8E1', borderRadius: 16, padding: 14,
    marginBottom: 14, borderWidth: 1, borderColor: '#FFD54F',
  },
  milestoneEmoji: { fontSize: 28, flexShrink: 0 },
  milestoneText: { flex: 1 },
  milestoneTitle: { fontSize: 15, fontWeight: '700', color: '#5D4037' },
  milestoneSub: { fontSize: 13, color: '#8D6E63', marginTop: 2 },
  milestoneDismiss: { padding: 4 },
  milestoneDismissText: { fontSize: 13, color: '#BCAAA4' },

  hobbyQuickSection: { marginBottom: 12 },
  hobbyQuickLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.5, marginBottom: 8 },
  hobbyQuickChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.sagePale, borderRadius: 12, padding: 12,
    marginBottom: 6, borderWidth: 1, borderColor: C.sageLight,
  },
  hobbyQuickEmoji: { fontSize: 20, flexShrink: 0 },
  hobbyQuickText: { flex: 1, fontSize: 13, color: C.forest, lineHeight: 18 },
  hobbyQuickAdd: { fontSize: 13, fontWeight: '700', color: C.sage, flexShrink: 0 },

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
