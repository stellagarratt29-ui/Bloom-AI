import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';
import { HOBBIES } from '../constants/data';

const STEPS = ['welcome', 'name', 'hobbies', 'goal', 'ready'];

function StepDots({ current, total }) {
  return (
    <View style={s.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[
          s.dot,
          i === current && s.dotActive,
          i < current  && s.dotDone,
        ]} />
      ))}
    </View>
  );
}

export default function OnboardingScreen({ onFinish }) {
  const [step, setStep]             = useState(0);
  const [name, setName]             = useState('');
  const [selectedHobbies, setSelectedHobbies] = useState([]);
  const [bigGoal, setBigGoal]       = useState('');

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));

  const toggleHobby = (id) =>
    setSelectedHobbies(prev =>
      prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]
    );

  // Welcome
  if (STEPS[step] === 'welcome') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.wordmark}>Bloom</Text>
          <Text style={s.tagline}>Gentle guidance.{'\n'}Real progress.</Text>
          <Text style={s.body}>
            Bloom helps you get things done by breaking your day into small, clear steps — no guilt, no pressure, just forward motion.
          </Text>
          <TouchableOpacity style={s.primaryBtn} onPress={next}>
            <Text style={s.primaryBtnText}>Get started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Name
  if (STEPS[step] === 'name') {
    return (
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.center}>
            <StepDots current={0} total={4} />
            <Text style={s.stepTitle}>What should we call you?</Text>
            <Text style={s.stepSub}>Just your first name.</Text>
            <TextInput
              style={s.textInput}
              placeholder="Your name…"
              placeholderTextColor={C.muted}
              value={name}
              onChangeText={setName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={next}
              autoCapitalize="words"
            />
            <TouchableOpacity style={s.primaryBtn} onPress={next}>
              <Text style={s.primaryBtnText}>
                {name.trim() ? `Continue →` : 'Skip →'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Hobbies
  if (STEPS[step] === 'hobbies') {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll}>
          <StepDots current={1} total={4} />
          <Text style={s.stepTitle}>What do you want to build?</Text>
          <Text style={s.stepSub}>Pick up to 3. We'll grow them one small step at a time.</Text>
          <View style={s.hobbyGrid}>
            {HOBBIES.map(h => {
              const active = selectedHobbies.includes(h.id);
              const maxed  = selectedHobbies.length >= 3 && !active;
              return (
                <TouchableOpacity
                  key={h.id}
                  style={[s.hobbyChip, active && s.hobbyChipActive, maxed && { opacity: 0.35 }]}
                  onPress={() => !maxed && toggleHobby(h.id)}
                >
                  <Feather name={h.icon ?? 'star'} size={16} color={active ? C.forest : C.muted} />
                  <Text style={[s.hobbyLabel, active && s.hobbyLabelActive]}>{h.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity style={s.primaryBtn} onPress={next}>
            <Text style={s.primaryBtnText}>
              {selectedHobbies.length === 0 ? 'Skip →' : `Continue (${selectedHobbies.length}) →`}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Goal
  if (STEPS[step] === 'goal') {
    return (
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.center}>
            <StepDots current={2} total={4} />
            <Text style={s.stepTitle}>What's one big goal for this year?</Text>
            <Text style={s.stepSub}>Don't overthink it — whatever comes to mind first.</Text>
            <TextInput
              style={s.textInput}
              placeholder="e.g. Learn Spanish, run a 5K, start a business…"
              placeholderTextColor={C.muted}
              value={bigGoal}
              onChangeText={setBigGoal}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={next}
              autoCapitalize="sentences"
            />
            <TouchableOpacity style={s.primaryBtn} onPress={next}>
              <Text style={s.primaryBtnText}>
                {bigGoal.trim() ? 'Set this goal →' : 'Skip →'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Ready
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <StepDots current={3} total={4} />
        <Text style={s.readyTitle}>
          {name.trim() ? `You're all set, ${name.trim()}.` : "You're all set."}
        </Text>
        <Text style={s.body}>
          Every morning, dump what's on your mind. Bloom turns it into a clear plan. Tap any task to see exactly how to get it done.
        </Text>
        <TouchableOpacity
          style={s.primaryBtn}
          onPress={() => onFinish(selectedHobbies, name.trim(), bigGoal.trim())}
        >
          <Text style={s.primaryBtnText}>Start →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: C.cream },
  scroll: { padding: 32, paddingBottom: 56 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },

  dots: { flexDirection: 'row', gap: 6, marginBottom: 40 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.border },
  dotActive: { backgroundColor: C.forest, width: 22 },
  dotDone: { backgroundColor: C.sageMid },

  wordmark: { fontSize: 48, fontWeight: '800', color: C.forest, letterSpacing: -1, marginBottom: 16 },
  tagline:  { fontSize: 24, fontWeight: '700', color: C.forest, textAlign: 'center', lineHeight: 32, marginBottom: 20 },
  body:     { fontSize: 16, color: C.muted, textAlign: 'center', lineHeight: 26, marginBottom: 40 },

  stepTitle: { fontSize: 28, fontWeight: '700', color: C.forest, marginBottom: 8, textAlign: 'center', lineHeight: 36 },
  stepSub:   { fontSize: 15, color: C.muted, lineHeight: 22, marginBottom: 32, textAlign: 'center' },

  readyTitle: { fontSize: 28, fontWeight: '700', color: C.forest, marginBottom: 20, textAlign: 'center', lineHeight: 36 },

  textInput: {
    width: '100%', backgroundColor: C.white,
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, paddingVertical: 16, paddingHorizontal: 18,
    fontSize: 17, color: C.forest, marginBottom: 24,
  },

  hobbyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 36, width: '100%' },
  hobbyChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: C.white, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border,
  },
  hobbyChipActive: { borderColor: C.forest, backgroundColor: C.sagePale },
  hobbyLabel: { fontSize: 14, fontWeight: '600', color: C.muted },
  hobbyLabelActive: { color: C.forest },

  primaryBtn: {
    backgroundColor: C.forest, borderRadius: 14,
    paddingVertical: 17, paddingHorizontal: 32,
    alignItems: 'center', width: '100%',
  },
  primaryBtnText: { color: C.white, fontWeight: '700', fontSize: 17 },
});
