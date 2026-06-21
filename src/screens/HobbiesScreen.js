import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';
import { HOBBIES } from '../constants/data';
import { useApp } from '../context/AppContext';

export default function HobbiesScreen({ navigation }) {
  const { selectedHobbies, hobbyProgress, completeHobbyStep, toggleHobby } = useApp();
  const [showAdd, setShowAdd] = useState(false);

  const myHobbies   = HOBBIES.filter(h => selectedHobbies.includes(h.id));
  const moreHobbies = HOBBIES.filter(h => !selectedHobbies.includes(h.id));

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.headerRow}>
          <View>
            <Text style={s.title}>Hobby Garden</Text>
            <Text style={s.sub}>Things you're growing, one small step at a time.</Text>
          </View>
          <TouchableOpacity
            style={s.screenBtn}
            onPress={() => navigation.navigate('ScreenAwareness')}
          >
            <Feather name="smartphone" size={18} color={C.muted} />
            <Text style={s.screenBtnLabel}>Screen</Text>
          </TouchableOpacity>
        </View>

        {myHobbies.length === 0 ? (
          <View style={s.empty}>
            <Feather name="sun" size={40} color={C.sageMid} style={{ marginBottom: 12 }} />
            <Text style={s.emptyText}>No hobbies yet. Add one below to start growing!</Text>
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
                    <Feather name={h.icon ?? 'star'} size={22} color={C.forest} />
                  </View>
                  <View style={s.hobbyMeta}>
                    <Text style={s.hobbyName}>{h.name}</Text>
                    <Text style={s.hobbyNext} numberOfLines={1}>
                      {complete ? '✓ Complete!' : `Next: ${nextStep}`}
                    </Text>
                    <View style={s.barTrack}>
                      <View style={[s.barFill, { width: `${pct}%` }]} />
                    </View>
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
                    onPress={() => toggleHobby(h.id)}
                    activeOpacity={0.75}
                  >
                    <Feather name={h.icon ?? 'star'} size={20} color={C.forest} />
                    <Text style={s.moreName}>{h.name}</Text>
                    <Text style={s.moreAdd}>+</Text>
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

  headerRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 24,
  },
  title: { fontSize: 30, fontWeight: '700', color: C.forest, marginBottom: 4 },
  sub:   { fontSize: 14, color: C.muted, lineHeight: 20, maxWidth: 220 },
  screenBtn: {
    alignItems: 'center', backgroundColor: C.white,
    borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12,
    borderWidth: 1, borderColor: C.border,
  },
  screenBtnLabel: { fontSize: 9, fontWeight: '700', color: C.muted, marginTop: 2 },

  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 14, color: C.muted, textAlign: 'center' },

  hobbyCard: {
    backgroundColor: C.white, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    padding: 16, marginBottom: 12,
  },
  hobbyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hobbyIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center',
  },
  hobbyMeta: { flex: 1 },
  hobbyName: { fontSize: 16, fontWeight: '700', color: C.forest, marginBottom: 3 },
  hobbyNext: { fontSize: 13, color: C.muted, marginBottom: 8 },
  barTrack: { height: 5, backgroundColor: '#EBF0E8', borderRadius: 3, overflow: 'hidden' },
  barFill:  { height: 5, backgroundColor: C.forest, borderRadius: 3 },

  doneBtn: {
    backgroundColor: C.forest, borderRadius: 20,
    paddingVertical: 7, paddingHorizontal: 14,
  },
  doneBtnText: { fontSize: 13, fontWeight: '700', color: C.white },

  addMoreRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.border, marginTop: 4,
  },
  addMoreText: { fontSize: 15, fontWeight: '600', color: C.forest },

  moreGrid: { gap: 8, marginBottom: 12 },
  moreChip: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.white, borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: C.border,
  },
  moreName: { flex: 1, fontSize: 15, fontWeight: '600', color: C.forest },
  moreAdd: { fontSize: 20, color: C.forest, fontWeight: '300' },
});
