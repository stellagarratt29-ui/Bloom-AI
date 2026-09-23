import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  buildPlan, behind, weekOf, prettyDate, todayIso, isValidDate,
} from './src/plan';
import { importCurriculum } from './src/ai';

const KEY = 'curric:v1';
const uid = () => Math.random().toString(36).slice(2, 10);
const topics = (list) => list.map((title) => ({ id: uid(), title, done: false }));

const SAMPLE = {
  start: '2026-09-07',
  end: '2027-07-16',
  holidays: [
    { id: uid(), name: 'Half term', start: '2026-10-26', end: '2026-10-30' },
    { id: uid(), name: 'Christmas', start: '2026-12-21', end: '2027-01-01' },
    { id: uid(), name: 'Easter', start: '2027-03-29', end: '2027-04-09' },
  ],
  subjects: [
    { id: uid(), name: 'Maths', topics: topics(['Place value', 'Fractions', 'Decimals', 'Percentages', 'Algebra basics', 'Geometry', 'Statistics']) },
    { id: uid(), name: 'Science', topics: topics(['Cells', 'Forces', 'Electricity', 'Light', 'Earth & space']) },
  ],
  planFrom: null,
};

export default function App() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('plan');

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => setData(raw ? JSON.parse(raw) : SAMPLE))
      .catch(() => setData(SAMPLE));
  }, []);

  const update = (next) => {
    setData(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={s.screen}>
        <StatusBar style="dark" />
        <Text style={s.logo}>Curric</Text>
        <View style={s.tabs}>
          {['plan', 'setup'].map((t) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabOn]}>
              <Text style={[s.tabText, tab === t && s.tabTextOn]}>{t === 'plan' ? 'My Plan' : 'Setup'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {data && (tab === 'plan' ? <PlanTab data={data} update={update} /> : <SetupTab data={data} update={update} />)}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function PlanTab({ data, update }) {
  const today = todayIso();
  const plan = useMemo(() => buildPlan(data), [data]);
  const late = behind(plan, today);
  const total = data.subjects.reduce((n, sub) => n + sub.topics.length, 0);
  const done = data.subjects.reduce((n, sub) => n + sub.topics.filter((t) => t.done).length, 0);

  const toggle = (subjectId, topicId) => update({
    ...data,
    subjects: data.subjects.map((sub) => sub.id !== subjectId ? sub : {
      ...sub,
      topics: sub.topics.map((t) => t.id === topicId ? { ...t, done: !t.done, doneOn: t.done ? null : todayIso() } : t),
    }),
  });

  const weeks = [];
  for (const it of plan.items) {
    const wk = it.date ? weekOf(it.date) : 'none';
    if (!weeks.length || weeks[weeks.length - 1].wk !== wk) weeks.push({ wk, items: [] });
    weeks[weeks.length - 1].items.push(it);
  }

  return (
    <ScrollView contentContainerStyle={s.body}>
      <Text style={s.progress}>{done} of {total} topics covered</Text>
      <View style={s.bar}><View style={[s.barFill, { width: `${total ? (done / total) * 100 : 0}%` }]} /></View>

      {late.length > 0 && (
        <View style={s.alert}>
          <Text style={s.alertText}>You're {late.length} topic{late.length > 1 ? 's' : ''} behind.</Text>
          <TouchableOpacity style={s.btn} onPress={() => update({ ...data, planFrom: today })}>
            <Text style={s.btnText}>Reschedule</Text>
          </TouchableOpacity>
        </View>
      )}

      {plan.schoolDayCount === 0 && (
        <Text style={s.muted}>No school days left. Check your term dates in Setup.</Text>
      )}

      {weeks.map(({ wk, items }) => (
        <View key={wk} style={s.card}>
          <Text style={s.cardTitle}>{wk === 'none' ? 'Unscheduled' : `Week of ${prettyDate(wk)}`}</Text>
          {items.map(({ subject, topic, date }) => (
            <TouchableOpacity key={topic.id} style={s.row} onPress={() => toggle(subject.id, topic.id)}>
              <View style={s.box} />
              <View style={{ flex: 1 }}>
                <Text style={[s.topic, date && date < today && s.late]}>{topic.title}</Text>
                <Text style={s.muted}>{subject.name}{date ? ` · ${prettyDate(date)}` : ''}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {done > 0 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Covered ✓</Text>
          {data.subjects.flatMap((sub) => sub.topics.filter((t) => t.done).map((t) => (
            <TouchableOpacity key={t.id} style={s.row} onPress={() => toggle(sub.id, t.id)}>
              <View style={[s.box, s.boxOn]} />
              <Text style={[s.topic, s.doneText]}>{t.title} <Text style={s.muted}>· {sub.name}</Text></Text>
            </TouchableOpacity>
          )))}
        </View>
      )}
    </ScrollView>
  );
}

function SetupTab({ data, update }) {
  const [hol, setHol] = useState({ name: '', start: '', end: '' });
  const [sub, setSub] = useState({ name: '', topics: '' });
  const [paste, setPaste] = useState('');
  const [ai, setAi] = useState({ busy: false, msg: '' });

  const runImport = async () => {
    if (!paste.trim() || ai.busy) return;
    setAi({ busy: true, msg: '' });
    try {
      const found = await importCurriculum(paste);
      update({
        ...data,
        subjects: [...data.subjects, ...found.map((f) => ({ id: uid(), name: f.name, topics: topics(f.topics) }))],
      });
      const n = found.reduce((sum, f) => sum + f.topics.length, 0);
      setPaste('');
      setAi({ busy: false, msg: `Added ${found.length} subject${found.length > 1 ? 's' : ''} (${n} topics).` });
    } catch (e) {
      setAi({ busy: false, msg: e.message, error: true });
    }
  };

  const addHoliday = () => {
    if (!hol.name || !isValidDate(hol.start) || !isValidDate(hol.end)) return;
    update({ ...data, holidays: [...data.holidays, { id: uid(), ...hol }] });
    setHol({ name: '', start: '', end: '' });
  };
  const addSubject = () => {
    const list = sub.topics.split('\n').map((t) => t.trim()).filter(Boolean);
    if (!sub.name || !list.length) return;
    update({ ...data, subjects: [...data.subjects, { id: uid(), name: sub.name, topics: topics(list) }] });
    setSub({ name: '', topics: '' });
  };

  return (
    <ScrollView contentContainerStyle={s.body}>
      <View style={s.card}>
        <Text style={s.cardTitle}>School year</Text>
        <DateField label="First day" value={data.start} onSave={(v) => update({ ...data, start: v })} />
        <DateField label="Last day" value={data.end} onSave={(v) => update({ ...data, end: v })} />
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Holidays</Text>
        {data.holidays.map((h) => (
          <Item key={h.id} text={`${h.name}: ${prettyDate(h.start)} – ${prettyDate(h.end)}`}
            onRemove={() => update({ ...data, holidays: data.holidays.filter((x) => x.id !== h.id) })} />
        ))}
        <TextInput style={s.input} placeholder="Name (e.g. Half term)" value={hol.name} onChangeText={(name) => setHol({ ...hol, name })} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput style={[s.input, { flex: 1, minWidth: 0 }]} placeholder="Start YYYY-MM-DD" value={hol.start} onChangeText={(start) => setHol({ ...hol, start })} />
          <TextInput style={[s.input, { flex: 1, minWidth: 0 }]} placeholder="End YYYY-MM-DD" value={hol.end} onChangeText={(end) => setHol({ ...hol, end })} />
        </View>
        <TouchableOpacity style={s.btn} onPress={addHoliday}><Text style={s.btnText}>Add holiday</Text></TouchableOpacity>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>✨ Import with AI</Text>
        <Text style={s.muted}>Paste your school's curriculum or scheme of work. AI will pull out the subjects and topics in teaching order.</Text>
        <TextInput style={[s.input, { height: 140 }]} multiline placeholder="Paste curriculum text here…"
          value={paste} onChangeText={setPaste} />
        <TouchableOpacity style={[s.btn, ai.busy && { opacity: 0.6 }]} onPress={runImport} disabled={ai.busy}>
          {ai.busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Import</Text>}
        </TouchableOpacity>
        {!!ai.msg && <Text style={ai.error ? s.error : s.success}>{ai.msg}</Text>}
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Subjects & topics</Text>
        {data.subjects.map((x) => (
          <Item key={x.id} text={`${x.name} (${x.topics.length} topics)`}
            onRemove={() => update({ ...data, subjects: data.subjects.filter((y) => y.id !== x.id) })} />
        ))}
        <TextInput style={s.input} placeholder="Subject (e.g. History)" value={sub.name} onChangeText={(name) => setSub({ ...sub, name })} />
        <TextInput style={[s.input, { height: 110 }]} multiline placeholder={'Topics, one per line, in teaching order'}
          value={sub.topics} onChangeText={(t) => setSub({ ...sub, topics: t })} />
        <TouchableOpacity style={s.btn} onPress={addSubject}><Text style={s.btnText}>Add subject</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function DateField({ label, value, onSave }) {
  const [text, setText] = useState(value);
  const ok = isValidDate(text);
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={s.muted}>{label}</Text>
      <TextInput style={[s.input, !ok && s.inputBad]} value={text} placeholder="YYYY-MM-DD"
        onChangeText={setText} onBlur={() => ok && text !== value && onSave(text)} />
    </View>
  );
}

function Item({ text, onRemove }) {
  return (
    <View style={s.item}>
      <Text style={{ flex: 1 }}>{text}</Text>
      <TouchableOpacity onPress={onRemove}><Text style={s.remove}>✕</Text></TouchableOpacity>
    </View>
  );
}

const BLUE = '#3B6FB6';
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F6FA' },
  logo: { fontSize: 28, fontWeight: '800', color: BLUE, paddingHorizontal: 16, paddingTop: 8 },
  tabs: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#E3E8F0' },
  tabOn: { backgroundColor: BLUE },
  tabText: { fontWeight: '600', color: '#44506A' },
  tabTextOn: { color: '#fff' },
  body: { padding: 16, paddingTop: 8, gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center' },
  progress: { fontSize: 16, fontWeight: '600', color: '#22304A' },
  bar: { height: 8, borderRadius: 4, backgroundColor: '#E3E8F0', overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: BLUE },
  alert: { backgroundColor: '#FFF2E0', borderRadius: 12, padding: 14, gap: 10 },
  alertText: { color: '#8A4B00', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#22304A', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: BLUE },
  boxOn: { backgroundColor: BLUE },
  topic: { fontSize: 15, color: '#22304A' },
  late: { color: '#C2410C' },
  doneText: { color: '#8A94A8', textDecorationLine: 'line-through' },
  muted: { fontSize: 13, color: '#8A94A8' },
  input: { borderWidth: 1, borderColor: '#D5DCE8', borderRadius: 8, padding: 10, backgroundColor: '#fff', textAlignVertical: 'top' },
  inputBad: { borderColor: '#E11D48' },
  btn: { backgroundColor: BLUE, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#EEF1F6' },
  error: { color: '#E11D48' },
  success: { color: '#15803D' },
  remove: { color: '#8A94A8', fontSize: 16, paddingHorizontal: 8 },
});
