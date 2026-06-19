import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Modal,
} from 'react-native';

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  cream: '#FAF8F4',
  forest: '#2D4A35',
  sage: '#7B9E87',
  sageMid: '#A8C5A0',
  sageLight: '#D6E8D4',
  sagePale: '#EBF4E9',
  peach: '#C8795E',
  peachLight: '#F2D4C8',
  peachPale: '#FBF0EB',
  muted: '#8A9B8C',
  border: '#E5DED6',
  white: '#FFFFFF',
};

const PRIORITY = {
  high:   { label: 'High',   text: C.peach, bg: C.peachLight },
  medium: { label: 'Medium', text: C.sage,  bg: C.sageLight  },
  low:    { label: 'Low',    text: C.muted, bg: '#EDEBE7'    },
};

const NUDGES = [
  'You said this was important to you — want a little help getting started?',
  'Progress, not perfection. Even one small step counts today.',
  'Your future self will thank you for starting now, not later.',
  "What's one tiny thing you can do in the next five minutes?",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function returnConditionFor(hasPendingTasks) {
  return hasPendingTasks
    ? "I'll bring this back once today's tasks are done."
    : "I'll remind you about this tomorrow morning.";
}

let _tid = 1;
const makeTask = (text, priority) => ({ id: _tid++, text, priority, done: false });

let _iid = 1;
const makeIdea = (text, returnCondition) => ({
  id: _iid++, text, returnCondition, surfaced: false,
});

// ─── TaskRow ──────────────────────────────────────────────────────────────────
function TaskRow({ task, onToggle }) {
  const p = PRIORITY[task.priority];
  return (
    <TouchableOpacity style={s.taskRow} onPress={onToggle} activeOpacity={0.7}>
      <View style={[s.checkbox, task.done && s.checkboxDone]}>
        {task.done && <Text style={s.checkmark}>✓</Text>}
      </View>
      <Text style={[s.taskText, task.done && s.taskTextDone]} numberOfLines={2}>
        {task.text}
      </Text>
      <View style={[s.badge, { backgroundColor: p.bg }]}>
        <Text style={[s.badgeText, { color: p.text }]}>{p.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── IdeaCaptureModal ─────────────────────────────────────────────────────────
function IdeaCaptureModal({ visible, hasPendingTasks, onSave, onDismiss }) {
  const [text, setText] = useState('');

  const handleSave = () => {
    if (!text.trim()) return;
    onSave(text.trim(), returnConditionFor(hasPendingTasks));
    setText('');
  };

  const handleDismiss = () => { setText(''); onDismiss(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleDismiss}>
      <View style={s.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />

            <Text style={s.sheetEmoji}>💡</Text>
            <Text style={s.sheetTitle}>Got an idea?</Text>
            <Text style={s.sheetSub}>Quick — tell me and I'll hold onto it for you.</Text>

            <TextInput
              style={s.sheetInput}
              placeholder="What's the idea?"
              placeholderTextColor={C.muted}
              value={text}
              onChangeText={setText}
              multiline
              autoFocus
              maxLength={200}
            />

            <TouchableOpacity
              style={[s.sheetSaveBtn, !text.trim() && { opacity: 0.4 }]}
              onPress={handleSave}
              disabled={!text.trim()}
            >
              <Text style={s.sheetSaveBtnText}>Save it 🌿</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.sheetCancelBtn} onPress={handleDismiss}>
              <Text style={s.sheetCancelText}>Actually, never mind</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── IdeaSavedToast ───────────────────────────────────────────────────────────
function IdeaSavedToast({ returnCondition }) {
  return (
    <View style={s.toast}>
      <Text style={s.toastEmoji}>🌿</Text>
      <Text style={s.toastText}>Saved! {returnCondition}</Text>
    </View>
  );
}

// ─── IdeaBankScreen ───────────────────────────────────────────────────────────
function IdeaBankScreen({ ideas, onBack, onPromote, onDelete }) {
  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.bankHeader}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.bankTitle}>Idea Bank</Text>
        <View style={{ width: 64 }} />
      </View>

      <ScrollView contentContainerStyle={s.bankContent} showsVerticalScrollIndicator={false}>
        <Text style={s.bankSubtitle}>
          These ideas are safe here. No pressure — come back whenever you're ready.
        </Text>

        {ideas.length === 0 ? (
          <View style={s.bankEmpty}>
            <Text style={s.bankEmptyEmoji}>🌱</Text>
            <Text style={s.bankEmptyText}>
              No ideas saved yet. Tap 💡 on the home screen whenever inspiration strikes!
            </Text>
          </View>
        ) : (
          ideas.map(idea => (
            <View key={idea.id} style={s.ideaCard}>
              <Text style={s.ideaText}>{idea.text}</Text>
              <Text style={s.ideaReturn}>{idea.returnCondition}</Text>
              <View style={s.ideaActions}>
                <TouchableOpacity style={s.ideaPromoteBtn} onPress={() => onPromote(idea)}>
                  <Text style={s.ideaPromoteText}>+ Add as task</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.ideaDeleteBtn} onPress={() => onDelete(idea.id)}>
                  <Text style={s.ideaDeleteText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('home');
  const [tasks, setTasks] = useState([
    makeTask('Work on my passion project', 'high'),
    makeTask('Go for a 20-minute walk', 'medium'),
    makeTask('Read for 15 minutes', 'low'),
  ]);
  const [ideas, setIdeas]             = useState([]);
  const [inputText, setInputText]     = useState('');
  const [priority, setPriority]       = useState('medium');
  const [nudge]                       = useState(() => NUDGES[Math.floor(Math.random() * NUDGES.length)]);
  const [showCapture, setShowCapture] = useState(false);
  const [toast, setToast]             = useState(null);
  const sessionAdded                  = useRef(0);
  const inputRef                      = useRef(null);

  const pendingCount  = tasks.filter(t => !t.done).length;
  const allDone       = tasks.length > 0 && pendingCount === 0;
  const surfaceIdea   = allDone ? ideas.find(i => !i.surfaced) : null;

  // ── Actions ─────────────────────────────────────────────────────────────────
  const addTask = () => {
    const text = inputText.trim();
    if (!text) return;
    setTasks(prev => [...prev, makeTask(text, priority)]);
    setInputText('');
    inputRef.current?.blur();

    sessionAdded.current += 1;
    if (sessionAdded.current === 3) {
      setTimeout(() => setShowCapture(true), 400);
    }
  };

  const toggleTask = id =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const saveIdea = (text, returnCondition) => {
    setIdeas(prev => [makeIdea(text, returnCondition), ...prev]);
    setShowCapture(false);
    setToast(returnCondition);
    setTimeout(() => setToast(null), 3500);
  };

  const promoteIdea = idea => {
    setTasks(prev => [...prev, makeTask(idea.text, 'medium')]);
    deleteIdea(idea.id);
    setScreen('home');
  };

  const deleteIdea = id =>
    setIdeas(prev => prev.filter(i => i.id !== id));

  const dismissSurfaced = () =>
    setIdeas(prev => prev.map(i =>
      i.id === surfaceIdea?.id ? { ...i, surfaced: true } : i
    ));

  // ── Screens ──────────────────────────────────────────────────────────────────
  if (screen === 'ideaBank') {
    return (
      <IdeaBankScreen
        ideas={ideas}
        onBack={() => setScreen('home')}
        onPromote={promoteIdea}
        onDelete={deleteIdea}
      />
    );
  }

  // ── Home screen ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <IdeaCaptureModal
        visible={showCapture}
        hasPendingTasks={pendingCount > 0}
        onSave={saveIdea}
        onDismiss={() => setShowCapture(false)}
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
            <View style={{ width: 48 }} />
            <View style={s.buddyWrapper}>
              <View style={s.buddyRing}>
                <View style={s.buddyCircle}>
                  <Text style={s.buddyEmoji}>🌿</Text>
                </View>
              </View>
              <Text style={s.buddyName}>Buddy</Text>
            </View>
            <TouchableOpacity style={s.ideaBtn} onPress={() => setShowCapture(true)}>
              <Text style={s.ideaBtnEmoji}>💡</Text>
              <Text style={s.ideaBtnLabel}>Idea</Text>
            </TouchableOpacity>
          </View>

          {/* ── Greeting ── */}
          <Text style={s.greetingBig}>{greeting()}!</Text>
          <Text style={s.greetingSub}>What matters today?</Text>

          {/* ── Section header ── */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionLabel}>TODAY'S FOCUS</Text>
            <View style={s.sectionRight}>
              {pendingCount > 0 && (
                <View style={s.countBubble}>
                  <Text style={s.countText}>{pendingCount}</Text>
                </View>
              )}
              {ideas.length > 0 && (
                <TouchableOpacity style={s.bankPill} onPress={() => setScreen('ideaBank')}>
                  <Text style={s.bankPillText}>💡 {ideas.length}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── Tasks ── */}
          {tasks.length === 0 ? (
            <Text style={s.empty}>Nothing here yet — add your first task below!</Text>
          ) : (
            tasks.map(t => <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t.id)} />)
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
                onSubmitEditing={addTask}
                returnKeyType="done"
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[s.addBtn, !inputText.trim() && s.addBtnOff]}
                onPress={addTask}
                disabled={!inputText.trim()}
              >
                <Text style={s.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
            <View style={s.priorityRow}>
              <Text style={s.priorityLabel}>Priority</Text>
              {['high', 'medium', 'low'].map(p => {
                const cfg = PRIORITY[p];
                const active = priority === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      s.priorityChip,
                      { borderColor: active ? cfg.text : C.border },
                      active && { backgroundColor: cfg.bg },
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[s.priorityChipText, { color: active ? cfg.text : C.muted }]}>
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Saved idea toast ── */}
          {toast && <IdeaSavedToast returnCondition={toast} />}

          {/* ── Resurfaced idea card ── */}
          {surfaceIdea && (
            <View style={[s.nudgeCard, s.resurface]}>
              <View style={s.nudgeTop}>
                <Text style={s.nudgeLeaf}>💡</Text>
                <Text style={[s.nudgeTitle, { color: C.sage }]}>Remember this?</Text>
              </View>
              <Text style={s.nudgeBody}>"{surfaceIdea.text}"</Text>
              <Text style={s.resurfaceSub}>You saved this earlier. Want to explore it now?</Text>
              <View style={s.resurfaceActions}>
                <TouchableOpacity
                  style={[s.nudgeBtn, { backgroundColor: C.sage }]}
                  onPress={() => promoteIdea(surfaceIdea)}
                >
                  <Text style={s.nudgeBtnText}>Add as task →</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.maybeLaterBtn} onPress={dismissSurfaced}>
                  <Text style={s.maybeLaterText}>Maybe later</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Gentle nudge ── */}
          {!surfaceIdea && (
            <View style={s.nudgeCard}>
              <View style={s.nudgeTop}>
                <Text style={s.nudgeLeaf}>🌱</Text>
                <Text style={s.nudgeTitle}>Gentle Nudge</Text>
              </View>
              <Text style={s.nudgeBody}>{nudge}</Text>
              <TouchableOpacity style={s.nudgeBtn}>
                <Text style={s.nudgeBtnText}>Let's begin →</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 48 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: C.cream },
  scroll: { paddingHorizontal: 24, paddingTop: 16 },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  buddyWrapper: { alignItems: 'center' },
  buddyRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.sageLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: C.sageMid,
  },
  buddyCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: C.sagePale, alignItems: 'center', justifyContent: 'center',
  },
  buddyEmoji: { fontSize: 28 },
  buddyName: {
    marginTop: 6, fontSize: 11, fontWeight: '700',
    color: C.sage, letterSpacing: 1.5, textTransform: 'uppercase',
  },

  // Idea button (top-right)
  ideaBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.peachPale,
    borderWidth: 1.5, borderColor: C.peachLight,
    borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10,
    width: 48,
  },
  ideaBtnEmoji: { fontSize: 18 },
  ideaBtnLabel: { fontSize: 9, fontWeight: '700', color: C.peach, marginTop: 2, letterSpacing: 0.5 },

  // Greeting
  greetingBig: { fontSize: 32, fontWeight: '700', color: C.forest, letterSpacing: -0.5 },
  greetingSub: { fontSize: 18, color: C.sage, marginTop: 4, marginBottom: 28 },

  // Section header
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1.8 },
  sectionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countBubble: {
    backgroundColor: C.sage, width: 20, height: 20,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  countText: { fontSize: 11, fontWeight: '700', color: C.white },
  bankPill: {
    backgroundColor: C.peachPale, borderWidth: 1, borderColor: C.peachLight,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
  },
  bankPillText: { fontSize: 12, fontWeight: '600', color: C.peach },

  // Empty
  empty: { fontSize: 15, color: C.muted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 20 },

  // Task row
  taskRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.white,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16,
    marginBottom: 8, borderWidth: 1, borderColor: C.border,
  },
  checkbox: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: C.sage,
    alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0,
  },
  checkboxDone: { backgroundColor: C.sage, borderColor: C.sage },
  checkmark: { color: C.white, fontSize: 13, fontWeight: '800', lineHeight: 15 },
  taskText: { flex: 1, fontSize: 16, color: C.forest, lineHeight: 22 },
  taskTextDone: { color: C.muted, textDecorationLine: 'line-through' },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, marginLeft: 10, flexShrink: 0 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // Add card
  addCard: {
    backgroundColor: C.white, borderRadius: 16, padding: 16,
    marginTop: 8, marginBottom: 20, borderWidth: 1, borderColor: C.border,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  input: {
    flex: 1, backgroundColor: C.cream, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14,
    fontSize: 15, color: C.forest,
  },
  addBtn: { backgroundColor: C.sage, paddingVertical: 11, paddingHorizontal: 20, borderRadius: 10 },
  addBtnOff: { opacity: 0.35 },
  addBtnText: { color: C.white, fontWeight: '700', fontSize: 15 },
  priorityRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priorityLabel: { fontSize: 13, color: C.muted, fontWeight: '500', marginRight: 2 },
  priorityChip: { paddingVertical: 5, paddingHorizontal: 13, borderRadius: 20, borderWidth: 1.5 },
  priorityChipText: { fontSize: 13, fontWeight: '600' },

  // Toast
  toast: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.sagePale, borderRadius: 12, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: C.sageLight,
  },
  toastEmoji: { fontSize: 18, marginRight: 10 },
  toastText: { flex: 1, fontSize: 14, color: C.forest, lineHeight: 20 },

  // Nudge card
  nudgeCard: {
    backgroundColor: C.peachPale, borderRadius: 18, padding: 22,
    borderWidth: 1, borderColor: C.peachLight, marginBottom: 12,
  },
  resurface: { backgroundColor: C.sagePale, borderColor: C.sageLight },
  nudgeTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  nudgeLeaf: { fontSize: 20, marginRight: 8 },
  nudgeTitle: {
    fontSize: 13, fontWeight: '700', color: C.peach,
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  nudgeBody: { fontSize: 17, color: C.forest, lineHeight: 26, marginBottom: 16 },
  nudgeBtn: {
    alignSelf: 'flex-end', backgroundColor: C.peach,
    paddingVertical: 11, paddingHorizontal: 22, borderRadius: 24,
  },
  nudgeBtnText: { color: C.white, fontWeight: '700', fontSize: 14 },

  // Resurface card extras
  resurfaceSub: { fontSize: 14, color: C.muted, marginBottom: 16 },
  resurfaceActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  maybeLaterBtn: { paddingVertical: 8, paddingHorizontal: 4 },
  maybeLaterText: { fontSize: 14, color: C.muted },

  // Idea capture modal
  overlay: {
    flex: 1, backgroundColor: 'rgba(45,74,53,0.3)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 40,
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: C.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: 24,
  },
  sheetEmoji: { fontSize: 36, textAlign: 'center', marginBottom: 8 },
  sheetTitle: {
    fontSize: 24, fontWeight: '700', color: C.forest,
    textAlign: 'center', marginBottom: 6,
  },
  sheetSub: {
    fontSize: 15, color: C.muted, textAlign: 'center',
    lineHeight: 22, marginBottom: 24,
  },
  sheetInput: {
    backgroundColor: C.cream, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, padding: 16, fontSize: 16, color: C.forest,
    minHeight: 100, textAlignVertical: 'top', marginBottom: 16,
  },
  sheetSaveBtn: {
    backgroundColor: C.sage, borderRadius: 16,
    paddingVertical: 16, alignItems: 'center', marginBottom: 12,
  },
  sheetSaveBtnText: { color: C.white, fontWeight: '700', fontSize: 17 },
  sheetCancelBtn: { alignItems: 'center', paddingVertical: 8 },
  sheetCancelText: { fontSize: 15, color: C.muted },

  // Idea Bank screen
  bankHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { paddingVertical: 4, paddingHorizontal: 4 },
  backBtnText: { fontSize: 16, color: C.sage, fontWeight: '600' },
  bankTitle: { fontSize: 18, fontWeight: '700', color: C.forest },
  bankContent: { paddingHorizontal: 24, paddingTop: 16 },
  bankSubtitle: {
    fontSize: 14, color: C.muted, lineHeight: 21,
    marginBottom: 20, textAlign: 'center',
  },
  bankEmpty: { alignItems: 'center', paddingTop: 48 },
  bankEmptyEmoji: { fontSize: 48, marginBottom: 16 },
  bankEmptyText: { fontSize: 15, color: C.muted, textAlign: 'center', lineHeight: 22 },

  // Idea card
  ideaCard: {
    backgroundColor: C.white, borderRadius: 16, padding: 18,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
  },
  ideaText: { fontSize: 16, color: C.forest, lineHeight: 24, marginBottom: 8 },
  ideaReturn: { fontSize: 13, color: C.sage, fontStyle: 'italic', marginBottom: 14 },
  ideaActions: { flexDirection: 'row', gap: 10 },
  ideaPromoteBtn: {
    flex: 1, backgroundColor: C.sagePale, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: C.sageLight,
  },
  ideaPromoteText: { fontSize: 14, fontWeight: '600', color: C.sage },
  ideaDeleteBtn: {
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 10, borderWidth: 1, borderColor: C.border,
  },
  ideaDeleteText: { fontSize: 14, color: C.muted },
});
