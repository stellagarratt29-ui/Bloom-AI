import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { C } from '../constants/colors';
import { HOBBIES } from '../constants/data';

const MOODS = [
  { id: 'energized', label: 'Energized', emoji: '⚡', hobbies: ['coding', 'fitness', 'guitar'] },
  { id: 'calm',      label: 'Calm',      emoji: '🌿', hobbies: ['drawing', 'writing', 'cooking'] },
  { id: 'tired',     label: 'Tired',     emoji: '😌', hobbies: ['drawing', 'writing', 'guitar'] },
];

function getSuggestion(mood, selectedHobbies, hobbyProgress) {
  const moodDef = MOODS.find(m => m.id === mood);
  const preferred = moodDef?.hobbies ?? [];

  // Find an active hobby that matches the mood
  const match = preferred.find(id => selectedHobbies.includes(id));
  const hobbyId = match ?? selectedHobbies[0];
  const hobby = HOBBIES.find(h => h.id === hobbyId);
  if (!hobby) return null;

  const stepIdx = hobbyProgress[hobby.id] ?? 0;
  const nextStep = hobby.steps[stepIdx] ?? hobby.steps[hobby.steps.length - 1];

  return { hobby, nextStep, stepIdx };
}

export default function HobbyModeModal({ visible, selectedHobbies, hobbyProgress, surfacedIdea, onStartHobby, onExploreIdea, onDismiss }) {
  const [mood, setMood] = useState(null);

  const suggestion = mood ? getSuggestion(mood, selectedHobbies, hobbyProgress) : null;

  const handleClose = () => { setMood(null); onDismiss(); };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={s.overlay}>
        <View style={s.card}>

          {!mood ? (
            /* ── Feeling check ── */
            <>
              <Text style={s.emoji}>🎉</Text>
              <Text style={s.title}>All done — amazing!</Text>
              <Text style={s.sub}>You cleared your list. How are you feeling right now?</Text>
              <View style={s.moodRow}>
                {MOODS.map(m => (
                  <TouchableOpacity key={m.id} style={s.moodBtn} onPress={() => setMood(m.id)}>
                    <Text style={s.moodEmoji}>{m.emoji}</Text>
                    <Text style={s.moodLabel}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {surfacedIdea && (
                <TouchableOpacity style={s.ideaCard} onPress={() => { handleClose(); onExploreIdea(surfacedIdea); }}>
                  <Text style={s.ideaCardLabel}>💡 Saved idea</Text>
                  <Text style={s.ideaCardText}>"{surfacedIdea.text}"</Text>
                  <Text style={s.ideaCardCta}>Want to explore this now? →</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={s.dismissBtn} onPress={handleClose}>
                <Text style={s.dismissText}>I'm just browsing</Text>
              </TouchableOpacity>
            </>
          ) : suggestion ? (
            /* ── Suggestion ── */
            <>
              <Text style={s.suggestionEmoji}>{suggestion.hobby.emoji}</Text>
              <Text style={s.title}>How about some {suggestion.hobby.name.toLowerCase()}?</Text>
              <View style={s.stepCard}>
                <Text style={s.stepLabel}>YOUR NEXT STEP</Text>
                <Text style={s.stepText}>{suggestion.nextStep}</Text>
              </View>
              <TouchableOpacity style={s.primaryBtn} onPress={() => { handleClose(); onStartHobby(suggestion.hobby.id); }}>
                <Text style={s.primaryBtnText}>Let's do this →</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.secondaryBtn} onPress={() => setMood(null)}>
                <Text style={s.secondaryBtnText}>Show me something else</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.dismissBtn} onPress={handleClose}>
                <Text style={s.dismissText}>Maybe later</Text>
              </TouchableOpacity>
            </>
          ) : (
            /* ── No hobbies yet ── */
            <>
              <Text style={s.emoji}>🌱</Text>
              <Text style={s.title}>Pick a hobby to grow!</Text>
              <Text style={s.sub}>You haven't chosen any hobbies yet. Head to the Grow tab to pick some.</Text>
              <TouchableOpacity style={s.primaryBtn} onPress={handleClose}>
                <Text style={s.primaryBtnText}>Go to Grow tab</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: C.overlay, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: C.white, borderRadius: 24, padding: 28, width: '100%', alignItems: 'center' },

  emoji: { fontSize: 48, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: '700', color: C.forest, textAlign: 'center', marginBottom: 8 },
  sub:   { fontSize: 15, color: C.muted, textAlign: 'center', lineHeight: 22, marginBottom: 22 },

  moodRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  moodBtn: {
    flex: 1, alignItems: 'center', padding: 16,
    backgroundColor: C.cream, borderRadius: 16,
    borderWidth: 2, borderColor: C.border,
  },
  moodEmoji: { fontSize: 26, marginBottom: 6 },
  moodLabel: { fontSize: 13, fontWeight: '600', color: C.forest },

  ideaCard: {
    width: '100%', backgroundColor: C.sagePale, borderRadius: 14,
    padding: 14, marginBottom: 14, borderWidth: 1, borderColor: C.sageLight,
  },
  ideaCardLabel: { fontSize: 11, fontWeight: '700', color: C.sage, letterSpacing: 1, marginBottom: 4 },
  ideaCardText: { fontSize: 15, color: C.forest, lineHeight: 21, marginBottom: 4 },
  ideaCardCta: { fontSize: 13, color: C.sage, fontWeight: '600' },

  suggestionEmoji: { fontSize: 52, marginBottom: 10 },
  stepCard: {
    width: '100%', backgroundColor: C.sagePale, borderRadius: 14,
    padding: 16, marginBottom: 20, borderWidth: 1, borderColor: C.sageLight,
  },
  stepLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.5, marginBottom: 6 },
  stepText: { fontSize: 16, color: C.forest, lineHeight: 24 },

  primaryBtn: {
    backgroundColor: C.sage, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 32,
    width: '100%', alignItems: 'center', marginBottom: 10,
  },
  primaryBtnText: { color: C.white, fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14,
    width: '100%', alignItems: 'center', marginBottom: 8,
    borderWidth: 1.5, borderColor: C.border,
  },
  secondaryBtnText: { fontSize: 15, color: C.muted, fontWeight: '500' },
  dismissBtn: { paddingVertical: 8 },
  dismissText: { fontSize: 14, color: C.muted },
});
