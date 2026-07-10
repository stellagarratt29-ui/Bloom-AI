import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet, Platform, TextInput, Modal,
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
  { key: 'high',   pillBg: C.pillPinkBg, pillText: C.pillPinkText, cbColor: C.pillPinkText },
  { key: 'medium', label: 'Tasks',       pillBg: C.pillLavBg,  pillText: C.pillLavText,  cbColor: C.pillLavText  },
  { key: 'low',    label: 'Fun & Leisure', pillBg: C.pillSkyBg, pillText: C.pillSkyText,  cbColor: C.pillSkyText  },
];

export default function TasksScreen({ navigation }) {
  const { tasks, toggleTask, deleteTask, updateTask, addTask, ndToggles, userOccupation } = useApp();
  const SECTIONS = SECTION_BASE.map(s => s.key === 'high' ? { ...s, label: getHighLabel(userOccupation) } : s);
  const { colors: t } = useTheme();
  const reducedClutter = !!ndToggles?.reducedClutter;
  const ideaCapture    = !!ndToggles?.ideaCapture;

  const [editTarget,    setEditTarget]    = useState(null);
  const [editText,      setEditText]      = useState('');
  const [editPrio,      setEditPrio]      = useState('medium');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [menuTarget,    setMenuTarget]    = useState(null);
  const [showAddTask,   setShowAddTask]   = useState(false);
  const [newTaskText,   setNewTaskText]   = useState('');
  const [newTaskPrio,   setNewTaskPrio]   = useState('medium');

  const openEdit = (task) => {
    setEditTarget(task);
    setEditText(task.text);
    setEditPrio(task.priority ?? 'medium');
  };

  const saveEdit = () => {
    if (!editText.trim()) return;
    updateTask(editTarget.id, { text: editText.trim(), priority: editPrio });
    setEditTarget(null);
  };

  const doAddTask = () => {
    if (!newTaskText.trim()) return;
    addTask(newTaskText.trim(), newTaskPrio);
    setNewTaskText('');
    setNewTaskPrio('medium');
    setShowAddTask(false);
  };

  const activeTasks = tasks.filter(tk => !tk.done);
  const doneTasks   = tasks.filter(tk => tk.done);

  const TaskCard = ({ task, sec, isDone }) => (
    <View style={[
      ss.taskCard,
      { backgroundColor: t.card, borderColor: t.border },
      isDone && ss.taskCardDone,
      reducedClutter && ss.taskCardSlim,
    ]}>
      <TouchableOpacity
        style={[ss.checkbox, { borderColor: isDone ? t.subtext : (sec?.cbColor ?? t.subtext) }]}
        onPress={() => toggleTask(task.id)}
        activeOpacity={0.7}
      >
        {task.done && <View style={[ss.checkFill, { backgroundColor: t.subtext }]} />}
      </TouchableOpacity>
      <TouchableOpacity
        style={ss.taskBody}
        onPress={() => !task.done && navigation.navigate('TaskGuide', { task })}
        activeOpacity={0.72}
      >
        <Text
          style={[ss.taskText, { color: isDone ? t.subtext : t.text }, isDone && ss.taskTextDone,
            reducedClutter && { fontSize: 14 }]}
          numberOfLines={reducedClutter ? 1 : 2}
        >
          {task.text}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={ss.menuBtn} onPress={() => setMenuTarget(task)}>
        <Icon name="more-vertical" size={18} color={t.subtext} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[ss.safe, { backgroundColor: t.bg }]}>
      <View style={[ss.header, { backgroundColor: t.bg, borderBottomColor: t.border }]}>
        <Text style={[ss.title, { color: C.clay }]}>Tasks</Text>
        <View style={ss.headerRight}>
          <TouchableOpacity style={[ss.addTaskBtn, { backgroundColor: C.clay }]} onPress={() => setShowAddTask(true)}>
            <Icon name="plus" size={14} color={C.white} />
            <Text style={ss.addTaskBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={ss.scroll} showsVerticalScrollIndicator={false}>
        {tasks.length === 0 ? (
          <View style={ss.empty}>
            <Icon name="check-circle" size={44} color={C.sageLight} style={{ marginBottom: 14 }} />
            <Text style={[ss.emptyHead, { color: t.text }]}>All clear</Text>
            <Text style={[ss.emptyText, { color: t.subtext }]}>
              Go to Chat, tell Bloom what's on your mind, and your tasks will appear here sorted by priority.
            </Text>
          </View>
        ) : (
          <>
            {SECTIONS.map(sec => {
              const items = activeTasks.filter(tk => tk.priority === sec.key);
              if (!items.length) return null;
              return (
                <View key={sec.key} style={ss.group}>
                  <View style={[ss.sectionPill, { backgroundColor: sec.pillBg }]}>
                    <Text style={[ss.sectionLabel, { color: sec.pillText }]}>{sec.label.toUpperCase()}</Text>
                  </View>
                  {items.map(task => (
                    <TaskCard key={task.id} task={task} sec={sec} isDone={false} />
                  ))}
                </View>
              );
            })}

            {doneTasks.length > 0 && (
              <View style={ss.group}>
                <View style={[ss.sectionPill, { backgroundColor: t.border }]}>
                  <Text style={[ss.sectionLabel, { color: t.subtext }]}>DONE</Text>
                </View>
                {doneTasks.map(task => (
                  <TaskCard key={task.id} task={task} sec={null} isDone={true} />
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* Idea capture FAB (shown when ideaCapture toggle is on) */}
      {ideaCapture && (
        <TouchableOpacity
          style={[ss.ideaFab, { backgroundColor: C.clay }]}
          onPress={() => setShowAddTask(true)}
          activeOpacity={0.85}
        >
          <Text style={ss.ideaFabText}>💡 Quick capture</Text>
        </TouchableOpacity>
      )}

      {/* Three-dot action menu */}
      <Modal visible={!!menuTarget} transparent animationType="slide" onRequestClose={() => setMenuTarget(null)}>
        <TouchableOpacity style={ss.menuOverlay} activeOpacity={1} onPress={() => setMenuTarget(null)}>
          <View style={[ss.menuSheet, { backgroundColor: t.card }]}>
            <Text style={[ss.menuItemTitle, { color: t.subtext }]} numberOfLines={1}>{menuTarget?.text}</Text>
            <View style={[ss.menuDivider, { backgroundColor: t.border }]} />
            <TouchableOpacity style={ss.menuItem} onPress={() => { openEdit(menuTarget); setMenuTarget(null); }}>
              <Icon name="edit-2" size={18} color={t.text} />
              <Text style={[ss.menuItemText, { color: t.text }]}>Edit task</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ss.menuItem} onPress={() => { setDeleteConfirm(menuTarget); setMenuTarget(null); }}>
              <Icon name="trash-2" size={18} color={C.pinkDark} />
              <Text style={[ss.menuItemText, { color: C.pinkDark }]}>Delete task</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[ss.menuItem, { justifyContent: 'center' }]} onPress={() => setMenuTarget(null)}>
              <Text style={[ss.menuItemText, { color: t.subtext }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add Task modal */}
      <Modal visible={showAddTask} transparent animationType="slide" onRequestClose={() => setShowAddTask(false)}>
        <View style={ss.modalOverlay}>
          <View style={[ss.modalCard, { backgroundColor: t.card }]}>
            <Text style={[ss.modalTitle, { color: t.text }]}>Add task</Text>
            <TextInput
              style={[ss.modalInput, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
              value={newTaskText}
              onChangeText={setNewTaskText}
              autoFocus
              placeholder="What do you need to do?"
              placeholderTextColor={t.subtext}
              multiline
            />
            <Text style={[ss.modalLabel, { color: t.subtext }]}>CATEGORY</Text>
            <View style={ss.prioRow}>
              {SECTIONS.map(sec => (
                <TouchableOpacity
                  key={sec.key}
                  style={[ss.prioChip, {
                    backgroundColor: newTaskPrio === sec.key ? sec.pillBg : t.bg,
                    borderColor: newTaskPrio === sec.key ? sec.pillText : t.border,
                    borderWidth: 2,
                  }]}
                  onPress={() => setNewTaskPrio(sec.key)}
                >
                  <Text style={[ss.prioChipText, { color: newTaskPrio === sec.key ? sec.pillText : t.subtext }]}>{sec.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={ss.modalActions}>
              <TouchableOpacity
                style={[ss.modalCancel, { borderColor: t.border }]}
                onPress={() => { setShowAddTask(false); setNewTaskText(''); setNewTaskPrio('medium'); }}
              >
                <Text style={[ss.modalCancelText, { color: t.subtext }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[ss.modalSave, !newTaskText.trim() && { opacity: 0.4 }]}
                onPress={doAddTask}
                disabled={!newTaskText.trim()}
              >
                <Text style={ss.modalSaveText}>Add task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit modal */}
      <Modal visible={!!editTarget} transparent animationType="slide" onRequestClose={() => setEditTarget(null)}>
        <View style={ss.modalOverlay}>
          <View style={[ss.modalCard, { backgroundColor: t.card }]}>
            <Text style={[ss.modalTitle, { color: t.text }]}>Edit task</Text>
            <TextInput
              style={[ss.modalInput, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
              value={editText}
              onChangeText={setEditText}
              autoFocus
              placeholder="Task description"
              placeholderTextColor={t.subtext}
              multiline
            />
            <Text style={[ss.modalLabel, { color: t.subtext }]}>CATEGORY</Text>
            <View style={ss.prioRow}>
              {SECTIONS.map(sec => (
                <TouchableOpacity
                  key={sec.key}
                  style={[ss.prioChip, {
                    backgroundColor: editPrio === sec.key ? sec.pillBg : t.bg,
                    borderColor: editPrio === sec.key ? sec.pillText : t.border,
                    borderWidth: 2,
                  }]}
                  onPress={() => setEditPrio(sec.key)}
                >
                  <Text style={[ss.prioChipText, { color: editPrio === sec.key ? sec.pillText : t.subtext }]}>{sec.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={ss.modalActions}>
              <TouchableOpacity style={[ss.modalCancel, { borderColor: t.border }]} onPress={() => setEditTarget(null)}>
                <Text style={[ss.modalCancelText, { color: t.subtext }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ss.modalSave} onPress={saveEdit}>
                <Text style={ss.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete confirm modal */}
      <Modal visible={!!deleteConfirm} transparent animationType="fade" onRequestClose={() => setDeleteConfirm(null)}>
        <View style={ss.modalOverlay}>
          <View style={[ss.modalCard, { backgroundColor: t.card }]}>
            <Text style={[ss.modalTitle, { color: t.text }]}>Remove task?</Text>
            <Text style={[ss.modalBody, { color: t.subtext }]} numberOfLines={2}>"{deleteConfirm?.text}"</Text>
            <View style={ss.modalActions}>
              <TouchableOpacity style={[ss.modalCancel, { borderColor: t.border }]} onPress={() => setDeleteConfirm(null)}>
                <Text style={[ss.modalCancelText, { color: t.subtext }]}>Keep</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[ss.modalSave, { backgroundColor: C.pinkDark }]} onPress={() => { deleteTask(deleteConfirm.id); setDeleteConfirm(null); }}>
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
    paddingHorizontal: 22, paddingTop: 18, paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 30, fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addTaskBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  addTaskBtnText: { fontSize: 13, fontWeight: '700', color: C.white },

  scroll: { paddingHorizontal: 18, paddingTop: 18 },

  group: { marginBottom: 22 },
  sectionPill: {
    alignSelf: 'flex-start',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    marginBottom: 10,
  },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },

  taskCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 14,
    borderWidth: 1, marginBottom: 8,
    shadowColor: '#2A2420', shadowOpacity: 0.09, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  taskCardDone: { opacity: 0.55 },
  taskCardSlim: { paddingVertical: 10, marginBottom: 10 },
  ideaFab: {
    position: 'absolute', bottom: 20, right: 18,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 11, paddingHorizontal: 16, borderRadius: 22,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  ideaFabText: { fontSize: 13, fontWeight: '700', color: C.white },
  checkbox: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkFill: { width: 10, height: 10, borderRadius: 5 },
  taskBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  taskText: { flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 20 },
  taskTextDone: { textDecorationLine: 'line-through' },
  menuBtn: { padding: 6 },

  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  menuSheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 8, paddingBottom: 40,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  menuItemTitle: { fontSize: 12, textAlign: 'center', paddingVertical: 10, paddingHorizontal: 20 },
  menuDivider: { height: 1, marginBottom: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 24 },
  menuItemText: { fontSize: 16, fontWeight: '500' },

  empty: { alignItems: 'center', paddingTop: 60, paddingBottom: 32, paddingHorizontal: 24 },
  emptyHead: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  modalTitle:  { fontSize: 18, fontWeight: '700', marginBottom: 14 },
  modalBody:   { fontSize: 14, lineHeight: 22, marginBottom: 20 },
  modalLabel:  { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },
  modalInput: {
    borderWidth: 1.5, borderRadius: 12,
    paddingVertical: 11, paddingHorizontal: 14,
    fontSize: 15, marginBottom: 18,
    minHeight: 64, textAlignVertical: 'top',
  },
  prioRow: { flexDirection: 'row', gap: 7, marginBottom: 22, flexWrap: 'wrap' },
  prioChip: { paddingVertical: 7, paddingHorizontal: 11, borderRadius: 16 },
  prioChipText: { fontSize: 12, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 10 },
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
