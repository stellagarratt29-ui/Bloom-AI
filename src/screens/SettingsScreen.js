import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet, Platform, Alert, Switch,
} from 'react-native';
import Icon from '../components/Icon';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { signInWithGoogle, signOutGoogle, hasClientId } from '../services/google';

export default function SettingsScreen({ navigation }) {
  const { googleUser, setGoogleUser, clearGoogleUser, clearAllData, userName } = useApp();
  const { colors: t, isDark, setDarkMode } = useTheme();
  const [connecting, setConnecting] = useState(false);

  const handleGoogleConnect = async () => {
    if (!hasClientId()) {
      Alert.alert('Not configured', 'Google sign-in is not set up in this build.');
      return;
    }
    setConnecting(true);
    try {
      const user = await signInWithGoogle();
      setGoogleUser(user);
    } catch (e) {
      if (e.message !== 'Cancelled') {
        Alert.alert('Sign-in failed', e.message);
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleGoogleDisconnect = () => {
    Alert.alert(
      'Disconnect Google',
      'Your calendar events will no longer appear in Bloom.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: clearGoogleUser },
      ],
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear all data',
      'This will delete all your tasks and life projects. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear everything', style: 'destructive', onPress: () => { clearAllData?.(); } },
      ],
    );
  };

  const displayName = googleUser?.name ?? userName ?? 'You';
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: t.border }]}>
        <Text style={[s.title, { color: t.text }]}>Settings</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="x" size={20} color={t.subtext} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Profile */}
        <View style={[s.section, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={s.profileRow}>
            <View style={[s.avatar, { backgroundColor: t.accentPale }]}>
              <Text style={[s.avatarText, { color: t.accent }]}>{initials}</Text>
            </View>
            <View style={s.profileInfo}>
              <Text style={[s.profileName, { color: t.text }]}>{displayName}</Text>
              {googleUser?.email ? (
                <Text style={[s.profileEmail, { color: t.subtext }]}>{googleUser.email}</Text>
              ) : (
                <Text style={[s.profileEmail, { color: t.muted }]}>Not signed in</Text>
              )}
            </View>
          </View>
        </View>

        <SectionLabel label="Integrations" color={t.muted} />

        {/* Google Calendar */}
        <View style={[s.section, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={s.row}>
            <View style={[s.iconBox, { backgroundColor: t.accentPale }]}>
              <Icon name="calendar" size={16} color={t.accent} />
            </View>
            <View style={s.rowBody}>
              <Text style={[s.rowTitle, { color: t.text }]}>Google Calendar</Text>
              <Text style={[s.rowSub, { color: t.subtext }]}>
                {googleUser ? `Connected as ${googleUser.email}` : 'See your events alongside tasks'}
              </Text>
            </View>
            {googleUser ? (
              <TouchableOpacity
                style={[s.chip, { backgroundColor: t.clayPale, borderColor: t.clay }]}
                onPress={handleGoogleDisconnect}
              >
                <Text style={[s.chipText, { color: t.clay }]}>Disconnect</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[s.chip, { backgroundColor: t.accentPale, borderColor: t.accent }]}
                onPress={handleGoogleConnect}
                disabled={connecting}
              >
                <Text style={[s.chipText, { color: t.accent }]}>
                  {connecting ? 'Connecting…' : 'Connect'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <SectionLabel label="Appearance" color={t.muted} />

        {/* Theme */}
        <View style={[s.section, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={s.row}>
            <View style={[s.iconBox, { backgroundColor: isDark ? t.accentPale : t.input }]}>
              <Icon name={isDark ? 'moon' : 'sun'} size={16} color={t.accent} />
            </View>
            <Text style={[s.rowTitle, { color: t.text, flex: 1 }]}>Appearance</Text>
            <View style={s.themeChips}>
              {[
                { label: 'Light', value: false },
                { label: 'Dark',  value: true  },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.label}
                  style={[
                    s.themeChip,
                    { borderColor: t.border },
                    isDark === opt.value && { backgroundColor: t.text, borderColor: t.text },
                  ]}
                  onPress={() => setDarkMode(opt.value)}
                >
                  <Text style={[
                    s.themeChipText,
                    { color: isDark === opt.value ? t.bg : t.subtext },
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <SectionLabel label="Data" color={t.muted} />

        {/* Clear data */}
        <View style={[s.section, { backgroundColor: t.card, borderColor: t.border }]}>
          <TouchableOpacity style={s.row} onPress={handleClearData} activeOpacity={0.7}>
            <View style={[s.iconBox, { backgroundColor: t.urgentPale }]}>
              <Icon name="trash-2" size={16} color={t.urgent} />
            </View>
            <View style={s.rowBody}>
              <Text style={[s.rowTitle, { color: t.urgent }]}>Clear all data</Text>
              <Text style={[s.rowSub, { color: t.muted }]}>Remove all tasks and projects</Text>
            </View>
            <Icon name="chevron-right" size={16} color={t.muted} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ label, color }) {
  return (
    <Text style={[s.sectionLabel, { color }]}>{label.toUpperCase()}</Text>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 0.5,
  },
  title: {
    fontSize: 22, fontWeight: '700', letterSpacing: -0.4,
    fontFamily: Platform.OS === 'web' ? '"Plus Jakarta Sans", system-ui, sans-serif' : undefined,
  },
  closeBtn: { padding: 4 },

  scroll:   { flex: 1 },
  content:  { paddingHorizontal: 20, paddingTop: 20 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.2,
    marginBottom: 8, marginLeft: 4, marginTop: 16,
  },

  section: {
    borderRadius: 14, borderWidth: 0.5, overflow: 'hidden', marginBottom: 4,
  },

  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700' },
  profileInfo: { flex: 1 },
  profileName:  { fontSize: 15, fontWeight: '600' },
  profileEmail: { fontSize: 12, marginTop: 2 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  iconBox: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '500' },
  rowSub:   { fontSize: 12, marginTop: 2 },

  chip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '600' },

  themeChips: { flexDirection: 'row', gap: 6 },
  themeChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1,
  },
  themeChipText: { fontSize: 12, fontWeight: '600' },
});
