import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Animated,
} from 'react-native';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function JournalScreen({ navigation }) {
  const { userName, processDump } = useApp();
  const [text, setText] = useState('');
  const [processing, setProcessing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const name = userName || 'Stella';

  const handleDone = () => {
    if (!text.trim()) {
      navigation.navigate('Home');
      return;
    }

    setProcessing(true);
    Animated.timing(fadeAnim, {
      toValue: 0, duration: 300, useNativeDriver: true,
    }).start(() => {
      processDump(text);
      navigation.navigate('Home');
    });
  };

  const handleSkip = () => {
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[s.container, { opacity: fadeAnim }]}>
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Step dots */}
            <View style={s.stepRow}>
              {[0, 1, 2].map(i => (
                <View key={i} style={[s.dot, i === 0 && s.dotActive]} />
              ))}
            </View>

            <Text style={s.bloom}>🌸</Text>
            <Text style={s.heading}>{greeting()},{'\n'}{name}.</Text>
            <Text style={s.sub}>
              What's on your mind today? Dump it all here —
              tasks, worries, ideas, errands. I'll sort it for you.
            </Text>

            {/* Dump area */}
            <View style={s.dumpWrap}>
              <TextInput
                style={s.dumpInput}
                placeholder={
                  `e.g.\nEmail Dr. Smith urgently\nGo for a walk\nMaybe read that book\nCall mum\nFinish the report`
                }
                placeholderTextColor={C.muted}
                value={text}
                onChangeText={setText}
                multiline
                textAlignVertical="top"
                autoFocus
              />
            </View>

            <Text style={s.hint}>
              ✨ Bloom will figure out what's urgent, what's nice-to-do, and put it in order for you.
            </Text>

            {/* Actions */}
            <View style={s.actions}>
              <TouchableOpacity style={s.skipBtn} onPress={handleSkip}>
                <Text style={s.skipText}>Skip today</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.doneBtn, !text.trim() && s.doneBtnOff]}
                onPress={handleDone}
                disabled={processing}
              >
                <Text style={s.doneBtnText}>
                  {processing ? 'Organising…' : 'Build my day →'}
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
  scroll: {
    paddingHorizontal: 26, paddingTop: 20, paddingBottom: 48, flexGrow: 1,
  },

  stepRow: { flexDirection: 'row', gap: 6, marginBottom: 24 },
  dot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: C.border,
  },
  dotActive: { backgroundColor: C.forest, width: 20 },

  bloom: { fontSize: 24, marginBottom: 14 },
  heading: {
    fontSize: 36, fontWeight: '700', color: C.forest,
    lineHeight: 44, marginBottom: 12,
  },
  sub: {
    fontSize: 15, color: C.muted, lineHeight: 24, marginBottom: 20,
  },

  dumpWrap: {
    backgroundColor: C.white, borderRadius: 18,
    borderWidth: 1.5, borderColor: C.border,
    marginBottom: 14,
  },
  dumpInput: {
    fontSize: 16, color: C.forest, lineHeight: 28,
    padding: 18, minHeight: 200,
  },

  hint: {
    fontSize: 13, color: C.muted, fontStyle: 'italic',
    lineHeight: 20, marginBottom: 28,
  },

  actions: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipBtn: { padding: 12 },
  skipText: { fontSize: 15, color: C.muted },

  doneBtn: {
    backgroundColor: C.forest, borderRadius: 28,
    paddingVertical: 14, paddingHorizontal: 28,
  },
  doneBtnOff: { opacity: 0.4 },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: C.white },
});
