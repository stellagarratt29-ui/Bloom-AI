import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, Switch,
} from 'react-native';
import { C } from '../constants/colors';
import Icon from '../components/Icon';

const OCCUPATIONS = ['Student', 'Working', 'Both', 'Other'];
const AGE_RANGES  = ['Under 16', '16–18', '19–24', '25–34', '35–49', '50+'];
const HOBBY_SUGGESTIONS = [
  'Guitar', 'Watercolour', 'Running', 'Reading', 'Cooking', 'Photography',
  'Yoga', 'Drawing', 'Gaming', 'Writing', 'Piano', 'Swimming',
];

const ND_TOGGLES_DEF = [
  {
    key: 'autoBreakTasks',
    label: 'Break tasks into smaller steps automatically',
    sub: 'Even simple-sounding tasks get split into 2–3 tiny steps so nothing feels overwhelming.',
  },
  {
    key: 'ideaCapture',
    label: 'Capture ideas without losing focus',
    sub: 'A quick-capture button stays visible so you can note mid-task ideas instantly without switching context.',
  },
  {
    key: 'timeBuffers',
    label: 'Extra time buffers',
    sub: 'Bloom pads time estimates more generously by default so you always have room to breathe.',
  },
  {
    key: 'reducedClutter',
    label: 'Reduce visual clutter',
    sub: 'A simpler, quieter view for Tasks and Goals with more whitespace and less text per item.',
  },
  {
    key: 'gentlerLanguage',
    label: 'Gentler language for missed tasks',
    sub: 'Extra-soft copy when something doesn\'t get done — never "you didn\'t finish," always "that\'s okay, here\'s what\'s next."',
  },
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
  const [occupation,        setOccupation]       = useState('');
  const [customOccupation,  setCustomOccupation] = useState('');
  const [selHobbies,        setSelHobbies]       = useState([]);
  const [customHobbyText,   setCustomHobbyText]  = useState('');
  const [ndChoice,    setNdChoice]   = useState(null); // 'yes' | 'no' | 'skip'
  const [ndToggles,   setNdToggles]  = useState({
    autoBreakTasks: false, ideaCapture: false,
    timeBuffers: false, reducedClutter: false, gentlerLanguage: false,
  });
  const [saving, setSaving] = useState(false);

  const next = () => setStep(s => s + 1);

  const toggleHobby = (h) =>
    setSelHobbies(prev =>
      prev.includes(h) ? prev.filter(x => x !== h) : prev.length < 5 ? [...prev, h] : prev
    );

  const addCustomHobby = () => {
    const h = customHobbyText.trim();
    if (!h || selHobbies.includes(h) || selHobbies.length >= 5) return;
    setSelHobbies(prev => [...prev, h]);
    setCustomHobbyText('');
  };

  const toggleNd = (key) =>
    setNdToggles(prev => ({ ...prev, [key]: !prev[key] }));

  const finish = async () => {
    setSaving(true);
    try {
      const finalOccupation = occupation === 'Other' && customOccupation.trim()
        ? customOccupation.trim()
        : occupation;
      onFinish(
        name.trim(), ageRange, finalOccupation,
        null, null, selHobbies,
        ndChoice, ndChoice === 'yes' ? ndToggles : null,
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Step 0: Welcome + Name ────────────────────────────────────────────────
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

  // ── Step 1: Age + Occupation ──────────────────────────────────────────────
  if (step === 1) {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scrollCenter} showsVerticalScrollIndicator={false}>
          <Dots current={0} total={4} />
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
          {occupation === 'Other' && (
            <TextInput
              style={[s.textInput, { marginTop: 10, marginBottom: 0 }]}
              placeholder="e.g. Mum, dentist, nurse, freelancer…"
              placeholderTextColor={C.muted}
              value={customOccupation}
              onChangeText={setCustomOccupation}
              autoCapitalize="words"
              returnKeyType="done"
            />
          )}

          <TouchableOpacity style={[s.primaryBtn, { marginTop: 32 }]} onPress={next}>
            <Text style={s.primaryBtnText}>Continue →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step 2: Optional hobbies ──────────────────────────────────────────────
  if (step === 2) {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scrollCenter} showsVerticalScrollIndicator={false}>
          <Dots current={1} total={4} />
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
            {selHobbies.filter(h => !HOBBY_SUGGESTIONS.includes(h)).map(h => (
              <TouchableOpacity
                key={h}
                style={[s.hobbyChip, s.hobbyChipActive]}
                onPress={() => toggleHobby(h)}
              >
                <Text style={[s.hobbyChipText, s.hobbyChipTextActive]}>{h}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.customHobbyRow}>
            <TextInput
              style={s.customHobbyInput}
              placeholder="Type your own hobby…"
              placeholderTextColor={C.muted}
              value={customHobbyText}
              onChangeText={setCustomHobbyText}
              onSubmitEditing={addCustomHobby}
              returnKeyType="done"
              autoCapitalize="words"
            />
            <TouchableOpacity
              style={[s.customHobbyAdd, !customHobbyText.trim() && { opacity: 0.35 }]}
              onPress={addCustomHobby}
              disabled={!customHobbyText.trim()}
            >
              <Text style={s.customHobbyAddText}>Add</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[s.primaryBtn, { marginTop: 20 }]} onPress={next}>
            <Text style={s.primaryBtnText}>{selHobbies.length > 0 ? `Add ${selHobbies.length} ${selHobbies.length === 1 ? 'hobby' : 'hobbies'} →` : 'Skip →'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step 3: Neurodivergent support question ───────────────────────────────
  if (step === 3) {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scrollCenter} showsVerticalScrollIndicator={false}>
          <Dots current={2} total={4} />
          <View style={s.ndIconWrap}>
            <Text style={s.ndIcon}>🌿</Text>
          </View>
          <Text style={s.stepTitle}>One more thing</Text>
          <Text style={s.ndQuestion}>
            Does your brain work in a way that sometimes needs a little extra support? (ADHD, autism, anxiety, or anything else — totally optional, just helps me help you better.)
          </Text>

          {[
            { id: 'yes',  label: 'Yes, a little extra support would help' },
            { id: 'no',   label: 'No, the default works well for me' },
            { id: 'skip', label: 'Prefer not to say' },
          ].map(opt => (
            <TouchableOpacity
              key={opt.id}
              style={[s.ndOption, ndChoice === opt.id && s.ndOptionActive]}
              onPress={() => setNdChoice(opt.id)}
              activeOpacity={0.7}
            >
              <View style={[s.ndRadio, ndChoice === opt.id && s.ndRadioActive]}>
                {ndChoice === opt.id && <View style={s.ndRadioFill} />}
              </View>
              <Text style={[s.ndOptionText, ndChoice === opt.id && s.ndOptionTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[s.primaryBtn, { marginTop: 28 }, !ndChoice && { opacity: 0.4 }]}
            onPress={() => {
              if (!ndChoice) return;
              if (ndChoice === 'yes') { next(); }
              else { setStep(5); } // skip toggle screen
            }}
            disabled={!ndChoice}
          >
            <Text style={s.primaryBtnText}>Continue →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step 4: ND toggle selection (only if "yes") ───────────────────────────
  if (step === 4) {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={[s.scrollCenter, { paddingTop: 32 }]} showsVerticalScrollIndicator={false}>
          <Dots current={3} total={4} />
          <Text style={s.stepTitle}>Choose what helps</Text>
          <Text style={s.stepSub}>
            All off by default — turn on whatever feels useful. You can change these anytime in Settings.
          </Text>

          {ND_TOGGLES_DEF.map(({ key, label, sub }) => (
            <TouchableOpacity
              key={key}
              style={[s.toggleCard, ndToggles[key] && s.toggleCardActive]}
              onPress={() => toggleNd(key)}
              activeOpacity={0.8}
            >
              <View style={s.toggleCardLeft}>
                <Text style={[s.toggleLabel, ndToggles[key] && s.toggleLabelActive]}>{label}</Text>
                <Text style={s.toggleSub}>{sub}</Text>
              </View>
              <Switch
                value={ndToggles[key]}
                onValueChange={() => toggleNd(key)}
                trackColor={{ false: C.border, true: C.moss }}
                thumbColor={C.white}
              />
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={[s.primaryBtn, { marginTop: 24 }]} onPress={next}>
            <Text style={s.primaryBtnText}>Continue →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step 5: Ready ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <Dots current={3} total={4} />
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

  hobbyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%', justifyContent: 'center', marginBottom: 16 },
  customHobbyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', marginBottom: 4 },
  customHobbyInput: {
    flex: 1, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, paddingVertical: 11, paddingHorizontal: 16,
    fontSize: 15, color: C.ink,
  },
  customHobbyAdd: {
    backgroundColor: C.clay, borderRadius: 14,
    paddingVertical: 11, paddingHorizontal: 18,
  },
  customHobbyAddText: { color: C.white, fontWeight: '700', fontSize: 14 },
  hobbyChip: {
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white,
  },
  hobbyChipActive: { borderColor: C.clay, backgroundColor: C.clayPale },
  hobbyChipText: { fontSize: 14, fontWeight: '600', color: C.muted },
  hobbyChipTextActive: { color: C.clay },

  // ND question
  ndIconWrap: { marginBottom: 16, alignItems: 'center' },
  ndIcon: { fontSize: 40 },
  ndQuestion: {
    fontSize: 15, color: C.ink, textAlign: 'center', lineHeight: 24,
    marginBottom: 28, paddingHorizontal: 4,
  },
  ndOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    width: '100%', borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16,
    marginBottom: 10, backgroundColor: C.white,
  },
  ndOptionActive: { borderColor: C.moss, backgroundColor: C.sagePale },
  ndRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  ndRadioActive: { borderColor: C.moss },
  ndRadioFill: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.moss },
  ndOptionText: { fontSize: 14, fontWeight: '500', color: C.muted, flex: 1 },
  ndOptionTextActive: { color: C.ink, fontWeight: '600' },

  // ND toggles
  toggleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    width: '100%', borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16,
    marginBottom: 10, backgroundColor: C.white,
  },
  toggleCardActive: { borderColor: C.moss, backgroundColor: C.sagePale },
  toggleCardLeft: { flex: 1 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: C.muted, marginBottom: 3 },
  toggleLabelActive: { color: C.ink },
  toggleSub:   { fontSize: 12, color: C.muted, lineHeight: 18 },

  primaryBtn: {
    backgroundColor: C.moss, borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 32,
    alignItems: 'center', width: '100%',
  },
  primaryBtnText: { color: C.white, fontWeight: '700', fontSize: 16 },
});
