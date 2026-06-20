import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C } from '../constants/colors';

const PRIORITY = {
  high:   { label: 'High',   text: C.peach, bg: C.peachLight, accent: C.peach   },
  medium: { label: 'Medium', text: C.sage,  bg: C.sageLight,  accent: C.sage    },
  low:    { label: 'Low',    text: C.muted, bg: '#EDEBE7',    accent: C.sageMid },
};

export default function TaskRow({ task, onToggle, onStartSprint, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const p = PRIORITY[task.priority] ?? PRIORITY.medium;

  if (confirmDelete) {
    return (
      <View style={[s.row, s.deleteRow]}>
        <Text style={s.deletePrompt} numberOfLines={1}>Remove "{task.text}"?</Text>
        <TouchableOpacity style={s.confirmBtn} onPress={() => onDelete?.(task.id)}>
          <Text style={s.confirmText}>Remove</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.cancelBtn} onPress={() => setConfirmDelete(false)}>
          <Text style={s.cancelText}>Keep</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.row, { borderLeftColor: task.done ? C.border : p.accent, borderLeftWidth: 3 }]}>
      <TouchableOpacity style={s.check} onPress={onToggle} activeOpacity={0.7}>
        <View style={[s.circle, task.done && s.circleDone]}>
          {task.done && <Text style={s.tick}>✓</Text>}
        </View>
      </TouchableOpacity>

      <Text style={[s.text, task.done && s.textDone]} numberOfLines={2}>
        {task.text}
      </Text>

      <View style={[s.badge, { backgroundColor: p.bg }]}>
        <Text style={[s.badgeText, { color: p.text }]}>{p.label}</Text>
      </View>

      {!task.done && (
        <TouchableOpacity style={s.sprintBtn} onPress={() => onStartSprint?.(task)}>
          <Text style={s.sprintBtnText}>⚡</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={s.deleteBtn} onPress={() => setConfirmDelete(true)}>
        <Text style={s.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white, borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 14,
    marginBottom: 8, borderWidth: 1, borderColor: C.border,
  },
  deleteRow: { backgroundColor: '#FFF5F2', borderColor: C.peachLight },

  check: { marginRight: 12, flexShrink: 0 },
  circle: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: C.sage,
    alignItems: 'center', justifyContent: 'center',
  },
  circleDone: { backgroundColor: C.sage, borderColor: C.sage },
  tick: { color: C.white, fontSize: 13, fontWeight: '800', lineHeight: 15 },

  text: { flex: 1, fontSize: 15, color: C.forest, lineHeight: 21 },
  textDone: { color: C.muted, textDecorationLine: 'line-through' },

  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginLeft: 8, flexShrink: 0 },
  badgeText: { fontSize: 10, fontWeight: '700' },

  sprintBtn: {
    marginLeft: 6, width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.sagePale, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.sageLight,
  },
  sprintBtnText: { fontSize: 14 },

  deleteBtn: { marginLeft: 6, padding: 4 },
  deleteBtnText: { fontSize: 13, color: C.muted },

  deletePrompt: { flex: 1, fontSize: 14, color: C.forest, fontStyle: 'italic' },
  confirmBtn: {
    backgroundColor: C.peachLight, borderRadius: 10,
    paddingVertical: 6, paddingHorizontal: 12, marginLeft: 8,
  },
  confirmText: { fontSize: 13, fontWeight: '700', color: C.peach },
  cancelBtn: { paddingVertical: 6, paddingHorizontal: 10, marginLeft: 6 },
  cancelText: { fontSize: 13, color: C.muted },
});
