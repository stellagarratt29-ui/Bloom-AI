import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet, Platform, TextInput, Switch,
} from 'react-native';
import Icon from '../components/Icon';
import { C, AESTHETICS } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import {
  requestNotificationPermission,
  getNotificationTime,
  setNotificationTime,
} from '../hooks/useNotifications';

const OCCUPATIONS = ['Student', 'Working', 'Both', 'Other'];
const AGE_RANGES  = ['Under 16', '16–18', '19–24', '25–34', '35–49', '50+'];

const AESTHETIC_LIST = Object.entries(AESTHETICS).map(([key, ae]) => ({ key, ...ae }));

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
  {
    key: 'dyslexiaMode',
    label: 'Dyslexia-friendly text',
    sub: 'More letter/word spacing, cleaner font, and larger text options.',
  },
];

const TEXT_SIZE_OPTIONS = [
  { key: 'normal', label: 'Normal' },
  { key: 'large',  label: 'Large' },
  { key: 'xl',     label: 'Extra large' },
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
  const { aesthetic, setAesthetic, isDark, setDarkMode, colors: t } = useTheme();

  const [editProfile, setEditProfile] = useState(false);
  const [draftName,   setDraftName]   = useState(userName);
  const [draftAge,    setDraftAge]    = useState(userAge);
  const [draftOcc,    setDraftOcc]    = useState(userOccupation);
  const [showReset,   setShowReset]   = useState(false);

  const [notifPermission, setNotifPermission] = useState('default');
  const [notifHour, setNotifHour] = useState('8');
  const [notifMin,  setNotifMin]  = useState('00');
  const [notifSaved, setNotifSaved] = useState(false);

  useEffect(() => {
    // Load saved notification time
    getNotificationTime().then(({ hour, min }) => {
      setNotifHour(String(hour));
      setNotifMin(String(min).padStart(2, '0'));
    });
    // Check current permission state on web
    if (Platform.OS === 'web' && typeof Notification !== 'undefined') {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const handleEnableNotif = async () => {
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
    if (granted && Platform.OS !== 'web') {
      // Schedule the first reminder immediately at the saved time
      const h = Math.min(23, Math.max(0, parseInt(notifHour) || 8));
      const m = Math.min(59, Math.max(0, parseInt(notifMin)  || 0));
      await setNotificationTime(h, m);
    }
  };

  const handleSaveNotifTime = async () => {
    const h = Math.min(23, Math.max(0, parseInt(notifHour) || 8));
    const m = Math.min(59, Math.max(0, parseInt(notifMin)  || 0));
    await setNotificationTime(h, m);
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2000);
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

        <Text style={[s.title, { color: t.pinkDark }]}>Settings</Text>
        <Text style={[s.titleSub, { color: t.subtext }]}>Your preferences and profile.</Text>

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
                    style={[s.chip, { borderColor: t.border, backgroundColor: t.bg }, draftAge === a && { borderColor: t.moss, backgroundColor: t.sagePale }]}
                    onPress={() => setDraftAge(a === draftAge ? '' : a)}
                  >
                    <Text style={[s.chipText, { color: t.subtext }, draftAge === a && { color: t.moss }]}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[s.editLabel, { color: t.subtext }]}>OCCUPATION</Text>
              <View style={s.chipRow}>
                {OCCUPATIONS.map(o => (
                  <TouchableOpacity
                    key={o}
                    style={[s.chip, { borderColor: t.border, backgroundColor: t.bg }, draftOcc === o && { borderColor: t.moss, backgroundColor: t.sagePale }]}
                    onPress={() => setDraftOcc(o === draftOcc ? '' : o)}
                  >
                    <Text style={[s.chipText, { color: t.subtext }, draftOcc === o && { color: t.moss }]}>{o}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={s.editActions}>
                <TouchableOpacity style={[s.cancelBtn, { borderColor: t.border }]} onPress={() => setEditProfile(false)}>
                  <Text style={[s.cancelBtnText, { color: t.subtext }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.saveBtn, { backgroundColor: t.moss }]} onPress={saveProfile}>
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
            <View style={s.apiStatusRow}>
              <View style={[s.apiDot, { backgroundColor: t.moss }]} />
              <Text style={[s.apiStatusText, { color: t.text }]}>AI connected</Text>
            </View>
            <Text style={[s.apiSub, { color: t.subtext }]}>
              Bloom uses AI for chat, task sorting, hobby milestones, and guidance. No setup needed.
            </Text>
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
                    trackColor={{ false: t.border, true: t.moss }}
                    thumbColor={C.white}
                  />
                </View>
              ))}
            </View>

            {!!ndToggles?.dyslexiaMode && (
              <View style={[s.card, { backgroundColor: t.card, borderColor: t.border, marginTop: 8 }]}>
                <Text style={[s.ndLabel, { color: t.text, marginBottom: 12 }]}>Text size</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {TEXT_SIZE_OPTIONS.map(opt => {
                    const active = (ndToggles?.textSize || 'normal') === opt.key;
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        style={[
                          s.chip, { flex: 1, alignItems: 'center', justifyContent: 'center', borderColor: t.border },
                          active && { borderColor: t.moss, backgroundColor: t.sagePale },
                        ]}
                        onPress={() => updateNdToggles({ textSize: opt.key })}
                      >
                        <Text style={[s.chipText, { color: t.subtext }, active && { color: t.moss }]}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}

        {/* Aesthetic */}
        <SectionTitle t={t}>Your Aesthetic</SectionTitle>
        <View style={[s.card, { backgroundColor: t.card, borderColor: t.border, overflow: 'hidden' }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.aeScrollContent}
          >
            {AESTHETIC_LIST.map(ae => {
              const selected = aesthetic === ae.key;
              return (
                <TouchableOpacity
                  key={ae.key}
                  onPress={() => setAesthetic(ae.key)}
                  activeOpacity={0.82}
                  style={[
                    s.aeCard,
                    { backgroundColor: ae.bg, borderColor: selected ? ae.accent : ae.border },
                    selected && { borderWidth: 2.5, shadowColor: ae.accent, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
                  ]}
                >
                  {/* Mini UI preview */}
                  <View style={s.aePreview}>
                    {/* Fake header strip */}
                    <View style={[s.aeHeader, { backgroundColor: ae.bg }]}>
                      <View style={[s.aeWordmark, { backgroundColor: ae.accent, opacity: 0.9 }]} />
                    </View>
                    {/* Fake chat bubbles */}
                    <View style={s.aeBubbles}>
                      {/* Bloom bubble */}
                      <View style={[s.aeBloomBubble, { backgroundColor: ae.card, borderColor: ae.border }]}>
                        <View style={[s.aeTextLine, { backgroundColor: ae.subtext, opacity: 0.35, width: '80%' }]} />
                        <View style={[s.aeTextLine, { backgroundColor: ae.subtext, opacity: 0.25, width: '55%', marginTop: 3 }]} />
                      </View>
                      {/* User bubble */}
                      <View style={[s.aeUserBubble, { backgroundColor: ae.accent }]}>
                        <View style={[s.aeTextLine, { backgroundColor: '#fff', opacity: 0.7, width: '70%' }]} />
                      </View>
                    </View>
                    {/* Fake input bar */}
                    <View style={[s.aeInputBar, { backgroundColor: ae.card, borderColor: ae.border }]}>
                      <View style={[s.aeInputLine, { backgroundColor: ae.subtext, opacity: 0.2 }]} />
                      <View style={[s.aeSendBtn, { backgroundColor: ae.accent }]} />
                    </View>
                  </View>

                  {/* Label */}
                  <Text style={[s.aeEmoji]}>{ae.emoji}</Text>
                  <Text style={[s.aeName, { color: ae.ink }]}>{ae.name}</Text>
                  {selected && (
                    <View style={[s.aeCheck, { backgroundColor: ae.accent }]}>
                      <Icon name="check" size={9} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {/* Description of selected */}
          <View style={[s.aeDescRow, { borderTopColor: t.border }]}>
            <Text style={[s.aeDescText, { color: t.subtext }]}>
              {AESTHETICS[aesthetic]?.description ?? ''}
            </Text>
            {AESTHETICS[aesthetic]?.isDark && (
              <View style={[s.aeDarkBadge, { backgroundColor: t.sagePale }]}>
                <Text style={[s.aeDarkBadgeText, { color: t.moss }]}>Always dark</Text>
              </View>
            )}
          </View>
        </View>

        {/* Display */}
        <SectionTitle t={t}>Display</SectionTitle>
        <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={s.switchRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[s.switchLabel, { color: AESTHETICS[aesthetic]?.isDark ? t.subtext : t.text }]}>Dark mode</Text>
              <Text style={[s.switchSub, { color: t.subtext }]}>
                {AESTHETICS[aesthetic]?.isDark
                  ? 'Always on for Midnight'
                  : 'Warm dark palette, same personality'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={setDarkMode}
              disabled={!!AESTHETICS[aesthetic]?.isDark}
              trackColor={{ false: t.border, true: t.moss }}
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

        {/* Notifications */}
        <SectionTitle t={t}>Morning Reminder</SectionTitle>
        <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={{ padding: 18, gap: 12 }}>
            {notifPermission !== 'granted' ? (
              <>
                <Text style={[s.ndSub, { color: t.subtext }]}>
                  Get a gentle reminder each morning to open Bloom and plan your day.
                </Text>
                {Platform.OS === 'web' && notifPermission === 'denied' ? (
                  <Text style={[s.ndSub, { color: C.clay }]}>
                    Notifications are blocked in your browser settings. Enable them there first.
                  </Text>
                ) : (
                  <TouchableOpacity
                    style={[s.saveBtn, { flex: 0, paddingHorizontal: 20, marginTop: 4, backgroundColor: t.moss }]}
                    onPress={handleEnableNotif}
                  >
                    <Text style={s.saveBtnText}>Enable morning reminder</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <View style={s.apiStatusRow}>
                  <View style={[s.apiDot, { backgroundColor: t.moss }]} />
                  <Text style={[s.apiStatusText, { color: t.text }]}>Reminders enabled</Text>
                </View>
                <Text style={[s.ndSub, { color: t.subtext }]}>Bloom will remind you to plan your day at:</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TextInput
                    style={[s.editInput, { width: 64, textAlign: 'center', marginBottom: 0, backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
                    value={notifHour}
                    onChangeText={setNotifHour}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={[s.rowLabel, { color: t.text }]}>:</Text>
                  <TextInput
                    style={[s.editInput, { width: 64, textAlign: 'center', marginBottom: 0, backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
                    value={notifMin}
                    onChangeText={setNotifMin}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <TouchableOpacity style={[s.saveBtn, { flex: 0, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: t.moss }]} onPress={handleSaveNotifTime}>
                    <Text style={s.saveBtnText}>{notifSaved ? 'Saved ✓' : 'Save'}</Text>
                  </TouchableOpacity>
                </View>
                {Platform.OS === 'web' && (
                  <Text style={[s.ndSub, { color: t.subtext, fontStyle: 'italic' }]}>
                    Note: the browser tab needs to be open for this reminder to fire.
                  </Text>
                )}
              </>
            )}
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
    fontSize: 38, fontWeight: '800', letterSpacing: -1, marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined,
  },

  titleSub: { fontSize: 14, lineHeight: 22, marginBottom: 24 },

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
  chipActive: {},
  chipText: { fontSize: 13, fontWeight: '600' },
  chipTextActive: {},

  editActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600' },
  saveBtn: {
    flex: 2, paddingVertical: 12, borderRadius: 10,
    alignItems: 'center',
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

  // Aesthetic picker
  aeScrollContent: {
    flexDirection: 'row', gap: 10, padding: 16, paddingRight: 16,
  },
  aeCard: {
    width: 88, borderRadius: 16, borderWidth: 1.5,
    alignItems: 'center', paddingBottom: 12, overflow: 'hidden',
    position: 'relative',
  },
  aePreview: {
    width: '100%', height: 96, overflow: 'hidden',
    borderBottomWidth: 1, borderBottomColor: 'transparent',
    gap: 5, paddingHorizontal: 8, paddingTop: 8,
  },
  aeHeader: {
    flexDirection: 'row', alignItems: 'center', height: 14,
    paddingHorizontal: 2,
  },
  aeWordmark: {
    width: 32, height: 6, borderRadius: 3,
  },
  aeBubbles: { gap: 5 },
  aeBloomBubble: {
    borderRadius: 8, borderBottomLeftRadius: 2,
    padding: 5, borderWidth: 1, maxWidth: '78%',
    gap: 2,
  },
  aeUserBubble: {
    borderRadius: 8, borderBottomRightRadius: 2,
    padding: 5, maxWidth: '65%', alignSelf: 'flex-end',
  },
  aeTextLine: {
    height: 3, borderRadius: 2,
  },
  aeInputBar: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 10,
    borderWidth: 1, paddingHorizontal: 7, paddingVertical: 5,
    marginTop: 'auto', gap: 5,
  },
  aeInputLine: {
    flex: 1, height: 3, borderRadius: 2,
  },
  aeSendBtn: {
    width: 16, height: 16, borderRadius: 8,
  },
  aeEmoji: { fontSize: 16, marginTop: 10 },
  aeName: {
    fontSize: 11, fontWeight: '700', marginTop: 2, letterSpacing: 0.2,
  },
  aeCheck: {
    position: 'absolute', top: 7, right: 7,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  aeDescRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1,
  },
  aeDescText: { fontSize: 13 },
  aeDarkBadge: {
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
  },
  aeDarkBadgeText: { fontSize: 11, fontWeight: '700' },

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
