import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, Switch,
} from 'react-native';
import { C } from '../constants/colors';
import Icon from '../components/Icon';
import { requestLocation, markLocationDenied } from '../services/location';

const OCCUPATIONS = ['Student', 'Working', 'Both', 'Other'];
const AGE_RANGES  = ['Under 16', '16–18', '19–24', '25–34', '35–49', '50+'];
const HOBBY_SUGGESTIONS = [
  'Guitar', 'Watercolour', 'Running', 'Reading', 'Cooking', 'Photography',
  'Yoga', 'Drawing', 'Gaming', 'Writing', 'Piano', 'Swimming',
];

const ND_TOGGLES_DEF = [
  {
    key: 'autoBreakTasks',
    label: 'Break tasks into smaller steps',
    sub: 'Simple tasks auto-split into 2–3 tiny steps so nothing feels overwhelming.',
  },
  {
    key: 'ideaCapture',
    label: 'Prominent idea capture',
    sub: 'Quick-capture button stays visible so mid-task ideas never get lost.',
  },
  {
    key: 'timeBuffers',
    label: 'Extra time buffers',
    sub: 'Time estimates padded more generously so you always have breathing room.',
  },
  {
    key: 'reducedClutter',
    label: 'Reduced visual clutter',
    sub: 'Simpler, quieter view for Tasks and Goals with more whitespace.',
  },
  {
    key: 'gentlerLanguage',
    label: 'Gentler language for missed tasks',
    sub: 'Extra-soft copy when something doesn\'t get done — never guilt, always forward.',
  },
  {
    key: 'dyslexiaMode',
    label: 'Dyslexia-friendly text',
    sub: 'More letter/word spacing, cleaner font, and larger text options.',
  },
];

const TEXT_SIZE_OPTIONS = [
  { key: 'normal', label: 'Normal' },
  { key: 'large',  label: 'Large' },
  { key: 'xl',     label: 'Extra large' },
];

// Thin progress line — shows from step 2 onward
function ProgressLine({ step }) {
  if (step < 2) return null;
  const pct = Math.min(((step - 1) / 5) * 100, 100);
  return (
    <View style={s.progressTrack}>
      <View style={[s.progressFill, { width: `${pct}%` }]} />
    </View>
  );
}

function BackBtn({ onPress }) {
  return (
    <TouchableOpacity style={s.backBtn} onPress={onPress} activeOpacity={0.6} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
      <Icon name="arrow-left" size={20} color={C.ink} />
    </TouchableOpacity>
  );
}

export default function OnboardingScreen({ onFinish }) {
  const [step,              setStep]             = useState(0);
  const [name,              setName]             = useState('');
  const [ageRange,          setAgeRange]         = useState('');
  const [occupation,        setOccupation]       = useState('');
  const [customOccupation,  setCustomOccupation] = useState('');
  const [selHobbies,        setSelHobbies]       = useState([]);
  const [customHobbyText,   setCustomHobbyText]  = useState('');
  const [ndChoice,          setNdChoice]         = useState(null);
  const [ndToggles,         setNdToggles]        = useState({
    autoBreakTasks: false, ideaCapture: false,
    timeBuffers: false, reducedClutter: false, gentlerLanguage: false,
    dyslexiaMode: false,
  });
  const [ndTextSize,    setNdTextSize]    = useState('normal');
  const [saving,        setSaving]        = useState(false);
  const [locGranted,    setLocGranted]    = useState(false);
  const [locRequesting, setLocRequesting] = useState(false);

  const next   = () => setStep(s => s + 1);
  const goBack = () => {
    if (step === 6) { setStep(ndChoice === 'yes' ? 5 : 4); return; }
    setStep(s => s - 1);
  };

  const handleAllowLocation = async () => {
    setLocRequesting(true);
    const coords = await requestLocation();
    setLocGranted(!!coords);
    setLocRequesting(false);
    next();
  };

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
        ? customOccupation.trim() : occupation;
      const finalNdToggles = ndChoice === 'yes'
        ? { ...ndToggles, textSize: ndToggles.dyslexiaMode ? ndTextSize : 'normal' }
        : null;
      onFinish(name.trim(), ageRange, finalOccupation, null, null, selHobbies, ndChoice, finalNdToggles);
    } finally {
      setSaving(false);
    }
  };

  // ── Step 0: Welcome ───────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.center}>
            <Text style={s.wordmark}>Bloom</Text>
            <Text style={s.tagline}>Your mind, sorted.</Text>
            <Text style={s.welcomeBody}>
              Tell Bloom what's on your mind — tasks, worries, goals, anything. It turns it into a clear, doable plan.
            </Text>

            <View style={s.inputWrap}>
              <TextInput
                style={s.nameInput}
                placeholder="What should we call you?"
                placeholderTextColor={C.muted}
                value={name}
                onChangeText={setName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={next}
                autoCapitalize="words"
              />
            </View>

            <TouchableOpacity
              style={[s.pill, !name.trim() && s.pillOff]}
              onPress={next}
              activeOpacity={0.85}
            >
              <Text style={s.pillText}>{name.trim() ? `Nice to meet you, ${name.trim().split(' ')[0]}` : 'Get started'}</Text>
            </TouchableOpacity>

            {!name.trim() && (
              <TouchableOpacity style={s.ghostBtn} onPress={next}>
                <Text style={s.ghostBtnText}>Skip</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Step 1: Location ──────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <SafeAreaView style={s.safe}>
        <ProgressLine step={step} />
        <BackBtn onPress={goBack} />
        <View style={s.center}>
          <View style={s.locIconWrap}>
            <Icon name="map-pin" size={24} color={C.clay} />
          </View>
          <Text style={s.stepTitle}>Know when to leave</Text>
          <Text style={s.stepSub}>
            Bloom can tell you exactly when to head out for events, based on real travel time. Totally optional.
          </Text>
          <View style={s.bulletList}>
            {['Leave-time alerts based on traffic', 'Works with your calendar events', 'Never shared or stored'].map(t => (
              <View key={t} style={s.bulletRow}>
                <View style={s.bulletDot} />
                <Text style={s.bulletText}>{t}</Text>
              </View>
            ))}
          </View>
          {locRequesting
            ? <ActivityIndicator color={C.moss} style={{ marginTop: 32 }} />
            : (
              <TouchableOpacity style={[s.pill, { marginTop: 36 }]} onPress={handleAllowLocation} activeOpacity={0.85}>
                <Text style={s.pillText}>Allow location</Text>
              </TouchableOpacity>
            )
          }
          <TouchableOpacity style={s.ghostBtn} onPress={() => { markLocationDenied(); next(); }}>
            <Text style={s.ghostBtnText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Step 2: Age + Occupation ──────────────────────────────────────────────
  if (step === 2) {
    return (
      <SafeAreaView style={s.safe}>
        <ProgressLine step={step} />
        <BackBtn onPress={goBack} />
        <ScrollView contentContainerStyle={s.scrollCenter} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={s.stepTitle}>A bit about you</Text>
          <Text style={s.stepSub}>Helps Bloom keep things relevant. Totally optional.</Text>

          <Text style={s.sectionLabel}>How old are you?</Text>
          <View style={s.pillGrid}>
            {AGE_RANGES.map(a => (
              <TouchableOpacity
                key={a}
                style={[s.selectChip, ageRange === a && s.selectChipActive]}
                onPress={() => setAgeRange(a === ageRange ? '' : a)}
              >
                <Text style={[s.selectChipText, ageRange === a && s.selectChipTextActive]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.sectionLabel, { marginTop: 28 }]}>What do you do?</Text>
          <View style={s.pillGrid}>
            {OCCUPATIONS.map(o => (
              <TouchableOpacity
                key={o}
                style={[s.selectChip, occupation === o && s.selectChipActive]}
                onPress={() => setOccupation(o === occupation ? '' : o)}
              >
                <Text style={[s.selectChipText, occupation === o && s.selectChipTextActive]}>{o}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {occupation === 'Other' && (
            <View style={[s.inputWrap, { marginTop: 12 }]}>
              <TextInput
                style={s.nameInput}
                placeholder="e.g. Mum, nurse, freelancer…"
                placeholderTextColor={C.muted}
                value={customOccupation}
                onChangeText={setCustomOccupation}
                autoCapitalize="words"
                returnKeyType="done"
              />
            </View>
          )}

          <TouchableOpacity style={[s.pill, { marginTop: 36 }]} onPress={next} activeOpacity={0.85}>
            <Text style={s.pillText}>Continue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.ghostBtn} onPress={next}>
            <Text style={s.ghostBtnText}>Skip</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step 3: Hobbies ───────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <SafeAreaView style={s.safe}>
        <ProgressLine step={step} />
        <BackBtn onPress={goBack} />
        <ScrollView contentContainerStyle={s.scrollCenter} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={s.stepTitle}>Any hobbies?</Text>
          <Text style={s.stepSub}>Pick up to 5 — Bloom will build you a real curriculum for each one. You can add more later.</Text>

          <View style={s.pillGrid}>
            {HOBBY_SUGGESTIONS.map(h => (
              <TouchableOpacity
                key={h}
                style={[s.selectChip, selHobbies.includes(h) && s.selectChipPink]}
                onPress={() => toggleHobby(h)}
              >
                {selHobbies.includes(h) && <Icon name="check" size={12} color={C.clay} style={{ marginRight: 4 }} />}
                <Text style={[s.selectChipText, selHobbies.includes(h) && s.selectChipTextPink]}>{h}</Text>
              </TouchableOpacity>
            ))}
            {selHobbies.filter(h => !HOBBY_SUGGESTIONS.includes(h)).map(h => (
              <TouchableOpacity key={h} style={[s.selectChip, s.selectChipPink]} onPress={() => toggleHobby(h)}>
                <Icon name="check" size={12} color={C.clay} style={{ marginRight: 4 }} />
                <Text style={[s.selectChipText, s.selectChipTextPink]}>{h}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[s.inputWrap, { marginTop: 16 }]}>
            <TextInput
              style={[s.nameInput, { paddingRight: 80 }]}
              placeholder="Type your own…"
              placeholderTextColor={C.muted}
              value={customHobbyText}
              onChangeText={setCustomHobbyText}
              onSubmitEditing={addCustomHobby}
              returnKeyType="done"
              autoCapitalize="words"
            />
            {!!customHobbyText.trim() && (
              <TouchableOpacity style={s.addInline} onPress={addCustomHobby}>
                <Text style={s.addInlineText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[s.pill, { marginTop: 28 }, selHobbies.length === 0 && s.pillOff]}
            onPress={next}
            activeOpacity={0.85}
          >
            <Text style={s.pillText}>
              {selHobbies.length > 0 ? `Add ${selHobbies.length} ${selHobbies.length === 1 ? 'hobby' : 'hobbies'}` : 'Continue'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.ghostBtn} onPress={next}>
            <Text style={s.ghostBtnText}>Skip</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step 4: ND support ────────────────────────────────────────────────────
  if (step === 4) {
    return (
      <SafeAreaView style={s.safe}>
        <ProgressLine step={step} />
        <BackBtn onPress={goBack} />
        <ScrollView contentContainerStyle={s.scrollCenter} showsVerticalScrollIndicator={false}>
          <Text style={s.stepTitle}>One more thing</Text>
          <Text style={s.stepSub}>
            Does your brain sometimes need a little extra support? (ADHD, autism, anxiety — anything. Totally optional, helps me help you.)
          </Text>

          {[
            { id: 'yes',  label: 'Yes — a little extra support helps' },
            { id: 'no',   label: 'No, the defaults work well for me' },
            { id: 'skip', label: 'Prefer not to say' },
          ].map(opt => (
            <TouchableOpacity
              key={opt.id}
              style={[s.optionCard, ndChoice === opt.id && s.optionCardActive]}
              onPress={() => setNdChoice(opt.id)}
              activeOpacity={0.7}
            >
              <View style={[s.optionRadio, ndChoice === opt.id && s.optionRadioActive]}>
                {ndChoice === opt.id && <View style={s.optionRadioFill} />}
              </View>
              <Text style={[s.optionText, ndChoice === opt.id && s.optionTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[s.pill, { marginTop: 28 }, !ndChoice && s.pillOff]}
            onPress={() => {
              if (!ndChoice) return;
              ndChoice === 'yes' ? next() : setStep(6);
            }}
            disabled={!ndChoice}
            activeOpacity={0.85}
          >
            <Text style={s.pillText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step 5: ND toggles ────────────────────────────────────────────────────
  if (step === 5) {
    return (
      <SafeAreaView style={s.safe}>
        <ProgressLine step={step} />
        <BackBtn onPress={goBack} />
        <ScrollView contentContainerStyle={[s.scrollCenter, { paddingTop: 24 }]} showsVerticalScrollIndicator={false}>
          <Text style={s.stepTitle}>Choose what helps</Text>
          <Text style={s.stepSub}>All off by default. Turn on whatever feels useful — change anytime in Settings.</Text>

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
                value={!!ndToggles[key]}
                onValueChange={() => toggleNd(key)}
                trackColor={{ false: C.border, true: C.moss }}
                thumbColor={C.white}
              />
            </TouchableOpacity>
          ))}

          {ndToggles.dyslexiaMode && (
            <View style={s.textSizeBox}>
              <Text style={s.textSizeLabel}>Text size</Text>
              <View style={s.pillGrid}>
                {TEXT_SIZE_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[s.selectChip, ndTextSize === opt.key && s.selectChipActive]}
                    onPress={() => setNdTextSize(opt.key)}
                  >
                    <Text style={[s.selectChipText, ndTextSize === opt.key && s.selectChipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity style={[s.pill, { marginTop: 24 }]} onPress={next} activeOpacity={0.85}>
            <Text style={s.pillText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step 6: Ready ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <ProgressLine step={6} />
      <BackBtn onPress={goBack} />
      <View style={s.center}>
        <Text style={s.wordmarkSmall}>Bloom</Text>
        <Text style={s.readyTitle}>
          {name.trim() ? `You're all set,\n${name.trim().split(' ')[0]}.` : "You're all set."}
        </Text>
        <Text style={s.welcomeBody}>
          Start by telling Bloom everything on your mind — tasks, worries, plans, goals. It'll sort it into a clear list. Tap any task for step-by-step help.
        </Text>
        <TouchableOpacity
          style={[s.pill, { marginTop: 36 }, saving && { opacity: 0.6 }]}
          onPress={finish}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color={C.white} />
            : <Text style={s.pillText}>Open Bloom</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const SHADOW = {
  shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 16,
  shadowOffset: { width: 0, height: 4 }, elevation: 3,
};

const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: C.cream },

  progressTrack: { height: 2, backgroundColor: C.border, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  progressFill:  { height: 2, backgroundColor: C.moss },

  backBtn: {
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8,
    alignSelf: 'flex-start',
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  scrollCenter: {
    flexGrow: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 28, paddingVertical: 40,
  },

  // Wordmark
  wordmark: {
    fontSize: 72, fontWeight: '800', color: C.clay, letterSpacing: -2,
    marginBottom: 8, textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined,
  },
  wordmarkSmall: {
    fontSize: 40, fontWeight: '800', color: C.clay, letterSpacing: -1,
    marginBottom: 20, textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined,
  },
  tagline: {
    fontSize: 22, fontWeight: '300', color: C.ink, textAlign: 'center',
    letterSpacing: 0.2, marginBottom: 20,
  },
  welcomeBody: {
    fontSize: 15, color: C.muted, textAlign: 'center',
    lineHeight: 25, marginBottom: 36, maxWidth: 300,
  },

  stepTitle: {
    fontSize: 28, fontWeight: '800', color: C.ink, textAlign: 'center', lineHeight: 36,
    marginBottom: 10,
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined,
  },
  stepSub: {
    fontSize: 14, color: C.muted, textAlign: 'center',
    lineHeight: 22, marginBottom: 32, maxWidth: 300,
  },
  readyTitle: {
    fontSize: 30, fontWeight: '800', color: C.ink, textAlign: 'center', lineHeight: 40,
    marginBottom: 16,
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined,
  },
  sectionLabel: {
    fontSize: 13, fontWeight: '600', color: C.ink, alignSelf: 'flex-start',
    marginBottom: 12,
  },

  // Input
  inputWrap: { width: '100%', position: 'relative', marginBottom: 4 },
  nameInput: {
    width: '100%', backgroundColor: C.white,
    borderRadius: 18, paddingVertical: 18, paddingHorizontal: 22,
    fontSize: 16, color: C.ink,
    ...SHADOW,
  },
  addInline: {
    position: 'absolute', right: 12, top: '50%',
    marginTop: -16, paddingVertical: 8, paddingHorizontal: 14,
    backgroundColor: C.clay, borderRadius: 10,
  },
  addInlineText: { color: C.white, fontWeight: '700', fontSize: 13 },

  // Pill button
  pill: {
    backgroundColor: C.moss, borderRadius: 50,
    paddingVertical: 18, paddingHorizontal: 32,
    width: '100%', alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
    ...SHADOW,
  },
  pillOff:  { opacity: 0.45 },
  pillText: { color: C.white, fontWeight: '700', fontSize: 16, letterSpacing: 0.2 },

  ghostBtn:     { paddingVertical: 16, paddingHorizontal: 20 },
  ghostBtnText: { fontSize: 14, color: C.muted, fontWeight: '500' },

  // Select chips (age, occupation, hobbies)
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%', justifyContent: 'flex-start' },
  selectChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: 50,
    backgroundColor: C.white, ...SHADOW,
  },
  selectChipActive:     { backgroundColor: C.sagePale, shadowOpacity: 0.03 },
  selectChipPink:       { backgroundColor: C.clayPale, shadowOpacity: 0.03 },
  selectChipText:       { fontSize: 14, fontWeight: '500', color: C.muted },
  selectChipTextActive: { color: C.mossDark, fontWeight: '600' },
  selectChipTextPink:   { color: C.clay, fontWeight: '600' },

  // Location bullets
  locIconWrap: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: C.clayPale, alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, ...SHADOW,
  },
  bulletList: { alignSelf: 'stretch', gap: 12, marginBottom: 4, paddingHorizontal: 4 },
  bulletRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bulletDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: C.moss, flexShrink: 0 },
  bulletText: { fontSize: 14, color: C.ink, flex: 1, lineHeight: 22 },

  // ND option cards
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    width: '100%', borderRadius: 18,
    paddingVertical: 16, paddingHorizontal: 18,
    marginBottom: 10, backgroundColor: C.white,
    ...SHADOW,
  },
  optionCardActive: { backgroundColor: C.sagePale, shadowOpacity: 0.03 },
  optionRadio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  optionRadioActive: { borderColor: C.moss },
  optionRadioFill:   { width: 10, height: 10, borderRadius: 5, backgroundColor: C.moss },
  optionText:        { fontSize: 14, fontWeight: '500', color: C.muted, flex: 1 },
  optionTextActive:  { color: C.ink, fontWeight: '600' },

  // ND toggle cards
  toggleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    width: '100%', borderRadius: 18,
    paddingVertical: 14, paddingHorizontal: 16,
    marginBottom: 10, backgroundColor: C.white,
    ...SHADOW,
  },
  toggleCardActive: { backgroundColor: C.sagePale, shadowOpacity: 0.03 },
  toggleCardLeft:   { flex: 1 },
  toggleLabel:      { fontSize: 14, fontWeight: '600', color: C.muted, marginBottom: 3 },
  toggleLabelActive:{ color: C.ink },
  toggleSub:        { fontSize: 12, color: C.muted, lineHeight: 18 },

  textSizeBox: {
    width: '100%', backgroundColor: C.sagePale,
    borderRadius: 18, padding: 18, marginBottom: 10,
  },
  textSizeLabel: { fontSize: 13, fontWeight: '600', color: C.ink, marginBottom: 12 },
});
