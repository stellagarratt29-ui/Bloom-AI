import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../components/Icon';
import { Button } from '../components/UI';
import { C, SPACING, FONT, RADIUS } from '../constants/theme';

export default function StartScreen({ navigation }) {
  return (
    <View style={s.root}>
      <LinearGradient colors={['#EAD9C4', '#C1602E', '#5C4A3A']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={s.content}>
        <View style={s.center}>
          <View style={s.glyph}><Icon name="home" size={40} color="#fff" /></View>
          <Text style={s.logo}>BLUEPRINT</Text>
          <Text style={s.tagline}>Design your dream world.</Text>

          <Button label="Start Creating" icon="sparkles" variant="secondary" onPress={() => navigation.navigate('Worlds')} style={s.cta} />

          <View style={s.comingSoon}>
            <Icon name="award" size={13} color="rgba(255,255,255,0.8)" />
            <Text style={s.comingSoonText}>Competitions — coming soon</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', paddingHorizontal: SPACING.xl },
  glyph: { width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  logo: { fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 40, fontWeight: '700', color: '#fff', letterSpacing: 2 },
  tagline: { color: 'rgba(255,255,255,0.85)', fontSize: 15, marginTop: 6, marginBottom: SPACING.xxl },
  cta: { paddingHorizontal: SPACING.xxl, paddingVertical: 16 },
  comingSoon: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.xl, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: RADIUS.pill, paddingVertical: 6, paddingHorizontal: 14 },
  comingSoonText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
});
