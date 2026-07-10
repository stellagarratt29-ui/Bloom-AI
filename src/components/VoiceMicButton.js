import React, { useRef, useState } from 'react';
import { TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import Icon from './Icon';
import { C } from '../constants/colors';
import { transcribeAudio } from '../services/ai';

// States: 'idle' | 'recording' | 'processing'
export default function VoiceMicButton({ onTranscript, color, activeColor }) {
  const [status, setStatus] = useState('idle');
  const recorderRef = useRef(null);
  const chunksRef   = useRef([]);
  const streamRef   = useRef(null);

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
        // Stop mic light immediately
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

  const stop = () => {
    recorderRef.current?.stop();
  };

  const toggle = () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Voice input needs HTTPS and a modern browser. Try Chrome or Safari.');
      return;
    }
    if (status === 'idle')      start();
    if (status === 'recording') stop();
  };

  const isRecording  = status === 'recording';
  const isProcessing = status === 'processing';
  const bg = isRecording ? (activeColor || '#E84040') : (color || C.border);

  return (
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
  );
}

const s = StyleSheet.create({
  btn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
});
