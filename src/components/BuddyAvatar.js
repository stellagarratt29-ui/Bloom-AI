import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';

function moodIcon(momentum) {
  if (momentum >= 75) return 'sun';
  if (momentum >= 50) return 'smile';
  if (momentum >= 25) return 'meh';
  return 'moon';
}

export default function BuddyAvatar({ buddy, momentum = 0, size = 80 }) {
  const ring = size;
  const inner = size * 0.76;
  const iconSize = Math.round(size * 0.34);
  const moodSize = size * 0.24;
  const moodIconSize = Math.max(8, Math.round(moodSize * 0.52));

  return (
    <View style={[s.ring, {
      width: ring, height: ring, borderRadius: ring / 2,
      backgroundColor: buddy?.color ? buddy.color + '40' : C.sageLight,
      borderColor: buddy?.color ?? C.sageMid,
    }]}>
      <View style={[s.inner, {
        width: inner, height: inner, borderRadius: inner / 2,
        backgroundColor: buddy?.color ? buddy.color + '25' : C.sagePale,
      }]}>
        <Feather
          name={buddy?.icon ?? 'feather'}
          size={iconSize}
          color={buddy?.color ?? C.forest}
        />
      </View>
      <View style={[s.moodBadge, { width: moodSize, height: moodSize, borderRadius: moodSize / 2 }]}>
        <Feather name={moodIcon(momentum)} size={moodIconSize} color={C.forest} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  ring: {
    borderWidth: 3, alignItems: 'center', justifyContent: 'center',
  },
  inner: {
    alignItems: 'center', justifyContent: 'center',
  },
  moodBadge: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: C.white, borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
});
