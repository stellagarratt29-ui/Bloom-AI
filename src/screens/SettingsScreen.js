import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet, Platform, TextInput, Switch,
} from 'react-native';
import Icon from '../components/Icon';
import { C, BG_THEMES } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { getApiKey, saveApiKey } from '../services/ai';

const OCCUPATIONS = ['Student', 'Working', 'Both', 'Other'];
const AGE_RANGES  = ['Under 16', '16–18', '19–24', '25–34', '35–49', '50+'];

const BG_SWATCHES = [
  { key: 'cream',    label: 'Petal',  color: '#ECC4D4' },
  { key: 'lavender', label: 'Lilac',  color: '#C0A8E0' },
  { key: 'mint',     label: 'Sage',   color: '#A4C4B0' },
  { key: 'sky',      label: 'Sky',    color: '#A8BCDC' },
  { key: 'pink',     label: 'Blush',  color: '#ECA8BE' },
];

const ND_TOGGLES_DEF = [
  {
    key: 'autoBreakTasks',
    label: 'Break tasks into smaller steps',
    sub: 'Simple tasks auto-split into 2–3 tiny steps.',
  },
  {
    key: 'ideaCapture',
    label: 'Prominent idea capture',
    sub: 'Quick-capture button stays visible so mid-task ideas never get lost.',
  },
  {
    key: 'timeBuffers',
    label: 'Extra time buffers',
    sub: 'Time estimates padded more generously by default.',
  },
  {
    key: 'reducedClutter',
    label: 'Reduced visual clutter',
    sub: 'Simpler view for Tasks and Goals with more whitespace.',
  },
  {
    key: 'gentlerLanguage',
    label: 'Gentler language for missed tasks',
    sub: 'Extra-soft copy when something doesn\'t get done.',
  },
];

const APP_VERSION = '1.0.0';

function SectionTitle({ children, t }) {
  return <Text style={[s.sectionTitle, { color: t.text }]}>{children}</Text>;
}

function Row({ label, value, onPress, t, last, danger }) {
  return (
    <TouchableOpacity
      style={[s.row, { borderBottomColor: t.border }, last && { borderBottomWidth: 0 }]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <Text style={[s.rowLabel, { color: danger ? '#B83A55' : t.text }]}>{label}</Text>
      <View style={s.rowRight}>
        {value ? <Text style={[s.rowValue, { color: t.subtext }]}>{value}</Text> : null}
        {onPress && !danger && <Icon name="chevron-right" size={16} color={t.subtext} />}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const {
    userName, setUserName, userAge, setUserAge,
    userOccupation, setUserOccupation, resetOnboarding,
    ndSupport, ndToggles, updateNdToggles,
    openTutorial,
  } = useApp();
  const { bgTheme, setBgTheme, isDark, setDarkMode, colors: t } = useTheme();

  const [editProfile, setEditProfile] = useState(false);
  const [draftName,   setDraftName]   = useState(userName);
  const [draftAge,    setDraftAge]    = useState(userAge);
  const [draftOcc,    setDraftOcc]    = useState(userOccupation);
  const [showReset,   setShowReset]   = useState(false);

  const [currentKey,  setCurrentKey]  = useState(null);
  const [draftKey,    setDraftKey]    = useState('');
  const [editingKey,  setEditingKey]  = useState(false);
  const [keySaved,    setKeySaved]    = useState(false);

  useEffect(() => {
    getApiKey().then(k => { setCurrentKey(k); });
  }, []);

  const handleSaveKey = async () => {
    await saveApiKey(draftKey);
    const updated = await getApiKey();
    setCurrentKey(updated);
    setEditingKey(false);
    setDraftKey('');
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2500);
  };

  const handleRemoveKey = async () => {
    await saveApiKey('');
    setCurrentKey(null);
    setEditingKey(false);
    setDraftKey('');
  };

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

        {/* Profile */}
        <SectionTitle t={t}>Profile</SectionTitle>
        <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
          {!editProfile ? (
            <>
              <Row label="Name"       value={userName || 'Not set'}       onPress={() => { setDraftName(userName); setDraftAge(userAge); setDraftOcc(userOccupation); setEditProfile(true); }} t={t} />
              <Row label="Age range"  value={userAge || 'Not set'}        onPress={() => { setDraftName(userName); setDraftAge(userAge); setDraftOcc(userOccupation); setEditProfile(true); }} t={t} />
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

        {/* AI Connection */}
        <SectionTitle t={t}>AI Connection</SectionTitle>
        <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={s.apiBlock}>
            {/* Status row */}
            <View style={s.apiStatusRow}>
              <View style={[s.apiDot, { backgroundColor: currentKey ? C.moss : C.clay }]} />
              <Text style={[s.apiStatusText, { color: t.text }]}>
                {currentKey ? 'Claude API connected' : 'No API key — using limited fallback'}
              </Text>
            </View>

            {!editingKey ? (
              <>
                <Text style={[s.apiSub, { color: t.subtext }]}>
                  {currentKey
                    ? 'Bloom is using real AI for chat, task sorting, and guidance.'
                    : 'Without a key, Bloom uses basic pattern matching. Tasks extracted from stream-of-consciousness messages may be incomplete.'}
                </Text>
                <View style={s.apiButtonRow}>
                  <TouchableOpacity
                    style={[s.apiBtn, { backgroundColor: C.moss }]}
                    onPress={() => { setDraftKey(''); setEditingKey(true); }}
                  >
                    <Text style={s.apiBtnText}>{currentKey ? 'Change key' : 'Add API key'}</Text>
                  </TouchableOpacity>
                  {currentKey && (
                    <TouchableOpacity
                      style={[s.apiBtn, { backgroundColor: t.bg, borderWidth: 1, borderColor: t.border }]}
                      onPress={handleRemoveKey}
                    >
                      <Text style={[s.apiBtnText, { color: '#B83A55' }]}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {keySaved && (
                  <Text style={[s.apiSaved, { color: C.moss }]}>Key saved — AI features unlocked.</Text>
                )}
                {!currentKey && (
                  <Text style={[s.apiHint, { color: t.subtext }]}>
                    Get a free key at openrouter.ai — sign up with email, go to Keys, click "Create key", copy and paste it here. No card needed.
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text style={[s.apiSub, { color: t.subtext }]}>
                  Paste your Claude API key below. It's stored only on this device.
                </Text>
                <TextInput
                  style={[s.apiInput, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
                  value={draftKey}
                  onChangeText={setDraftKey}
                  placeholder="sk-or-..."
                  placeholderTextColor={t.subtext}
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={false}
                />
                <View style={s.apiButtonRow}>
                  <TouchableOpacity
                    style={[s.apiBtn, { backgroundColor: C.moss }, !draftKey.trim() && { opacity: 0.4 }]}
                    onPress={handleSaveKey}
                    disabled={!draftKey.trim()}
                  >
                    <Text style={s.apiBtnText}>Save key</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.apiBtn, { backgroundColor: t.bg, borderWidth: 1, borderColor: t.border }]}
                    onPress={() => setEditingKey(false)}
                  >
                    <Text style={[s.apiBtnText, { color: t.subtext }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Support preferences (show if nd was answered) */}
        {ndSupport === 'yes' && (
          <>
            <SectionTitle t={t}>Support preferences</SectionTitle>
            <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
              {ND_TOGGLES_DEF.map(({ key, label, sub }, i) => (
                <View
                  key={key}
                  style={[
                    s.ndRow,
                    { borderBottomColor: t.border },
                    i === ND_TOGGLES_DEF.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={s.ndRowText}>
                    <Text style={[s.ndLabel, { color: t.text }]}>{label}</Text>
                    <Text style={[s.ndSub, { color: t.subtext }]}>{sub}</Text>
                  </View>
                  <Switch
                    value={!!ndToggles?.[key]}
                    onValueChange={v => updateNdToggles({ [key]: v })}
                    trackColor={{ false: C.border, true: C.moss }}
                    thumbColor={C.white}
                  />
                </View>
              ))}
            </View>
          </>
        )}

        {/* Background */}
        <SectionTitle t={t}>Background</SectionTitle>
        <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={s.swatchRow}>
            {BG_SWATCHES.map(sw => (
              <TouchableOpacity
                key={sw.key}
                style={[s.swatch, { backgroundColor: sw.color }, bgTheme === sw.key && s.swatchActive]}
                onPress={() => setBgTheme(sw.key)}
              >
                {bgTheme === sw.key && <Icon name="check" size={16} color="#fff" />}
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

        {/* Display */}
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

        {/* Screen Time */}
        <SectionTitle t={t}>Screen Time</SectionTitle>
        <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={{ paddingHorizontal: 18, paddingVertical: 16, gap: 10 }}>
            <Text style={[s.rowLabel, { color: t.text }]}>Apple Screen Time</Text>
            <Text style={[s.ndSub, { color: t.subtext }]}>
              Real screen time data uses Apple's DeviceActivity framework — a native iOS feature. The web version of Bloom can't access this data.
            </Text>
            <Text style={[s.ndSub, { color: t.subtext }]}>
              When Bloom is built as a native iOS app and approved for Apple's Family Controls entitlement, this section will show your real usage automatically.
            </Text>
            <View style={[{ borderRadius: 10, padding: 12, marginTop: 4 }, { backgroundColor: t.bg }]}>
              <Text style={[s.sectionTitle, { color: t.subtext, marginBottom: 6, marginTop: 0 }]}>FOR THE DEVELOPER (STELLA)</Text>
              <Text style={[s.ndSub, { color: t.subtext }]}>
                In Xcode: Signing & Capabilities → add "Family Controls". Then submit for Apple entitlement review with a written justification. This is a one-time step before App Store submission.
              </Text>
            </View>
          </View>
        </View>

        {/* About */}
        <SectionTitle t={t}>About</SectionTitle>
        <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={[s.row, { borderBottomColor: t.border }]}>
            <Text style={[s.rowLabel, { color: t.text }]}>Version</Text>
            <Text style={[s.rowValue, { color: t.subtext }]}>{APP_VERSION}</Text>
          </View>
          <TouchableOpacity
            style={[s.row, { borderBottomColor: t.border }]}
            onPress={openTutorial}
            activeOpacity={0.6}
          >
            <Text style={[s.rowLabel, { color: t.text }]}>How to Use</Text>
            <View style={s.rowRight}>
              <Icon name="chevron-right" size={16} color={t.subtext} />
            </View>
          </TouchableOpacity>
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

  // ND toggles
  ndRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1, gap: 12,
  },
  ndRowText: { flex: 1 },
  ndLabel:   { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  ndSub:     { fontSize: 12, lineHeight: 17 },

  swatchRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingTop: 18, paddingHorizontal: 14,
  },
  swatch: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  swatchActive: { borderWidth: 3, borderColor: C.mossDark },
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

  apiBlock: { padding: 18, gap: 10 },
  apiStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  apiDot: { width: 9, height: 9, borderRadius: 5 },
  apiStatusText: { fontSize: 14, fontWeight: '600' },
  apiSub: { fontSize: 13, lineHeight: 19 },
  apiHint: { fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
  apiSaved: { fontSize: 13, fontWeight: '600' },
  apiInput: {
    borderWidth: 1.5, borderRadius: 12,
    paddingVertical: 11, paddingHorizontal: 14,
    fontSize: 14, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  apiButtonRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  apiBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  apiBtnText: { fontSize: 14, fontWeight: '700', color: C.white },
});
