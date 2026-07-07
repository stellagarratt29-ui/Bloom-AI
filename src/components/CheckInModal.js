import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, SafeAreaView, Platform,
} from 'react-native';
import { C } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

const STEPS = [
  {
    key: 'mood',
    question: 'How are you feeling?',
    sub: 'Pick the one that fits best right now.',
    options: [
      { value: 'amazing',    label: 'Amazing',     bg: '#D4EDD4', text: '#2D6B34' },
      { value: 'good',       label: 'Good',        bg: '#E4F0E2', text: '#4A7A52' },
      { value: 'okay',       label: 'Okay',        bg: '#EDE8E1', text: '#6B5E4A' },
      { value: 'anxious',    label: 'Anxious',     bg: '#F0E8E4', text: '#7A4A3A' },
      { value: 'tired',      label: 'Tired',       bg: '#E8E4F0', text: '#5A4A7A' },
      { value: 'stressed',   label: 'Stressed',    bg: '#F5E8DC', text: '#8B4A1E' },
      { value: 'sad',        label: 'Sad',         bg: '#DCE8F5', text: '#1E4A8B' },
      { value: 'overwhelmed',label: 'Overwhelmed', bg: '#F5DCE0', text: '#8B1E35' },
    ],
  },
  {
    key: 'sleep',
    question: 'How much sleep did you get?',
    sub: 'Roughly.',
    options: [
      { value: 'under5', label: 'Under 5h', bg: '#F5DCE0', text: '#8B1E35' },
      { value: '5to6',   label: '5–6h',     bg: '#F5E8DC', text: '#8B4A1E' },
      { value: '6to7',   label: '6–7h',     bg: '#EDE8E1', text: '#6B5E4A' },
      { value: '7to8',   label: '7–8h',     bg: '#E4F0E2', text: '#4A7A52' },
      { value: 'over8',  label: '8h+',      bg: '#D4EDD4', text: '#2D6B34' },
    ],
  },
  {
    key: 'energy',
    question: 'Energy level?',
    sub: 'How much fuel do you have today?',
    options: [
      { value: 'low',    label: 'Running on empty', bg: '#F5DCE0', text: '#8B1E35' },
      { value: 'medium', label: 'Some in the tank',  bg: '#EDE8E1', text: '#6B5E4A' },
      { value: 'high',   label: 'Fully charged',     bg: '#D4EDD4', text: '#2D6B34' },
    ],
  },
];

export default function CheckInModal({ visible, onDone }) {
  const { colors: t } = useTheme();
  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState({});

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  const pick = (value) => {
    const next = { ...answers, [current.key]: value };
    setAnswers(next);
    if (isLast) {
      onDone(next);
      setStep(0);
      setAnswers({});
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={s.overlay}>
        <SafeAreaView style={[s.sheet, { backgroundColor: t.bg }]}>

          {/* Progress dots */}
          <View style={s.dots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[s.dot, { backgroundColor: i <= step ? C.moss : t.border }]} />
            ))}
          </View>

          <Text style={[s.question, { color: t.text }]}>{current.question}</Text>
          <Text style={[s.sub, { color: t.subtext }]}>{current.sub}</Text>

          <View style={s.options}>
            {current.options.map(o => (
              <TouchableOpacity
                key={o.value}
                style={[s.chip, { backgroundColor: o.bg }]}
                onPress={() => pick(o.value)}
                activeOpacity={0.75}
              >
                <Text style={[s.chipText, { color: o.text }]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={() => { onDone(answers); setStep(0); setAnswers({}); }} style={s.skipBtn}>
            <Text style={[s.skipText, { color: t.subtext }]}>Skip check-in</Text>
          </TouchableOpacity>

        </SafeAreaView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 28, paddingTop: 24, paddingBottom: 40,
    gap: 6,
  },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4 },

  question: {
    fontSize: 26, fontWeight: '700', textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined,
    marginBottom: 4,
  },
  sub: { fontSize: 14, textAlign: 'center', marginBottom: 20 },

  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 16 },
  chip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 50 },
  chipText: { fontSize: 16, fontWeight: '600' },

  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { fontSize: 14 },
});
