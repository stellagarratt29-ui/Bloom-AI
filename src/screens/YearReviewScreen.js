import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet, Platform, ActivityIndicator,
} from 'react-native';
import Icon from '../components/Icon';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { generateYearReview } from '../services/ai';

function getHobbyIcon(name) {
  const n = (name || '').toLowerCase();
  if (/guitar|piano|drum|violin|ukulele|bass/.test(n)) return 'music';
  if (/sing|choir|vocal/.test(n)) return 'mic';
  if (/paint|watercolou|watercolor|sketch|draw|art\b/.test(n)) return 'pen-tool';
  if (/photo|camera/.test(n)) return 'camera';
  if (/film|video/.test(n)) return 'film';
  if (/run|jog|sprint/.test(n)) return 'activity';
  if (/gym|lift|fitness/.test(n)) return 'trending-up';
  if (/yoga|meditat|mindful/.test(n)) return 'sun';
  if (/cook|bak|chef/.test(n)) return 'coffee';
  if (/read|book/.test(n)) return 'book-open';
  if (/writ|journal|blog/.test(n)) return 'edit-3';
  if (/code|program|dev/.test(n)) return 'code';
  if (/garden|plant|flower/.test(n)) return 'feather';
  if (/knit|sew|crochet/.test(n)) return 'scissors';
  if (/travel|explore/.test(n)) return 'globe';
  return 'star';
}

export default function YearReviewScreen({ navigation }) {
  const { tasks, hobbies, goals } = useApp();
  const { colors: t } = useTheme();

  const year = new Date().getFullYear();
  const yearStart = new Date(year, 0, 1).getTime();

  const doneTasks = tasks.filter(tk => tk.done);
  const thisYearTasks = tasks.filter(tk => tk.done && (tk.completedAt ?? 0) >= yearStart);
  const taskCount = thisYearTasks.length > 0 ? thisYearTasks.length : doneTasks.length;
  const countLabel = thisYearTasks.length > 0 ? `${year}` : 'total';

  const [reflection, setReflection] = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    let alive = true;
    generateYearReview({ year, taskCount, hobbies, goals }).then(r => {
      if (alive) { setReflection(r); setLoading(false); }
    });
    return () => { alive = false; };
  }, []);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>

      <View style={[s.header, { backgroundColor: t.bg, borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color={t.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: C.clay }]}>{year} in review</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Reflection */}
        <View style={[s.reflectionCard, { backgroundColor: C.sagePale, borderColor: C.sageLight }]}>
          {loading ? (
            <ActivityIndicator color={C.moss} />
          ) : (
            <Text style={[s.reflectionText, { color: C.ink }]}>{reflection}</Text>
          )}
        </View>

        {/* Task count */}
        <View style={[s.statCard, { backgroundColor: t.card, borderColor: t.border }]}>
          <Text style={[s.statNum, { color: C.clay }]}>{taskCount}</Text>
          <Text style={[s.statLabel, { color: t.subtext }]}>tasks completed{countLabel !== `${year}` ? ' (all time)' : ` in ${year}`}</Text>
        </View>

        {/* Hobbies */}
        {hobbies.length > 0 && (
          <>
            <Text style={[s.sectionTitle, { color: t.subtext }]}>HOBBIES</Text>
            {hobbies.map((h, idx) => {
              const total   = h.milestones?.length ?? 1;
              const reached = h.milestoneIndex ?? 0;
              const pct     = total > 0 ? Math.round((reached / total) * 100) : 0;
              return (
                <View key={h.id} style={[s.hobbyCard, { backgroundColor: t.card, borderColor: t.border }]}>
                  <View style={[s.hobbyIconBox, { backgroundColor: C.sagePale }]}>
                    <Icon name={getHobbyIcon(h.name)} size={18} color={C.moss} />
                  </View>
                  <View style={s.hobbyInfo}>
                    <Text style={[s.hobbyName, { color: t.text }]}>{h.name}</Text>
                    <Text style={[s.hobbyMeta, { color: t.subtext }]}>
                      Milestone {reached} of {total} reached
                    </Text>
                    <View style={[s.track, { backgroundColor: t.border }]}>
                      <View style={[s.fill, { backgroundColor: C.moss, width: `${pct}%` }]} />
                    </View>
                  </View>
                  <Text style={[s.pct, { color: C.moss }]}>{pct}%</Text>
                </View>
              );
            })}
          </>
        )}

        {/* Goals */}
        {goals.length > 0 && (
          <>
            <Text style={[s.sectionTitle, { color: t.subtext }]}>GOALS</Text>
            {goals.map(g => {
              const done = g.completedActions?.length ?? 0;
              const total = done + (g.currentAction ? 1 : 0);
              return (
                <View key={g.id} style={[s.goalCard, { backgroundColor: t.card, borderColor: t.border }]}>
                  <Icon name="target" size={16} color={C.clay} style={{ flexShrink: 0 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.goalText, { color: t.text }]}>{g.text}</Text>
                    <Text style={[s.goalMeta, { color: t.subtext }]}>
                      {done === 0
                        ? 'Just getting started'
                        : `${done} action${done !== 1 ? 's' : ''} completed`}
                      {g.currentAction ? ' · in progress' : ''}
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {hobbies.length === 0 && goals.length === 0 && taskCount === 0 && (
          <View style={s.empty}>
            <Icon name="sun" size={44} color={C.sageLight} style={{ marginBottom: 14 }} />
            <Text style={[s.emptyHead, { color: t.text }]}>Nothing here yet</Text>
            <Text style={[s.emptyText, { color: t.subtext }]}>
              Add hobbies, set goals, and complete tasks — they'll all show up here when you look back.
            </Text>
          </View>
        )}

        <Text style={[s.footer, { color: t.subtext }]}>
          This review updates in real time as you complete things.
        </Text>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn:     { padding: 4 },
  headerTitle: {
    fontSize: 20, fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 20 },

  reflectionCard: {
    borderRadius: 18, borderWidth: 1,
    padding: 20, marginBottom: 16,
    minHeight: 60, alignItems: 'center', justifyContent: 'center',
  },
  reflectionText: { fontSize: 15, lineHeight: 26, fontStyle: 'italic', textAlign: 'center' },

  statCard: {
    borderRadius: 18, borderWidth: 1,
    padding: 20, marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  statNum:   { fontSize: 52, fontWeight: '800', lineHeight: 60 },
  statLabel: { fontSize: 13, marginTop: 4 },

  sectionTitle: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1.4,
    marginBottom: 10, marginTop: 4,
  },

  hobbyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1,
    padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  hobbyIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  hobbyInfo:  { flex: 1, gap: 4 },
  hobbyName:  { fontSize: 15, fontWeight: '700' },
  hobbyMeta:  { fontSize: 12, lineHeight: 17 },
  track:      { height: 4, borderRadius: 2, marginTop: 4, overflow: 'hidden' },
  fill:       { height: 4, borderRadius: 2 },
  pct:        { fontSize: 13, fontWeight: '700', flexShrink: 0 },

  goalCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderRadius: 16, borderWidth: 1,
    padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  goalText: { fontSize: 14, fontWeight: '600', lineHeight: 21, marginBottom: 2 },
  goalMeta: { fontSize: 12 },

  empty: { alignItems: 'center', paddingTop: 40, paddingBottom: 32, paddingHorizontal: 16 },
  emptyHead: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22, maxWidth: 280 },

  footer: { fontSize: 12, textAlign: 'center', marginTop: 20, paddingBottom: 4 },
});
