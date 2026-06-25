import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  SafeAreaView, StyleSheet, Platform, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { generateHobbyCurriculum } from '../services/ai';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export default function HobbiesScreen({ navigation }) {
  const { hobbies, addHobby, removeHobby } = useApp();
  const [showAdd, setShowAdd]       = useState(false);
  const [hobbyName, setHobbyName]   = useState('');
  const [skillLevel, setSkillLevel] = useState('Beginner');
  const [generating, setGenerating] = useState(false);

  const handleAdd = async () => {
    const name = hobbyName.trim();
    if (!name || generating) return;
    setGenerating(true);
    try {
      // generateHobbyCurriculum has its own fallback — never throws
      const milestones = await generateHobbyCurriculum({
        hobbyName: name,
        skillLevel: skillLevel.toLowerCase(),
      });
      addHobby(name, skillLevel.toLowerCase(), milestones);
      setHobbyName('');
      setSkillLevel('Beginner');
      setShowAdd(false);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.title}>Grow</Text>
        <Text style={s.sub}>Hobbies and skills you're building — one milestone at a time.</Text>

        {hobbies.length === 0 && !showAdd && (
          <View style={s.empty}>
            <Feather name="sun" size={44} color={C.sageLight} style={{ marginBottom: 14 }} />
            <Text style={s.emptyHead}>Nothing here yet</Text>
            <Text style={s.emptyText}>
              Add any hobby — guitar, watercolour, running, anything. Bloom will build you a real curriculum.
            </Text>
          </View>
        )}

        {hobbies.map(h => {
          const total = h.milestones?.length ?? (h.completedMilestones?.length + 1 ?? 1);
          const done  = h.milestoneIndex ?? h.completedMilestones?.length ?? 0;
          const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <TouchableOpacity
              key={h.id}
              style={s.hobbyCard}
              onPress={() => navigation.navigate('HobbyDetail', { hobby: h })}
              activeOpacity={0.82}
            >
              <View style={s.hobbyCardInner}>
                <View style={s.hobbyMeta}>
                  <Text style={s.hobbyName}>{h.name}</Text>
                  <View style={s.hobbyMetaRow}>
                    <Text style={s.hobbyLevel}>{h.skillLevel}</Text>
                    <Text style={s.milestoneBadge}>Milestone {done + 1} of {total}</Text>
                  </View>
                  <Text style={s.hobbyMilestone} numberOfLines={3}>{h.currentMilestone}</Text>
                  <View style={s.barTrack}>
                    <View style={[s.barFill, { width: `${pct}%` }]} />
                  </View>
                </View>
                <Feather name="chevron-right" size={18} color={C.muted} />
              </View>
              <TouchableOpacity style={s.removeRow} onPress={() => removeHobby(h.id)}>
                <Text style={s.removeText}>Remove</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        {showAdd ? (
          <View style={s.addCard}>
            <Text style={s.addCardTitle}>Add a hobby</Text>
            <TextInput
              style={s.addInput}
              placeholder="e.g. Watercolour, Guitar, Running, Baking…"
              placeholderTextColor={C.muted}
              value={hobbyName}
              onChangeText={setHobbyName}
              autoFocus
              returnKeyType="done"
              editable={!generating}
            />
            <Text style={s.addLabel}>Skill level</Text>
            <View style={s.levelRow}>
              {SKILL_LEVELS.map(l => (
                <TouchableOpacity
                  key={l}
                  style={[s.levelChip, skillLevel === l && s.levelChipActive]}
                  onPress={() => setSkillLevel(l)}
                >
                  <Text style={[s.levelChipText, skillLevel === l && s.levelChipTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.addActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowAdd(false); setHobbyName(''); }}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.createBtn, (!hobbyName.trim() || generating) && s.createBtnOff]}
                onPress={handleAdd}
                disabled={!hobbyName.trim() || generating}
              >
                {generating ? (
                  <ActivityIndicator size="small" color={C.white} />
                ) : (
                  <Text style={s.createBtnText}>Build my curriculum →</Text>
                )}
              </TouchableOpacity>
            </View>
            {generating && (
              <Text style={s.generatingNote}>Building your first milestone…</Text>
            )}
          </View>
        ) : (
          <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
            <Feather name="plus" size={16} color={C.clay} />
            <Text style={s.addBtnText}>Add a hobby</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.cream },
  scroll: { paddingHorizontal: 22, paddingTop: 22 },

  title: {
    fontSize: 30, fontWeight: '800', color: C.ink, marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : undefined,
  },
  sub: { fontSize: 14, color: C.muted, lineHeight: 20, marginBottom: 24 },

  empty: { alignItems: 'center', paddingTop: 40, paddingBottom: 32 },
  emptyHead: { fontSize: 18, fontWeight: '700', color: C.ink, marginBottom: 8 },
  emptyText: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22, maxWidth: 280 },

  hobbyCard: {
    backgroundColor: C.white, borderRadius: 18, borderWidth: 1, borderColor: C.border,
    padding: 18, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  hobbyCardInner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  hobbyMeta: { flex: 1 },
  hobbyName:    { fontSize: 17, fontWeight: '700', color: C.ink, marginBottom: 4 },
  hobbyMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  hobbyLevel:   { fontSize: 11, fontWeight: '600', color: C.sage, letterSpacing: 0.8, textTransform: 'uppercase' },
  milestoneBadge: { fontSize: 11, fontWeight: '600', color: C.clay, backgroundColor: C.clayPale, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  hobbyMilestone: { fontSize: 13, color: C.muted, lineHeight: 20, marginBottom: 12 },
  barTrack: { height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden', marginTop: 10 },
  barFill:  { height: 4, backgroundColor: C.sage, borderRadius: 2, minWidth: 4 },
  removeRow: { marginTop: 12, alignItems: 'flex-end' },
  removeText: { fontSize: 12, color: C.muted },

  addCard: {
    backgroundColor: C.white, borderRadius: 18, borderWidth: 1.5, borderColor: C.border,
    padding: 20, marginBottom: 16,
  },
  addCardTitle: { fontSize: 16, fontWeight: '700', color: C.ink, marginBottom: 14 },
  addInput: {
    backgroundColor: C.cream, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14,
    fontSize: 15, color: C.ink, marginBottom: 16,
  },
  addLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1, marginBottom: 10 },
  levelRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  levelChip: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: C.border, alignItems: 'center',
    backgroundColor: C.cream,
  },
  levelChipActive: { borderColor: C.moss, backgroundColor: C.sagePale },
  levelChipText: { fontSize: 13, fontWeight: '600', color: C.muted },
  levelChipTextActive: { color: C.ink },
  addActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: C.muted },
  createBtn: {
    flex: 2, paddingVertical: 13, borderRadius: 12,
    backgroundColor: C.moss, alignItems: 'center',
  },
  createBtnOff: { opacity: 0.4 },
  createBtnText: { fontSize: 14, fontWeight: '700', color: C.white },
  generatingNote: { fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 12 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, justifyContent: 'center',
    borderWidth: 1.5, borderColor: C.clayLight, borderRadius: 14,
    borderStyle: 'dashed',
  },
  addBtnText: { fontSize: 15, fontWeight: '600', color: C.clay },
});
