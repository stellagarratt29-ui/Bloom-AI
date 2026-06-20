import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet,
} from 'react-native';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';

export default function IdeaBankScreen({ navigation }) {
  const { ideas, promoteIdea, deleteIdea } = useApp();

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Idea Bank</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.sub}>
          These ideas are safe here. No pressure — come back whenever you're ready.
        </Text>

        {ideas.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>🌱</Text>
            <Text style={s.emptyText}>
              No ideas yet. Tap 💡 on the home screen whenever inspiration strikes!
            </Text>
          </View>
        ) : (
          ideas.map(idea => (
            <View key={idea.id} style={s.card}>
              <Text style={s.ideaText}>{idea.text}</Text>
              <Text style={s.returnCond}>{idea.returnCondition}</Text>
              <View style={s.actions}>
                <TouchableOpacity style={s.promoteBtn} onPress={() => { promoteIdea(idea); navigation.goBack(); }}>
                  <Text style={s.promoteBtnText}>+ Add as task</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.deleteBtn} onPress={() => deleteIdea(idea.id)}>
                  <Text style={s.deleteBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  back: { paddingVertical: 4 },
  backText: { fontSize: 16, color: C.sage, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: C.forest },
  scroll: { paddingHorizontal: 22, paddingTop: 16 },
  sub: { fontSize: 14, color: C.muted, lineHeight: 21, marginBottom: 20, textAlign: 'center' },
  empty: { alignItems: 'center', paddingTop: 48 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 15, color: C.muted, textAlign: 'center', lineHeight: 22 },
  card: {
    backgroundColor: C.white, borderRadius: 16, padding: 18,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
  },
  ideaText: { fontSize: 16, color: C.forest, lineHeight: 24, marginBottom: 6 },
  returnCond: { fontSize: 13, color: C.sage, fontStyle: 'italic', marginBottom: 14 },
  actions: { flexDirection: 'row', gap: 10 },
  promoteBtn: {
    flex: 1, backgroundColor: C.sagePale, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: C.sageLight,
  },
  promoteBtnText: { fontSize: 14, fontWeight: '600', color: C.sage },
  deleteBtn: {
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 10, borderWidth: 1, borderColor: C.border,
  },
  deleteBtnText: { fontSize: 14, color: C.muted },
});
