import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { ScreenHeader, Chip, EmptyState } from '../components/UI';
import { C, SPACING, FONT, RADIUS } from '../constants/theme';
import { useGame } from '../context/AppContext';

export default function InspirationBoardScreen({ navigation }) {
  const { boards, addBoard, removeFromBoard } = useGame();
  const [activeBoardId, setActiveBoardId] = useState(boards[0]?.id);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const board = boards.find(b => b.id === activeBoardId) || boards[0];

  const createBoard = () => {
    if (!name.trim()) return;
    const id = addBoard(name.trim());
    setActiveBoardId(id);
    setName('');
    setCreating(false);
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScreenHeader title="Inspiration Boards" onBack={() => navigation.canGoBack() && navigation.goBack()} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow}>
        {boards.map(b => <Chip key={b.id} label={b.name} active={activeBoardId === b.id} onPress={() => setActiveBoardId(b.id)} />)}
        <TouchableOpacity onPress={() => setCreating(v => !v)} style={s.addChip}>
          <Icon name="plus" size={14} color={C.accent} />
        </TouchableOpacity>
      </ScrollView>

      {creating && (
        <View style={s.newBoardRow}>
          <TextInput value={name} onChangeText={setName} placeholder="Board name" placeholderTextColor={C.textFaint} style={s.input} onSubmitEditing={createBoard} />
          <TouchableOpacity onPress={createBoard} style={s.createBtn}><Icon name="check" size={16} color={C.textOnAccent} /></TouchableOpacity>
        </View>
      )}

      {!board || board.items.length === 0 ? (
        <EmptyState icon="bookmark" title="Nothing saved yet" subtitle="Save rooms, homes, and layouts from Explore or Inspiration to organize your ideas here." />
      ) : (
        <ScrollView contentContainerStyle={s.grid}>
          {board.items.map(item => (
            <View key={item.id} style={s.card}>
              <View style={[s.thumb, { backgroundColor: (item.accent || C.accent) + '22' }]}>
                <Icon name="home" size={24} color={item.accent || C.accent} />
              </View>
              <Text style={FONT.h3} numberOfLines={1}>{item.title}</Text>
              <Text style={FONT.bodyMuted} numberOfLines={1}>{item.category}</Text>
              <TouchableOpacity onPress={() => removeFromBoard(board.id, item.id)} style={s.removeBtn}>
                <Icon name="x" size={14} color={C.textFaint} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  chipRow: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  addChip: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  newBoardRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, marginBottom: SPACING.md, gap: 8 },
  input: { flex: 1, backgroundColor: C.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, paddingHorizontal: SPACING.md, paddingVertical: 8, color: C.text },
  createBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  grid: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl, flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  card: { width: '47%', backgroundColor: C.surface, borderRadius: RADIUS.lg, padding: SPACING.md },
  thumb: { height: 80, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  removeBtn: { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
});
