import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet, Switch, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '../constants/colors';
import { BUDDIES } from '../constants/data';
import { useApp } from '../context/AppContext';
import BuddyAvatar from '../components/BuddyAvatar';
import { getApiKey, saveApiKey } from '../services/ai';

const LEVELS = [
  { min: 0,    label: 'Seedling',   icon: 'feather'   },
  { min: 50,   label: 'Sprout',     icon: 'sun'        },
  { min: 150,  label: 'Bloom',      icon: 'star'       },
  { min: 300,  label: 'Garden',     icon: 'wind'       },
  { min: 500,  label: 'Forest',     icon: 'layers'     },
  { min: 1000, label: 'Rainforest', icon: 'globe'      },
];
function getLevel(pts) {
  return LEVELS.slice().reverse().find(l => pts >= l.min) ?? LEVELS[0];
}

const TARGETS = [100, 250, 500];

export default function SettingsScreen({ navigation }) {
  const {
    userName, setUserName,
    buddy, setBuddy,
    monthlyGoalTarget, setMonthlyGoalTarget,
    momentum, totalPoints, currentStreak, tasksCompleted,
  } = useApp();

  const handleReset = () => {
    Alert.alert(
      'Reset Bloom?',
      'This will clear all your tasks, goals, points, and progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset everything',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('@bloom_v1');
            Alert.alert('Done', 'Bloom has been reset. Restart the app to start fresh.');
          },
        },
      ]
    );
  };

  const [nameInput, setNameInput]   = useState(userName);
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [saved, setSaved]           = useState(false);
  const [apiKey, setApiKey]         = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [showKey, setShowKey]       = useState(false);
  const [keyStatus, setKeyStatus]   = useState(null); // null | 'set' | 'cleared'

  React.useEffect(() => {
    getApiKey().then(k => { if (k) { setApiKey(k); setKeyStatus('set'); } });
  }, []);

  const handleSaveKey = async () => {
    await saveApiKey(apiKey);
    setKeyStatus(apiKey.trim() ? 'set' : 'cleared');
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2000);
  };

  const handleClearKey = async () => {
    await saveApiKey('');
    setApiKey('');
    setKeyStatus('cleared');
  };

  const handleSaveName = () => {
    setUserName(nameInput.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const lvl = getLevel(totalPoints ?? 0);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.sectionLabel}>YOUR PROFILE</Text>
        <View style={s.card}>
          <Text style={s.fieldLabel}>Your name</Text>
          <View style={s.nameRow}>
            <TextInput
              style={s.nameInput}
              placeholder="What should we call you?"
              placeholderTextColor={C.muted}
              value={nameInput}
              onChangeText={setNameInput}
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
            />
            <TouchableOpacity
              style={[s.saveBtn, !nameInput.trim() && s.saveBtnOff]}
              onPress={handleSaveName}
              disabled={!nameInput.trim()}
            >
              <Text style={s.saveBtnText}>{saved ? '✓' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.sectionLabel}>YOUR BUDDY</Text>
        <View style={s.card}>
          <Text style={s.fieldLabel}>Choose your companion</Text>
          <View style={s.buddyGrid}>
            {BUDDIES.map(b => {
              const active = buddy?.id === b.id;
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[s.buddyOption, active && { borderColor: b.color, backgroundColor: b.color + '18' }]}
                  onPress={() => setBuddy(b)}
                >
                  <BuddyAvatar buddy={b} momentum={momentum} size={52} />
                  <Text style={[s.buddyOptionName, active && { color: b.color }]}>{b.name}</Text>
                  <Text style={s.buddyOptionSub}>{b.subtitle}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={s.sectionLabel}>YOUR STATS</Text>
        <View style={s.card}>
          <View style={s.statsGrid}>
            <View style={s.statCell}>
              <Feather name={lvl.icon} size={22} color={C.forest} style={{ marginBottom: 4 }} />
              <Text style={s.statValue}>{lvl.label}</Text>
              <Text style={s.statLabel}>Level</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statCell}>
              <Feather name="zap" size={22} color={C.forest} style={{ marginBottom: 4 }} />
              <Text style={s.statValue}>{currentStreak ?? 0}</Text>
              <Text style={s.statLabel}>Day streak</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statCell}>
              <Feather name="check-circle" size={22} color={C.forest} style={{ marginBottom: 4 }} />
              <Text style={s.statValue}>{tasksCompleted ?? 0}</Text>
              <Text style={s.statLabel}>Done</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statCell}>
              <Feather name="trending-up" size={22} color={C.forest} style={{ marginBottom: 4 }} />
              <Text style={s.statValue}>{totalPoints ?? 0}</Text>
              <Text style={s.statLabel}>Points</Text>
            </View>
          </View>
        </View>

        <Text style={s.sectionLabel}>MONTHLY GOAL TARGET</Text>
        <View style={s.card}>
          <Text style={s.fieldLabel}>How many points are you aiming for?</Text>
          <View style={s.targetRow}>
            {TARGETS.map(t => {
              const active = monthlyGoalTarget === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[s.targetChip, active && s.targetChipActive]}
                  onPress={() => setMonthlyGoalTarget(t)}
                >
                  <Text style={[s.targetChipText, active && s.targetChipTextActive]}>{t} pts</Text>
                  <Text style={[s.targetChipSub, active && { color: C.white }]}>
                    {t === 100 ? 'Gentle' : t === 250 ? 'Balanced' : 'Ambitious'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={s.sectionLabel}>REMINDERS</Text>
        <View style={s.card}>
          <View style={s.switchRow}>
            <View style={s.switchLeft}>
              <Text style={s.switchLabel}>Morning nudge</Text>
              <Text style={s.switchSub}>A gentle reminder to start your day</Text>
            </View>
            <Switch
              value={notificationsOn}
              onValueChange={setNotificationsOn}
              trackColor={{ false: C.border, true: C.sageMid }}
              thumbColor={notificationsOn ? C.sage : C.muted}
            />
          </View>
          {notificationsOn && (
            <Text style={s.comingSoon}>Notification scheduling coming soon</Text>
          )}
        </View>

        <Text style={s.sectionLabel}>AI FEATURES</Text>
        <View style={s.card}>
          <View style={s.aiStatusRow}>
            <Feather
              name={keyStatus === 'set' ? 'check-circle' : 'circle'}
              size={16}
              color={keyStatus === 'set' ? C.sage : C.muted}
            />
            <Text style={[s.aiStatus, keyStatus === 'set' && { color: C.sage }]}>
              {keyStatus === 'set' ? 'AI connected' : 'AI not connected'}
            </Text>
          </View>
          <Text style={s.fieldLabel}>Anthropic API key</Text>
          <View style={s.keyRow}>
            <TextInput
              style={s.keyInput}
              placeholder="sk-ant-api03-…"
              placeholderTextColor={C.muted}
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowKey(v => !v)} style={s.eyeBtn}>
              <Feather name={showKey ? 'eye-off' : 'eye'} size={18} color={C.muted} />
            </TouchableOpacity>
          </View>
          <View style={s.keyActions}>
            <TouchableOpacity
              style={[s.saveBtn, !apiKey.trim() && s.saveBtnOff]}
              onPress={handleSaveKey}
              disabled={!apiKey.trim()}
            >
              <Text style={s.saveBtnText}>{apiKeySaved ? '✓ Saved' : 'Save key'}</Text>
            </TouchableOpacity>
            {keyStatus === 'set' && (
              <TouchableOpacity onPress={handleClearKey} style={s.clearKeyBtn}>
                <Text style={s.clearKeyText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={s.aiHint}>
            Get a free key at console.anthropic.com → API Keys.{'\n'}
            Your key is stored only on this device and is never shared.
          </Text>
          <View style={s.aiFeatureList}>
            <Text style={s.aiFeatureItem}>• Brain dump parsed by Claude (not just keywords)</Text>
            <Text style={s.aiFeatureItem}>• Real conversations with your buddy</Text>
            <Text style={s.aiFeatureItem}>• Personalised goal advice & plans</Text>
          </View>
        </View>

        <Text style={s.sectionLabel}>YOUR PLAN</Text>
        <View style={s.planCard}>
          <View style={s.planTop}>
            <Text style={s.planBadge}>FREE</Text>
            <Text style={s.planTitle}>Bloom Basic</Text>
          </View>
          <Text style={s.planDesc}>
            Task management, hobby growth, points system, and your buddy — all free, forever.
          </Text>
          <View style={s.premiumTeaser}>
            <Text style={s.premiumLabel}>Bloom Premium — coming soon</Text>
            <Text style={s.premiumItem}>• Real AI goal coaching</Text>
            <Text style={s.premiumItem}>• Buddy outfits & accessories</Text>
            <Text style={s.premiumItem}>• Weekly insights & patterns</Text>
            <Text style={s.premiumItem}>• Sprint ambient audio</Text>
          </View>
        </View>

        <Text style={s.appInfo}>Bloom v1.0 · Made with care</Text>
        <TouchableOpacity style={s.resetBtn} onPress={handleReset}>
          <Text style={s.resetBtnText}>Reset all data</Text>
        </TouchableOpacity>
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
  scroll: { paddingHorizontal: 22, paddingTop: 22 },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1.8, marginBottom: 10 },

  card: {
    backgroundColor: C.white, borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: C.border, marginBottom: 26,
  },
  fieldLabel: { fontSize: 13, color: C.muted, fontWeight: '500', marginBottom: 10 },

  nameRow: { flexDirection: 'row', gap: 8 },
  nameInput: {
    flex: 1, backgroundColor: C.cream, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14,
    fontSize: 15, color: C.forest,
  },
  saveBtn: { backgroundColor: C.sage, paddingHorizontal: 18, borderRadius: 12, justifyContent: 'center' },
  saveBtnOff: { opacity: 0.35 },
  saveBtnText: { color: C.white, fontWeight: '700', fontSize: 15 },

  statsGrid: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: C.forest, marginBottom: 2 },
  statLabel: { fontSize: 11, color: C.muted, fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: C.border, marginHorizontal: 4, alignSelf: 'stretch' },

  buddyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  buddyOption: {
    width: '47%', alignItems: 'center', padding: 14,
    backgroundColor: C.cream, borderRadius: 16,
    borderWidth: 2, borderColor: C.border,
  },
  buddyOptionName: { fontSize: 14, fontWeight: '700', color: C.forest, marginTop: 8 },
  buddyOptionSub: { fontSize: 11, color: C.muted, marginTop: 2 },

  targetRow: { flexDirection: 'row', gap: 8 },
  targetChip: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    backgroundColor: C.cream, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border,
  },
  targetChipActive: { backgroundColor: C.sage, borderColor: C.sage },
  targetChipText: { fontSize: 15, fontWeight: '700', color: C.forest },
  targetChipTextActive: { color: C.white },
  targetChipSub: { fontSize: 11, color: C.muted, marginTop: 3 },

  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLeft: { flex: 1, marginRight: 12 },
  switchLabel: { fontSize: 15, fontWeight: '600', color: C.forest },
  switchSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  comingSoon: { fontSize: 12, color: C.sage, fontStyle: 'italic', marginTop: 12 },

  planCard: {
    backgroundColor: C.white, borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: C.border, marginBottom: 26,
  },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  planBadge: {
    backgroundColor: C.sageLight, color: C.sage, fontSize: 10, fontWeight: '800',
    letterSpacing: 1.5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  planTitle: { fontSize: 17, fontWeight: '700', color: C.forest },
  planDesc: { fontSize: 13, color: C.muted, lineHeight: 20, marginBottom: 16 },
  premiumTeaser: {
    backgroundColor: C.peachPale, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.peachLight,
  },
  premiumLabel: { fontSize: 13, fontWeight: '700', color: C.peach, marginBottom: 8 },
  premiumItem: { fontSize: 13, color: C.forest, lineHeight: 22 },

  aiStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  aiStatus: { fontSize: 13, fontWeight: '600', color: C.muted },
  keyRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.cream, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, marginBottom: 10, paddingRight: 4,
  },
  keyInput: {
    flex: 1, fontSize: 14, color: C.forest,
    paddingVertical: 11, paddingHorizontal: 14,
  },
  eyeBtn: { padding: 10 },
  keyActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  clearKeyBtn: { padding: 8 },
  clearKeyText: { fontSize: 13, color: C.muted, textDecorationLine: 'underline' },
  aiHint: { fontSize: 12, color: C.muted, lineHeight: 18, marginBottom: 10 },
  aiFeatureList: { backgroundColor: C.sagePale, borderRadius: 10, padding: 12 },
  aiFeatureItem: { fontSize: 13, color: C.forest, lineHeight: 22 },

  appInfo: { fontSize: 12, color: C.muted, textAlign: 'center', marginBottom: 12 },
  resetBtn: { alignItems: 'center', paddingVertical: 10, marginBottom: 8 },
  resetBtnText: { fontSize: 13, color: C.muted, textDecorationLine: 'underline' },
});
