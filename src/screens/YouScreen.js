import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, SafeAreaView, StyleSheet, Platform, Switch,
} from 'react-native';
import { saveApiKey } from '../services/ai';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import Icon from '../components/Icon';

export default function YouScreen() {
  const { userName, setUserName, points } = useApp();
  const { colors: t, isDark, setDarkMode } = useTheme();

  const [editingName, setEditingName] = useState(false);
  const [nameInput,   setNameInput]   = useState(userName ?? '');
  const [apiKey,      setApiKey]      = useState('');
  const [apiVisible,  setApiVisible]  = useState(false);
  const [apiSaved,    setApiSaved]    = useState(false);

  const saveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) setUserName(trimmed);
    setEditingName(false);
  };

  const handleSaveApiKey = async () => {
    await saveApiKey(apiKey.trim());
    setApiSaved(true);
    setTimeout(() => setApiSaved(false), 2500);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={[s.title, { color: t.text, fontFamily: Platform.OS === 'web' ? '"Outfit", system-ui, sans-serif' : undefined }]}>
            You
          </Text>
          <Text style={[s.subtitle, { color: t.subtext }]}>Settings & preferences.</Text>
        </View>

        {/* Points */}
        <View style={[s.pointsBanner, { backgroundColor: t.accentPale }]}>
          <View style={[s.pointsDot, { backgroundColor: t.accent }]} />
          <Text style={[s.pointsLabel, { color: t.subtext }]}>Points earned</Text>
          <Text style={[s.pointsValue, { color: t.accent, fontFamily: Platform.OS === 'web' ? '"Outfit", system-ui, sans-serif' : undefined }]}>
            {points ?? 0}
          </Text>
        </View>

        {/* Name */}
        <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <Text style={[s.cardLabel, { color: t.muted }]}>Name</Text>
          {editingName ? (
            <View style={s.nameRow}>
              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
                style={[s.nameInput, { color: t.text, borderColor: t.accent }]}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={saveName}
                placeholderTextColor={t.muted}
                placeholder="Your name"
              />
              <TouchableOpacity onPress={saveName} style={[s.saveBtn, { backgroundColor: t.text }]}>
                <Text style={[s.saveBtnText, { color: t.bg }]}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={s.nameRow}
              onPress={() => { setNameInput(userName ?? ''); setEditingName(true); }}
            >
              <Text style={[s.nameValue, { color: userName ? t.text : t.muted }]}>
                {userName || 'Tap to set your name'}
              </Text>
              <Icon name="edit-2" size={14} color={t.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Dark mode */}
        <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={s.row}>
            <View>
              <Text style={[s.cardLabel, { color: t.muted }]}>Appearance</Text>
              <Text style={[s.rowValue, { color: t.text }]}>{isDark ? 'Dark' : 'Light'}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={setDarkMode}
              trackColor={{ false: t.border, true: t.accentLight }}
              thumbColor={isDark ? t.accent : t.card}
            />
          </View>
        </View>

        {/* Claude API Key */}
        <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <Text style={[s.cardLabel, { color: t.muted }]}>Claude API Key</Text>
          <Text style={[s.cardMeta, { color: t.subtext }]}>
            Powers the AI chat. Get a free key at{' '}
            <Text style={{ color: t.accent }}>console.anthropic.com</Text>
            {' '}→ API Keys. Key starts with sk-ant-
          </Text>
          <View style={s.apiRow}>
            <TextInput
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="sk-ant-..."
              placeholderTextColor={t.muted}
              secureTextEntry={!apiVisible}
              style={[s.apiInput, { color: t.text, backgroundColor: t.bg, borderColor: t.border }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setApiVisible(v => !v)} style={s.eyeBtn}>
              <Icon name={apiVisible ? 'eye-off' : 'eye'} size={16} color={t.muted} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={handleSaveApiKey}
            style={[
              s.saveApiBtn,
              { backgroundColor: apiSaved ? t.accentPale : t.text },
            ]}
            disabled={!apiKey.trim()}
          >
            <Text style={[s.saveApiBtnText, { color: apiSaved ? t.accent : t.bg }]}>
              {apiSaved ? '✓ Saved' : 'Save key'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <Text style={[s.cardLabel, { color: t.muted }]}>About</Text>
          <Text style={[s.aboutText, { color: t.subtext }]}>
            Built for the 2.5-hour scroll spiral.{'\n\n'}
            Open this instead. Tasks adapt to your mood. Voice input. No streaks, no guilt — just forward.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },

  header:   { marginBottom: 24 },
  title:    { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },

  pointsBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, padding: 16, marginBottom: 14,
  },
  pointsDot:   { width: 8, height: 8, borderRadius: 4 },
  pointsLabel: { flex: 1, fontSize: 13, fontWeight: '500' },
  pointsValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },

  card: {
    borderRadius: 16, borderWidth: 1,
    padding: 18, marginBottom: 12,
  },
  cardLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },
  cardMeta:  { fontSize: 13, lineHeight: 20, marginBottom: 14 },

  nameRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nameValue: { flex: 1, fontSize: 17, fontWeight: '500' },
  nameInput: {
    flex: 1, fontSize: 17, fontWeight: '500',
    borderBottomWidth: 1.5, paddingBottom: 4,
    outlineStyle: 'none',
  },
  saveBtn: {
    paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20,
  },
  saveBtnText: { fontWeight: '700', fontSize: 13 },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowValue: { fontSize: 16, fontWeight: '500', marginTop: 2 },

  apiRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  apiInput: {
    flex: 1, fontSize: 14,
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    outlineStyle: 'none',
  },
  eyeBtn: { padding: 8 },
  saveApiBtn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  saveApiBtnText: { fontSize: 14, fontWeight: '700' },

  aboutText: { fontSize: 13, lineHeight: 20 },
});
