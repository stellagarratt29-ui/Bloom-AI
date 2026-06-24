import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';
import { HOBBIES } from '../constants/data';
import { useApp } from '../context/AppContext';

export default function HobbiesScreen() {
  const { selectedHobbies, hobbyProgress, completeHobbyStep, toggleHobby } = useApp();
  const [showAdd, setShowAdd] = useState(false);

  const myHobbies   = HOBBIES.filter(h => selectedHobbies.includes(h.id));
  const moreHobbies = HOBBIES.filter(h => !selectedHobbies.includes(h.id));

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.title}>Grow</Text>
        <Text style={s.sub}>Things you're building, one small step at a time.</Text>

        {myHobbies.length === 0 ? (
          <View style={s.empty}>
            <Feather name="sun" size={40} color={C.sageLight} style={{ marginBottom: 12 }} />
            <Text style={s.emptyHead}>Nothing here yet</Text>
            <Text style={s.emptyText}>Add a hobby below to start tracking your progress.</Text>
          </View>
        ) : (
          myHobbies.map(h => {
            const progress = hobbyProgress[h.id] ?? 0;
            const pct = Math.round((progress / h.steps.length) * 100);
            const nextStep = h.steps[progress];
            const complete = progress >= h.steps.length;
            return (
              <View key={h.id} style={s.hobbyCard}>
                <View style={s.hobbyRow}>
                  <View style={s.hobbyIconWrap}>
                    <Feather name={h.icon ?? 'star'} size={20} color={C.forest} />
                  </View>
                  <View style={s.hobbyMeta}>
                    <Text style={s.hobbyName}>{h.name}</Text>
                    <Text style={s.hobbyNext} numberOfLines={2}>
                      {complete ? 'All milestones complete!' : nextStep}
                    </Text>
                    <View style={s.barTrack}>
                      <View style={[s.barFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={s.barLabel}>{pct}% through the milestones</Text>
                  </View>
                  {!complete && (
                    <TouchableOpacity
                      style={s.doneBtn}
                      onPress={() => completeHobbyStep(h.id, progress)}
                    >
                      <Text style={s.doneBtnText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity style={s.removeRow} onPress={() => toggleHobby(h.id)}>
                  <Text style={s.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {moreHobbies.length > 0 && (
          <>
            <TouchableOpacity style={s.addMoreRow} onPress={() => setShowAdd(v => !v)}>
              <Text style={s.addMoreText}>+ Add a hobby</Text>
              <Feather name={showAdd ? 'chevron-up' : 'chevron-down'} size={14} color={C.muted} />
            </TouchableOpacity>

            {showAdd && (
              <View style={s.moreGrid}>
                {moreHobbies.map(h => (
                  <TouchableOpacity
                    key={h.id}
                    style={s.moreChip}
                    onPress={() => { toggleHobby(h.id); setShowAdd(false); }}
                    activeOpacity={0.75}
                  >
                    <Feather name={h.icon ?? 'star'} size={18} color={C.forest} />
                    <Text style={s.moreName}>{h.name}</Text>
                    <Feather name="plus" size={16} color={C.sage} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
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
    fontSize: 30, fontWeight: '800', color: C.forest, marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : undefined,
  },
  sub: { fontSize: 14, color: C.muted, lineHeight: 20, marginBottom: 24 },

  empty: { alignItems: 'center', paddingTop: 40 },
  emptyHead: { fontSize: 18, fontWeight: '700', color: C.forest, marginBottom: 6 },
  emptyText: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20 },

  hobbyCard: {
    backgroundColor: C.white, borderRadius: 18,
    borderWidth: 1, borderColor: C.border,
    padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  hobbyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  hobbyIconWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.sagePale, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  hobbyMeta: { flex: 1 },
  hobbyName: { fontSize: 16, fontWeight: '700', color: C.forest, marginBottom: 5 },
  hobbyNext: { fontSize: 13, color: C.muted, lineHeight: 19, marginBottom: 10 },
  barTrack: { height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  barFill:  { height: 4, backgroundColor: C.sage, borderRadius: 2 },
  barLabel: { fontSize: 11, color: C.muted },

  doneBtn: {
    backgroundColor: C.forest, borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 14, flexShrink: 0,
  },
  doneBtnText: { fontSize: 13, fontWeight: '700', color: C.white },

  removeRow: { marginTop: 12, alignItems: 'flex-end' },
  removeText: { fontSize: 12, color: C.muted },

  addMoreRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.border, marginTop: 8,
  },
  addMoreText: { fontSize: 15, fontWeight: '600', color: C.clay },

  moreGrid: { gap: 8, marginBottom: 12 },
  moreChip: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.white, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  moreName: { flex: 1, fontSize: 15, fontWeight: '600', color: C.forest },
});
