import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { C } from '../constants/colors';
import { generateGoalAction } from '../services/ai';

const STEPS = ['welcome', 'name', 'goal', 'ready'];

function StepDots({ current, total }) {
  return (
    <View style={s.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[s.dot, i === current && s.dotActive, i < current && s.dotDone]} />
      ))}
    </View>
  );
}

export default function OnboardingScreen({ onFinish }) {
  const [step, setStep]       = useState(0);
  const [name, setName]       = useState('');
  const [bigGoal, setBigGoal] = useState('');
  const [saving, setSaving]   = useState(false);

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));

  const finish = async () => {
    setSaving(true);
    try {
      let firstGoalAction = '';
      if (bigGoal.trim()) {
        firstGoalAction = await generateGoalAction({ goalText: bigGoal.trim(), completedActions: [] });
      }
      onFinish(name.trim(), bigGoal.trim() || null, firstGoalAction || null);
    } catch {
      onFinish(name.trim(), bigGoal.trim() || null, null);
    } finally {
      setSaving(false);
    }
  };

  if (STEPS[step] === 'welcome') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.wordmark}>Bloom</Text>
          <Text style={s.tagline}>Gentle guidance.{'\n'}Real progress.</Text>
          <Text style={s.body}>
            Every morning, tell Bloom what's on your mind. Tasks, worries, goals — anything. It sorts it into a clear plan and helps you get it done.
          </Text>
          <TouchableOpacity style={s.primaryBtn} onPress={next}>
            <Text style={s.primaryBtnText}>Get started →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (STEPS[step] === 'name') {
    return (
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.center}>
            <StepDots current={0} total={3} />
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
              <Text style={s.primaryBtnText}>{name.trim() ? 'Continue →' : 'Skip →'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (STEPS[step] === 'goal') {
    return (
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.center}>
            <StepDots current={1} total={3} />
            <Text style={s.stepTitle}>What's one big goal for this year?</Text>
            <Text style={s.stepSub}>Don't overthink it — whatever comes to mind first. Bloom will build you a real first action.</Text>
            <TextInput
              style={s.textInput}
              placeholder="e.g. Start a business, learn guitar, run a 5K…"
              placeholderTextColor={C.muted}
              value={bigGoal}
              onChangeText={setBigGoal}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={next}
              autoCapitalize="sentences"
            />
            <TouchableOpacity style={s.primaryBtn} onPress={next}>
              <Text style={s.primaryBtnText}>{bigGoal.trim() ? 'Set this goal →' : 'Skip →'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <StepDots current={2} total={3} />
        <Text style={s.readyTitle}>
          {name.trim() ? `You're all set, ${name.trim()}.` : "You're all set."}
        </Text>
        <Text style={s.body}>
          Start by telling Bloom everything on your mind — tasks, worries, goals, plans. It'll turn it into a clear plan. Tap any task to get step-by-step help.
        </Text>
        <TouchableOpacity
          style={[s.primaryBtn, saving && { opacity: 0.6 }]}
          onPress={finish}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={C.white} />
          ) : (
            <Text style={s.primaryBtnText}>Open Bloom →</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: C.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },

  dots: { flexDirection: 'row', gap: 6, marginBottom: 40 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.border },
  dotActive: { backgroundColor: C.moss, width: 22 },
  dotDone: { backgroundColor: C.sageMid },

  wordmark: {
    fontSize: 52, fontWeight: '800', color: C.ink, letterSpacing: -1, marginBottom: 16,
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : undefined,
  },
  tagline:  { fontSize: 24, fontWeight: '700', color: C.ink, textAlign: 'center', lineHeight: 32, marginBottom: 20 },
  body:     { fontSize: 16, color: C.muted, textAlign: 'center', lineHeight: 26, marginBottom: 40 },

  stepTitle: { fontSize: 28, fontWeight: '700', color: C.ink, marginBottom: 8, textAlign: 'center', lineHeight: 36 },
  stepSub:   { fontSize: 15, color: C.muted, lineHeight: 22, marginBottom: 32, textAlign: 'center' },
  readyTitle:{ fontSize: 28, fontWeight: '700', color: C.ink, marginBottom: 20, textAlign: 'center', lineHeight: 36 },

  textInput: {
    width: '100%', backgroundColor: C.white,
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, paddingVertical: 16, paddingHorizontal: 18,
    fontSize: 17, color: C.ink, marginBottom: 24,
  },

  primaryBtn: {
    backgroundColor: C.moss, borderRadius: 14,
    paddingVertical: 17, paddingHorizontal: 32,
    alignItems: 'center', width: '100%',
  },
  primaryBtnText: { color: C.white, fontWeight: '700', fontSize: 17 },
});
