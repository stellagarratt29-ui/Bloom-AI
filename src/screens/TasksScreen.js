import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet, Platform, TextInput, Modal, Animated,
} from 'react-native';
import Icon from '../components/Icon';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

function getHighLabel(occupation) {
  if (!occupation || occupation === 'Student') return 'School & Health';
  if (occupation === 'Working') return 'Work & Health';
  if (occupation === 'Both') return 'Work, School & Health';
  return 'Health & Urgent';
}

const SECTION_BASE = [
  { key: 'high',   pillBg: C.pillPinkBg, pillText: C.pillPinkText },
  { key: 'medium', label: 'Tasks',         pillBg: C.pillLavBg,  pillText: C.pillLavText  },
  { key: 'low',    label: 'Fun & Leisure', pillBg: C.pillSkyBg,  pillText: C.pillSkyText  },
];

const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function relativeTime(ts) {
  const age = Date.now() - ts;
  if (age < 60 * 60 * 1000)  return 'Just now';
  if (age < 24 * 60 * 60 * 1000) return 'Today';
  if (age < 48 * 60 * 60 * 1000) return 'Yesterday';
  return '2 days ago';
}

// ─── Pomodoro component used in Focus Mode ────────────────────
function PomodoroTimer({ t }) {
  const [seconds, setSeconds] = useState(WORK_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            // flip phase
            if (!isBreak) { setIsBreak(true); return BREAK_MINUTES * 60; }
            else { setIsBreak(false); return WORK_MINUTES * 60; }
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const toggle = () => setRunning(r => !r);
  const reset  = () => { setRunning(false); setIsBreak(false); setSeconds(WORK_MINUTES * 60); };

  const pct = isBreak
    ? 1 - seconds / (BREAK_MINUTES * 60)
    : 1 - seconds / (WORK_MINUTES * 60);

  const ringColor  = isBreak ? t.clay : t.accent;
  const labelColor = isBreak ? t.clay : t.accent;

  return (
    <View style={pomS.wrap}>
      <View style={[pomS.ring, { borderColor: t.border }]}>
        <View style={[pomS.ringFill, {
          borderColor: ringColor,
          // simple arc approximation — just use border opacity to show progress
          opacity: 0.2 + pct * 0.8,
        }]} />
        <Text style={[pomS.time, { color: t.text }]}>{formatTime(seconds)}</Text>
        <Text style={[pomS.phase, { color: labelColor }]}>
          {isBreak ? 'BREAK' : 'FOCUS'}
        </Text>
      </View>
      <View style={pomS.btns}>
        <TouchableOpacity style={[pomS.startBtn, { backgroundColor: ringColor }]} onPress={toggle}>
          <Icon name={running ? 'pause' : 'play'} size={16} color="#FFF" />
          <Text style={pomS.startBtnText}>{running ? 'Pause' : 'Start'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[pomS.resetBtn, { borderColor: t.border }]} onPress={reset}>
          <Icon name="rotate-ccw" size={14} color={t.subtext} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const pomS = StyleSheet.create({
  wrap: { alignItems: 'center', marginVertical: 24 },
  ring: {
    width: 148, height: 148, borderRadius: 74, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    position: 'relative',
  },
  ringFill: {
    position: 'absolute', width: 148, height: 148, borderRadius: 74,
    borderWidth: 3,
  },
  time: { fontSize: 36, fontWeight: '700', letterSpacing: -1 },
  phase: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: 2 },
  btns: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 11, paddingHorizontal: 24, borderRadius: 24,
  },
  startBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  resetBtn: {
    width: 42, height: 42, borderRadius: 21, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
});

// ─── Focus Mode overlay ────────────────────────────────────────
function FocusMode({ tasks, SECTIONS, t, onClose, onDone, onSkip, navigation }) {
  const [idx, setIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Flatten tasks in priority order
  const ordered = [];
  for (const sec of SECTIONS) {
    for (const tk of tasks.filter(t => t.priority === sec.key)) ordered.push({ ...tk, sec });
  }

  const task = ordered[idx];
  const total = ordered.length;

  if (!task) {
    return (
      <View style={[fS.wrap, { backgroundColor: t.bg }]}>
        <TouchableOpacity style={fS.closeBtn} onPress={onClose}>
          <Icon name="x" size={22} color={t.subtext} />
        </TouchableOpacity>
        <View style={fS.emptyWrap}>
          <Text style={fS.emptyEmoji}>🌿</Text>
          <Text style={[fS.emptyTitle, { color: t.text }]}>You're all caught up</Text>
          <Text style={[fS.emptySub, { color: t.subtext }]}>Nothing left on your list. Go be outside.</Text>
        </View>
        <TouchableOpacity style={[fS.actionBtn, { backgroundColor: t.accent }]} onPress={onClose}>
          <Text style={fS.actionBtnText}>Back to list</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const advance = (done) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    if (done) onDone(task.id);
    setIdx(i => Math.min(i + 1, total - 1));
  };

  return (
    <View style={[fS.wrap, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={fS.topBar}>
        <TouchableOpacity style={fS.closeBtn} onPress={onClose}>
          <Icon name="x" size={20} color={t.subtext} />
        </TouchableOpacity>
        <Text style={[fS.counter, { color: t.subtext }]}>{idx + 1} of {total}</Text>
      </View>

      <Animated.View style={[fS.content, { opacity: fadeAnim }]}>
        {/* Category pill */}
        <View style={[fS.pill, { backgroundColor: task.sec.pillBg }]}>
          <Text style={[fS.pillText, { color: task.sec.pillText }]}>
            {task.sec.label?.toUpperCase()}
          </Text>
        </View>

        {/* Task text — large and central */}
        <Text style={[fS.taskText, { color: t.text }]}>{task.text}</Text>

        {/* Pomodoro */}
        <PomodoroTimer t={t} />
      </Animated.View>

      {/* Actions */}
      <View style={fS.actions}>
        <TouchableOpacity
          style={[fS.helpBtn, { borderColor: t.border }]}
          onPress={() => navigation.navigate('TaskGuide', { task })}
        >
          <Icon name="help-circle" size={16} color={t.subtext} />
          <Text style={[fS.helpBtnText, { color: t.subtext }]}>How do I do this?</Text>
        </TouchableOpacity>

        <View style={fS.primaryActions}>
          {idx < total - 1 && (
            <TouchableOpacity
              style={[fS.skipBtn, { borderColor: t.border }]}
              onPress={() => advance(false)}
            >
              <Text style={[fS.skipBtnText, { color: t.subtext }]}>Skip →</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[fS.doneBtn, { backgroundColor: t.accent }]}
            onPress={() => advance(true)}
          >
            <Icon name="check" size={16} color="#FFF" />
            <Text style={fS.doneBtnText}>Done  +5 pts</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const fS = StyleSheet.create({
  wrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 100, paddingHorizontal: 28, paddingBottom: 48,
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'web' ? 24 : 56, paddingBottom: 8,
  },
  closeBtn: { padding: 8 },
  counter: { fontSize: 13, fontWeight: '600' },

  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  pill: {
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5,
    marginBottom: 20,
  },
  pillText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.8 },

  taskText: {
    fontSize: 26, fontWeight: '700', textAlign: 'center', lineHeight: 36,
    letterSpacing: -0.3, marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? '"Outfit", Georgia, sans-serif' : undefined,
  },

  actions: { gap: 12 },
  helpBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: 12, borderRadius: 14, borderWidth: 1.5,
  },
  helpBtnText: { fontSize: 14, fontWeight: '500' },

  primaryActions: { flexDirection: 'row', gap: 10 },
  skipBtn: {
    flex: 1, paddingVertical: 15, borderRadius: 14,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  skipBtnText: { fontSize: 15, fontWeight: '600' },
  doneBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 14,
  },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 52, marginBottom: 20 },
  emptyTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4, marginBottom: 10 },
  emptySub: { fontSize: 15, textAlign: 'center', lineHeight: 24 },
  actionBtn: { paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});

// ─── Main screen ──────────────────────────────────────────────
export default function TasksScreen({ navigation }) {
  const {
    tasks, deleteTask, updateTask, addTask, ndToggles, userOccupation,
    finishedTasks, finishTask, clearFinishedTask, points,
  } = useApp();
  const SECTIONS = SECTION_BASE.map(s => s.key === 'high' ? { ...s, label: getHighLabel(userOccupation) } : s);
  const { colors: t } = useTheme();

  const [focusMode,    setFocusMode]    = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [editText,     setEditText]     = useState('');
  const [editPrio,     setEditPrio]     = useState('medium');
  const [deleteConfirm,setDeleteConfirm]= useState(null);
  const [menuTarget,   setMenuTarget]   = useState(null);
  const [showAddTask,  setShowAddTask]  = useState(false);
  const [newTaskText,  setNewTaskText]  = useState('');
  const [newTaskPrio,  setNewTaskPrio]  = useState('medium');
  const [showFinished, setShowFinished] = useState(true);

  const openEdit = (task) => { setEditTarget(task); setEditText(task.text); setEditPrio(task.priority ?? 'medium'); };
  const saveEdit = () => { if (!editText.trim()) return; updateTask(editTarget.id, { text: editText.trim(), priority: editPrio }); setEditTarget(null); };
  const doAddTask = () => { if (!newTaskText.trim()) return; addTask(newTaskText.trim(), newTaskPrio); setNewTaskText(''); setNewTaskPrio('medium'); setShowAddTask(false); };

  const activeTasks = tasks.filter(tk => !tk.done);

  const TaskCard = ({ task, sec }) => (
    <View style={[ss.taskCard, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={[ss.taskStripe, { backgroundColor: sec?.pillText ?? t.border }]} />
      <TouchableOpacity style={ss.doneBtn} onPress={() => finishTask(task.id)} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}>
        <View style={[ss.checkCircle, { borderColor: sec?.pillText ?? t.border }]} />
      </TouchableOpacity>
      <TouchableOpacity style={ss.taskBody} onPress={() => navigation.navigate('TaskGuide', { task })} activeOpacity={0.72}>
        <Text style={[ss.taskText, { color: t.text }]} numberOfLines={2}>{task.text}</Text>
        <Text style={[ss.taskHint, { color: t.subtext }]}>Tap for help →</Text>
      </TouchableOpacity>
      <TouchableOpacity style={ss.menuBtn} onPress={() => setMenuTarget(task)}>
        <Icon name="more-vertical" size={18} color={t.subtext} />
      </TouchableOpacity>
    </View>
  );

  const FinishedCard = ({ item }) => (
    <View style={[ss.finishedCard, { backgroundColor: t.card, borderColor: t.border }]}>
      <Icon name="check-circle" size={17} color={t.accent} />
      <Text style={[ss.finishedText, { color: t.subtext }]} numberOfLines={1}>{item.text}</Text>
      <Text style={[ss.finishedAge, { color: t.muted }]}>{relativeTime(item.finishedAt)}</Text>
      <TouchableOpacity onPress={() => clearFinishedTask(item.id)} style={ss.finishedX} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Icon name="x" size={14} color={t.subtext} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[ss.safe, { backgroundColor: t.bg }]}>
      {/* Focus Mode overlay */}
      {focusMode && (
        <FocusMode
          tasks={activeTasks}
          SECTIONS={SECTIONS}
          t={t}
          onClose={() => setFocusMode(false)}
          onDone={(id) => finishTask(id)}
          onSkip={() => {}}
          navigation={navigation}
        />
      )}

      <View style={[ss.header, { backgroundColor: t.bg, borderBottomColor: t.border }]}>
        <Text style={[ss.title, { color: t.clay }]}>Tasks</Text>
        <View style={ss.headerRight}>
          {points > 0 && (
            <View style={[ss.pointsBadge, { backgroundColor: t.accentPale }]}>
              <Text style={[ss.pointsText, { color: t.accent }]}>{points} pts</Text>
            </View>
          )}
          {/* Focus Mode button */}
          {activeTasks.length > 0 && (
            <TouchableOpacity
              style={[ss.focusBtn, { backgroundColor: t.accentPale }]}
              onPress={() => setFocusMode(true)}
            >
              <Icon name="target" size={14} color={t.accent} />
              <Text style={[ss.focusBtnText, { color: t.accent }]}>Focus</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[ss.addTaskBtn, { backgroundColor: t.accent }]} onPress={() => setShowAddTask(true)}>
            <Icon name="plus" size={14} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={ss.scroll} showsVerticalScrollIndicator={false}>
        {activeTasks.length === 0 && finishedTasks.length === 0 ? (
          <View style={ss.empty}>
            <Text style={ss.emptyEmoji}>🌱</Text>
            <Text style={[ss.emptyHead, { color: t.text }]}>All clear</Text>
            <Text style={[ss.emptyText, { color: t.subtext }]}>
              Go to Chat, brain-dump everything on your mind, and Bloom will sort it into tasks for you.
            </Text>
          </View>
        ) : (
          <>
            {/* Focus nudge banner */}
            {activeTasks.length > 2 && (
              <TouchableOpacity
                style={[ss.focusBanner, { backgroundColor: t.accentPale, borderColor: t.accentLight }]}
                onPress={() => setFocusMode(true)}
                activeOpacity={0.8}
              >
                <Icon name="target" size={16} color={t.accent} />
                <Text style={[ss.focusBannerText, { color: t.accent }]}>
                  {activeTasks.length} tasks — tap Focus to do one at a time
                </Text>
                <Icon name="chevron-right" size={15} color={t.accent} />
              </TouchableOpacity>
            )}

            {SECTIONS.map(sec => {
              const items = activeTasks.filter(tk => tk.priority === sec.key);
              if (!items.length) return null;
              return (
                <View key={sec.key} style={ss.group}>
                  <View style={[ss.sectionPill, { backgroundColor: sec.pillBg }]}>
                    <Text style={[ss.sectionLabel, { color: sec.pillText }]}>{sec.label.toUpperCase()}</Text>
                  </View>
                  {items.map(task => (
                    <TaskCard key={task.id} task={task} sec={sec} />
                  ))}
                </View>
              );
            })}

            {finishedTasks.length > 0 && (
              <View style={ss.group}>
                <TouchableOpacity style={ss.finishedHeader} onPress={() => setShowFinished(v => !v)} activeOpacity={0.75}>
                  <View style={[ss.sectionPill, { backgroundColor: t.border }]}>
                    <Text style={[ss.sectionLabel, { color: t.subtext }]}>DONE ({finishedTasks.length})</Text>
                  </View>
                  <Icon name={showFinished ? 'chevron-up' : 'chevron-down'} size={15} color={t.subtext} />
                </TouchableOpacity>
                {showFinished && finishedTasks.map(item => <FinishedCard key={item.id} item={item} />)}
              </View>
            )}
          </>
        )}
        <View style={{ height: 48 }} />
      </ScrollView>

      {/* Three-dot menu */}
      <Modal visible={!!menuTarget} transparent animationType="slide" onRequestClose={() => setMenuTarget(null)}>
        <TouchableOpacity style={ss.menuOverlay} activeOpacity={1} onPress={() => setMenuTarget(null)}>
          <View style={[ss.menuSheet, { backgroundColor: t.card }]}>
            <Text style={[ss.menuItemTitle, { color: t.subtext }]} numberOfLines={1}>{menuTarget?.text}</Text>
            <View style={[ss.menuDivider, { backgroundColor: t.border }]} />
            <TouchableOpacity style={ss.menuItem} onPress={() => { openEdit(menuTarget); setMenuTarget(null); }}>
              <Icon name="edit-2" size={18} color={t.text} />
              <Text style={[ss.menuItemText, { color: t.text }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ss.menuItem} onPress={() => { finishTask(menuTarget.id); setMenuTarget(null); }}>
              <Icon name="check-circle" size={18} color={t.accent} />
              <Text style={[ss.menuItemText, { color: t.accent }]}>Mark done</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ss.menuItem} onPress={() => { setDeleteConfirm(menuTarget); setMenuTarget(null); }}>
              <Icon name="trash-2" size={18} color={t.urgent} />
              <Text style={[ss.menuItemText, { color: t.urgent }]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[ss.menuItem, { justifyContent: 'center' }]} onPress={() => setMenuTarget(null)}>
              <Text style={[ss.menuItemText, { color: t.subtext }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add Task */}
      <Modal visible={showAddTask} transparent animationType="slide" onRequestClose={() => setShowAddTask(false)}>
        <View style={ss.modalOverlay}>
          <View style={[ss.modalCard, { backgroundColor: t.card }]}>
            <Text style={[ss.modalTitle, { color: t.text }]}>Add task</Text>
            <TextInput
              style={[ss.modalInput, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
              value={newTaskText} onChangeText={setNewTaskText}
              autoFocus placeholder="What do you need to do?" placeholderTextColor={t.subtext} multiline
            />
            <Text style={[ss.modalLabel, { color: t.subtext }]}>PRIORITY</Text>
            <View style={ss.prioRow}>
              {SECTIONS.map(sec => (
                <TouchableOpacity key={sec.key}
                  style={[ss.prioChip, { backgroundColor: newTaskPrio === sec.key ? sec.pillBg : t.bg, borderColor: newTaskPrio === sec.key ? sec.pillText : t.border, borderWidth: 2 }]}
                  onPress={() => setNewTaskPrio(sec.key)}>
                  <Text style={[ss.prioChipText, { color: newTaskPrio === sec.key ? sec.pillText : t.subtext }]}>{sec.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={ss.modalActions}>
              <TouchableOpacity style={[ss.modalCancel, { borderColor: t.border }]} onPress={() => { setShowAddTask(false); setNewTaskText(''); }}>
                <Text style={[ss.modalCancelText, { color: t.subtext }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[ss.modalSave, { backgroundColor: t.accent }, !newTaskText.trim() && { opacity: 0.4 }]} onPress={doAddTask} disabled={!newTaskText.trim()}>
                <Text style={ss.modalSaveText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit */}
      <Modal visible={!!editTarget} transparent animationType="slide" onRequestClose={() => setEditTarget(null)}>
        <View style={ss.modalOverlay}>
          <View style={[ss.modalCard, { backgroundColor: t.card }]}>
            <Text style={[ss.modalTitle, { color: t.text }]}>Edit task</Text>
            <TextInput
              style={[ss.modalInput, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
              value={editText} onChangeText={setEditText} autoFocus multiline
              placeholderTextColor={t.subtext}
            />
            <Text style={[ss.modalLabel, { color: t.subtext }]}>PRIORITY</Text>
            <View style={ss.prioRow}>
              {SECTIONS.map(sec => (
                <TouchableOpacity key={sec.key}
                  style={[ss.prioChip, { backgroundColor: editPrio === sec.key ? sec.pillBg : t.bg, borderColor: editPrio === sec.key ? sec.pillText : t.border, borderWidth: 2 }]}
                  onPress={() => setEditPrio(sec.key)}>
                  <Text style={[ss.prioChipText, { color: editPrio === sec.key ? sec.pillText : t.subtext }]}>{sec.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={ss.modalActions}>
              <TouchableOpacity style={[ss.modalCancel, { borderColor: t.border }]} onPress={() => setEditTarget(null)}>
                <Text style={[ss.modalCancelText, { color: t.subtext }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[ss.modalSave, { backgroundColor: t.accent }]} onPress={saveEdit}>
                <Text style={ss.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete confirm */}
      <Modal visible={!!deleteConfirm} transparent animationType="fade" onRequestClose={() => setDeleteConfirm(null)}>
        <View style={ss.modalOverlay}>
          <View style={[ss.modalCard, { backgroundColor: t.card }]}>
            <Text style={[ss.modalTitle, { color: t.text }]}>Remove task?</Text>
            <Text style={[ss.modalBody, { color: t.subtext }]} numberOfLines={2}>"{deleteConfirm?.text}"</Text>
            <View style={ss.modalActions}>
              <TouchableOpacity style={[ss.modalCancel, { borderColor: t.border }]} onPress={() => setDeleteConfirm(null)}>
                <Text style={[ss.modalCancelText, { color: t.subtext }]}>Keep</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[ss.modalSave, { backgroundColor: t.urgent }]} onPress={() => { deleteTask(deleteConfirm.id); setDeleteConfirm(null); }}>
                <Text style={ss.modalSaveText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1,
  },
  title: {
    fontSize: 34, fontWeight: '800', letterSpacing: -0.8,
    fontFamily: Platform.OS === 'web' ? '"Outfit", Georgia, sans-serif' : undefined,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pointsBadge: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  pointsText:  { fontSize: 12, fontWeight: '800' },
  focusBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  focusBtnText: { fontSize: 13, fontWeight: '700' },
  addTaskBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },

  scroll: { paddingHorizontal: 18, paddingTop: 16 },

  focusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, padding: 14, marginBottom: 18,
    borderWidth: 1,
  },
  focusBannerText: { flex: 1, fontSize: 13, fontWeight: '600' },

  group: { marginBottom: 20 },
  sectionPill: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },

  taskCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, paddingVertical: 13, paddingRight: 10, paddingLeft: 14,
    borderWidth: 1, marginBottom: 8, overflow: 'hidden',
    shadowColor: '#1A1018', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  taskStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 14, borderBottomLeftRadius: 14 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
  doneBtn: { padding: 2, flexShrink: 0 },
  taskBody: { flex: 1, flexDirection: 'column', gap: 2 },
  taskText: { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  taskHint: { fontSize: 11, fontWeight: '400', letterSpacing: 0.1 },
  menuBtn: { padding: 6 },

  finishedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  finishedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    borderRadius: 13, paddingVertical: 11, paddingHorizontal: 13,
    borderWidth: 1, marginBottom: 6, opacity: 0.7,
  },
  finishedText: { flex: 1, fontSize: 13, fontWeight: '500' },
  finishedAge:  { fontSize: 11, fontWeight: '500', flexShrink: 0 },
  finishedX:    { padding: 2, marginLeft: 2 },

  empty: { alignItems: 'center', paddingTop: 80, paddingBottom: 40, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyHead: { fontSize: 22, fontWeight: '800', marginBottom: 10, letterSpacing: -0.3, fontFamily: Platform.OS === 'web' ? '"Outfit", Georgia, sans-serif' : undefined },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 23 },

  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  menuSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 8, paddingBottom: 40 },
  menuItemTitle: { fontSize: 12, textAlign: 'center', paddingVertical: 10, paddingHorizontal: 20 },
  menuDivider: { height: 1, marginBottom: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 24 },
  menuItemText: { fontSize: 16, fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14 },
  modalBody:  { fontSize: 14, lineHeight: 22, marginBottom: 20 },
  modalLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },
  modalInput: { borderWidth: 1.5, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14, fontSize: 15, marginBottom: 18, minHeight: 64, textAlignVertical: 'top' },
  prioRow:   { flexDirection: 'row', gap: 7, marginBottom: 22, flexWrap: 'wrap' },
  prioChip:  { paddingVertical: 7, paddingHorizontal: 11, borderRadius: 16 },
  prioChipText: { fontSize: 12, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '600' },
  modalSave: { flex: 2, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  modalSaveText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
