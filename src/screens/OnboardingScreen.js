import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { C } from '../constants/colors';
import { generateGoalAction } from '../services/ai';

const OCCUPATIONS = ['Student', 'Working', 'Both', 'Other'];
const AGE_RANGES  = ['Under 16', '16–18', '19–24', '25–34', '35–49', '50+'];
const HOBBY_SUGGESTIONS = [
  'Guitar', 'Watercolour', 'Running', 'Reading', 'Cooking', 'Photography',
  'Yoga', 'Drawing', 'Gaming', 'Writing', 'Piano', 'Swimming',
];

function Dots({ current, total }) {
  return (
    <View style={s.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[s.dot, i === current && s.dotActive, i < current && s.dotDone]} />
      ))}
    </View>
  );
}

export default function OnboardingScreen({ onFinish }) {
  const [step,        setStep]       = useState(0);
  const [name,        setName]       = useState('');
  const [ageRange,    setAgeRange]   = useState('');
  const [occupation,  setOccupation] = useState('');
  const [selHobbies,  setSelHobbies] = useState([]);
  const [saving,      setSaving]     = useState(false);

  const next = () => setStep(s => s + 1);

  const toggleHobby = (h) =>
    setSelHobbies(prev =>
      prev.includes(h) ? prev.filter(x => x !== h) : prev.length < 3 ? [...prev, h] : prev
    );

  const finish = async () => {
    setSaving(true);
    try {
      onFinish(name.trim(), ageRange, occupation, null, null, selHobbies);
    } finally {
      setSaving(false);
    }
  };

  // Step 0: Welcome + Name
  if (step === 0) {
    return (
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.center}>
            <Text style={s.wordmark}>Bloom</Text>
            <Text style={s.tagline}>Gentle guidance.{'\n'}Real progress.</Text>
            <Text style={s.body}>
              Every morning, tell Bloom what's on your mind — tasks, worries, goals, anything. It sorts it into a clear plan.
            </Text>
            <Text style={s.stepQ}>What should we call you?</Text>
            <TextInput
              style={s.textInput}
              placeholder="Your first name…"
              placeholderTextColor={C.muted}
              value={name}
              onChangeText={setName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={next}
              autoCapitalize="words"
            />
            <TouchableOpacity style={s.primaryBtn} onPress={next}>
              <Text style={s.primaryBtnText}>{name.trim() ? 'Continue →' : 'Skip →'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Step 1: Age range + Occupation
  if (step === 1) {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scrollCenter} showsVerticalScrollIndicator={false}>
          <Dots current={0} total={3} />
          <Text style={s.stepTitle}>A bit about you</Text>
          <Text style={s.stepSub}>Helps Bloom keep suggestions relevant. Optional.</Text>

          <Text style={s.fieldLabel}>AGE RANGE</Text>
          <View style={s.chipRow}>
            {AGE_RANGES.map(a => (
              <TouchableOpacity
                key={a}
                style={[s.chip, ageRange === a && s.chipActive]}
                onPress={() => setAgeRange(a === ageRange ? '' : a)}
              >
                <Text style={[s.chipText, ageRange === a && s.chipTextActive]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.fieldLabel, { marginTop: 20 }]}>OCCUPATION</Text>
          <View style={s.chipRow}>
            {OCCUPATIONS.map(o => (
              <TouchableOpacity
                key={o}
                style={[s.chip, occupation === o && s.chipActive]}
                onPress={() => setOccupation(o === occupation ? '' : o)}
              >
                <Text style={[s.chipText, occupation === o && s.chipTextActive]}>{o}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[s.primaryBtn, { marginTop: 32 }]} onPress={next}>
            <Text style={s.primaryBtnText}>Continue →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Step 2: Optional hobbies
  if (step === 2) {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scrollCenter} showsVerticalScrollIndicator={false}>
          <Dots current={1} total={3} />
          <Text style={s.stepTitle}>Any hobbies to start with?</Text>
          <Text style={s.stepSub}>Pick up to 3 — or skip. You can always add more in Grow.</Text>

          <View style={s.hobbyGrid}>
            {HOBBY_SUGGESTIONS.map(h => (
              <TouchableOpacity
                key={h}
                style={[s.hobbyChip, selHobbies.includes(h) && s.hobbyChipActive]}
                onPress={() => toggleHobby(h)}
              >
                <Text style={[s.hobbyChipText, selHobbies.includes(h) && s.hobbyChipTextActive]}>{h}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[s.primaryBtn, { marginTop: 28 }]} onPress={next}>
            <Text style={s.primaryBtnText}>{selHobbies.length > 0 ? `Add ${selHobbies.length} hobbies →` : 'Skip →'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Step 3: Ready
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <Dots current={2} total={3} />
        <Text style={s.readyTitle}>
          {name.trim() ? `You're all set, ${name.trim()}.` : "You're all set."}
        </Text>
        <Text style={s.body}>
          Start by telling Bloom everything on your mind — tasks, worries, goals, plans. It'll turn it into a clear, doable list. Tap any task for step-by-step help.
        </Text>
        <TouchableOpacity
          style={[s.primaryBtn, saving && { opacity: 0.6 }]}
          onPress={finish}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color={C.white} /> : <Text style={s.primaryBtnText}>Open Bloom →</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: C.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  scrollCenter: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 },

  dots: { flexDirection: 'row', gap: 6, marginBottom: 36 },
  dot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: C.border },
  dotActive:{ backgroundColor: C.moss, width: 22 },
  dotDone:  { backgroundColor: C.sageMid },

  wordmark: {
    fontSize: 52, fontWeight: '800', color: C.clay, letterSpacing: -1, marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined,
  },
  tagline: { fontSize: 24, fontWeight: '700', color: C.ink, textAlign: 'center', lineHeight: 32, marginBottom: 16 },
  body:    { fontSize: 15, color: C.muted, textAlign: 'center', lineHeight: 24, marginBottom: 32 },

  stepQ:   { fontSize: 18, fontWeight: '700', color: C.ink, marginBottom: 14, alignSelf: 'flex-start' },
  stepTitle: {
    fontSize: 26, fontWeight: '800', color: C.ink, textAlign: 'center', lineHeight: 34,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined,
  },
  stepSub: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  readyTitle: {
    fontSize: 26, fontWeight: '800', color: C.ink, textAlign: 'center', lineHeight: 34,
    marginBottom: 20,
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined,
  },

  textInput: {
    width: '100%', backgroundColor: C.white,
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, paddingVertical: 15, paddingHorizontal: 18,
    fontSize: 17, color: C.ink, marginBottom: 22,
  },

  fieldLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.4, alignSelf: 'flex-start', marginBottom: 10 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%' },
  chip: {
    paddingVertical: 9, paddingHorizontal: 16, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white,
  },
  chipActive: { borderColor: C.moss, backgroundColor: C.sagePale },
  chipText: { fontSize: 14, fontWeight: '600', color: C.muted },
  chipTextActive: { color: C.ink },

  hobbyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%', justifyContent: 'center' },
  hobbyChip: {
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white,
  },
  hobbyChipActive: { borderColor: C.clay, backgroundColor: C.clayPale },
  hobbyChipText: { fontSize: 14, fontWeight: '600', color: C.muted },
  hobbyChipTextActive: { color: C.clay },

  primaryBtn: {
    backgroundColor: C.moss, borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 32,
    alignItems: 'center', width: '100%',
  },
  primaryBtnText: { color: C.white, fontWeight: '700', fontSize: 16 },
});
