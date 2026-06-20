import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet,
} from 'react-native';
import { C } from '../constants/colors';
import { HOBBIES } from '../constants/data';
import { useApp } from '../context/AppContext';

export default function HobbiesScreen() {
  const { selectedHobbies, hobbyProgress, completeHobbyStep, toggleHobby } = useApp();
  const [expanded, setExpanded] = useState(null);

  const myHobbies  = HOBBIES.filter(h => selectedHobbies.includes(h.id));
  const moreHobbies = HOBBIES.filter(h => !selectedHobbies.includes(h.id));

  const toggle = (id) => setExpanded(e => e === id ? null : id);

  const HobbyCard = ({ hobby }) => {
    const progress = hobbyProgress[hobby.id] ?? 0;
    const isOpen   = expanded === hobby.id;
    const pct      = Math.round((progress / hobby.steps.length) * 100);
    const complete  = progress >= hobby.steps.length;

    return (
      <View style={s.card}>
        <TouchableOpacity style={s.cardHeader} onPress={() => toggle(hobby.id)}>
          <Text style={s.cardEmoji}>{hobby.emoji}</Text>
          <View style={s.cardMeta}>
            <Text style={s.cardName}>{hobby.name}</Text>
            <Text style={s.cardProgress}>
              {complete ? '✓ Complete!' : `${progress}/${hobby.steps.length} steps · ${pct}%`}
            </Text>
          </View>
          <View style={s.progressBarWrap}>
            <View style={[s.progressBar, { width: `${pct}%` }, complete && s.progressBarDone]} />
          </View>
          <Text style={s.chevron}>{isOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {isOpen && (
          <View style={s.steps}>
            {hobby.steps.map((step, i) => {
              const done = i < progress;
              const next = i === progress;
              return (
                <TouchableOpacity
                  key={i}
                  style={[s.step, done && s.stepDone, next && s.stepNext]}
                  onPress={() => !done && next && completeHobbyStep(hobby.id, i)}
                  disabled={done || !next}
                  activeOpacity={next ? 0.7 : 1}
                >
                  <View style={[s.stepDot, done && s.stepDotDone, next && s.stepDotNext]}>
                    {done ? <Text style={s.stepTick}>✓</Text> : <Text style={s.stepNum}>{i + 1}</Text>}
                  </View>
                  <View style={s.stepContent}>
                    <Text style={[s.stepText, done && s.stepTextDone]}>{step}</Text>
                    {next && <Text style={s.stepCta}>Tap to mark complete · +15 pts</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={s.removeBtn} onPress={() => { setExpanded(null); toggleHobby(hobby.id); }}>
              <Text style={s.removeBtnText}>Remove from my hobbies</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Grow</Text>
        <Text style={s.sub}>Small steps, real progress. No rush.</Text>

        {myHobbies.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>🌱</Text>
            <Text style={s.emptyText}>
              You haven't added any hobbies yet.{'\n'}Tap one below to start growing it!
            </Text>
          </View>
        ) : (
          myHobbies.map(h => <HobbyCard key={h.id} hobby={h} />)
        )}

        {moreHobbies.length > 0 && (
          <>
            <Text style={s.moreSectionLabel}>ADD TO YOUR JOURNEY</Text>
            <Text style={s.moreSectionSub}>Tap any to start growing it</Text>
            <View style={s.moreGrid}>
              {moreHobbies.map(h => (
                <TouchableOpacity
                  key={h.id}
                  style={s.moreChip}
                  onPress={() => toggleHobby(h.id)}
                  activeOpacity={0.75}
                >
                  <Text style={s.moreEmoji}>{h.emoji}</Text>
                  <View style={s.moreText}>
                    <Text style={s.moreName}>{h.name}</Text>
                    <Text style={s.moreSteps}>{h.steps.length} steps</Text>
                  </View>
                  <Text style={s.moreAdd}>+ Add</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.cream },
  scroll: { paddingHorizontal: 22, paddingTop: 20 },

  title: { fontSize: 30, fontWeight: '700', color: C.forest, marginBottom: 4 },
  sub:   { fontSize: 16, color: C.sage, marginBottom: 24 },

  empty: { alignItems: 'center', paddingTop: 32, paddingBottom: 24 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 15, color: C.muted, textAlign: 'center', lineHeight: 22 },

  card: {
    backgroundColor: C.white, borderRadius: 18,
    borderWidth: 1, borderColor: C.border, marginBottom: 12, overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  cardEmoji: { fontSize: 26, flexShrink: 0 },
  cardMeta: { flex: 1 },
  cardName: { fontSize: 17, fontWeight: '700', color: C.forest },
  cardProgress: { fontSize: 12, color: C.muted, marginTop: 2 },
  progressBarWrap: { position: 'absolute', bottom: 0, left: 0, right: 44, height: 3, backgroundColor: C.sageLight },
  progressBar: { height: 3, backgroundColor: C.sage, borderRadius: 2 },
  progressBarDone: { backgroundColor: C.peach },
  chevron: { fontSize: 12, color: C.muted, flexShrink: 0 },

  steps: { borderTopWidth: 1, borderTopColor: C.border, paddingVertical: 8 },
  step: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  stepDone: { opacity: 0.6 },
  stepNext: { backgroundColor: C.sagePale },
  stepDot: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  stepDotDone: { backgroundColor: C.sage, borderColor: C.sage },
  stepDotNext: { borderColor: C.sage },
  stepTick: { color: C.white, fontSize: 13, fontWeight: '800' },
  stepNum: { fontSize: 12, fontWeight: '700', color: C.muted },
  stepContent: { flex: 1 },
  stepText: { fontSize: 15, color: C.forest, lineHeight: 22 },
  stepTextDone: { color: C.muted, textDecorationLine: 'line-through' },
  stepCta: { fontSize: 12, color: C.sage, marginTop: 4, fontWeight: '600' },
  removeBtn: { paddingVertical: 10, paddingHorizontal: 16, alignItems: 'flex-end' },
  removeBtnText: { fontSize: 12, color: C.muted },

  moreSectionLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1.6, marginTop: 8, marginBottom: 2 },
  moreSectionSub: { fontSize: 13, color: C.muted, marginBottom: 12 },
  moreGrid: { gap: 8, marginBottom: 10 },
  moreChip: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: C.white, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border,
  },
  moreEmoji: { fontSize: 22 },
  moreText: { flex: 1 },
  moreName: { fontSize: 15, fontWeight: '600', color: C.forest },
  moreSteps: { fontSize: 12, color: C.muted, marginTop: 1 },
  moreAdd: { fontSize: 13, fontWeight: '700', color: C.sage },
});
