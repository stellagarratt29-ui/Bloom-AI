import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { callClaude, getApiKey, generateHobbyMilestone } from '../services/ai';

export default function HobbyDetailScreen({ route, navigation }) {
  const { hobby: initialHobby } = route.params ?? {};
  const { hobbies, completeMilestone } = useApp();

  // Pull live hobby data from context so it updates after milestone completion
  const hobby = hobbies.find(h => h.id === initialHobby?.id) ?? initialHobby;

  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const scrollRef  = useRef(null);
  const historyRef = useRef([]);

  useEffect(() => { loadGuidance(); }, []);

  const scrollToEnd = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);

  const loadGuidance = async () => {
    if (!hobby) return;
    setThinking(true);
    try {
      const key = await getApiKey();
      if (!key) throw new Error('no key');
      const reply = await callClaude({
        system: `You are Bloom, a skilled and encouraging teacher. Give clear, specific guidance to help someone complete their current learning milestone.
- 4–6 numbered steps, each specific and actionable
- Include real methods, techniques, or free resources where helpful
- End with a short encouraging sentence and an open question
Write in plain text, no markdown headers.`,
        messages: [{ role: 'user', content: `Hobby: ${hobby.name}\nSkill level: ${hobby.skillLevel}\nCurrent milestone: ${hobby.currentMilestone}\n\nHow do I complete this milestone?` }],
        maxTokens: 600,
      });
      const msg = { id: 1, from: 'bloom', text: reply };
      setMessages([msg]);
      historyRef.current = [{ role: 'assistant', content: reply }];
    } catch {
      const fallback = `Here's how to work on "${hobby.currentMilestone}":\n\n1. Break it into a single 20–30 minute session today — don't try to finish it all at once.\n2. Remove distractions before starting — phone away, clear space.\n3. Focus on the part that feels hardest first while your energy is highest.\n4. At the end, write one sentence about what you actually did.\n\nWhat feels most challenging about this right now?`;
      const msg = { id: 1, from: 'bloom', text: fallback };
      setMessages([msg]);
      historyRef.current = [{ role: 'assistant', content: fallback }];
    } finally {
      setThinking(false);
      scrollToEnd();
    }
  };

  const send = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    const userMsg = { id: Date.now(), from: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    scrollToEnd();
    historyRef.current = [...historyRef.current, { role: 'user', content: trimmed }];

    setThinking(true);
    try {
      const key = await getApiKey();
      if (!key) throw new Error('no key');
      const reply = await callClaude({
        system: `You are Bloom, a practical teacher helping someone learn ${hobby?.name}. They're working on: "${hobby?.currentMilestone}". Answer their question specifically and helpfully. 3–4 sentences, direct.`,
        messages: historyRef.current,
        maxTokens: 350,
      });
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text: reply }]);
      historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }];
    } catch {
      const fallback = `Good question. Focus on the most basic version of this first — even doing it wrong teaches you what to fix. What specifically are you finding difficult?`;
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bloom', text: fallback }]);
      historyRef.current = [...historyRef.current, { role: 'assistant', content: fallback }];
    } finally {
      setThinking(false);
      scrollToEnd();
    }
  };

  const handleMilestoneDone = async () => {
    if (!hobby || advancing) return;
    setAdvancing(true);
    try {
      const nextIndex = (hobby.milestoneIndex ?? 0) + 1;
      const hasPregenerated = hobby.milestones?.length > nextIndex;
      if (hasPregenerated) {
        // Use the next pre-generated milestone from the curriculum — no AI call needed
        completeMilestone(hobby.id);
      } else {
        // Exhausted the pre-generated curriculum — generate dynamically
        const nextMilestone = await generateHobbyMilestone({
          hobbyName: hobby.name,
          skillLevel: hobby.skillLevel,
          completedMilestones: [...(hobby.completedMilestones ?? []), hobby.currentMilestone],
        });
        completeMilestone(hobby.id, nextMilestone);
      }
      navigation.goBack();
    } catch {
      completeMilestone(hobby.id, `Keep practising ${hobby.name} — done when you complete one focused session and can describe what improved.`);
      navigation.goBack();
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Feather name="arrow-left" size={22} color={C.forest} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerHobby}>{hobby?.name ?? 'Hobby'}</Text>
            <Text style={s.headerMilestone} numberOfLines={2}>{hobby?.currentMilestone}</Text>
          </View>
          <TouchableOpacity
            style={[s.doneBtn, advancing && { opacity: 0.6 }]}
            onPress={handleMilestoneDone}
            disabled={advancing}
          >
            {advancing ? (
              <ActivityIndicator size="small" color={C.white} />
            ) : (
              <>
                <Feather name="check" size={14} color={C.white} />
                <Text style={s.doneBtnText}>Milestone done</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Curriculum overview strip */}
        {hobby?.milestones?.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.curriculumStrip}
            contentContainerStyle={s.curriculumStripContent}
          >
            {hobby.milestones.map((m, i) => {
              const idx = hobby.milestoneIndex ?? 0;
              const isDone    = i < idx;
              const isCurrent = i === idx;
              return (
                <View key={i} style={[s.curriculumStep, isDone && s.curriculumStepDone, isCurrent && s.curriculumStepCurrent]}>
                  <Text style={[s.curriculumStepNum, isDone && s.curriculumStepNumDone, isCurrent && s.curriculumStepNumCurrent]}>
                    {isDone ? '✓' : i + 1}
                  </Text>
                </View>
              );
            })}
            <Text style={s.curriculumLabel}>
              Step {(hobby.milestoneIndex ?? 0) + 1} of {hobby.milestones.length}
            </Text>
          </ScrollView>
        )}

        <ScrollView
          ref={scrollRef}
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {thinking && messages.length === 0 && (
            <View style={s.loadingWrap}>
              <ActivityIndicator color={C.sage} size="small" />
              <Text style={s.loadingText}>Building your guidance…</Text>
            </View>
          )}

          {messages.map(m => (
            m.from === 'bloom' ? (
              <View key={m.id} style={s.bloomBubble}>
                <Text style={s.bloomText}>{m.text}</Text>
              </View>
            ) : (
              <View key={m.id} style={s.userRow}>
                <View style={s.userBubble}>
                  <Text style={s.userText}>{m.text}</Text>
                </View>
              </View>
            )
          ))}

          {thinking && messages.length > 0 && (
            <View style={[s.bloomBubble, { paddingVertical: 16 }]}>
              <ActivityIndicator color={C.sage} size="small" />
            </View>
          )}
        </ScrollView>

        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            placeholder="Ask about this milestone…"
            placeholderTextColor={C.muted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
            editable={!thinking}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || thinking) && s.sendBtnOff]}
            onPress={() => send(input)}
            disabled={!input.trim() || thinking}
          >
            <Feather name="send" size={16} color={C.white} />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: C.cream },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.white,
  },
  backBtn: { padding: 4, flexShrink: 0 },
  headerCenter: { flex: 1 },
  headerHobby: { fontSize: 13, fontWeight: '700', color: C.sage, letterSpacing: 0.5, marginBottom: 3 },
  headerMilestone: { fontSize: 13, color: C.forest, lineHeight: 18, fontWeight: '500' },
  doneBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.moss, borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 14, flexShrink: 0, minWidth: 70, justifyContent: 'center',
  },
  doneBtnText: { fontSize: 13, fontWeight: '700', color: C.white },

  curriculumStrip: { flexShrink: 0, maxHeight: 44, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.white },
  curriculumStripContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  curriculumStep: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.cream,
  },
  curriculumStepDone:    { backgroundColor: C.moss,  borderColor: C.moss  },
  curriculumStepCurrent: { backgroundColor: C.ink,   borderColor: C.ink   },
  curriculumStepNum:     { fontSize: 11, fontWeight: '700', color: C.muted },
  curriculumStepNumDone:    { color: C.white },
  curriculumStepNumCurrent: { color: C.white },
  curriculumLabel: { fontSize: 11, fontWeight: '600', color: C.muted, marginLeft: 6 },

  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 14, paddingBottom: 32 },

  loadingWrap: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 14, color: C.muted },

  bloomBubble: {
    backgroundColor: C.white, borderRadius: 18, borderBottomLeftRadius: 6,
    padding: 16, borderWidth: 1, borderColor: C.border,
  },
  bloomText: { fontSize: 15, color: C.forest, lineHeight: 26 },

  userRow: { alignItems: 'flex-end' },
  userBubble: {
    backgroundColor: C.moss, borderRadius: 18, borderBottomRightRadius: 6,
    paddingVertical: 12, paddingHorizontal: 16, maxWidth: '80%',
  },
  userText: { fontSize: 15, color: C.white, lineHeight: 22 },

  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.cream,
  },
  input: {
    flex: 1, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 24, paddingVertical: 11, paddingHorizontal: 18,
    fontSize: 15, color: C.ink,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.moss, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { opacity: 0.3 },
});
