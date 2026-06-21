import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';

export default function JournalScreen({ navigation }) {
  const { userName, addTask, saveIdea } = useApp();
  const [text, setText] = useState('');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const handleDone = () => {
    if (text.trim()) {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      lines.forEach(line => {
        if (line.startsWith('-') || line.startsWith('•')) {
          addTask(line.replace(/^[-•]\s*/, ''), 'medium');
        } else {
          addTask(line, 'medium');
        }
      });
    }
    navigation.navigate('MoodCheckIn');
  };

  const handleSkip = () => navigation.navigate('MoodCheckIn');

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.stepRow}>
            {[1, 2, 3].map(i => (
              <View key={i} style={[s.stepDot, i === 1 && s.stepDotActive]} />
            ))}
          </View>

          <Text style={s.bloom}>🌸</Text>
          <Text style={s.heading}>{greeting},{'\n'}{userName || 'Stella'}.</Text>
          <Text style={s.sub}>
            What's on your mind today? Tell me everything — tasks, plans, ideas, worries.
            {'\n'}I'll organize it for you.
          </Text>

          <TextInput
            style={s.input}
            placeholder="Tap to start writing, or use your voice..."
            placeholderTextColor={C.muted}
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
            autoFocus={false}
          />

          <View style={s.row}>
            <TouchableOpacity style={s.skipBtn} onPress={handleSkip}>
              <Text style={s.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.micBtn} onPress={handleDone}>
              <Text style={s.micIcon}>🎙</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.doneBtn} onPress={handleDone}>
              <Text style={s.doneText}>Done →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: C.cream },
  scroll: { paddingHorizontal: 28, paddingTop: 24, paddingBottom: 40, flexGrow: 1 },

  stepRow: { flexDirection: 'row', gap: 6, marginBottom: 28 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border },
  stepDotActive: { backgroundColor: C.forest },

  bloom: { fontSize: 22, marginBottom: 16 },
  heading: { fontSize: 34, fontWeight: '700', color: C.forest, lineHeight: 42, marginBottom: 14 },
  sub: { fontSize: 15, color: C.muted, lineHeight: 24, marginBottom: 28 },

  input: {
    backgroundColor: C.white, borderWidth: 1, borderColor: C.border,
    borderRadius: 16, padding: 18, fontSize: 16, color: C.forest,
    minHeight: 180, lineHeight: 26,
  },

  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 24,
  },
  skipBtn: { padding: 10 },
  skipText: { fontSize: 15, color: C.muted },
  micBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: C.forest, alignItems: 'center', justifyContent: 'center',
  },
  micIcon: { fontSize: 24 },
  doneBtn: {
    backgroundColor: C.forest, borderRadius: 24,
    paddingVertical: 12, paddingHorizontal: 22,
  },
  doneText: { fontSize: 15, fontWeight: '700', color: C.white },
});
