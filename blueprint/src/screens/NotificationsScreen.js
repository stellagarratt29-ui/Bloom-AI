import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { ScreenHeader, Card } from '../components/UI';
import { C, SPACING, FONT } from '../constants/theme';
import { NOTIFICATIONS } from '../constants/mockData';

export default function NotificationsScreen({ navigation }) {
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScreenHeader title="Notifications" onBack={() => navigation.canGoBack() && navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        {NOTIFICATIONS.map(n => (
          <Card key={n.id} style={s.row}>
            <View style={s.glyph}><Icon name={n.icon} size={16} color={C.accent} /></View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={FONT.body}>{n.text}</Text>
              <Text style={FONT.caption}>{n.time} ago</Text>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  glyph: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
});
