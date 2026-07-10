import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  SafeAreaView, StyleSheet, Platform, ActivityIndicator, Modal,
} from 'react-native';
import Icon from '../components/Icon';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { generateHobbyCurriculum } from '../services/ai';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const HOBBY_EMOJIS = ['🎨', '🎵', '🌱', '✨', '🎯', '📚', '🏃', '🎭', '🍳', '💻', '📷', '🎸'];

const BADGE_GRADIENTS = [
  ['#F2DBC8', '#E8C8B8'],
  ['#D8E4D0', '#C8D8C0'],
  ['#E8D8C0', '#D4C4A8'],
  ['#F0E0D0', '#E8D0C0'],
  ['#C8D8D4', '#B8C8C4'],
  ['#E4D8CC', '#D4C8B8'],
];

export default function HobbiesScreen({ navigation }) {
  const { hobbies, addHobby, removeHobby, updateHobby } = useApp();
  const { colors: t } = useTheme();

  const [showAdd,     setShowAdd]     = useState(false);
  const [hobbyName,   setHobbyName]   = useState('');
  const [skillLevel,  setSkillLevel]  = useState('Beginner');
  const [generating,  setGenerating]  = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [editName,    setEditName]    = useState('');
  const [editSkill,   setEditSkill]   = useState('Beginner');
  const [regen,       setRegen]       = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [menuTarget, setMenuTarget] = useState(null);
  const generatingIds = useRef(new Set());

  // Auto-generate curricula for hobbies that arrived from onboarding with no milestones
  useEffect(() => {
    hobbies.forEach(h => {
      if (!h.milestones?.length && !generatingIds.current.has(h.id)) {
        generatingIds.current.add(h.id);
        generateHobbyCurriculum({ hobbyName: h.name, skillLevel: h.skillLevel ?? 'beginner' })
          .then(milestones => updateHobby(h.id, {}, milestones))
          .catch(() => {})
          .finally(() => generatingIds.current.delete(h.id));
      }
    });
  }, [hobbies]);

  const handleAdd = async () => {
    const name = hobbyName.trim();
    if (!name || generating) return;
    setGenerating(true);
    try {
      const milestones = await generateHobbyCurriculum({ hobbyName: name, skillLevel: skillLevel.toLowerCase() });
      addHobby(name, skillLevel.toLowerCase(), milestones);
      setHobbyName('');
      setSkillLevel('Beginner');
      setShowAdd(false);
    } finally {
      setGenerating(false);
    }
  };

  const openEdit = (h) => {
    setEditTarget(h);
    setEditName(h.name);
    setEditSkill(h.skillLevel.charAt(0).toUpperCase() + h.skillLevel.slice(1));
  };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    const nameChanged = editName.trim().toLowerCase() !== editTarget.name.toLowerCase();
    if (nameChanged) {
      setRegen(true);
      try {
        const milestones = await generateHobbyCurriculum({ hobbyName: editName.trim(), skillLevel: editSkill.toLowerCase() });
        updateHobby(editTarget.id, { name: editName.trim(), skillLevel: editSkill.toLowerCase() }, milestones);
      } catch {
        updateHobby(editTarget.id, { name: editName.trim(), skillLevel: editSkill.toLowerCase() });
      } finally {
        setRegen(false);
      }
    } else {
      updateHobby(editTarget.id, { name: editName.trim(), skillLevel: editSkill.toLowerCase() });
    }
    setEditTarget(null);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.titleRow}>
          <Text style={[s.title, { color: C.moss }]}>Grow</Text>
          <TouchableOpacity onPress={() => navigation.navigate('YearReview')} style={s.yearBtn}>
            <Text style={[s.yearBtnText, { color: C.clay }]}>Year in review ✦</Text>
          </TouchableOpacity>
        </View>
        <Text style={[s.sub, { color: t.subtext }]}>Hobbies you're building, one milestone at a time.</Text>

        {hobbies.length === 0 && !showAdd && (
          <View style={s.empty}>
            <Icon name="sun" size={44} color={C.sageLight} style={{ marginBottom: 14 }} />
            <Text style={[s.emptyHead, { color: t.text }]}>Nothing here yet</Text>
            <Text style={[s.emptyText, { color: t.subtext }]}>
              Add any hobby — guitar, watercolour, running, anything. Bloom will build you a real curriculum.
            </Text>
          </View>
        )}

        {hobbies.map((h, idx) => {
          const total = h.milestones?.length ?? 1;
          const done  = h.milestoneIndex ?? 0;
          const emoji = HOBBY_EMOJIS[idx % HOBBY_EMOJIS.length];
          const gradColors = BADGE_GRADIENTS[idx % BADGE_GRADIENTS.length];
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <TouchableOpacity
              key={h.id}
              style={[s.hobbyCard, { backgroundColor: t.card, borderColor: t.border }]}
              onPress={() => navigation.navigate('HobbyDetail', { hobby: h })}
              activeOpacity={0.82}
            >
              <View style={s.hobbyCardTop}>
                <View style={[
                  s.emojiCircle,
                  Platform.OS === 'web'
                    ? { background: `linear-gradient(135deg, ${gradColors[0]}, ${gradColors[1]})` }
                    : { backgroundColor: gradColors[0] },
                ]}>
                  <Text style={s.hobbyEmoji}>{emoji}</Text>
                </View>
                <Text style={[s.hobbyName, { color: t.text }]}>{h.name}</Text>
                <TouchableOpacity style={s.menuBtn} onPress={() => setMenuTarget(h)}>
                  <Icon name="more-vertical" size={18} color={t.subtext} />
                </TouchableOpacity>
              </View>
              <View style={[s.progressTrack, { backgroundColor: t.border }]}>
                <View style={[s.progressFill, { backgroundColor: C.moss, width: `${pct}%` }]} />
              </View>
              <Text style={[s.milestoneLabel, { color: t.subtext }]}>MILESTONE {done + 1} OF {total}</Text>
              <Text style={[s.hobbyMilestone, { color: t.text }]} numberOfLines={3}>{h.currentMilestone}</Text>
            </TouchableOpacity>
          );
        })}

        {showAdd ? (
          <View style={[s.addCard, { backgroundColor: t.card, borderColor: t.border }]}>
            <Text style={[s.addCardTitle, { color: t.text }]}>Add a hobby</Text>
            <TextInput
              style={[s.addInput, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
              placeholder="e.g. Watercolour, Guitar, Running, Baking…"
              placeholderTextColor={t.subtext}
              value={hobbyName}
              onChangeText={setHobbyName}
              autoFocus
              returnKeyType="done"
              editable={!generating}
            />
            <Text style={[s.addLabel, { color: t.subtext }]}>SKILL LEVEL</Text>
            <View style={s.levelRow}>
              {SKILL_LEVELS.map(l => (
                <TouchableOpacity
                  key={l}
                  style={[s.levelChip, { borderColor: t.border, backgroundColor: t.bg }, skillLevel === l && s.levelChipActive]}
                  onPress={() => setSkillLevel(l)}
                >
                  <Text style={[s.levelChipText, { color: t.subtext }, skillLevel === l && { color: C.moss }]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.addActions}>
              <TouchableOpacity style={[s.cancelBtn, { borderColor: t.border }]} onPress={() => { setShowAdd(false); setHobbyName(''); }}>
                <Text style={[s.cancelBtnText, { color: t.subtext }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.createBtn, (!hobbyName.trim() || generating) && s.createBtnOff]}
                onPress={handleAdd}
                disabled={!hobbyName.trim() || generating}
              >
                {generating
                  ? <ActivityIndicator size="small" color={C.white} />
                  : <Text style={s.createBtnText}>Build my curriculum →</Text>}
              </TouchableOpacity>
            </View>
            {generating && <Text style={[s.generatingNote, { color: t.subtext }]}>Building your curriculum…</Text>}
          </View>
        ) : (
          <TouchableOpacity style={[s.addBtn, { borderColor: C.clayLight }]} onPress={() => setShowAdd(true)}>
            <Icon name="plus" size={16} color={C.clay} />
            <Text style={[s.addBtnText, { color: C.clay }]}>Add a hobby</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* Three-dot action menu */}
      <Modal visible={!!menuTarget} transparent animationType="slide" onRequestClose={() => setMenuTarget(null)}>
        <TouchableOpacity style={s.menuOverlay} activeOpacity={1} onPress={() => setMenuTarget(null)}>
          <View style={[s.menuSheet, { backgroundColor: t.card }]}>
            <Text style={[s.menuItemTitle, { color: t.subtext }]} numberOfLines={1}>{menuTarget?.name}</Text>
            <View style={[s.menuDivider, { backgroundColor: t.border }]} />
            <TouchableOpacity style={s.menuItem} onPress={() => { openEdit(menuTarget); setMenuTarget(null); }}>
              <Icon name="edit-2" size={18} color={t.text} />
              <Text style={[s.menuItemText, { color: t.text }]}>Edit hobby</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.menuItem} onPress={() => { setDeleteConfirm(menuTarget); setMenuTarget(null); }}>
              <Icon name="trash-2" size={18} color={C.pinkDark} />
              <Text style={[s.menuItemText, { color: C.pinkDark }]}>Remove hobby</Text>
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
            <Text style={[s.modalTitle, { color: t.text }]}>Edit hobby</Text>
            <Text style={[s.modalLabel, { color: t.subtext }]}>NAME</Text>
            <TextInput
              style={[s.modalInput, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
              value={editName}
              onChangeText={setEditName}
              autoFocus
              placeholder="Hobby name"
              placeholderTextColor={t.subtext}
            />
            <Text style={[s.modalNote, { color: t.subtext }]}>Changing the name substantially will regenerate milestones.</Text>
            <Text style={[s.modalLabel, { color: t.subtext }]}>SKILL LEVEL</Text>
            <View style={s.levelRow}>
              {SKILL_LEVELS.map(l => (
                <TouchableOpacity
                  key={l}
                  style={[s.levelChip, { borderColor: t.border, backgroundColor: t.bg }, editSkill === l && s.levelChipActive]}
                  onPress={() => setEditSkill(l)}
                >
                  <Text style={[s.levelChipText, { color: t.subtext }, editSkill === l && { color: C.moss }]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.modalCancel, { borderColor: t.border }]} onPress={() => setEditTarget(null)}>
                <Text style={[s.modalCancelText, { color: t.subtext }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalSave, regen && { opacity: 0.6 }]} onPress={saveEdit} disabled={regen}>
                {regen
                  ? <ActivityIndicator size="small" color={C.white} />
                  : <Text style={s.modalSaveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete confirm */}
      <Modal visible={!!deleteConfirm} transparent animationType="fade" onRequestClose={() => setDeleteConfirm(null)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: t.card }]}>
            <Text style={[s.modalTitle, { color: t.text }]}>Remove hobby?</Text>
            <Text style={[s.modalNote, { color: t.subtext }]}>"{deleteConfirm?.name}" and all its milestones will be removed.</Text>
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.modalCancel, { borderColor: t.border }]} onPress={() => setDeleteConfirm(null)}>
                <Text style={[s.modalCancelText, { color: t.subtext }]}>Keep</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalSave, { backgroundColor: C.pinkDark }]} onPress={() => { removeHobby(deleteConfirm.id); setDeleteConfirm(null); }}>
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

  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 4 },
  title: {
    fontSize: 30, fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined,
  },
  yearBtn: { paddingBottom: 4 },
  yearBtnText: { fontSize: 13, fontWeight: '700' },
  sub: { fontSize: 14, lineHeight: 20, marginBottom: 24 },

  empty: { alignItems: 'center', paddingTop: 40, paddingBottom: 32 },
  emptyHead: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22, maxWidth: 280 },

  hobbyCard: {
    borderRadius: 18, borderWidth: 1,
    padding: 18, marginBottom: 12,
    shadowColor: '#2A2420', shadowOpacity: 0.09, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  hobbyCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  emojiCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  hobbyEmoji: { fontSize: 22, lineHeight: 26 },
  hobbyName: { flex: 1, fontSize: 17, fontWeight: '700' },

  progressTrack: { height: 4, borderRadius: 2, marginBottom: 8, overflow: 'hidden' },
  progressFill:  { height: 4, borderRadius: 2 },
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
  milestoneLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 6 },
  hobbyMilestone: { fontSize: 14, lineHeight: 22 },

  addCard: {
    borderRadius: 18, borderWidth: 1.5,
    padding: 20, marginBottom: 16,
  },
  addCardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  addInput: {
    borderWidth: 1.5, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 14,
    fontSize: 15, marginBottom: 16,
  },
  addLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  levelRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  levelChip: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, alignItems: 'center',
  },
  levelChipActive: { borderColor: C.moss },
  levelChipText: { fontSize: 13, fontWeight: '600' },
  addActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    borderWidth: 1.5, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600' },
  createBtn: {
    flex: 2, paddingVertical: 13, borderRadius: 12,
    backgroundColor: C.moss, alignItems: 'center',
  },
  createBtnOff: { opacity: 0.4 },
  createBtnText: { fontSize: 14, fontWeight: '700', color: C.white },
  generatingNote: { fontSize: 12, textAlign: 'center', marginTop: 12 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, justifyContent: 'center',
    borderWidth: 1.5, borderRadius: 14, borderStyle: 'dashed',
  },
  addBtnText: { fontSize: 15, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitle:  { fontSize: 18, fontWeight: '700', marginBottom: 14 },
  modalLabel:  { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 },
  modalNote:   { fontSize: 13, lineHeight: 20, marginBottom: 14 },
  modalInput: {
    borderWidth: 1.5, borderRadius: 12,
    paddingVertical: 11, paddingHorizontal: 14,
    fontSize: 15, marginBottom: 10,
  },
  modalActions:     { flexDirection: 'row', gap: 10, marginTop: 8 },
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
