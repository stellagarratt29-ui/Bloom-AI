import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C } from '../constants/colors';

function moodEmoji(momentum) {
  if (momentum >= 75) return '✨';
  if (momentum >= 50) return '😊';
  if (momentum >= 25) return '😌';
  return '😴';
}

export default function BuddyAvatar({ buddy, momentum = 0, size = 80 }) {
  const ring = size;
  const inner = size * 0.76;
  const fontSize = size * 0.36;
  const moodSize = size * 0.24;

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
        <Text style={{ fontSize }}>{buddy?.emoji ?? '🌿'}</Text>
      </View>
      <View style={[s.moodBadge, { width: moodSize, height: moodSize, borderRadius: moodSize / 2 }]}>
        <Text style={{ fontSize: moodSize * 0.6 }}>{moodEmoji(momentum)}</Text>
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
