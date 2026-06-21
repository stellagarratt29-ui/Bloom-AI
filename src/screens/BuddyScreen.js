import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet,
} from 'react-native';
import { C } from '../constants/colors';
import { BUDDIES } from '../constants/data';
import { useApp } from '../context/AppContext';

const BOUTIQUE_ITEMS = [
  { emoji: '🍄', label: 'Lamp',   pts: 50  },
  { emoji: '🌻', label: 'Flower', pts: 80  },
  { emoji: '🌿', label: 'Plant',  pts: 60  },
];

function SproutIllustration() {
  return (
    <View style={ill.wrap}>
      <View style={ill.ground} />
      <View style={ill.stem} />
      <View style={ill.leaf1} />
      <View style={ill.leaf2} />
      <View style={ill.sprout} />
    </View>
  );
}

const ill = StyleSheet.create({
  wrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'flex-end' },
  ground: {
    position: 'absolute', bottom: 0,
    width: 100, height: 20, borderRadius: 50,
    backgroundColor: '#D6E8D4',
  },
  stem: {
    position: 'absolute', bottom: 18,
    width: 6, height: 60, borderRadius: 3,
    backgroundColor: '#5A8C6A',
  },
  leaf1: {
    position: 'absolute', bottom: 50, left: 30,
    width: 32, height: 18, borderRadius: 50,
    backgroundColor: '#7EBD8C',
    transform: [{ rotate: '-30deg' }],
  },
  leaf2: {
    position: 'absolute', bottom: 60, right: 28,
    width: 28, height: 16, borderRadius: 50,
    backgroundColor: '#9DCCA8',
    transform: [{ rotate: '25deg' }],
  },
  sprout: {
    position: 'absolute', bottom: 74,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#5A8C6A',
  },
});

export default function BuddyScreen({ navigation }) {
  const { buddy, setBuddy, totalPoints, momentum } = useApp();

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.headerRow}>
          <Text style={s.label}>BUDDY</Text>
          <TouchableOpacity style={s.settingsBtn} onPress={() => navigation.navigate('Settings')}>
            <Text style={s.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Buddy room */}
        <View style={s.roomCard}>
          <Text style={s.buddyName}>{buddy?.name ?? 'Sprout'}</Text>
          <Text style={s.buddySub}>Your companion's cozy room.</Text>
          <View style={s.roomScene}>
            <SproutIllustration />
          </View>
        </View>

        {/* Bloom Chat */}
        <TouchableOpacity style={s.chatBtn} onPress={() => navigation.navigate('BloomChat')}>
          <Text style={s.chatBtnEmoji}>💬</Text>
          <View style={s.chatBtnText}>
            <Text style={s.chatBtnTitle}>Bloom Chat</Text>
            <Text style={s.chatBtnSub}>Ask Bloom anything</Text>
          </View>
          <Text style={s.chatBtnArrow}>→</Text>
        </TouchableOpacity>

        {/* Boutique */}
        <Text style={s.boutiqueLabel}>BOUTIQUE</Text>
        <View style={s.boutiqueRow}>
          {BOUTIQUE_ITEMS.map(item => (
            <View key={item.label} style={s.boutiqueItem}>
              <Text style={s.boutiqueEmoji}>{item.emoji}</Text>
              <Text style={s.boutiqueItemName}>{item.label}</Text>
              <Text style={s.boutiquePts}>{item.pts} pts</Text>
            </View>
          ))}
        </View>

        {/* Switch companion */}
        <Text style={s.switchLabel}>SWITCH COMPANION</Text>
        <View style={s.buddyGrid}>
          {BUDDIES.map(b => (
            <TouchableOpacity
              key={b.id}
              style={[s.buddyCard, buddy?.id === b.id && s.buddyCardActive]}
              onPress={() => setBuddy(b)}
            >
              <Text style={s.buddyCardEmoji}>{b.emoji ?? '🌱'}</Text>
              <Text style={[s.buddyCardName, buddy?.id === b.id && s.buddyCardNameActive]}>
                {b.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.cream },
  scroll: { paddingHorizontal: 22, paddingTop: 20 },

  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 16,
  },
  label: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 2 },
  settingsBtn: { padding: 6 },
  settingsIcon: { fontSize: 20 },

  roomCard: {
    backgroundColor: C.white, borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
    padding: 24, alignItems: 'center', marginBottom: 16,
  },
  buddyName: { fontSize: 28, fontWeight: '700', color: C.forest, marginBottom: 4 },
  buddySub: { fontSize: 14, color: C.muted, marginBottom: 24 },
  roomScene: {
    width: '100%', height: 140,
    backgroundColor: '#F5F0E8', borderRadius: 16,
    alignItems: 'center', justifyContent: 'flex-end',
    paddingBottom: 16,
  },

  chatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.forest, borderRadius: 16,
    padding: 18, marginBottom: 24,
  },
  chatBtnEmoji: { fontSize: 22 },
  chatBtnText: { flex: 1 },
  chatBtnTitle: { fontSize: 16, fontWeight: '700', color: C.white },
  chatBtnSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  chatBtnArrow: { fontSize: 18, color: C.white },

  boutiqueLabel: {
    fontSize: 11, fontWeight: '700', color: C.muted,
    letterSpacing: 1.6, marginBottom: 12,
  },
  boutiqueRow: {
    flexDirection: 'row', gap: 10, marginBottom: 28,
  },
  boutiqueItem: {
    flex: 1, backgroundColor: C.white, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    paddingVertical: 16, alignItems: 'center', gap: 4,
  },
  boutiqueEmoji: { fontSize: 26 },
  boutiqueItemName: { fontSize: 12, fontWeight: '600', color: C.forest },
  boutiquePts: { fontSize: 11, color: C.muted },

  switchLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1.6, marginBottom: 12 },
  buddyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  buddyCard: {
    width: '47.5%', alignItems: 'center', padding: 16,
    backgroundColor: C.white, borderRadius: 16,
    borderWidth: 2, borderColor: C.border,
  },
  buddyCardActive: { borderColor: C.forest, backgroundColor: '#EAF0E8' },
  buddyCardEmoji: { fontSize: 32, marginBottom: 6 },
  buddyCardName: { fontSize: 14, fontWeight: '700', color: C.forest },
  buddyCardNameActive: { color: C.forest },
});
