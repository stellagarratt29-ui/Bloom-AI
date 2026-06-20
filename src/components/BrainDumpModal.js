import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
} from 'react-native';
import { C } from '../constants/colors';

function parseItems(raw) {
  return raw
    .split(/[\n.!?]+/)
    .map(s => s.replace(/^[-•*]\s*/, '').trim())
    .filter(s => s.length > 3);
}

export default function BrainDumpModal({ visible, onDone, onDismiss }) {
  const [text, setText]     = useState('');
  const [items, setItems]   = useState(null); // null = typing, array = sorting
  const [tags, setTags]     = useState({});   // { index: 'task' | 'idea' | 'skip' }

  const handleSort = () => {
    const parsed = parseItems(text);
    setItems(parsed);
    const initial = {};
    parsed.forEach((_, i) => { initial[i] = 'task'; });
    setTags(initial);
  };

  const handleDone = () => {
    const tasks = items?.filter((_, i) => tags[i] === 'task') ?? [];
    const ideas = items?.filter((_, i) => tags[i] === 'idea') ?? [];
    onDone({ tasks, ideas });
    setText('');
    setItems(null);
    setTags({});
  };

  const handleDismiss = () => {
    setText('');
    setItems(null);
    setTags({});
    onDismiss();
  };

  const tag = (i, val) => setTags(prev => ({ ...prev, [i]: val }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleDismiss}>
      <View style={s.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.kav}
        >
          <View style={s.sheet}>
            <View style={s.handle} />

            {!items ? (
              /* ── Dump phase ── */
              <>
                <Text style={s.emoji}>🧠</Text>
                <Text style={s.title}>Morning brain dump</Text>
                <Text style={s.sub}>
                  What's on your mind? Just pour it all out — one thought per line, or speak it.
                </Text>
                <Text style={s.hint}>💡 Tap the 🎤 on your keyboard to dictate instead of type.</Text>
                <TextInput
                  style={s.input}
                  placeholder={'Call dentist\nFinish the report\nRemember to email Jake\nBuy groceries...'}
                  placeholderTextColor={C.muted}
                  value={text}
                  onChangeText={setText}
                  multiline
                  autoFocus
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[s.primaryBtn, !text.trim() && s.btnOff]}
                  onPress={handleSort}
                  disabled={!text.trim()}
                >
                  <Text style={s.primaryBtnText}>Sort this out for me →</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.cancelBtn} onPress={handleDismiss}>
                  <Text style={s.cancelText}>Maybe later</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* ── Sort phase ── */
              <>
                <Text style={s.title}>Here's what I caught</Text>
                <Text style={s.sub}>Label each one — or skip it entirely.</Text>
                <ScrollView style={s.itemList} showsVerticalScrollIndicator={false}>
                  {items.map((item, i) => (
                    <View key={i} style={s.itemRow}>
                      <Text style={s.itemText}>{item}</Text>
                      <View style={s.tagRow}>
                        {[
                          { val: 'task', label: '→ Task',   activeColor: C.sage,  activeBg: C.sageLight  },
                          { val: 'idea', label: '💡 Idea',  activeColor: C.peach, activeBg: C.peachLight },
                          { val: 'skip', label: 'Skip',     activeColor: C.muted, activeBg: '#EDEBE7'    },
                        ].map(opt => {
                          const active = tags[i] === opt.val;
                          return (
                            <TouchableOpacity
                              key={opt.val}
                              style={[s.tagChip, active && { backgroundColor: opt.activeBg, borderColor: opt.activeColor }]}
                              onPress={() => tag(i, opt.val)}
                            >
                              <Text style={[s.tagChipText, active && { color: opt.activeColor }]}>
                                {opt.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                  <View style={{ height: 16 }} />
                </ScrollView>
                <TouchableOpacity style={s.primaryBtn} onPress={handleDone}>
                  <Text style={s.primaryBtnText}>
                    Done — add {Object.values(tags).filter(v => v === 'task').length} task{Object.values(tags).filter(v => v === 'task').length !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setItems(null)}>
                  <Text style={s.cancelText}>← Back to editing</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  kav: { width: '100%' },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 26, paddingBottom: 44, maxHeight: '92%',
  },
  handle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 22 },

  emoji:  { fontSize: 36, textAlign: 'center', marginBottom: 6 },
  title:  { fontSize: 22, fontWeight: '700', color: C.forest, textAlign: 'center', marginBottom: 6 },
  sub:    { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 21, marginBottom: 10 },
  hint:   { fontSize: 13, color: C.sage, textAlign: 'center', marginBottom: 16, fontStyle: 'italic' },

  input: {
    backgroundColor: C.cream, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, padding: 14, fontSize: 15, color: C.forest,
    minHeight: 140, maxHeight: 200, textAlignVertical: 'top', marginBottom: 16,
  },

  itemList: { maxHeight: 320, marginBottom: 14 },
  itemRow: {
    backgroundColor: C.cream, borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: C.border,
  },
  itemText: { fontSize: 15, color: C.forest, lineHeight: 21, marginBottom: 10 },
  tagRow: { flexDirection: 'row', gap: 7 },
  tagChip: {
    paddingVertical: 5, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1.5, borderColor: C.border,
  },
  tagChipText: { fontSize: 12, fontWeight: '600', color: C.muted },

  primaryBtn: {
    backgroundColor: C.sage, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginBottom: 10,
  },
  btnOff: { opacity: 0.4 },
  primaryBtnText: { color: C.white, fontWeight: '700', fontSize: 16 },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontSize: 14, color: C.muted },
});
