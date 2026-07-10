import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  SafeAreaView, StyleSheet, Platform, ActivityIndicator, Modal,
} from 'react-native';
import Icon from '../components/Icon';
import { C, GOAL_ACCENTS } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { generateGoalAction } from '../services/ai';

export default function GoalsScreen({ navigation }) {
  const { goals, addGoal, deleteGoal, updateGoal } = useApp();
  const { colors: t } = useTheme();

  const [newGoal,   setNewGoal]   = useState('');
  const [showAdd,   setShowAdd]   = useState(false);
  const [creating,  setCreating]  = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editText,   setEditText]   = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [menuTarget, setMenuTarget] = useState(null);

  const handleAdd = async () => {
    const text = newGoal.trim();
    if (!text || creating) return;
    setCreating(true);
    try {
      const firstAction = await generateGoalAction({ goalText: text, completedActions: [] });
      addGoal(text, firstAction);
    } catch {
      addGoal(text, `Write down exactly what "${text}" looks like when it's done — be as specific as possible.`);
    } finally {
      setNewGoal('');
      setShowAdd(false);
      setCreating(false);
    }
  };

  const saveEdit = () => {
    if (!editText.trim()) return;
    updateGoal(editTarget.id, { text: editText.trim() });
    setEditTarget(null);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.titleRow}>
          <Text style={[s.title, { color: C.pinkDark }]}>Goals</Text>
          <TouchableOpacity onPress={() => setShowAdd(v => !v)}>
            <Text style={[s.addBtn, { color: C.moss }]}>+ Add goal</Text>
          </TouchableOpacity>
        </View>
        <Text style={[s.sub, { color: t.subtext }]}>Big things you're working toward.</Text>

        {showAdd && (
          <View style={[s.addCard, { backgroundColor: t.card, borderColor: t.border }]}>
            <TextInput
              style={[s.addInput, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
              placeholder="What big thing are you working toward?"
              placeholderTextColor={t.subtext}
              value={newGoal}
              onChangeText={setNewGoal}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
              autoFocus
              editable={!creating}
            />
            <TouchableOpacity
              style={[s.saveBtn, (!newGoal.trim() || creating) && s.saveBtnOff]}
              onPress={handleAdd}
              disabled={!newGoal.trim() || creating}
            >
              {creating
                ? <ActivityIndicator size="small" color={C.white} />
                : <Text style={s.saveBtnText}>Build my plan →</Text>}
            </TouchableOpacity>
            {creating && <Text style={[s.creatingNote, { color: t.subtext }]}>Building your first action…</Text>}
          </View>
        )}

        {goals.length === 0 && !showAdd ? (
          <View style={s.empty}>
            <Icon name="target" size={44} color={C.sageLight} style={{ marginBottom: 14 }} />
            <Text style={[s.emptyHead, { color: t.text }]}>No goals yet</Text>
            <Text style={[s.emptyText, { color: t.subtext }]}>
              Add something big — "Start a business", "Get fit", "Write a book". Bloom will generate a real step-by-step plan, one action at a time.
            </Text>
          </View>
        ) : (
          goals.map((g, idx) => {
            const accent = GOAL_ACCENTS[idx % GOAL_ACCENTS.length];
            return (
              <TouchableOpacity
                key={g.id}
                style={[s.goalCard, { backgroundColor: t.card, borderColor: t.border, borderLeftColor: accent }]}
                onPress={() => navigation.navigate('GoalDetail', { goal: g })}
                activeOpacity={0.82}
              >
                <View style={s.goalHeader}>
                  <Text style={[s.goalText, { color: t.text }]}>{g.text}</Text>
                  <TouchableOpacity style={s.menuBtn} onPress={() => setMenuTarget(g)}>
                    <Icon name="more-vertical" size={18} color={t.subtext} />
                  </TouchableOpacity>
                </View>
                {g.currentAction ? (
                  <View style={[s.actionBox, { backgroundColor: t.white ?? t.card, borderLeftColor: accent, borderColor: t.border }]}>
                    <Text style={[s.actionText, { color: t.text }]} numberOfLines={3}>{g.currentAction}</Text>
                  </View>
                ) : (
                  <Text style={[s.nextActionText, { color: t.subtext }]}>Tap to generate your first action.</Text>
                )}
                {g.completedActions?.length > 0 && (
                  <View style={s.progressRow}>
                    <View style={[s.progressTrack, { backgroundColor: t.border }]}>
                      <View style={[s.progressFill, { backgroundColor: accent, width: `${Math.min((g.completedActions.length / (g.completedActions.length + 1)) * 100, 85)}%` }]} />
                    </View>
                    <Text style={[s.progressText, { color: t.subtext }]}>{g.completedActions.length} done</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* Goal action menu */}
      <Modal visible={!!menuTarget} transparent animationType="slide" onRequestClose={() => setMenuTarget(null)}>
        <TouchableOpacity style={s.menuOverlay} activeOpacity={1} onPress={() => setMenuTarget(null)}>
          <View style={[s.menuSheet, { backgroundColor: t.card }]}>
            <Text style={[s.menuItemTitle, { color: t.subtext }]} numberOfLines={1}>{menuTarget?.text}</Text>
            <View style={[s.menuDivider, { backgroundColor: t.border }]} />
            <TouchableOpacity style={s.menuItem} onPress={() => { setEditTarget(menuTarget); setEditText(menuTarget?.text ?? ''); setMenuTarget(null); }}>
              <Icon name="edit-2" size={18} color={t.text} />
              <Text style={[s.menuItemText, { color: t.text }]}>Edit goal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.menuItem} onPress={() => { setDeleteConfirm(menuTarget); setMenuTarget(null); }}>
              <Icon name="trash-2" size={18} color={C.pinkDark} />
              <Text style={[s.menuItemText, { color: C.pinkDark }]}>Remove goal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.menuItem, { justifyContent: 'center' }]} onPress={() => setMenuTarget(null)}>
              <Text style={[s.menuItemText, { color: t.subtext }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit modal */}
      <Modal visible={!!editTarget} transparent animationType="slide" onRequestClose={() => setEditTarget(null)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: t.card }]}>
            <Text style={[s.modalTitle, { color: t.text }]}>Edit goal</Text>
            <TextInput
              style={[s.modalInput, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
              value={editText}
              onChangeText={setEditText}
              autoFocus
              placeholder="Goal title"
              placeholderTextColor={t.subtext}
            />
            <Text style={[s.modalNote, { color: t.subtext }]}>Your progress and actions are kept as-is.</Text>
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.modalCancel, { borderColor: t.border }]} onPress={() => setEditTarget(null)}>
                <Text style={[s.modalCancelText, { color: t.subtext }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSave} onPress={saveEdit}>
                <Text style={s.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete confirm */}
      <Modal visible={!!deleteConfirm} transparent animationType="fade" onRequestClose={() => setDeleteConfirm(null)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: t.card }]}>
            <Text style={[s.modalTitle, { color: t.text }]}>Remove goal?</Text>
            <Text style={[s.modalNote, { color: t.subtext }]} numberOfLines={2}>"{deleteConfirm?.text}"</Text>
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.modalCancel, { borderColor: t.border }]} onPress={() => setDeleteConfirm(null)}>
                <Text style={[s.modalCancelText, { color: t.subtext }]}>Keep</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalSave, { backgroundColor: C.pinkDark }]} onPress={() => { deleteGoal(deleteConfirm.id); setDeleteConfirm(null); }}>
                <Text style={s.modalSaveText}>Remove</Text>
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

  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: {
    fontSize: 30, fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined,
  },
  addBtn: { fontSize: 14, fontWeight: '700' },
  sub: { fontSize: 14, lineHeight: 22, marginBottom: 20 },

  addCard: {
    borderRadius: 16, borderWidth: 1.5,
    padding: 16, marginBottom: 16, gap: 10,
  },
  addInput: {
    borderWidth: 1.5, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 14, fontSize: 15,
  },
  saveBtn: {
    backgroundColor: C.moss, paddingVertical: 13,
    paddingHorizontal: 18, borderRadius: 12, alignItems: 'center',
  },
  saveBtnOff: { opacity: 0.35 },
  saveBtnText: { color: C.white, fontWeight: '700', fontSize: 15 },
  creatingNote: { fontSize: 12, textAlign: 'center' },

  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 16 },
  emptyHead: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22, maxWidth: 300 },

  goalCard: {
    borderRadius: 18, borderWidth: 1, borderLeftWidth: 4,
    padding: 18, marginBottom: 14,
    shadowColor: '#2A3A2C', shadowOpacity: 0.09, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 10, marginBottom: 10,
  },
  menuBtn: { padding: 6 },
  goalText: { flex: 1, fontSize: 17, fontWeight: '700', lineHeight: 26 },
  nextActionText: { fontSize: 14, lineHeight: 22 },

  actionBox: {
    borderLeftWidth: 3, borderWidth: 1,
    borderRadius: 10, padding: 12,
    marginTop: 4,
  },
  actionText: { fontSize: 14, lineHeight: 21 },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  progressText: { fontSize: 11, fontWeight: '600' },

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

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitle:  { fontSize: 18, fontWeight: '700', marginBottom: 14 },
  modalNote:   { fontSize: 13, lineHeight: 20, marginBottom: 20 },
  modalInput: {
    borderWidth: 1.5, borderRadius: 12,
    paddingVertical: 11, paddingHorizontal: 14,
    fontSize: 15, marginBottom: 8,
  },
  modalActions:     { flexDirection: 'row', gap: 10 },
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
