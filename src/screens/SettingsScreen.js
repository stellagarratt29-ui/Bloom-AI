import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet, Platform, TextInput, Switch,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C, BG_THEMES } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const OCCUPATIONS = ['Student', 'Working', 'Both', 'Other'];
const AGE_RANGES  = ['Under 16', '16–18', '19–24', '25–34', '35–49', '50+'];

const BG_SWATCHES = [
  { key: 'cream',    label: 'Cream',    color: '#FBF7EF' },
  { key: 'lavender', label: 'Lavender', color: '#C9B8E8' },
  { key: 'mint',     label: 'Mint',     color: '#AEDCC4' },
  { key: 'sky',      label: 'Sky',      color: '#A8D4E8' },
  { key: 'pink',     label: 'Pink',     color: '#F2B9C4' },
];

const APP_VERSION = '1.0.0';

function SectionTitle({ children, t }) {
  return (
    <Text style={[s.sectionTitle, { color: t.text }]}>{children}</Text>
  );
}

function Row({ label, value, onPress, t, last }) {
  return (
    <TouchableOpacity
      style={[s.row, { borderBottomColor: t.border }, last && { borderBottomWidth: 0 }]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <Text style={[s.rowLabel, { color: t.text }]}>{label}</Text>
      <View style={s.rowRight}>
        {value ? <Text style={[s.rowValue, { color: t.subtext }]}>{value}</Text> : null}
        <Feather name="chevron-right" size={16} color={t.subtext} />
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { userName, setUserName, userAge, setUserAge, userOccupation, setUserOccupation, resetOnboarding } = useApp();
  const { bgTheme, setBgTheme, isDark, setDarkMode, colors: t } = useTheme();

  const [editProfile, setEditProfile] = useState(false);
  const [draftName,   setDraftName]   = useState(userName);
  const [draftAge,    setDraftAge]    = useState(userAge);
  const [draftOcc,    setDraftOcc]    = useState(userOccupation);
  const [showReset,   setShowReset]   = useState(false);

  const saveProfile = () => {
    setUserName(draftName.trim());
    setUserAge(draftAge);
    setUserOccupation(draftOcc);
    setEditProfile(false);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={[s.title, { color: C.ink }]}>Settings</Text>

        {/* 2a Profile */}
        <SectionTitle t={t}>Profile</SectionTitle>
        <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
          {!editProfile ? (
            <>
              <Row label="Name"       value={userName || 'Not set'}     onPress={() => { setDraftName(userName); setDraftAge(userAge); setDraftOcc(userOccupation); setEditProfile(true); }} t={t} />
              <Row label="Age range"  value={userAge || 'Not set'}      onPress={() => { setDraftName(userName); setDraftAge(userAge); setDraftOcc(userOccupation); setEditProfile(true); }} t={t} />
              <Row label="Occupation" value={userOccupation || 'Not set'} onPress={() => { setDraftName(userName); setDraftAge(userAge); setDraftOcc(userOccupation); setEditProfile(true); }} t={t} last />
            </>
          ) : (
            <View style={s.editBlock}>
              <Text style={[s.editLabel, { color: t.subtext }]}>NAME</Text>
              <TextInput
                style={[s.editInput, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
                value={draftName}
                onChangeText={setDraftName}
                placeholder="Your name"
                placeholderTextColor={t.subtext}
                autoFocus
              />

              <Text style={[s.editLabel, { color: t.subtext }]}>AGE RANGE</Text>
              <View style={s.chipRow}>
                {AGE_RANGES.map(a => (
                  <TouchableOpacity
                    key={a}
                    style={[s.chip, { borderColor: t.border, backgroundColor: t.bg }, draftAge === a && s.chipActive]}
                    onPress={() => setDraftAge(a === draftAge ? '' : a)}
                  >
                    <Text style={[s.chipText, { color: t.subtext }, draftAge === a && { color: C.moss }]}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[s.editLabel, { color: t.subtext }]}>OCCUPATION</Text>
              <View style={s.chipRow}>
                {OCCUPATIONS.map(o => (
                  <TouchableOpacity
                    key={o}
                    style={[s.chip, { borderColor: t.border, backgroundColor: t.bg }, draftOcc === o && s.chipActive]}
                    onPress={() => setDraftOcc(o === draftOcc ? '' : o)}
                  >
                    <Text style={[s.chipText, { color: t.subtext }, draftOcc === o && { color: C.moss }]}>{o}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={s.editActions}>
                <TouchableOpacity style={[s.cancelBtn, { borderColor: t.border }]} onPress={() => setEditProfile(false)}>
                  <Text style={[s.cancelBtnText, { color: t.subtext }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={saveProfile}>
                  <Text style={s.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* 2b Background */}
        <SectionTitle t={t}>Background</SectionTitle>
        <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={s.swatchRow}>
            {BG_SWATCHES.map(sw => (
              <TouchableOpacity
                key={sw.key}
                style={[s.swatch, { backgroundColor: sw.color }, bgTheme === sw.key && s.swatchActive]}
                onPress={() => setBgTheme(sw.key)}
              >
                {bgTheme === sw.key && (
                  <Feather name="check" size={16} color={sw.key === 'cream' ? C.ink : '#fff'} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.swatchLabels}>
            {BG_SWATCHES.map(sw => (
              <Text key={sw.key} style={[s.swatchLabel, { color: t.subtext }, bgTheme === sw.key && { color: t.text, fontWeight: '700' }]}>
                {sw.label}
              </Text>
            ))}
          </View>
        </View>

        {/* 2c Display mode */}
        <SectionTitle t={t}>Display</SectionTitle>
        <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={s.switchRow}>
            <View>
              <Text style={[s.switchLabel, { color: t.text }]}>Dark mode</Text>
              <Text style={[s.switchSub, { color: t.subtext }]}>Warm dark palette, same personality</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={setDarkMode}
              trackColor={{ false: C.border, true: C.moss }}
              thumbColor={C.white}
            />
          </View>
        </View>

        {/* 2d About / Reset */}
        <SectionTitle t={t}>About</SectionTitle>
        <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={[s.row, { borderBottomColor: t.border }]}>
            <Text style={[s.rowLabel, { color: t.text }]}>Version</Text>
            <Text style={[s.rowValue, { color: t.subtext }]}>{APP_VERSION}</Text>
          </View>
          {!showReset ? (
            <TouchableOpacity
              style={[s.row, { borderBottomWidth: 0 }]}
              onPress={() => setShowReset(true)}
            >
              <Text style={[s.rowLabel, { color: '#B83A55' }]}>Reset onboarding</Text>
            </TouchableOpacity>
          ) : (
            <View style={[s.row, { borderBottomWidth: 0, flexDirection: 'column', alignItems: 'flex-start', gap: 10 }]}>
              <Text style={[s.rowLabel, { color: t.text }]}>This will clear your name, age, and occupation. Are you sure?</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={[s.smallBtn, { backgroundColor: '#B83A55' }]} onPress={resetOnboarding}>
                  <Text style={s.smallBtnText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.smallBtn, { backgroundColor: t.bg, borderWidth: 1, borderColor: t.border }]} onPress={() => setShowReset(false)}>
                  <Text style={[s.smallBtnText, { color: t.subtext }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingHorizontal: 22, paddingTop: 22 },

  title: {
    fontSize: 30, fontWeight: '800', marginBottom: 24,
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined,
  },

  sectionTitle: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.4,
    marginBottom: 10, marginTop: 8,
  },

  card: {
    borderRadius: 18, borderWidth: 1,
    marginBottom: 22, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },

  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 15,
    borderBottomWidth: 1,
  },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowValue: { fontSize: 14 },

  editBlock: { padding: 18, gap: 0 },
  editLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8, marginTop: 14 },
  editInput: {
    borderWidth: 1.5, borderRadius: 12,
    paddingVertical: 11, paddingHorizontal: 14,
    fontSize: 15, marginBottom: 4,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 4 },
  chip: {
    paddingVertical: 7, paddingHorizontal: 13, borderRadius: 18,
    borderWidth: 1.5,
  },
  chipActive: { borderColor: C.moss, backgroundColor: C.sagePale },
  chipText: { fontSize: 13, fontWeight: '600' },

  editActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600' },
  saveBtn: {
    flex: 2, paddingVertical: 12, borderRadius: 10,
    backgroundColor: C.moss, alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: C.white },

  swatchRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingTop: 18, paddingHorizontal: 14,
  },
  swatch: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  swatchActive: {
    borderWidth: 2.5, borderColor: C.ink,
  },
  swatchLabels: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingTop: 8, paddingBottom: 18, paddingHorizontal: 14,
  },
  swatchLabel: { fontSize: 10, fontWeight: '500', textAlign: 'center', width: 44 },

  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 16,
  },
  switchLabel: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
  switchSub:   { fontSize: 12 },

  smallBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  smallBtnText: { fontSize: 13, fontWeight: '700', color: C.white },
});
