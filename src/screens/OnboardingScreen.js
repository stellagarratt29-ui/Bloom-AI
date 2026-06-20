import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { C } from '../constants/colors';
import { BUDDIES, HOBBIES } from '../constants/data';
import BuddyAvatar from '../components/BuddyAvatar';

const STEPS = ['welcome', 'name', 'buddy', 'hobbies', 'goal', 'ready'];

function StepDots({ current, total }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={{
          width: i === current ? 20 : 7, height: 7, borderRadius: 4,
          backgroundColor: i === current ? C.sage : i < current ? C.sageMid : C.border,
        }} />
      ))}
    </View>
  );
}

export default function OnboardingScreen({ onFinish }) {
  const [step, setStep]               = useState(0);
  const [name, setName]               = useState('');
  const [selectedBuddy, setSelectedBuddy] = useState(BUDDIES[0].id);
  const [selectedHobbies, setSelectedHobbies] = useState([]);
  const [bigGoal, setBigGoal]         = useState('');

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));

  const toggleHobby = (id) =>
    setSelectedHobbies(prev =>
      prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]
    );

  const buddy = BUDDIES.find(b => b.id === selectedBuddy);

  // ── Welcome ───────────────────────────────────────────────────────────────
  if (STEPS[step] === 'welcome') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.logo}>🌸</Text>
          <Text style={s.wordmark}>Bloom</Text>
          <Text style={s.tagline}>Gentle guidance. Real progress.{'\n'}You, in full bloom.</Text>
          <Text style={s.welcomeBody}>
            Bloom helps you stop procrastinating by redirecting you toward what you actually care about — no app blocking, no guilt, no streaks.
          </Text>
          <TouchableOpacity style={s.primaryBtn} onPress={next}>
            <Text style={s.primaryBtnText}>Let's begin →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Name ──────────────────────────────────────────────────────────────────
  if (STEPS[step] === 'name') {
    return (
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.center}>
            <StepDots current={0} total={5} />
            <Text style={s.nameEmoji}>👋</Text>
            <Text style={s.stepTitle}>What should we call you?</Text>
            <Text style={s.stepSub}>Just your first name is perfect.</Text>
            <TextInput
              style={s.nameInput}
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
                {name.trim() ? `Nice to meet you, ${name.trim()} →` : 'Skip for now →'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Buddy ─────────────────────────────────────────────────────────────────
  if (STEPS[step] === 'buddy') {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll}>
          <StepDots current={1} total={5} />
          <Text style={s.stepTitle}>Choose your companion</Text>
          <Text style={s.stepSub}>They'll cheer you on — and never judge you.</Text>
          <View style={s.buddyGrid}>
            {BUDDIES.map(b => (
              <TouchableOpacity
                key={b.id}
                style={[s.buddyCard, selectedBuddy === b.id && s.buddyCardActive]}
                onPress={() => setSelectedBuddy(b.id)}
              >
                <BuddyAvatar buddy={b} momentum={60} size={64} />
                <Text style={s.buddyName}>{b.name}</Text>
                <Text style={s.buddySubtitle}>{b.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={s.primaryBtn} onPress={next}>
            <Text style={s.primaryBtnText}>This is my buddy →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Hobbies ───────────────────────────────────────────────────────────────
  if (STEPS[step] === 'hobbies') {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll}>
          <StepDots current={2} total={5} />
          <Text style={s.stepTitle}>What do you want to build?</Text>
          <Text style={s.stepSub}>Pick up to 3 things. We'll grow them together, one small step at a time.</Text>
          <View style={s.hobbyGrid}>
            {HOBBIES.map(h => {
              const active = selectedHobbies.includes(h.id);
              const maxed  = selectedHobbies.length >= 3 && !active;
              return (
                <TouchableOpacity
                  key={h.id}
                  style={[s.hobbyChip, active && s.hobbyChipActive, maxed && s.hobbyChipDisabled]}
                  onPress={() => !maxed && toggleHobby(h.id)}
                >
                  <Text style={s.hobbyEmoji}>{h.emoji}</Text>
                  <Text style={[s.hobbyLabel, active && s.hobbyLabelActive]}>{h.name}</Text>
                  {active && <Text style={s.hobbyCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={[s.primaryBtn, selectedHobbies.length === 0 && s.btnOff]}
            onPress={next}
            disabled={selectedHobbies.length === 0}
          >
            <Text style={s.primaryBtnText}>
              {selectedHobbies.length === 0
                ? 'Pick at least one'
                : `I'm growing these (${selectedHobbies.length}) →`}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Goal ──────────────────────────────────────────────────────────────────
  if (STEPS[step] === 'goal') {
    return (
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.center}>
            <StepDots current={3} total={5} />
            <Text style={s.nameEmoji}>🎯</Text>
            <Text style={s.stepTitle}>What's one big goal for this year?</Text>
            <Text style={s.stepSub}>Don't overthink it — whatever comes to mind first is perfect.</Text>
            <TextInput
              style={s.nameInput}
              placeholder="e.g. Learn to play guitar…"
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
                {bigGoal.trim() ? 'Set this goal →' : 'Skip for now →'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Ready ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <StepDots current={4} total={5} />
        <BuddyAvatar buddy={buddy} momentum={50} size={100} />
        <Text style={[s.buddyName, { marginTop: 16, fontSize: 22 }]}>{buddy.name} is ready!</Text>
        <Text style={s.readyBody}>
          {name.trim()
            ? `You and ${buddy.name} are going to do great things together, ${name.trim()}. One small step at a time.`
            : `You and ${buddy.name} are going to do great things together. One small step at a time.`}
        </Text>
        <TouchableOpacity style={s.primaryBtn} onPress={() => onFinish(selectedBuddy, selectedHobbies, name.trim(), bigGoal.trim())}>
          <Text style={s.primaryBtnText}>Start blooming 🌸</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: C.cream },
  scroll: { padding: 28, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },

  logo: { fontSize: 64, marginBottom: 8 },
  wordmark: { fontSize: 42, fontWeight: '700', color: C.forest, marginBottom: 8 },
  tagline: { fontSize: 16, color: C.sage, textAlign: 'center', lineHeight: 24, marginBottom: 28 },
  welcomeBody: { fontSize: 16, color: C.muted, textAlign: 'center', lineHeight: 26, marginBottom: 40 },

  nameEmoji: { fontSize: 52, marginBottom: 16 },
  stepTitle: { fontSize: 26, fontWeight: '700', color: C.forest, marginBottom: 8, textAlign: 'center' },
  stepSub: { fontSize: 15, color: C.muted, lineHeight: 22, marginBottom: 28, textAlign: 'center' },

  nameInput: {
    width: '100%', backgroundColor: C.white,
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: 16, paddingVertical: 15, paddingHorizontal: 18,
    fontSize: 18, color: C.forest, marginBottom: 24, textAlign: 'center',
  },

  buddyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  buddyCard: {
    width: '47%', alignItems: 'center', padding: 20,
    backgroundColor: C.white, borderRadius: 18,
    borderWidth: 2, borderColor: C.border,
  },
  buddyCardActive: { borderColor: C.sage, backgroundColor: C.sagePale },
  buddyName: { fontSize: 16, fontWeight: '700', color: C.forest, marginTop: 10 },
  buddySubtitle: { fontSize: 12, color: C.muted, marginTop: 2 },

  hobbyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  hobbyChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: C.white, borderRadius: 14,
    borderWidth: 2, borderColor: C.border, gap: 8,
  },
  hobbyChipActive: { borderColor: C.sage, backgroundColor: C.sagePale },
  hobbyChipDisabled: { opacity: 0.4 },
  hobbyEmoji: { fontSize: 20 },
  hobbyLabel: { fontSize: 15, fontWeight: '600', color: C.forest },
  hobbyLabelActive: { color: C.sage },
  hobbyCheck: { fontSize: 13, color: C.sage, fontWeight: '800' },

  readyBody: { fontSize: 16, color: C.muted, textAlign: 'center', lineHeight: 26, marginVertical: 20, marginBottom: 40 },

  primaryBtn: {
    backgroundColor: C.sage, borderRadius: 16,
    paddingVertical: 17, paddingHorizontal: 32,
    alignItems: 'center', width: '100%',
  },
  btnOff: { opacity: 0.4 },
  primaryBtnText: { color: C.white, fontWeight: '700', fontSize: 17 },
});
