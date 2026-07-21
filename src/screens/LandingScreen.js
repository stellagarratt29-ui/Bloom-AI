import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, ScrollView, Animated,
} from 'react-native';
import { C } from '../constants/colors';
import Icon from '../components/Icon';

const FEATURES = [
  {
    icon: 'message-circle',
    title: 'Brain dump anything',
    desc: 'Type your whole messy morning — tasks, worries, ideas — in one go. No formatting needed.',
  },
  {
    icon: 'zap',
    title: 'Bloom sorts it instantly',
    desc: 'AI pulls out every task, ranks them by what matters, and builds you a clear plan.',
  },
  {
    icon: 'sun',
    title: 'Hobbies, goals & more',
    desc: 'Real step-by-step milestones for hobbies. Evolving action plans for big goals.',
  },
];

function FeatureCard({ icon, title, desc, delay }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[s.featureCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={s.featureIconBox}>
        <Icon name={icon} size={20} color={C.moss} />
      </View>
      <View style={s.featureText}>
        <Text style={s.featureTitle}>{title}</Text>
        <Text style={s.featureDesc}>{desc}</Text>
      </View>
    </Animated.View>
  );
}

export default function LandingScreen({ onGetStarted }) {
  const heroFade  = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(16)).current;
  const btnScale  = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(heroSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.spring(btnScale,  { toValue: 1, delay: 900, friction: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1,    duration: 80, useNativeDriver: true }),
    ]).start(() => onGetStarted());
  };

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero */}
        <Animated.View style={[s.hero, { opacity: heroFade, transform: [{ translateY: heroSlide }] }]}>
          <View style={s.pill}>
            <View style={s.pillDot} />
            <Text style={s.pillText}>Free · No account needed</Text>
          </View>
          <Text style={s.wordmark}>Bloom</Text>
          <Text style={s.tagline}>Your morning brain dump,{'\n'}sorted in seconds.</Text>
        </Animated.View>

        {/* Feature cards */}
        <View style={s.features}>
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={300 + i * 120} />
          ))}
        </View>

        {/* Testimonial-style quote */}
        <View style={s.quoteCard}>
          <Text style={s.quoteText}>"I typed everything on my mind and Bloom turned it into a plan in under 10 seconds."</Text>
          <Text style={s.quoteAuthor}>— Early user</Text>
        </View>

        {/* CTA */}
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity style={s.cta} onPress={handlePress} activeOpacity={0.85}>
            <Text style={s.ctaText}>Get started — it's free</Text>
            <Icon name="arrow-right" size={18} color={C.white} />
          </TouchableOpacity>
        </Animated.View>

        <Text style={s.foot}>Takes 2 minutes to set up. No email required.</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.cream },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'web' ? 64 : 80,
    paddingBottom: 48,
  },

  hero:    { alignItems: 'center', marginBottom: 40 },
  pill:    {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.clayPale,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, marginBottom: 20,
  },
  pillDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.moss },
  pillText: { fontSize: 12, fontWeight: '600', color: C.mossDark },

  wordmark: {
    fontSize: 72, fontWeight: '800', color: C.ink, letterSpacing: -2, lineHeight: 78,
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined,
  },
  tagline: {
    fontSize: 22, fontWeight: '500', color: C.muted,
    textAlign: 'center', lineHeight: 32, marginTop: 12,
  },

  features: { gap: 12, marginBottom: 28 },
  featureCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: C.white,
    borderRadius: 18, padding: 18,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  featureIconBox: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: C.clayPale,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: { flex: 1, gap: 4 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: C.ink },
  featureDesc:  { fontSize: 13, color: C.muted, lineHeight: 20 },

  quoteCard: {
    backgroundColor: C.sagePale, borderRadius: 16,
    padding: 18, marginBottom: 28,
  },
  quoteText:   { fontSize: 14, color: C.ink, lineHeight: 22, fontStyle: 'italic', marginBottom: 8 },
  quoteAuthor: { fontSize: 12, color: C.muted, fontWeight: '600' },

  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.moss, borderRadius: 28,
    paddingVertical: 18, paddingHorizontal: 32,
    shadowColor: C.moss, shadowOpacity: 0.35, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  ctaText: { fontSize: 17, fontWeight: '800', color: C.white },
  foot:    { fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 16 },
});
