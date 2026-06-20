import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { C } from '../constants/colors';

function returnConditionFor(hasPendingTasks, taskCount) {
  const h = new Date().getHours();
  if (h >= 20) return "I'll bring this to the top of your list tomorrow morning.";
  if (!hasPendingTasks) return "I'll bring this back next time you're planning.";
  if (taskCount >= 4) return "I'll remind you about this when you need fresh inspiration.";
  return "I'll bring this back once today's tasks are done.";
}

export default function IdeaCaptureModal({ visible, hasPendingTasks, taskCount, onSave, onDismiss }) {
  const [text, setText] = useState('');

  const handleSave = () => {
    if (!text.trim()) return;
    onSave(text.trim(), returnConditionFor(hasPendingTasks, taskCount ?? 0));
    setText('');
  };

  const handleDismiss = () => { setText(''); onDismiss(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleDismiss}>
      <View style={s.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.emoji}>💡</Text>
            <Text style={s.title}>Got an idea?</Text>
            <Text style={s.sub}>Quick — tell me and I'll hold onto it for you.</Text>
            <TextInput
              style={s.input}
              placeholder="What's the idea?"
              placeholderTextColor={C.muted}
              value={text}
              onChangeText={setText}
              multiline
              autoFocus
              maxLength={200}
            />
            <TouchableOpacity
              style={[s.saveBtn, !text.trim() && s.saveBtnOff]}
              onPress={handleSave}
              disabled={!text.trim()}
            >
              <Text style={s.saveBtnText}>Save it 🌿</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={handleDismiss}>
              <Text style={s.cancelText}>Actually, never mind</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 44,
  },
  handle: {
    width: 40, height: 4, backgroundColor: C.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: 24,
  },
  emoji: { fontSize: 36, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: C.forest, textAlign: 'center', marginBottom: 6 },
  sub: { fontSize: 15, color: C.muted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  input: {
    backgroundColor: C.cream, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, padding: 16, fontSize: 16, color: C.forest,
    minHeight: 90, textAlignVertical: 'top', marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: C.sage, borderRadius: 16,
    paddingVertical: 16, alignItems: 'center', marginBottom: 12,
  },
  saveBtnOff: { opacity: 0.4 },
  saveBtnText: { color: C.white, fontWeight: '700', fontSize: 17 },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontSize: 15, color: C.muted },
});
