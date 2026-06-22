import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { parseTasksWithAI } from '../services/ai';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function useSpeechRecognition({ onTranscript, onInterim }) {
  const recogRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const [supported] = useState(() => {
    if (Platform.OS !== 'web') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  });

  const start = () => {
    if (!supported) return;
    setError('');
    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const r = new SR();
      r.continuous = true;
      r.interimResults = true;
      r.lang = 'en-US';

      r.onstart = () => setListening(true);
      r.onend   = () => { setListening(false); onInterim?.(''); };
      r.onerror = (e) => {
        setListening(false);
        onInterim?.('');
        if (e.error === 'not-allowed') setError('Microphone access denied. Allow mic in browser settings.');
        else if (e.error === 'no-speech') setError('No speech detected. Try again.');
        else if (e.error !== 'aborted') setError('Voice input unavailable. Try typing instead.');
      };
      r.onresult = (e) => {
        let interim = '';
        let final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += t + ' ';
          else interim += t;
        }
        if (interim) onInterim?.(interim);
        if (final.trim()) {
          onInterim?.('');
          onTranscript(final.trim());
        }
      };

      recogRef.current = r;
      r.start();
    } catch (err) {
      setError('Could not start voice input.');
    }
  };

  const stop = () => {
    recogRef.current?.stop();
    recogRef.current = null;
    setListening(false);
    onInterim?.('');
  };

  return { listening, supported, error, start, stop };
}

export default function JournalScreen({ navigation }) {
  const { userName, processDump, processBrainDump } = useApp();
  const [text, setText]               = useState('');
  const [interimText, setInterimText] = useState('');
  const [processing, setProcessing]   = useState(false);
  const [processingLabel, setProcessingLabel] = useState('Sorting…');
  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef(null);

  const name = userName || 'you';

  const { listening, supported, error: micError, start, stop } = useSpeechRecognition({
    onTranscript: (transcript) => {
      setText(prev => prev ? prev + ' ' + transcript : transcript);
    },
    onInterim: setInterimText,
  });

  const startListening = () => {
    start();
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
  };

  const stopListening = () => {
    stop();
    pulseLoop.current?.stop();
    Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  };

  const toggleVoice = () => {
    if (listening) stopListening();
    else startListening();
  };

  const handleDone = async () => {
    if (listening) stopListening();
    if (!text.trim()) { navigation.navigate('Home'); return; }
    setProcessing(true);

    const finish = (items) => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => {
        processBrainDump(items);
        navigation.navigate('Home');
      });
    };

    try {
      setProcessingLabel('Bloom is sorting…');
      // parseTasksWithAI handles the API key check internally and falls back to rules
      const items = await parseTasksWithAI(text);
      finish(items);
    } catch {
      setProcessingLabel('Sorting…');
      processDump(text);
      Animated.timing(fadeAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => {
        navigation.navigate('Home');
      });
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.View style={[s.container, { opacity: fadeAnim }]}>
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={s.heading}>{greeting()},</Text>
            <Text style={s.heading}>{name}.</Text>
            <Text style={s.sub}>
              What's on your mind? Tasks, goals, worries, errands — dump it all. Bloom will sort it into your day.
            </Text>

            <View style={[s.dumpWrap, listening && s.dumpWrapActive]}>
              <TextInput
                style={s.dumpInput}
                placeholder={`e.g.\nEmail Dr. Smith urgently\nGo for a walk\nMaybe read that book\nCall mum\nFinish the report`}
                placeholderTextColor={C.muted}
                value={text}
                onChangeText={setText}
                multiline
                textAlignVertical="top"
              />

              {supported && (
                <View style={s.micRow}>
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <TouchableOpacity
                      style={[s.micBtn, listening && s.micBtnActive]}
                      onPress={toggleVoice}
                      activeOpacity={0.8}
                    >
                      <Feather
                        name={listening ? 'stop-circle' : 'mic'}
                        size={20}
                        color={listening ? '#E74C3C' : C.forest}
                      />
                    </TouchableOpacity>
                  </Animated.View>
                  <Text style={s.micLabel}>
                    {listening ? 'Listening… tap to stop' : 'Tap to speak'}
                  </Text>
                </View>
              )}
            </View>

            {listening && (
              <View style={s.listeningBanner}>
                <View style={s.listeningDot} />
                <Text style={s.listeningText}>
                  {interimText ? interimText : 'Listening — just talk normally'}
                </Text>
              </View>
            )}

            {!!micError && (
              <View style={s.errorBanner}>
                <Feather name="alert-circle" size={14} color="#C0392B" />
                <Text style={s.errorText}>{micError}</Text>
              </View>
            )}

            <Text style={s.hint}>
              Goals go to your Goals list. Tasks go to Today. Bloom handles the sorting.
            </Text>

            <View style={s.actions}>
              <TouchableOpacity style={s.skipBtn} onPress={() => navigation.navigate('Home')}>
                <Text style={s.skipText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.doneBtn, !text.trim() && s.doneBtnOff]}
                onPress={handleDone}
                disabled={processing}
              >
                <Text style={s.doneBtnText}>
                  {processing ? processingLabel : 'Sort my day →'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: C.cream },
  container: { flex: 1 },
  scroll: { paddingHorizontal: 26, paddingTop: 28, paddingBottom: 48, flexGrow: 1 },

  heading: { fontSize: 38, fontWeight: '800', color: C.forest, lineHeight: 46, letterSpacing: -0.5 },
  sub:     { fontSize: 15, color: C.muted, lineHeight: 24, marginTop: 10, marginBottom: 24 },

  dumpWrap: {
    backgroundColor: C.white, borderRadius: 18,
    borderWidth: 1.5, borderColor: C.border,
    marginBottom: 14,
  },
  dumpWrapActive: { borderColor: C.forest },
  dumpInput: {
    fontSize: 16, color: C.forest, lineHeight: 28,
    padding: 18, minHeight: 180,
  },

  micRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: '#F0EBE3',
  },
  micBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.cream, borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: '#FDECEA', borderColor: '#E74C3C',
  },
  micLabel: { fontSize: 13, color: C.muted, fontWeight: '500' },

  listeningBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FDECEA', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#F5C6C2',
  },
  listeningDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#E74C3C',
  },
  listeningText: { fontSize: 13, color: '#C0392B', fontWeight: '600', flex: 1 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FBF0EB', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 14, marginBottom: 10,
    borderWidth: 1, borderColor: C.peachLight,
  },
  errorText: { fontSize: 13, color: '#8B3A2A', flex: 1 },

  hint: { fontSize: 13, color: C.muted, fontStyle: 'italic', lineHeight: 20, marginBottom: 28 },

  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skipBtn: { padding: 12 },
  skipText: { fontSize: 15, color: C.muted },
  doneBtn: {
    backgroundColor: C.forest, borderRadius: 28,
    paddingVertical: 14, paddingHorizontal: 28,
  },
  doneBtnOff: { opacity: 0.4 },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: C.white },
});
