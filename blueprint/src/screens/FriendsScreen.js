import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { ScreenHeader, Card, Avatar, Button } from '../components/UI';
import { C, SPACING, FONT } from '../constants/theme';
import { FRIENDS } from '../constants/mockData';

export default function FriendsScreen({ navigation }) {
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScreenHeader title="Friends" onBack={() => navigation.canGoBack() && navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        {FRIENDS.map(f => (
          <Card key={f.id} style={s.row}>
            <View>
              <Avatar name={f.name} size={44} />
              {f.online && <View style={s.onlineDot} />}
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={FONT.h3}>{f.name}</Text>
              <Text style={FONT.bodyMuted}>{f.status}</Text>
            </View>
            <TouchableOpacity style={s.msgBtn} onPress={() => navigation.navigate('Messages')}>
              <Icon name="message-circle" size={18} color={C.accent} />
            </TouchableOpacity>
          </Card>
        ))}
        <Button label="Find More Friends" icon="users" variant="secondary" style={{ marginTop: SPACING.sm }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: C.success, borderWidth: 2, borderColor: C.surface },
  msgBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
});
