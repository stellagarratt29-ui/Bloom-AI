import React, { useRef, useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Platform, ActivityIndicator, View, Animated } from 'react-native';
import Icon from './Icon';
import { C } from '../constants/colors';

const BAR_DURATIONS = [210, 290, 170, 250, 195];

// Uses the browser's native Web Speech API — no API key, no Groq, fully offline.
// Falls back to MediaRecorder → transcription if SpeechRecognition isn't available.
export default function VoiceMicButton({ onTranscript, color, activeColor }) {
  const [status, setStatus]  = useState('idle');
  const recognitionRef       = useRef(null);
  const barAnims             = useRef(BAR_DURATIONS.map(() => new Animated.Value(0.15)));
  const waveOpacity          = useRef(new Animated.Value(0));

  const isRecording  = status === 'recording';
  const isProcessing = status === 'processing';

  useEffect(() => {
    if (isRecording) {
      Animated.timing(waveOpacity.current, { toValue: 1, duration: 150, useNativeDriver: false }).start();
      barAnims.current.forEach((anim, i) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 1,   duration: BAR_DURATIONS[i], useNativeDriver: false }),
            Animated.timing(anim, { toValue: 0.1, duration: BAR_DURATIONS[i], useNativeDriver: false }),
          ])
        ).start();
      });
    } else {
      Animated.timing(waveOpacity.current, { toValue: 0, duration: 120, useNativeDriver: false }).start();
      barAnims.current.forEach(anim => { anim.stopAnimation(); anim.setValue(0.15); });
    }
    return () => barAnims.current.forEach(a => a.stopAnimation());
  }, [isRecording]);

  const start = () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Voice input requires Chrome or Safari. Try typing instead.');
      return;
    }

    const rec = new SR();
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = false;
    recognitionRef.current = rec;

    rec.onstart  = () => setStatus('recording');
    rec.onend    = () => setStatus('idle');
    rec.onerror  = (e) => {
      setStatus('idle');
      if (e.error === 'not-allowed') {
        alert('Microphone access is blocked.\n\nTap the lock icon in your browser address bar → allow microphone → try again.');
      }
    };
    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript?.trim();
      if (text) onTranscript(text);
    };

    try { rec.start(); } catch { setStatus('idle'); }
  };

  const stop = () => {
    recognitionRef.current?.stop();
    setStatus('idle');
  };

  const toggle = () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (status === 'idle')      start();
    if (status === 'recording') stop();
  };

  const recordColor = activeColor || '#C24B4B';
  const bg = isRecording ? recordColor : (color || C.border);

  return (
    <View style={s.row}>
      <Animated.View style={[s.waveform, { opacity: waveOpacity.current }]}>
        {barAnims.current.map((anim, i) => (
          <Animated.View
            key={i}
            style={[s.bar, {
              height: anim.interpolate({ inputRange: [0, 1], outputRange: [3, 22] }),
              backgroundColor: recordColor,
            }]}
          />
        ))}
      </Animated.View>
      <TouchableOpacity
        style={[s.btn, { backgroundColor: bg }]}
        onPress={toggle}
        activeOpacity={0.75}
        disabled={isProcessing}
      >
        {isProcessing
          ? <ActivityIndicator size="small" color={C.muted} />
          : <Icon name="mic" size={18} color={isRecording ? '#fff' : C.muted} />
        }
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  waveform: { flexDirection: 'row', alignItems: 'center', marginRight: 6, height: 24, gap: 3 },
  bar:      { width: 3, borderRadius: 2 },
  btn:      { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
