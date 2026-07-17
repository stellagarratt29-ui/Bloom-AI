import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import Icon from '../components/Icon';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { callClaude, getApiKey } from '../services/ai';

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

export default function ScreenAwarenessScreen({ navigation }) {
  const { hobbies, goals, tasks, finishedTasks, points } = useApp();
  const { colors: t } = useTheme();
  const [insight, setInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(true);

  const msDay = 86400000;
  const finishedToday    = finishedTasks.filter(f => Date.now() - f.finishedAt < msDay).length;
  const finishedThisWeek = finishedTasks.filter(f => Date.now() - f.finishedAt < 7 * msDay).length;
  const activeTasks      = tasks.filter(tk => !tk.done).length;
  const activeGoals      = goals.length;

  useEffect(() => {
    const hobbyNames = hobbies.map(h => h.name);
    const goalNames  = goals.map(g => g.text);

    const context = [
      `Tasks finished today: ${finishedToday}`,
      `Tasks finished this week: ${finishedThisWeek}`,
      `Active tasks remaining: ${activeTasks}`,
      `Goals in progress: ${activeGoals}${goalNames.length ? ` (${goalNames.slice(0, 3).join(', ')})` : ''}`,
      `Hobbies being developed: ${hobbyNames.length}${hobbyNames.length ? ` (${hobbyNames.slice(0, 3).join(', ')})` : ''}`,
      `Total points earned: ${points}`,
    ].join('\n');

    getApiKey().then(key => {
      if (!key) {
        setInsight(finishedToday > 0
          ? `You've finished ${finishedToday} task${finishedToday > 1 ? 's' : ''} today. Keep going.`
          : 'Every task you finish shows up here as a real measure of your day.');
        setLoadingInsight(false);
        return;
      }
      callClaude({
        system: "You are Bloom. Write ONE observational sentence about this person's productivity data. Be specific to the actual numbers. Warm but direct — no 'great job!' filler, no generic advice.",
        messages: [{ role: 'user', content: context }],
        maxTokens: 80,
      })
        .then(text => { setInsight(text.trim()); setLoadingInsight(false); })
        .catch(() => {
          setInsight(finishedToday > 0
            ? `${finishedToday} task${finishedToday > 1 ? 's' : ''} done today — that's real progress.`
            : 'Tap the circle on any task to mark it done and watch your stats build here.');
          setLoadingInsight(false);
        });
    });
  }, []);

  const redirectHobbies = hobbies.slice(0, 3);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={[s.title, { color: C.lavDark }]}>Your{'\n'}Progress</Text>
        <Text style={[s.sub, { color: t.subtext }]}>Everything you've built in Bloom, at a glance.</Text>

        <View style={s.statsRow}>
          <View style={[s.statBox, { backgroundColor: C.lavWash }]}>
            <Text style={[s.statValue, { color: C.lavDark }]}>{finishedThisWeek}</Text>
            <Text style={[s.statLabel, { color: C.lavDark }]}>DONE THIS WEEK</Text>
          </View>
          <View style={[s.statBox, { backgroundColor: C.pillSkyBg }]}>
            <Text style={[s.statValue, { color: C.pillSkyText }]}>{activeTasks}</Text>
            <Text style={[s.statLabel, { color: C.pillSkyText }]}>STILL TO DO</Text>
          </View>
        </View>

        <View style={s.statsRow}>
          <View style={[s.statBox, { backgroundColor: C.pinkWash }]}>
            <Text style={[s.statValue, { color: C.pinkDark }]}>{activeGoals}</Text>
            <Text style={[s.statLabel, { color: C.pinkDark }]}>GOALS ACTIVE</Text>
          </View>
          <View style={[s.statBox, { backgroundColor: '#E8EFE4' }]}>
            <Text style={[s.statValue, { color: C.moss }]}>{points}</Text>
            <Text style={[s.statLabel, { color: C.moss }]}>TOTAL POINTS</Text>
          </View>
        </View>

        <View style={[s.insightCard, { borderLeftColor: C.skyDark, backgroundColor: t.card, borderColor: t.border }]}>
          <Text style={[s.insightLabel, { color: C.skyDark }]}>BLOOM NOTICED</Text>
          {loadingInsight
            ? <ActivityIndicator size="small" color={C.skyDark} style={{ marginVertical: 8 }} />
            : <Text style={[s.insightText, { color: t.text }]}>{insight}</Text>}
        </View>

        {redirectHobbies.length > 0 ? (
          <>
            <Text style={[s.redirectTitle, { color: t.subtext }]}>NEED A BREAK?</Text>
            {redirectHobbies.map((h) => (
              <TouchableOpacity
                key={h.id}
                style={[s.redirectBtn, { borderColor: C.clay, backgroundColor: t.card }]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('GrowTab', { screen: 'HobbyDetail', params: { hobby: h } })}
              >
                <Icon name={getHobbyIcon(h.name)} size={16} color={C.clay} />
                <Text style={[s.redirectText, { color: C.clay }]}>{h.name} instead?</Text>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <TouchableOpacity
            style={[s.noHobbiesHint, { borderColor: C.clay, backgroundColor: t.card }]}
            onPress={() => navigation.navigate('GrowTab')}
            activeOpacity={0.7}
          >
            <Icon name="plus-circle" size={16} color={C.clay} />
            <Text style={[s.noHobbiesText, { color: C.clay }]}>Add hobbies in Grow and they'll appear here as break options →</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingHorizontal: 22, paddingTop: 22 },

  title: {
    fontSize: 30, fontWeight: '800', lineHeight: 38, marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined,
  },
  sub: { fontSize: 14, lineHeight: 22, marginBottom: 28 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statBox: {
    flex: 1, alignItems: 'center', paddingVertical: 20, paddingHorizontal: 12,
    borderRadius: 18,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  statValue: { fontSize: 32, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textAlign: 'center' },

  insightCard: {
    paddingLeft: 16, paddingRight: 14, paddingVertical: 14,
    borderLeftWidth: 3, borderWidth: 1, borderRadius: 14,
    marginTop: 4, marginBottom: 28,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  insightLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.3, marginBottom: 8 },
  insightText:  { fontSize: 14, lineHeight: 22 },

  redirectTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },
  redirectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: 20,
    paddingVertical: 14, paddingHorizontal: 20, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  redirectText: { fontSize: 15, fontWeight: '600' },

  noHobbiesHint: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 14, padding: 16,
  },
  noHobbiesText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
