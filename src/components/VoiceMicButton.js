import React, { useRef, useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Platform, ActivityIndicator, View, Animated } from 'react-native';
import Icon from './Icon';
import { C } from '../constants/colors';
import { transcribeAudio } from '../services/ai';

// Each bar gets its own cycle duration so they fall out of phase naturally
const BAR_DURATIONS = [210, 290, 170, 250, 195];

// States: 'idle' | 'recording' | 'processing'
export default function VoiceMicButton({ onTranscript, color, activeColor }) {
  const [status, setStatus] = useState('idle');
  const recorderRef = useRef(null);
  const chunksRef   = useRef([]);
  const streamRef   = useRef(null);
  const barAnims    = useRef(BAR_DURATIONS.map(() => new Animated.Value(0.15)));
  const waveOpacity = useRef(new Animated.Value(0));

  const isRecording  = status === 'recording';
  const isProcessing = status === 'processing';

  useEffect(() => {
    if (isRecording) {
      // Fade waveform in
      Animated.timing(waveOpacity.current, { toValue: 1, duration: 150, useNativeDriver: false }).start();
      // Start each bar looping at its own rhythm
      barAnims.current.forEach((anim, i) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 1,    duration: BAR_DURATIONS[i], useNativeDriver: false }),
            Animated.timing(anim, { toValue: 0.1,  duration: BAR_DURATIONS[i], useNativeDriver: false }),
          ])
        ).start();
      });
    } else {
      // Fade out then reset
      Animated.timing(waveOpacity.current, { toValue: 0, duration: 120, useNativeDriver: false }).start();
      barAnims.current.forEach(anim => {
        anim.stopAnimation();
        anim.setValue(0.15);
      });
    }
    return () => {
      barAnims.current.forEach(anim => anim.stopAnimation());
    };
  }, [isRecording]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setStatus('processing');
        try {
          const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
          const text = await transcribeAudio(blob);
          if (text) onTranscript(text);
        } catch (err) {
          console.warn('Transcription error:', err);
        } finally {
          setStatus('idle');
        }
      };

      rec.start();
      setStatus('recording');
    } catch (err) {
      setStatus('idle');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('Microphone access is blocked.\n\nTap the lock icon in your browser address bar → allow microphone → try again.');
      } else if (err.name === 'NotFoundError') {
        alert('No microphone found on this device.');
      }
    }
  };

  const stop = () => recorderRef.current?.stop();

  const toggle = () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Voice input needs HTTPS and a modern browser. Try Chrome or Safari.');
      return;
    }
    if (status === 'idle')      start();
    if (status === 'recording') stop();
  };

  const recordColor = activeColor || '#E84040';
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
    height: 24,
    gap: 3,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
  btn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
});
