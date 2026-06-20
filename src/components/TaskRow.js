import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C } from '../constants/colors';

const PRIORITY = {
  high:   { label: 'High',   text: C.peach, bg: C.peachLight },
  medium: { label: 'Medium', text: C.sage,  bg: C.sageLight  },
  low:    { label: 'Low',    text: C.muted, bg: '#EDEBE7'    },
};

export default function TaskRow({ task, onToggle, onStartSprint }) {
  const p = PRIORITY[task.priority];
  return (
    <View style={s.row}>
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
});
