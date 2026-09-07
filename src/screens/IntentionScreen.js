import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
  Animated, Easing,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

export default function IntentionScreen({ onDone }) {
  const { tasks, userName } = useApp();
  const { colors: t } = useTheme();

  const topTask = tasks?.filter(t => !t.done)?.[0];
  const highTask = tasks?.filter(t => !t.done && t.priority === 'high')?.[0];
  const featured = highTask || topTask;

  // Animations
  const fadeTag   = useRef(new Animated.Value(0)).current;
  const fadeHead  = useRef(new Animated.Value(0)).current;
  const fadeCard  = useRef(new Animated.Value(0)).current;
  const fadeBtn   = useRef(new Animated.Value(0)).current;
  const slideCard = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeTag,  { toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.delay(100),
      Animated.timing(fadeHead, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(fadeCard,  { toValue: 1, duration: 450, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(slideCard, { toValue: 0, duration: 450, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
      Animated.delay(150),
      Animated.timing(fadeBtn, { toValue: 1, duration: 350, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();

    // Auto-advance after 6 seconds
    const timer = setTimeout(onDone, 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      <View style={s.content}>

        {/* Small eyebrow label */}
        <Animated.View style={{ opacity: fadeTag }}>
          <Text style={[s.eyebrow, { color: t.muted }]}>hold on.</Text>
        </Animated.View>

        {/* Main headline */}
        <Animated.Text
          style={[
            s.headline,
            { color: t.text, fontFamily: Platform.OS === 'web' ? '"Outfit", system-ui, sans-serif' : undefined },
            { opacity: fadeHead },
          ]}
        >
          you were about{'\n'}to scroll.
        </Animated.Text>

        {/* Task card or empty nudge */}
        <Animated.View
          style={[
            s.card,
            { backgroundColor: t.card, borderColor: t.border },
            { opacity: fadeCard, transform: [{ translateY: slideCard }] },
          ]}
        >
          {featured ? (
            <>
              <Text style={[s.cardLabel, { color: t.muted }]}>do this instead</Text>
              <Text style={[s.cardTask, { color: t.text, fontFamily: Platform.OS === 'web' ? '"Outfit", system-ui, sans-serif' : undefined }]} numberOfLines={3}>
                {featured.text}
              </Text>
              {featured.priority === 'high' && (
                <View style={[s.urgentPill, { backgroundColor: t.urgentPale }]}>
                  <Text style={[s.urgentPillText, { color: t.urgent }]}>urgent</Text>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={[s.cardLabel, { color: t.muted }]}>no tasks yet</Text>
              <Text style={[s.cardTask, { color: t.text, fontFamily: Platform.OS === 'web' ? '"Outfit", system-ui, sans-serif' : undefined }]}>
                Open Chat and dump everything on your mind — Bloom will sort it.
              </Text>
            </>
          )}
        </Animated.View>

        {/* CTA */}
        <Animated.View style={{ opacity: fadeBtn, width: '100%' }}>
          <TouchableOpacity
            style={[s.btn, { backgroundColor: t.text }]}
            onPress={onDone}
            activeOpacity={0.8}
          >
            <Text style={[s.btnText, { color: t.bg }]}>
              {featured ? "let's do it →" : "open the app →"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDone} style={s.skipBtn}>
            <Text style={[s.skipText, { color: t.muted }]}>just browsing</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  content: {
    width: '100%',
    maxWidth: 340,
    gap: 24,
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'lowercase',
  },
  headline: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 50,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardTask: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  urgentPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4,
  },
  urgentPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'web' ? '"Outfit", system-ui, sans-serif' : undefined,
  },
  skipBtn: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 4,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '400',
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },
});
