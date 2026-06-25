import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet, Platform, TextInput, Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

// Section metadata
const SECTIONS = [
  {
    key: 'high',
    label: 'School & Health',
    pillBg:   C.pillPinkBg,
    pillText: C.pillPinkText,
    cbColor:  C.pillPinkText,
  },
  {
    key: 'medium',
    label: 'Tasks',
    pillBg:   C.pillLavBg,
    pillText: C.pillLavText,
    cbColor:  C.pillLavText,
  },
  {
    key: 'low',
    label: 'Fun & Leisure',
    pillBg:   C.pillSkyBg,
    pillText: C.pillSkyText,
    cbColor:  C.pillSkyText,
  },
];

const PRIORITY_CATS = ['high', 'medium', 'low'];

export default function TasksScreen({ navigation }) {
  const { tasks, totalPoints, toggleTask, deleteTask, updateTask } = useApp();
  const { colors: t } = useTheme();

  const [editTarget, setEditTarget] = useState(null); // { id, text, priority }
  const [editText,   setEditText]   = useState('');
  const [editPrio,   setEditPrio]   = useState('medium');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const pending = tasks.filter(t => !t.done);
  const done    = tasks.filter(t =>  t.done);

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
        <View style={[ss.ptsWrap, { backgroundColor: t.sagePale }]}>
          <Text style={[ss.ptsTotal, { color: C.moss }]}>{totalPoints} pts</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={ss.scroll} showsVerticalScrollIndicator={false}>
        {pending.length === 0 ? (
          <View style={ss.empty}>
            <Feather name="check-circle" size={44} color={C.sage} style={{ marginBottom: 14 }} />
            <Text style={[ss.emptyHead, { color: t.text }]}>All clear</Text>
            <Text style={[ss.emptyText, { color: t.subtext }]}>
              Go to Chat, tell Bloom what's on your mind, and your tasks will appear here sorted by priority.
            </Text>
          </View>
        ) : (
          SECTIONS.map(sec => {
            const items = pending.filter(t => t.priority === sec.key);
            if (!items.length) return null;
            return (
              <View key={sec.key} style={ss.group}>
                <View style={[ss.sectionPill, { backgroundColor: sec.pillBg }]}>
                  <Text style={[ss.sectionLabel, { color: sec.pillText }]}>{sec.label.toUpperCase()}</Text>
                </View>
                {items.map(task => (
                  <View key={task.id} style={[ss.taskCard, { backgroundColor: t.card, borderColor: t.border }]}>
                    <TouchableOpacity
                      style={[ss.checkbox, { borderColor: sec.cbColor }]}
                      onPress={() => toggleTask(task.id)}
                      activeOpacity={0.7}
                    >
                      <View style={{ width: 10, height: 10 }} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={ss.taskBody}
                      onPress={() => navigation.navigate('TaskGuide', { task })}
                      activeOpacity={0.72}
                    >
                      <Text style={[ss.taskText, { color: t.text }]} numberOfLines={2}>{task.text}</Text>
                      <View style={[ss.pts, { backgroundColor: t.goldPale }]}>
                        <Text style={[ss.ptsText, { color: C.gold }]}>+5</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={ss.iconBtn} onPress={() => openEdit(task)}>
                      <Feather name="edit-2" size={14} color={t.subtext} />
                    </TouchableOpacity>
                    <TouchableOpacity style={ss.iconBtn} onPress={() => confirmDelete(task)}>
                      <Feather name="trash-2" size={14} color={t.subtext} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            );
          })
        )}

        {done.length > 0 && (
          <View style={ss.doneSection}>
            <Text style={[ss.doneLabel, { color: t.subtext }]}>DONE</Text>
            {done.slice(-5).reverse().map(task => (
              <View key={task.id} style={[ss.doneCard, { backgroundColor: t.sagePale }]}>
                <Feather name="check" size={13} color={C.moss} />
                <Text style={[ss.doneText, { color: t.subtext }]} numberOfLines={1}>{task.text}</Text>
                <TouchableOpacity onPress={() => confirmDelete(task)}>
                  <Feather name="x" size={13} color={t.subtext} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
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
                  style={[ss.prioChip, { backgroundColor: sec.pillBg, borderColor: editPrio === sec.key ? sec.pillText : 'transparent', borderWidth: 2 }]}
                  onPress={() => setEditPrio(sec.key)}
                >
                  <Text style={[ss.prioChipText, { color: sec.pillText }]}>{sec.label}</Text>
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
  ptsWrap: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  ptsTotal: { fontSize: 13, fontWeight: '700' },

  scroll: { paddingHorizontal: 18, paddingTop: 18 },

  group: { marginBottom: 18 },
  sectionPill: {
    alignSelf: 'flex-start', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5, marginBottom: 10,
  },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },

  taskCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 12,
    borderWidth: 1, marginBottom: 6,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  taskBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  taskText: { flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 20 },
  pts: { borderRadius: 8, paddingVertical: 2, paddingHorizontal: 6 },
  ptsText: { fontSize: 11, fontWeight: '700' },
  iconBtn: { padding: 6 },

  empty: { alignItems: 'center', paddingTop: 60, paddingBottom: 32, paddingHorizontal: 24 },
  emptyHead: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },

  doneSection: { marginTop: 8, marginBottom: 4 },
  doneLabel:   { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 8 },
  doneCard: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4,
  },
  doneText: { flex: 1, fontSize: 13, fontWeight: '500' },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
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
