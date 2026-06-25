import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet, Platform, TextInput, Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const SECTIONS = [
  { key: 'high',   label: 'School & Health', labelColor: C.clay,    cbColor: C.pillPinkText, ptsColor: C.pillPinkText },
  { key: 'medium', label: 'Tasks',           labelColor: C.lavDark,  cbColor: C.lavDark,      ptsColor: C.lavDark     },
  { key: 'low',    label: 'Fun & Leisure',   labelColor: C.skyDark,  cbColor: C.skyDark,      ptsColor: C.skyDark     },
];

export default function TasksScreen({ navigation }) {
  const { tasks, totalPoints, toggleTask, deleteTask, updateTask } = useApp();
  const { colors: t } = useTheme();

  const [editTarget, setEditTarget] = useState(null);
  const [editText,   setEditText]   = useState('');
  const [editPrio,   setEditPrio]   = useState('medium');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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

  const confirmDelete = (task) => setDeleteConfirm(task);
  const doDelete = () => { deleteTask(deleteConfirm.id); setDeleteConfirm(null); };

  return (
    <SafeAreaView style={[ss.safe, { backgroundColor: t.bg }]}>
      <View style={[ss.header, { backgroundColor: t.bg, borderBottomColor: t.border }]}>
        <Text style={[ss.title, { color: C.lavDark }]}>Tasks</Text>
        <Text style={[ss.ptsTotal, { color: C.moss }]}>{totalPoints} pts</Text>
      </View>

      <ScrollView contentContainerStyle={ss.scroll} showsVerticalScrollIndicator={false}>
        {tasks.length === 0 ? (
          <View style={ss.empty}>
            <Feather name="check-circle" size={44} color={C.sageLight} style={{ marginBottom: 14 }} />
            <Text style={[ss.emptyHead, { color: t.text }]}>All clear</Text>
            <Text style={[ss.emptyText, { color: t.subtext }]}>
              Go to Chat, tell Bloom what's on your mind, and your tasks will appear here sorted by priority.
            </Text>
          </View>
        ) : (
          SECTIONS.map(sec => {
            const items = tasks.filter(tk => tk.priority === sec.key);
            if (!items.length) return null;
            return (
              <View key={sec.key} style={ss.group}>
                <Text style={[ss.sectionLabel, { color: sec.labelColor }]}>{sec.label.toUpperCase()}</Text>
                {items.map(task => (
                  <View
                    key={task.id}
                    style={[ss.taskCard, { backgroundColor: t.card, borderColor: t.border }, task.done && ss.taskCardDone]}
                  >
                    <TouchableOpacity
                      style={[ss.checkbox, { borderColor: task.done ? t.subtext : sec.cbColor }]}
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
                        style={[ss.taskText, { color: task.done ? t.subtext : t.text }, task.done && ss.taskTextDone]}
                        numberOfLines={2}
                      >
                        {task.text}
                      </Text>
                      {!task.done && <Text style={[ss.ptsLabel, { color: sec.ptsColor }]}>+5</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={ss.iconBtn} onPress={() => openEdit(task)}>
                      <Feather name="edit-2" size={13} color={t.subtext} />
                    </TouchableOpacity>
                    <TouchableOpacity style={ss.iconBtn} onPress={() => confirmDelete(task)}>
                      <Feather name="trash-2" size={13} color={t.subtext} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            );
          })
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

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
                  style={[ss.prioChip, { backgroundColor: t.bg, borderColor: editPrio === sec.key ? sec.labelColor : t.border, borderWidth: 2 }]}
                  onPress={() => setEditPrio(sec.key)}
                >
                  <Text style={[ss.prioChipText, { color: editPrio === sec.key ? sec.labelColor : t.subtext }]}>{sec.label}</Text>
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
              <TouchableOpacity style={[ss.modalSave, { backgroundColor: C.pillPinkText }]} onPress={doDelete}>
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
  ptsTotal: { fontSize: 14, fontWeight: '700' },

  scroll: { paddingHorizontal: 18, paddingTop: 18 },

  group: { marginBottom: 22 },
  sectionLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2, marginBottom: 10 },

  taskCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 14,
    borderWidth: 1, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  taskCardDone: { opacity: 0.55 },
  checkbox: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkFill: { width: 10, height: 10, borderRadius: 5 },
  taskBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  taskText: { flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 20 },
  taskTextDone: { textDecorationLine: 'line-through' },
  ptsLabel: { fontSize: 12, fontWeight: '700' },
  iconBtn: { padding: 5 },

  empty: { alignItems: 'center', paddingTop: 60, paddingBottom: 32, paddingHorizontal: 24 },
  emptyHead: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14 },
  modalBody:  { fontSize: 14, lineHeight: 22, marginBottom: 20 },
  modalLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },
  modalInput: {
    borderWidth: 1.5, borderRadius: 12,
    paddingVertical: 11, paddingHorizontal: 14,
    fontSize: 15, marginBottom: 18,
    minHeight: 80, textAlignVertical: 'top',
  },
  prioRow: { flexDirection: 'row', gap: 8, marginBottom: 22, flexWrap: 'wrap' },
  prioChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16 },
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
