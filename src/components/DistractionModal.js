import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { C } from '../constants/colors';

export default function DistractionModal({ visible, pendingTask, onStartTask, onAlternative, onIgnore }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onIgnore}>
      <View style={s.overlay}>
        <View style={s.card}>
          <Text style={s.emoji}>🌀</Text>
          <Text style={s.title}>Looks like you've been in a loop.</Text>
          <Text style={s.body}>
            That's okay — it happens to everyone. Want to spend just 15 minutes on something that matters?
          </Text>

          {pendingTask && (
            <TouchableOpacity style={s.primaryBtn} onPress={onStartTask}>
              <Text style={s.primaryBtnText}>⚡ Start: "{pendingTask.text}"</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={s.secondaryBtn} onPress={onAlternative}>
            <Text style={s.secondaryBtnText}>🌱 Give me another option</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.ignoreBtn} onPress={onIgnore}>
            <Text style={s.ignoreText}>Not right now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: C.overlay,
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    backgroundColor: C.white, borderRadius: 24,
    padding: 28, width: '100%', alignItems: 'center',
  },
  emoji: { fontSize: 44, marginBottom: 12 },
  title: {
    fontSize: 20, fontWeight: '700', color: C.forest,
    textAlign: 'center', marginBottom: 10,
  },
  body: {
    fontSize: 15, color: C.muted, textAlign: 'center',
    lineHeight: 23, marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: C.sage, borderRadius: 16,
    paddingVertical: 15, paddingHorizontal: 24,
    width: '100%', alignItems: 'center', marginBottom: 10,
  },
  primaryBtnText: { color: C.white, fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    backgroundColor: C.sagePale, borderRadius: 16,
    paddingVertical: 15, paddingHorizontal: 24,
    width: '100%', alignItems: 'center', marginBottom: 10,
    borderWidth: 1, borderColor: C.sageLight,
  },
  secondaryBtnText: { color: C.sage, fontWeight: '600', fontSize: 16 },
  ignoreBtn: { paddingVertical: 10 },
  ignoreText: { fontSize: 14, color: C.muted },
});
