import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import PhotoCard from '../components/PhotoCard';
import { Button, Chip, EmptyState } from '../components/UI';
import { C, SPACING, FONT, RADIUS } from '../constants/theme';
import { useGame } from '../context/AppContext';
import { ENVIRONMENT_TILES, TIME_OF_DAY, SEASONS, WEATHER } from '../constants/catalog';

function CreateWorldModal({ visible, onClose, onCreate }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 700;
  const [name, setName] = useState('');
  const [envId, setEnvId] = useState(ENVIRONMENT_TILES[0].id);
  const [timeOfDay, setTimeOfDay] = useState('Golden Hour');
  const [season, setSeason] = useState('Summer');
  const [weather, setWeather] = useState('Clear');

  const submit = () => {
    const env = ENVIRONMENT_TILES.find(e => e.id === envId);
    onCreate(name.trim() || env.name, env, { timeOfDay, season, weather });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.modalBackdrop}>
        <View style={[s.modalCard, isDesktop && { width: 560 }]}>
          <View style={s.modalHeader}>
            <Text style={FONT.h2}>Create New World</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="x" size={20} color={C.textFaint} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 480 }}>
            <Text style={FONT.label}>WORLD NAME</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="My World"
              placeholderTextColor={C.textFaint}
              style={s.input}
            />

            <Text style={[FONT.label, { marginTop: SPACING.lg }]}>ENVIRONMENT</Text>
            <View style={s.envGrid}>
              {ENVIRONMENT_TILES.map(env => (
                <PhotoCard
                  key={env.id}
                  icon={env.icon}
                  accent={env.palette}
                  height={72}
                  title={env.name}
                  style={[s.envTile, envId === env.id && s.envTileActive]}
                  onPress={() => setEnvId(env.id)}
                />
              ))}
            </View>

            <Text style={[FONT.label, { marginTop: SPACING.lg }]}>TIME OF DAY</Text>
            <View style={s.chipRow}>{TIME_OF_DAY.map(t => <Chip key={t} label={t} active={timeOfDay === t} onPress={() => setTimeOfDay(t)} />)}</View>

            <Text style={[FONT.label, { marginTop: SPACING.md }]}>SEASON</Text>
            <View style={s.chipRow}>{SEASONS.map(t => <Chip key={t} label={t} active={season === t} onPress={() => setSeason(t)} />)}</View>

            <Text style={[FONT.label, { marginTop: SPACING.md }]}>WEATHER</Text>
            <View style={s.chipRow}>{WEATHER.map(t => <Chip key={t} label={t} active={weather === t} onPress={() => setWeather(t)} />)}</View>
          </ScrollView>

          <Button label="Create World" icon="sparkles" onPress={submit} style={{ marginTop: SPACING.lg }} />
        </View>
      </View>
    </Modal>
  );
}

export default function WorldsScreen({ navigation }) {
  const { worlds, createWorld, deleteWorld } = useGame();
  const [modalOpen, setModalOpen] = useState(false);

  const enterWorld = (world) => {
    const lot = world.lots[0];
    const room = lot.rooms[0];
    navigation.navigate('Play3D', { worldId: world.id, lotId: lot.id, roomId: room.id });
  };

  const handleCreate = (name, env, settings) => {
    const world = createWorld(name, env, settings);
    setModalOpen(false);
    enterWorld(world);
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={FONT.h2}>Your Worlds</Text>
        <View style={{ width: 20 }} />
      </View>

      {worlds.length === 0 ? (
        <EmptyState icon="home" title="No worlds yet" subtitle="Create your first world to start building." actionLabel="Create New World" onAction={() => setModalOpen(true)} />
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {worlds.map(w => (
            <TouchableOpacity key={w.id} activeOpacity={0.9} onPress={() => enterWorld(w)}>
              <PhotoCard icon={w.theme.icon} accent={w.theme.palette} height={140} title={w.name} subtitle={w.theme.name} style={{ marginBottom: SPACING.md }}>
                <TouchableOpacity style={s.deleteBtn} onPress={() => deleteWorld(w.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name="trash-2" size={15} color="#fff" />
                </TouchableOpacity>
              </PhotoCard>
            </TouchableOpacity>
          ))}
          <Button label="Create New World" icon="plus" variant="secondary" onPress={() => setModalOpen(true)} />
        </ScrollView>
      )}

      <CreateWorldModal visible={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  list: { padding: SPACING.lg, paddingBottom: SPACING.xxl, maxWidth: 700, width: '100%', alignSelf: 'center' },
  deleteBtn: { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  modalCard: { backgroundColor: C.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, width: '100%', maxWidth: 560 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  input: {
    backgroundColor: C.surfaceAlt, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border,
    padding: SPACING.md, fontSize: 15, color: C.text, marginTop: 6,
  },
  envGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: 6 },
  envTile: { width: '31%' },
  envTileActive: { borderWidth: 3, borderColor: C.accent },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
});
