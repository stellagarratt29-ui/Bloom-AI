import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
  StyleSheet, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { C } from '../constants/colors';
import { SPRINT_DURATION, SPRINT_SOUNDS, ENCOURAGEMENTS } from '../constants/data';
import { useApp } from '../context/AppContext';
import BuddyAvatar from '../components/BuddyAvatar';

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function CircleTimer({ progress }) {
  const SIZE = 220;
  const STROKE = 10;
  const R = (SIZE - STROKE * 2) / 2;
  const CIRC = 2 * Math.PI * R;
  const dashOffset = CIRC * (1 - progress);

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background ring */}
      <View style={{
        position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2,
        borderWidth: STROKE, borderColor: C.sageLight,
      }} />
      {/* Progress ring — approximated with a styled View since we have no SVG */}
      <View style={{
        position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2,
        borderWidth: STROKE, borderColor: C.sage,
        opacity: progress,
      }} />
    </View>
  );
}

export default function SprintScreen({ route, navigation }) {
  const task = route?.params?.task ?? null;
  const { buddy, momentum, addPoints, toggleTask } = useApp();
  const [taskMarkedDone, setTaskMarkedDone] = useState(false);

  const [timeLeft, setTimeLeft]     = useState(SPRINT_DURATION);
  const [running, setRunning]       = useState(false);
  const [done, setDone]             = useState(false);
  const [sound, setSound]           = useState('none');
  const [encourageIdx, setEncourage] = useState(0);
  const intervalRef                  = useRef(null);
  const encourageRef                 = useRef(null);

  useEffect(() => {
    if (running && !done) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            clearInterval(encourageRef.current);
            setRunning(false);
            setDone(true);
            addPoints(10); // sprint bonus
            return 0;
          }
          return t - 1;
        });
      }, 1000);

      encourageRef.current = setInterval(() => {
        setEncourage(i => (i + 1) % ENCOURAGEMENTS.length);
      }, 45000);
    }

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(encourageRef.current);
    };
  }, [running]);

  // Pause timer if user navigates away
  useFocusEffect(
    useCallback(() => {
      return () => setRunning(false);
    }, [])
  );

  const toggle = () => setRunning(r => !r);
  const reset  = () => { setRunning(false); setTimeLeft(SPRINT_DURATION); setDone(false); };

  const progress = 1 - timeLeft / SPRINT_DURATION;

  const handleMarkDone = () => {
    if (task && !taskMarkedDone) {
      toggleTask(task.id);
      setTaskMarkedDone(true);
    }
    navigation.goBack();
  };

  if (done) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <BuddyAvatar buddy={buddy} momentum={Math.min(100, momentum + 10)} size={100} />
          <Text style={s.doneEmoji}>🎉</Text>
          <Text style={s.doneTitle}>Sprint complete!</Text>
          <Text style={s.doneSub}>
            You did 15 focused minutes. That's real progress — and {buddy?.name} noticed.
          </Text>
          <View style={s.pointsBadge}>
            <Text style={s.pointsBadgeText}>+10 pts — Sprint bonus! ⚡</Text>
          </View>
          {task && !task.done && (
            <TouchableOpacity style={s.primaryBtn} onPress={handleMarkDone}>
              <Text style={s.primaryBtnText}>✓ Mark "{task.text.slice(0, 24)}{task.text.length > 24 ? '…' : ''}" as done</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={task && !task.done ? s.secondaryBtn : s.primaryBtn} onPress={() => navigation.goBack()}>
            <Text style={task && !task.done ? s.secondaryBtnText : s.primaryBtnText}>Back to today →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.ghostBtn} onPress={reset}>
            <Text style={s.ghostBtnText}>Start another sprint</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Back */}
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Task label */}
        {task && (
          <View style={s.taskChip}>
            <Text style={s.taskChipText} numberOfLines={1}>⚡ {task.text}</Text>
          </View>
        )}

        {/* Timer */}
        <View style={s.timerWrapper}>
          <CircleTimer progress={progress} />
          <View style={s.timerCenter}>
            <Text style={s.timerText}>{formatTime(timeLeft)}</Text>
            <Text style={s.timerLabel}>{running ? 'in flow' : timeLeft === SPRINT_DURATION ? 'ready' : 'paused'}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={s.controls}>
          <TouchableOpacity style={s.primaryBtn} onPress={toggle}>
            <Text style={s.primaryBtnText}>{running ? '⏸ Pause' : timeLeft === SPRINT_DURATION ? '⚡ Start Sprint' : '▶ Resume'}</Text>
          </TouchableOpacity>
          {timeLeft < SPRINT_DURATION && (
            <TouchableOpacity style={s.resetBtn} onPress={reset}>
              <Text style={s.resetBtnText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Buddy encouragement */}
        <View style={s.encourageCard}>
          <BuddyAvatar buddy={buddy} momentum={momentum} size={48} />
          <Text style={s.encourageText}>
            {running ? ENCOURAGEMENTS[encourageIdx] : "Whenever you're ready — I'm right here with you."}
          </Text>
        </View>

        {/* Sound picker */}
        <Text style={s.soundTitle}>Ambient sound</Text>
        <View style={s.soundRow}>
          {SPRINT_SOUNDS.map(snd => (
            <TouchableOpacity
              key={snd.id}
              style={[s.soundChip, sound === snd.id && s.soundChipActive]}
              onPress={() => setSound(snd.id)}
            >
              <Text style={s.soundEmoji}>{snd.emoji}</Text>
              <Text style={[s.soundLabel, sound === snd.id && s.soundLabelActive]}>{snd.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.soundNote}>Audio coming soon — the visual timer is fully functional!</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.cream },
  scroll: { paddingHorizontal: 24, paddingTop: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },

  back: { marginBottom: 12 },
  backText: { fontSize: 16, color: C.sage, fontWeight: '600' },

  taskChip: {
    alignSelf: 'center', backgroundColor: C.sagePale,
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 18,
    borderWidth: 1, borderColor: C.sageLight, marginBottom: 28,
  },
  taskChipText: { fontSize: 14, fontWeight: '600', color: C.forest },

  timerWrapper: {
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 28, position: 'relative',
  },
  timerCenter: {
    position: 'absolute', alignItems: 'center',
  },
  timerText: { fontSize: 58, fontWeight: '700', color: C.forest, letterSpacing: -2 },
  timerLabel: { fontSize: 14, color: C.sage, marginTop: 2, fontWeight: '500' },

  controls: { alignItems: 'center', gap: 10, marginBottom: 24 },
  primaryBtn: {
    backgroundColor: C.sage, borderRadius: 16,
    paddingVertical: 17, paddingHorizontal: 40, alignItems: 'center',
  },
  primaryBtnText: { color: C.white, fontWeight: '700', fontSize: 17 },
  secondaryBtn: {
    marginTop: 12, paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: 16, borderWidth: 2, borderColor: C.sage,
  },
  secondaryBtnText: { color: C.sage, fontWeight: '600', fontSize: 16 },
  ghostBtn: { marginTop: 4, paddingVertical: 10 },
  ghostBtnText: { fontSize: 15, color: C.muted },
  resetBtn: { paddingVertical: 8 },
  resetBtnText: { fontSize: 14, color: C.muted },

  encourageCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.sagePale, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.sageLight, marginBottom: 24,
  },
  encourageText: { flex: 1, fontSize: 15, color: C.forest, lineHeight: 22, fontStyle: 'italic' },

  soundTitle: { fontSize: 12, fontWeight: '700', color: C.muted, letterSpacing: 1.5, marginBottom: 10 },
  soundRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  soundChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
    backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border,
  },
  soundChipActive: { borderColor: C.sage, backgroundColor: C.sagePale },
  soundEmoji: { fontSize: 15 },
  soundLabel: { fontSize: 13, fontWeight: '600', color: C.muted },
  soundLabelActive: { color: C.sage },
  soundNote: { fontSize: 12, color: C.muted, fontStyle: 'italic' },

  doneEmoji: { fontSize: 52, marginTop: 16, marginBottom: 8 },
  doneTitle: { fontSize: 28, fontWeight: '700', color: C.forest, textAlign: 'center' },
  doneSub: { fontSize: 16, color: C.muted, textAlign: 'center', lineHeight: 25, marginVertical: 14, marginBottom: 20 },
  pointsBadge: {
    backgroundColor: C.peachPale, borderRadius: 20,
    paddingVertical: 10, paddingHorizontal: 20, marginBottom: 28,
    borderWidth: 1, borderColor: C.peachLight,
  },
  pointsBadgeText: { fontSize: 15, fontWeight: '700', color: C.peach },
});
