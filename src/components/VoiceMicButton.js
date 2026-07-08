import React, { useRef, useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Icon from './Icon';
import { C } from '../constants/colors';

export default function VoiceMicButton({ onTranscript, color, activeColor }) {
  const [listening, setListening] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (listening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 550, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,   duration: 550, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [listening]);

  const toggle = () => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Voice input isn\'t supported in this browser. Try Chrome or Edge.');
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    recognitionRef.current = rec;

    rec.onstart = () => setListening(true);
    rec.onend   = () => { setListening(false); recognitionRef.current = null; };
    rec.onerror = () => { setListening(false); recognitionRef.current = null; };
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      onTranscript(transcript);
    };

    rec.start();
  };

  const bg = listening ? (activeColor || '#E84040') : (color || C.border);

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity style={[s.btn, { backgroundColor: bg }]} onPress={toggle} activeOpacity={0.75}>
        <Icon name="mic" size={18} color={listening ? '#fff' : C.muted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  btn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
});
