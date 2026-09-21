import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { parseBrainDump } from '../services/ai';

export default function OnboardingScreen({ onFinish }) {
  const { processBrainDump } = useApp();
  const [step,     setStep]     = useState(0);
  const [name,     setName]     = useState('');
  const [dump,     setDump]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const inputRef = useRef(null);

  const firstName = name.trim().split(' ')[0];

  const goToStep1 = () => setStep(1);

  const handleFinish = async () => {
    setLoading(true);
    try {
      if (dump.trim()) {
        const { tasks = [], projects = [] } = await parseBrainDump(dump.trim());
        processBrainDump(tasks, projects);
      }
      onFinish(name.trim(), '', '', null, null, [], null, null);
    } catch {
      onFinish(name.trim(), '', '', null, null, [], null, null);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 0: Name ──────────────────────────────────────
  if (step === 0) {
    return (
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.center}>
            <Text style={s.wordmark}>bloom</Text>
            <Text style={s.tagline}>Your mind, sorted.</Text>
            <Text style={s.body}>
              Tell Bloom what's on your mind. It turns the chaos into a clear, doable plan.
            </Text>

            <TextInput
              ref={inputRef}
              style={s.nameInput}
              placeholder="What should we call you?"
              placeholderTextColor="#ABA59E"
              value={name}
              onChangeText={setName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={goToStep1}
              autoCapitalize="words"
            />

            <TouchableOpacity
              style={[s.btn, !name.trim() && s.btnMuted]}
              onPress={goToStep1}
              activeOpacity={0.85}
            >
              <Text style={s.btnText}>
                {name.trim() ? `Hi ${firstName} →` : 'Get started →'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Step 1: First brain dump ──────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.center}>
          <Text style={s.stepTitle}>
            {firstName ? `What's on your mind,\n${firstName}?` : "What's on your mind?"}
          </Text>
          <Text style={s.stepSub}>
            Dump it all here — tasks, worries, plans, random thoughts. Don't organise it. That's my job.
          </Text>

          <TextInput
            style={s.dumpInput}
            placeholder={
              "e.g. do my chemistry homework, skin has been breaking out, need to wash my leotard before Saturday, worried about the presentation..."
            }
            placeholderTextColor="#ABA59E"
            value={dump}
            onChangeText={setDump}
            multiline
            autoFocus
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[s.btn, loading && s.btnMuted]}
            onPress={handleFinish}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#FAF7F2" />
              : <Text style={s.btnText}>{dump.trim() ? 'Sort it out →' : 'Skip for now →'}</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: '#FAF7F2' },
  flex:  { flex: 1 },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 28,
  },

  wordmark: {
    fontSize: 64, fontWeight: '800', color: '#C98B6B',
    letterSpacing: -2, marginBottom: 6, textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : undefined,
  },
  tagline: {
    fontSize: 20, fontWeight: '300', color: '#1A1510',
    textAlign: 'center', letterSpacing: 0.2, marginBottom: 16,
    fontFamily: Platform.OS === 'web' ? '"Plus Jakarta Sans", system-ui, sans-serif' : undefined,
  },
  body: {
    fontSize: 14, color: '#6B6560', textAlign: 'center',
    lineHeight: 22, marginBottom: 36, maxWidth: 280,
    fontFamily: Platform.OS === 'web' ? '"Plus Jakarta Sans", system-ui, sans-serif' : undefined,
  },

  stepTitle: {
    fontSize: 28, fontWeight: '700', color: '#1A1510',
    textAlign: 'center', lineHeight: 38, letterSpacing: -0.5,
    marginBottom: 10,
    fontFamily: Platform.OS === 'web' ? '"Plus Jakarta Sans", system-ui, sans-serif' : undefined,
  },
  stepSub: {
    fontSize: 14, color: '#6B6560', textAlign: 'center',
    lineHeight: 22, marginBottom: 24, maxWidth: 300,
    fontFamily: Platform.OS === 'web' ? '"Plus Jakarta Sans", system-ui, sans-serif' : undefined,
  },

  nameInput: {
    width: '100%', backgroundColor: '#FFFFFF',
    borderRadius: 16, paddingVertical: 18, paddingHorizontal: 20,
    fontSize: 16, color: '#1A1510', marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
    fontFamily: Platform.OS === 'web' ? '"Plus Jakarta Sans", system-ui, sans-serif' : undefined,
  },
  dumpInput: {
    width: '100%', backgroundColor: '#FFFFFF',
    borderRadius: 16, padding: 18,
    fontSize: 15, color: '#1A1510',
    height: 160, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
    fontFamily: Platform.OS === 'web' ? '"Plus Jakarta Sans", system-ui, sans-serif' : undefined,
  },

  btn: {
    width: '100%', backgroundColor: '#7A9A89',
    borderRadius: 50, paddingVertical: 18,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  btnMuted: { opacity: 0.6 },
  btnText: {
    color: '#FAF7F2', fontWeight: '700', fontSize: 16,
    fontFamily: Platform.OS === 'web' ? '"Plus Jakarta Sans", system-ui, sans-serif' : undefined,
  },
});
