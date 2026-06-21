import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView, StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../constants/colors';

const MOODS = [
  { id: 'motivated',   icon: 'zap',        label: 'Motivated',   sub: 'Ready to get things done' },
  { id: 'overwhelmed', icon: 'cloud-rain',  label: 'Overwhelmed', sub: 'Everything feels like a lot' },
  { id: 'low',         icon: 'moon',        label: 'Low Energy',  sub: 'Want gentle encouragement' },
  { id: 'excited',     icon: 'star',        label: 'Excited',     sub: 'I have lots of ideas' },
  { id: 'calm',        icon: 'sun',         label: 'Calm',        sub: 'Want a peaceful day' },
  { id: 'unmotivated', icon: 'cloud',       label: 'Unmotivated', sub: 'Burning out here' },
];

export default function MoodCheckInScreen({ navigation }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (id) => {
    setSelected(id);
    setTimeout(() => navigation.navigate('Home'), 500);
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.stepRow}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[s.stepDot, i === 2 && s.stepDotActive]} />
          ))}
        </View>

        <Text style={s.heading}>How are you{'\n'}feeling today?</Text>
        <Text style={s.sub}>This shapes the rest of your day.</Text>

        <View style={s.grid}>
          {MOODS.map(m => {
            const active = selected === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[s.card, active && s.cardActive]}
                onPress={() => handleSelect(m.id)}
                activeOpacity={0.8}
              >
                <Feather
                  name={m.icon}
                  size={24}
                  color={active ? C.white : C.forest}
                  style={{ marginBottom: 8 }}
                />
                <Text style={[s.label, active && s.labelActive]}>{m.label}</Text>
                <Text style={[s.cardSub, active && s.cardSubActive]}>{m.sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={s.skip} onPress={() => navigation.navigate('Home')}>
          <Text style={s.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },

  stepRow: { flexDirection: 'row', gap: 6, marginBottom: 28 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border },
  stepDotActive: { backgroundColor: C.forest },

  heading: { fontSize: 32, fontWeight: '700', color: C.forest, lineHeight: 40, marginBottom: 8 },
  sub: { fontSize: 15, color: C.muted, marginBottom: 28 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  card: {
    width: '47.5%', backgroundColor: C.white, borderRadius: 16,
    padding: 16, borderWidth: 1.5, borderColor: C.border,
  },
  cardActive: { backgroundColor: C.forest, borderColor: C.forest },

  label: { fontSize: 15, fontWeight: '700', color: C.forest, marginBottom: 4 },
  labelActive: { color: C.white },
  cardSub: { fontSize: 12, color: C.muted, lineHeight: 18 },
  cardSubActive: { color: 'rgba(255,255,255,0.75)' },

  skip: { alignSelf: 'center', marginTop: 28, padding: 10 },
  skipText: { fontSize: 14, color: C.muted },
});
