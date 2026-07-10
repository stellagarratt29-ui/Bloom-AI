import React, { useRef, useState } from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Icon from './Icon';
import { C } from '../constants/colors';

export default function VoiceMicButton({ onTranscript, color, activeColor }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  const toggle = () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Voice input needs Chrome, Edge, or Safari. Try one of those browsers.');
      return;
    }

    if (listening) {
      recRef.current?.stop();
      return;
    }

    try {
      const rec = new SR();
      rec.lang = 'en-US';
      rec.interimResults = true;
      rec.continuous = false;
      recRef.current = rec;

      rec.onstart  = () => setListening(true);
      rec.onend    = () => { setListening(false); recRef.current = null; };
      rec.onerror  = (e) => {
        setListening(false);
        recRef.current = null;
        if (e.error === 'not-allowed') {
          alert('Microphone blocked. Tap the lock icon in your browser address bar and allow microphone access, then try again.');
        }
      };
      rec.onresult = (e) => {
        const text = Array.from(e.results).map(r => r[0].transcript).join('');
        onTranscript(text);
      };

      rec.start();
    } catch (err) {
      setListening(false);
    }
  };

  const bg = listening ? (activeColor || '#E84040') : (color || C.border);

  return (
    <TouchableOpacity
      style={[s.btn, { backgroundColor: bg }]}
      onPress={toggle}
      activeOpacity={0.75}
    >
      <Icon name="mic" size={18} color={listening ? '#fff' : C.muted} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
});
