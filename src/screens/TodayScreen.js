import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView,
  StyleSheet, Platform, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import Icon from '../components/Icon';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

// ─── Mood config ──────────────────────────────────────
const MOODS = [
  { key: 'tired',   label: 'Tired', emoji: '😴' },
  { key: 'okay',    label: 'Okay',  emoji: '😐' },
  { key: 'good',    label: 'Good',  emoji: '🙂' },
  { key: 'great',   label: 'Great', emoji: '😄' },
];

function getMoodInsight(mood) {
  switch (mood) {
    case 'tired': return "You're tired — I've kept it to just the essentials. That's enough.";
    case 'okay':  return "Feeling okay. Here's what actually needs to happen today.";
    case 'good':  return "You're in a good place. Let's make it count.";
    case 'great': return "You're fired up. Full list is yours — go get it.";
    default:      return null;
  }
}

function filterByMood(tasks, mood) {
  const active = tasks.filter(t => !t.done);
  const high   = active.filter(t => t.priority === 'high');
  const medium = active.filter(t => t.priority === 'medium');
  const low    = active.filter(t => t.priority === 'low');

  switch (mood) {
    case 'tired': return { doFirst: high.slice(0, 2),  ifTime: [],              later: [] };
    case 'okay':  return { doFirst: high.slice(0, 2),  ifTime: medium.slice(0, 2), later: [] };
    case 'good':  return { doFirst: high,              ifTime: medium.slice(0, 4), later: low.slice(0, 1) };
    case 'great': return { doFirst: high,              ifTime: medium,          later: low };
    default:      return { doFirst: high.slice(0, 3),  ifTime: medium.slice(0, 3), later: [] };
  }
}

function greeting(name) {
  const h = new Date().getHours();
  const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  return `Good ${time}${name ? `, ${name}` : ''}.`;
}

function dateLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function priorityDotColor(priority, t) {
  if (priority === 'high')   return t.urgent;
  if (priority === 'medium') return t.accent;
  return t.border;
}

const PRIORITY_OPTIONS = [
  { key: 'high',   label: 'Urgent',  color: '#CC5A5A' },
  { key: 'medium', label: 'Normal',  color: '#5A5FD4' },
  { key: 'low',    label: 'Later',   color: '#C0BEC8' },
];

// ─── Component ───────────────────────────────────────
export default function TodayScreen({ navigation }) {
  const { userName, tasks, checkIn, saveCheckIn, finishTask, addTask, deleteTask, updateTask } = useApp();
  const { colors: t } = useTheme();

  const mood = checkIn?.mood ?? null;
  const setMood = (m) => saveCheckIn({ mood: m });

  const { doFirst, ifTime, later } = filterByMood(tasks, mood);
  const activeTasks = tasks.filter(t => !t.done);
  const allEmpty = activeTasks.length === 0;

  // Add task modal
  const [showAdd,    setShowAdd]    = useState(false);
  const [newText,    setNewText]    = useState('');
  const [newPrio,    setNewPrio]    = useState('medium');
  const [addLoading, setAddLoading] = useState(false);

  // Long-press menu
  const [menuTask, setMenuTask] = useState(null);

  // Edit modal
  const [editTask, setEditTask] = useState(null);
  const [editText, setEditText] = useState('');
  const [editPrio, setEditPrio] = useState('medium');

  const doAddTask = () => {
    if (!newText.trim()) return;
    addTask(newText.trim(), newPrio);
    setNewText('');
    setNewPrio('medium');
    setShowAdd(false);
  };

  const saveEdit = () => {
    if (!editText.trim()) return;
    updateTask(editTask.id, { text: editText.trim(), priority: editPrio });
    setEditTask(null);
  };

  const handleCheck = (task) => {
    finishTask(task.id);
  };

  const openGuide = (task) => {
    navigation.navigate('TaskGuide', { task });
  };

  // ─── Subcomponents ─────────────────────────────────

  const TaskCard = ({ task }) => (
    <TouchableOpacity
      style={[ss.taskCard, { backgroundColor: t.card, borderColor: t.border }]}
      onPress={() => openGuide(task)}
      onLongPress={() => setMenuTask(task)}
      activeOpacity={0.78}
    >
      <View style={[ss.dot, { backgroundColor: priorityDotColor(task.priority, t) }]} />
      <View style={ss.taskBody}>
        <Text style={[ss.taskText, { color: t.text }]} numberOfLines={2}>{task.text}</Text>
        {task.category ? (
          <Text style={[ss.taskMeta, { color: t.subtext }]}>
            {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
            {' · '}
            <Text style={{ color: t.accent }}>Tap for help →</Text>
          </Text>
        ) : (
          <Text style={[ss.taskMeta, { color: t.accent }]}>Tap for help →</Text>
        )}
      </View>
      <TouchableOpacity
        style={[ss.checkCircle, { borderColor: priorityDotColor(task.priority, t) }]}
        onPress={() => handleCheck(task)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const SectionBlock = ({ label, tasks: sectionTasks }) => {
    if (!sectionTasks || sectionTasks.length === 0) return null;
    return (
      <View style={ss.section}>
        <Text style={[ss.sectionLabel, { color: t.subtext }]}>{label}</Text>
        {sectionTasks.map(task => <TaskCard key={task.id} task={task} />)}
      </View>
    );
  };

  // ─── Render ────────────────────────────────────────
  return (
    <SafeAreaView style={[ss.safe, { backgroundColor: t.bg }]}>
      <ScrollView
        contentContainerStyle={ss.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* Header */}
        <View style={ss.header}>
          <View>
            <Text style={[ss.greeting, { color: t.text, fontFamily: Platform.OS === 'web' ? '"Outfit", sans-serif' : undefined }]}>
              {greeting(userName)}
            </Text>
            <Text style={[ss.dateLabel, { color: t.subtext }]}>{dateLabel()}</Text>
          </View>
          <TouchableOpacity
            style={[ss.addBtn, { backgroundColor: t.accent }]}
            onPress={() => setShowAdd(true)}
          >
            <Icon name="plus" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Mood row */}
        <View style={ss.moodBlock}>
          <Text style={[ss.moodLabel, { color: t.subtext }]}>How are you today?</Text>
          <View style={ss.moodPills}>
            {MOODS.map(m => {
              const selected = mood === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    ss.moodPill,
                    { backgroundColor: selected ? t.accentPale : t.card, borderColor: selected ? t.accent : t.border },
                  ]}
                  onPress={() => setMood(m.key)}
                  activeOpacity={0.75}
                >
                  <Text style={[ss.moodPillText, { color: selected ? t.accent : t.subtext }]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Mood insight */}
        {mood && (
          <View style={[ss.insight, { backgroundColor: t.accentPale }]}>
            <Text style={[ss.insightText, { color: t.accent }]}>{getMoodInsight(mood)}</Text>
          </View>
        )}

        {/* Task list */}
        {allEmpty ? (
          <View style={ss.empty}>
            <View style={[ss.emptyIcon, { backgroundColor: t.accentPale }]}>
              <Icon name="check-square" size={28} color={t.accent} />
            </View>
            <Text style={[ss.emptyHead, {
              color: t.text,
              fontFamily: Platform.OS === 'web' ? '"Outfit", sans-serif' : undefined,
            }]}>Nothing here yet</Text>
            <Text style={[ss.emptyBody, { color: t.subtext }]}>
              Add a task with the + button, or tell the Chat tab everything that's on your mind and it'll sort it out.
            </Text>
          </View>
        ) : (
          <>
            <SectionBlock label="DO FIRST" tasks={doFirst} />
            <SectionBlock label="IF YOU HAVE TIME" tasks={ifTime} />
            <SectionBlock label="LATER" tasks={later} />
            {/* Show hidden count when mood filters out tasks */}
            {mood && mood !== 'great' && (() => {
              const shown = (doFirst?.length ?? 0) + (ifTime?.length ?? 0) + (later?.length ?? 0);
              const hidden = activeTasks.length - shown;
              if (hidden <= 0) return null;
              return (
                <TouchableOpacity
                  style={[ss.hiddenNote, { borderColor: t.border }]}
                  onPress={() => setMood('great')}
                >
                  <Text style={[ss.hiddenNoteText, { color: t.subtext }]}>
                    +{hidden} more task{hidden !== 1 ? 's' : ''} hidden · tap to see all
                  </Text>
                </TouchableOpacity>
              );
            })()}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Add task modal ───────────────────────── */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <TouchableOpacity style={ss.modalOverlay} activeOpacity={1} onPress={() => setShowAdd(false)}>
          <View style={[ss.modalSheet, { backgroundColor: t.card }]}>
            <Text style={[ss.modalTitle, { color: t.text, fontFamily: Platform.OS === 'web' ? '"Outfit", sans-serif' : undefined }]}>
              Add a task
            </Text>
            <TextInput
              style={[ss.modalInput, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
              placeholder="What needs to get done?"
              placeholderTextColor={t.subtext}
              value={newText}
              onChangeText={setNewText}
              onSubmitEditing={doAddTask}
              returnKeyType="done"
              autoFocus
            />
            <View style={ss.prioRow}>
              {PRIORITY_OPTIONS.map(p => (
                <TouchableOpacity
                  key={p.key}
                  style={[
                    ss.prioPill,
                    { borderColor: newPrio === p.key ? p.color : t.border,
                      backgroundColor: newPrio === p.key ? p.color + '18' : t.bg },
                  ]}
                  onPress={() => setNewPrio(p.key)}
                >
                  <View style={[ss.prioDot, { backgroundColor: p.color }]} />
                  <Text style={[ss.prioLabel, { color: newPrio === p.key ? p.color : t.subtext }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[ss.modalSave, { backgroundColor: t.accent }, !newText.trim() && ss.modalSaveOff]}
              onPress={doAddTask}
              disabled={!newText.trim()}
            >
              <Text style={ss.modalSaveText}>Add task</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Task context menu ────────────────────── */}
      <Modal visible={!!menuTask} transparent animationType="slide" onRequestClose={() => setMenuTask(null)}>
        <TouchableOpacity style={ss.modalOverlay} activeOpacity={1} onPress={() => setMenuTask(null)}>
          <View style={[ss.menuSheet, { backgroundColor: t.card }]}>
            <Text style={[ss.menuTitle, { color: t.subtext }]} numberOfLines={1}>{menuTask?.text}</Text>
            <View style={[ss.menuDivider, { backgroundColor: t.border }]} />
            <TouchableOpacity style={ss.menuItem} onPress={() => { setEditTask(menuTask); setEditText(menuTask?.text ?? ''); setEditPrio(menuTask?.priority ?? 'medium'); setMenuTask(null); }}>
              <Icon name="edit-2" size={18} color={t.text} />
              <Text style={[ss.menuItemText, { color: t.text }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ss.menuItem} onPress={() => { finishTask(menuTask.id); setMenuTask(null); }}>
              <Icon name="check-circle" size={18} color={t.accent} />
              <Text style={[ss.menuItemText, { color: t.accent }]}>Mark done +5 pts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ss.menuItem} onPress={() => { deleteTask(menuTask.id); setMenuTask(null); }}>
              <Icon name="trash-2" size={18} color={t.urgent} />
              <Text style={[ss.menuItemText, { color: t.urgent }]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[ss.menuItem, { justifyContent: 'center' }]} onPress={() => setMenuTask(null)}>
              <Text style={[ss.menuItemText, { color: t.subtext }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Edit modal ───────────────────────────── */}
      <Modal visible={!!editTask} transparent animationType="slide" onRequestClose={() => setEditTask(null)}>
        <View style={[ss.modalOverlay, { justifyContent: 'flex-end' }]}>
          <View style={[ss.modalSheet, { backgroundColor: t.card }]}>
            <Text style={[ss.modalTitle, { color: t.text, fontFamily: Platform.OS === 'web' ? '"Outfit", sans-serif' : undefined }]}>Edit task</Text>
            <TextInput
              style={[ss.modalInput, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
              value={editText}
              onChangeText={setEditText}
              autoFocus
              placeholder="Task"
              placeholderTextColor={t.subtext}
            />
            <View style={ss.prioRow}>
              {PRIORITY_OPTIONS.map(p => (
                <TouchableOpacity
                  key={p.key}
                  style={[
                    ss.prioPill,
                    { borderColor: editPrio === p.key ? p.color : t.border,
                      backgroundColor: editPrio === p.key ? p.color + '18' : t.bg },
                  ]}
                  onPress={() => setEditPrio(p.key)}
                >
                  <View style={[ss.prioDot, { backgroundColor: p.color }]} />
                  <Text style={[ss.prioLabel, { color: editPrio === p.key ? p.color : t.subtext }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={ss.modalActions}>
              <TouchableOpacity style={[ss.modalCancel, { borderColor: t.border }]} onPress={() => setEditTask(null)}>
                <Text style={[ss.modalCancelText, { color: t.subtext }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[ss.modalSave, { flex: 2, backgroundColor: t.accent }]} onPress={saveEdit}>
                <Text style={ss.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────
const ss = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 22 },

  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 24,
  },
  greeting: {
    fontSize: 30, fontWeight: '800', letterSpacing: -0.5, lineHeight: 36,
  },
  dateLabel: { fontSize: 13, marginTop: 4, fontWeight: '500' },
  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },

  moodBlock: { marginBottom: 16 },
  moodLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.12,
    textTransform: 'uppercase', marginBottom: 10,
    fontFamily: Platform.OS === 'web' ? '"Outfit", sans-serif' : undefined,
  },
  moodPills:    { flexDirection: 'row', gap: 8 },
  moodPill:     {
    flex: 1, borderRadius: 20, borderWidth: 1.5,
    paddingVertical: 9, alignItems: 'center',
  },
  moodPillText: {
    fontSize: 13, fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Outfit", sans-serif' : undefined,
  },

  insight: { borderRadius: 14, padding: 13, marginBottom: 22 },
  insightText: { fontSize: 13, fontWeight: '500', lineHeight: 20 },

  section: { marginBottom: 18 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 0.14,
    textTransform: 'uppercase', marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? '"Outfit", sans-serif' : undefined,
  },

  taskCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1,
    padding: 14, marginBottom: 8, gap: 12,
    shadowColor: '#1A1918', shadowOpacity: 0.05,
    shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  taskBody: { flex: 1 },
  taskText: { fontSize: 15, fontWeight: '500', lineHeight: 22 },
  taskMeta: { fontSize: 11.5, marginTop: 3 },
  checkCircle: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, flexShrink: 0,
  },

  hiddenNote: {
    borderWidth: 1, borderRadius: 12, borderStyle: 'dashed',
    paddingVertical: 12, alignItems: 'center', marginBottom: 12,
  },
  hiddenNoteText: { fontSize: 12, fontWeight: '500' },

  empty: { alignItems: 'center', paddingTop: 52, paddingHorizontal: 24 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyHead: {
    fontSize: 22, fontWeight: '800', marginBottom: 10, letterSpacing: -0.3,
  },
  emptyBody: {
    fontSize: 14, textAlign: 'center', lineHeight: 23, maxWidth: 270,
  },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.38)', justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 44,
    gap: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalInput: {
    borderWidth: 1.5, borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 16, fontSize: 15,
  },
  prioRow: { flexDirection: 'row', gap: 8 },
  prioPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 12,
  },
  prioDot: { width: 7, height: 7, borderRadius: 3.5 },
  prioLabel: { fontSize: 12, fontWeight: '600' },
  modalSave: {
    paddingVertical: 14, borderRadius: 14, alignItems: 'center',
  },
  modalSaveOff: { opacity: 0.35 },
  modalSaveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  modalCancel: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 10 },

  // Context menu
  menuSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 8, paddingBottom: 44,
  },
  menuTitle: {
    fontSize: 12, textAlign: 'center', paddingVertical: 10, paddingHorizontal: 20,
  },
  menuDivider: { height: 1, marginBottom: 4 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, paddingHorizontal: 24,
  },
  menuItemText: { fontSize: 16, fontWeight: '500' },
});
