import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet,
} from 'react-native';
import { C } from '../constants/colors';
import { BUDDIES, HOBBIES } from '../constants/data';
import BuddyAvatar from '../components/BuddyAvatar';

const STEPS = ['welcome', 'buddy', 'hobbies', 'ready'];

export default function OnboardingScreen({ onFinish }) {
  const [step, setStep] = useState(0);
  const [selectedBuddy, setSelectedBuddy] = useState(BUDDIES[0].id);
  const [selectedHobbies, setSelectedHobbies] = useState([]);

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));

  const toggleHobby = (id) =>
    setSelectedHobbies(prev =>
      prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]
    );

  const buddy = BUDDIES.find(b => b.id === selectedBuddy);

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

  if (STEPS[step] === 'buddy') {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll}>
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

  if (STEPS[step] === 'hobbies') {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={s.stepTitle}>What do you want to build?</Text>
          <Text style={s.stepSub}>Pick up to 3 things. We'll grow them together, one small step at a time.</Text>
          <View style={s.hobbyGrid}>
            {HOBBIES.map(h => {
              const active = selectedHobbies.includes(h.id);
              const maxed = selectedHobbies.length >= 3 && !active;
              return (
                <TouchableOpacity
                  key={h.id}
                  style={[s.hobbyChip, active && s.hobbyChipActive, maxed && s.hobbyChipDisabled]}
                  onPress={() => !maxed && toggleHobby(h.id)}
                >
                  <Text style={s.hobbyEmoji}>{h.emoji}</Text>
                  <Text style={[s.hobbyLabel, active && s.hobbyLabelActive]}>{h.name}</Text>
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
              {selectedHobbies.length === 0 ? 'Pick at least one' : `I'm growing these (${selectedHobbies.length}) →`}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ready
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <BuddyAvatar buddy={buddy} momentum={50} size={100} />
        <Text style={[s.buddyName, { marginTop: 16, fontSize: 22 }]}>{buddy.name} is ready!</Text>
        <Text style={s.readyBody}>
          You and {buddy.name} are going to do great things together. One small step at a time.
        </Text>
        <TouchableOpacity style={s.primaryBtn} onPress={() => onFinish(selectedBuddy, selectedHobbies)}>
          <Text style={s.primaryBtnText}>Start blooming 🌸</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  scroll: { padding: 28, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },

  logo: { fontSize: 64, marginBottom: 8 },
  wordmark: { fontSize: 42, fontWeight: '700', color: C.forest, marginBottom: 8 },
  tagline: { fontSize: 16, color: C.sage, textAlign: 'center', lineHeight: 24, marginBottom: 28 },
  welcomeBody: {
    fontSize: 16, color: C.muted, textAlign: 'center',
    lineHeight: 26, marginBottom: 40,
  },

  stepTitle: { fontSize: 26, fontWeight: '700', color: C.forest, marginBottom: 8 },
  stepSub: { fontSize: 15, color: C.muted, lineHeight: 22, marginBottom: 28 },

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

  readyBody: {
    fontSize: 16, color: C.muted, textAlign: 'center',
    lineHeight: 26, marginVertical: 20, marginBottom: 40,
  },

  primaryBtn: {
    backgroundColor: C.sage, borderRadius: 16,
    paddingVertical: 17, paddingHorizontal: 32,
    alignItems: 'center', width: '100%',
  },
  btnOff: { opacity: 0.4 },
  primaryBtnText: { color: C.white, fontWeight: '700', fontSize: 17 },
});
