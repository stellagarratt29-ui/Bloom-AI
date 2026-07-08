import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
  StyleSheet, Platform, Animated,
} from 'react-native';
import Icon from '../components/Icon';
import { C } from '../constants/colors';

const SLIDES = [
  {
    icon:  'message-circle',
    color: C.moss,
    bg:    C.sagePale,
    title: 'Start every morning with a brain dump',
    body:  "Tell Bloom everything — tasks, worries, goals, plans. No formatting needed. It reads what you wrote and builds you a real, sorted plan.",
  },
  {
    icon:  'list',
    color: C.clay,
    bg:    C.clayPale,
    title: 'Tap a task to learn exactly how to do it',
    body:  "Your tasks are sorted by priority. Tap the task title for step-by-step guidance from Bloom. Tap the circle to mark it done.",
  },
  {
    icon:  'target',
    color: C.pinkDark,
    bg:    '#FDE8F0',
    title: 'Build skills and reach big goals',
    body:  "The Grow tab gives you a real skill path for any hobby — milestone by milestone. Goals tracks bigger ambitions with a step-by-step action plan that evolves as you go.",
  },
  {
    icon:  'settings',
    color: C.skyDark,
    bg:    C.skyWash,
    title: 'Bloom adapts to you',
    body:  "Change your colour theme, connect Google Calendar, or update your support preferences from Settings anytime. Everything is editable whenever you need it.",
  },
];

export default function TutorialScreen({ onDone }) {
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const goTo = (newIndex) => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -20, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setIndex(newIndex);
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const next = () => {
    if (index < SLIDES.length - 1) goTo(index + 1);
    else onDone();
  };

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <SafeAreaView style={s.safe}>

      {/* Skip */}
      <TouchableOpacity style={s.skipBtn} onPress={onDone} activeOpacity={0.7}>
        <Text style={s.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slide content */}
      <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={[s.iconWrap, { backgroundColor: slide.bg }]}>
          <Icon name={slide.icon} size={38} color={slide.color} />
        </View>
        <Text style={s.slideTitle}>{slide.title}</Text>
        <Text style={s.slideBody}>{slide.body}</Text>
      </Animated.View>

      {/* Dots */}
      <View style={s.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.7}>
            <View style={[s.dot, i === index && s.dotActive, i < index && s.dotDone]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Navigation */}
      <View style={s.navRow}>
        {index > 0 ? (
          <TouchableOpacity style={s.prevBtn} onPress={() => goTo(index - 1)} activeOpacity={0.7}>
            <Text style={s.prevText}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.prevBtn} />
        )}

        <TouchableOpacity style={[s.nextBtn, { backgroundColor: slide.color }]} onPress={next} activeOpacity={0.85}>
          <Text style={s.nextBtnText}>{isLast ? 'Get Started →' : 'Next →'}</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1, backgroundColor: C.cream,
    paddingHorizontal: 28,
  },

  skipBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 12, paddingHorizontal: 4,
    marginTop: 8,
  },
  skipText: { fontSize: 14, color: C.muted, fontWeight: '600' },

  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingBottom: 20,
  },

  iconWrap: {
    width: 88, height: 88, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },

  slideTitle: {
    fontSize: 24, fontWeight: '800', color: C.ink,
    textAlign: 'center', lineHeight: 32, marginBottom: 16,
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined,
  },
  slideBody: {
    fontSize: 15, color: C.muted, textAlign: 'center',
    lineHeight: 26, maxWidth: 320,
  },

  dots: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 28 },
  dot:       { width: 7, height: 7, borderRadius: 4, backgroundColor: C.border },
  dotActive: { width: 22, backgroundColor: C.moss },
  dotDone:   { backgroundColor: C.sageMid },

  navRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 20, gap: 12,
  },
  prevBtn:  { flex: 1, paddingVertical: 16, alignItems: 'center' },
  prevText: { fontSize: 14, fontWeight: '600', color: C.muted },
  nextBtn:  {
    flex: 2, paddingVertical: 16, borderRadius: 14,
    alignItems: 'center',
  },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
