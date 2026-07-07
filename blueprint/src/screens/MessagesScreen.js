import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader, Card, Avatar } from '../components/UI';
import { C, SPACING, FONT } from '../constants/theme';
import { MESSAGES } from '../constants/mockData';

export default function MessagesScreen({ navigation }) {
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScreenHeader title="Messages" onBack={() => navigation.canGoBack() && navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        {MESSAGES.map(m => (
          <TouchableOpacity key={m.id}>
            <Card style={s.row}>
              <Avatar name={m.from} size={44} />
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={FONT.h3}>{m.from}</Text>
                <Text style={FONT.bodyMuted} numberOfLines={1}>{m.preview}</Text>
              </View>
              <Text style={FONT.caption}>{m.time}</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
});
