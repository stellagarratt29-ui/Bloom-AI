import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { ScreenHeader, Card } from '../components/UI';
import { C, SPACING, FONT } from '../constants/theme';

const ROWS = [
  { icon: 'user', label: 'Account' },
  { icon: 'bell', label: 'Notification Preferences' },
  { icon: 'shopping-bag', label: 'Purchases' },
  { icon: 'sliders', label: 'Accessibility' },
  { icon: 'mail', label: 'Contact Support' },
];

export default function SettingsScreen({ navigation }) {
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScreenHeader title="Settings" onBack={() => navigation.canGoBack() && navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {ROWS.map((r, i) => (
            <TouchableOpacity key={r.label} style={[s.row, i < ROWS.length - 1 && s.rowBorder]}>
              <Icon name={r.icon} size={18} color={C.textMuted} />
              <Text style={[FONT.body, { flex: 1, marginLeft: SPACING.md }]}>{r.label}</Text>
              <Icon name="chevron-right" size={16} color={C.textFaint} />
            </TouchableOpacity>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
});
