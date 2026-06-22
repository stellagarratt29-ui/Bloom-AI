import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView, StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';

const DURATION_OPTIONS = [5, 10, 15, 25];

const ERRAND_RE = /\b(doctor|dentist|hospital|clinic|pharmacy|appointment|commute|drive|travel|pick.?up|drop.?off|grocery|groceries|shopping|shop(?:ping)?\s+for|store|errand|laundry|tidy|haircut|salon|barber|vet|optician|church|temple|mosque|funeral|wedding|party|event|concert|visit|meeting\s+at|call\s+(?:the|my|a)?|phone\s+call|interview\s+at|school\s+run)\b/i;

function isTimerTask(text) {
  return !ERRAND_RE.test(text ?? '');
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function SprintScreen({ route, navigation }) {
  const task = route?.params?.task ?? null;
  const { addPoints, toggleTask } = useApp();

  const [selectedMins, setSelectedMins] = useState(15);
  const [timeLeft, setTimeLeft]         = useState(15 * 60);
  const [running, setRunning]           = useState(false);
  const [done, setDone]                 = useState(false);
  const [taskMarkedDone, setTaskMarkedDone] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running && !done) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setDone(true);
            addPoints(10);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  useFocusEffect(
    useCallback(() => {
      return () => setRunning(false);
    }, [])
  );

  const toggle = () => setRunning(r => !r);
  const reset  = () => { setRunning(false); setTimeLeft(selectedMins * 60); setDone(false); };

  const handlePickDuration = (mins) => {
    if (!running && timeLeft === selectedMins * 60) {
      setSelectedMins(mins);
      setTimeLeft(mins * 60);
    }
  };

  const handleMarkDone = () => {
    if (task && !taskMarkedDone) {
      toggleTask(task.id);
      setTaskMarkedDone(true);
    }
    navigation.goBack();
  };

  const progress = 1 - timeLeft / (selectedMins * 60);
  const timerMode = isTimerTask(task?.text);

  if (!timerMode && !done) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.container}>
          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={s.errandWrap}>
            <Feather name="map-pin" size={38} color={C.sage} style={{ marginBottom: 18 }} />
            <Text style={s.errandTitle}>{task?.text ?? 'Task'}</Text>
            <Text style={s.errandSub}>This one doesn't need a timer — just go do it.</Text>
          </View>
          <TouchableOpacity style={s.primaryBtn} onPress={handleMarkDone}>
            <View style={s.btnRow}>
              <Feather name="check" size={18} color={C.white} />
              <Text style={s.primaryBtnText}>Mark as done</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (done) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Feather name="check-circle" size={52} color={C.sage} style={{ marginBottom: 16 }} />
          <Text style={s.doneTitle}>Sprint complete!</Text>
          <Text style={s.doneSub}>
            {selectedMins} focused minutes done. That's real progress.
          </Text>
          {task && !task.done && (
            <TouchableOpacity style={s.primaryBtn} onPress={handleMarkDone}>
              <View style={s.btnRow}>
                <Feather name="check" size={16} color={C.white} />
                <Text style={s.primaryBtnText}>Mark as done</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.secondaryBtn} onPress={() => navigation.goBack()}>
            <Text style={s.secondaryBtnText}>Back to Today →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.ghostBtn} onPress={reset}>
            <Text style={s.ghostBtnText}>Another sprint</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        {!running && timeLeft === selectedMins * 60 && (
          <View style={s.durationRow}>
            {DURATION_OPTIONS.map(mins => (
              <TouchableOpacity
                key={mins}
                style={[s.durationChip, selectedMins === mins && s.durationChipActive]}
                onPress={() => handlePickDuration(mins)}
              >
                <Text style={[s.durationText, selectedMins === mins && s.durationTextActive]}>
                  {mins}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={s.clockWrap}>
          <View style={[s.clockRing, { opacity: 0.12 + progress * 0.88 }]} />
          <View style={s.clockInner}>
            <Text style={s.clockTime}>{formatTime(timeLeft)}</Text>
            {task && (
              <Text style={s.clockTask} numberOfLines={2}>{task.text}</Text>
            )}
          </View>
        </View>

        <Text style={s.quote}>Small progress is still progress.</Text>

        <TouchableOpacity style={s.primaryBtn} onPress={toggle}>
          <View style={s.btnRow}>
            <Feather name={running ? 'pause' : 'play'} size={18} color={C.white} />
            <Text style={s.primaryBtnText}>
              {running ? 'Pause' : timeLeft === selectedMins * 60 ? 'Start Focus' : 'Resume'}
            </Text>
          </View>
        </TouchableOpacity>

        {timeLeft < selectedMins * 60 && !running && (
          <TouchableOpacity style={s.ghostBtn} onPress={reset}>
            <Text style={s.ghostBtnText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: C.cream },
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 20 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },

  back: { alignSelf: 'flex-start', marginBottom: 16 },
  backText: { fontSize: 16, color: C.sage, fontWeight: '600' },

  durationRow: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  durationChip: {
    paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20,
    backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border,
  },
  durationChipActive: { backgroundColor: C.forest, borderColor: C.forest },
  durationText: { fontSize: 14, fontWeight: '700', color: C.muted },
  durationTextActive: { color: C.white },

  clockWrap: {
    width: 260, height: 260, alignItems: 'center', justifyContent: 'center',
    marginBottom: 32,
  },
  clockRing: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    borderWidth: 12, borderColor: C.forest,
  },
  clockInner: { alignItems: 'center', paddingHorizontal: 24 },
  clockTime: { fontSize: 64, fontWeight: '300', color: C.forest, letterSpacing: -2 },
  clockTask: { fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 8, lineHeight: 20 },

  quote: { fontSize: 14, color: C.muted, fontStyle: 'italic', marginBottom: 32 },

  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  primaryBtn: {
    backgroundColor: C.forest, borderRadius: 28,
    paddingVertical: 16, paddingHorizontal: 48,
    marginBottom: 12,
  },
  primaryBtnText: { color: C.white, fontWeight: '700', fontSize: 17 },
  secondaryBtn: {
    backgroundColor: C.white, borderWidth: 2, borderColor: C.forest,
    borderRadius: 28, paddingVertical: 14, paddingHorizontal: 36,
    marginBottom: 12,
  },
  secondaryBtnText: { color: C.forest, fontWeight: '600', fontSize: 16 },
  ghostBtn: { padding: 10, marginTop: 4 },
  ghostBtnText: { fontSize: 14, color: C.muted },

  errandWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, marginBottom: 32 },
  errandTitle: { fontSize: 22, fontWeight: '700', color: C.forest, textAlign: 'center', marginBottom: 12, lineHeight: 30 },
  errandSub: { fontSize: 15, color: C.muted, textAlign: 'center', lineHeight: 24 },

  doneTitle:  { fontSize: 28, fontWeight: '700', color: C.forest, marginBottom: 10 },
  doneSub:    { fontSize: 15, color: C.muted, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
});
