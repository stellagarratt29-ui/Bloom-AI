import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from './Icon';
import { C, RADIUS, FONT, SPACING } from '../constants/theme';

function mix(hex, target, amount) {
  const h = hex.replace('#', '');
  const t = target.replace('#', '');
  const r1 = parseInt(h.substring(0, 2), 16), g1 = parseInt(h.substring(2, 4), 16), b1 = parseInt(h.substring(4, 6), 16);
  const r2 = parseInt(t.substring(0, 2), 16), g2 = parseInt(t.substring(2, 4), 16), b2 = parseInt(t.substring(4, 6), 16);
  const r = Math.round(r1 + (r2 - r1) * amount);
  const g = Math.round(g1 + (g2 - g1) * amount);
  const b = Math.round(b1 + (b2 - b1) * amount);
  return `rgb(${r}, ${g}, ${b})`;
}

// A photographic-feeling placeholder card: gradient wash + large watermark icon + bottom scrim.
// Stands in for real imagery so the UI reads as an actual product, not a lorem-ipsum grid.
export default function PhotoCard({
  icon = 'home', accent = C.accent, height = 150, title, subtitle, badge,
  overlay = true, onPress, style, children, dim = false,
}) {
  const Wrap = onPress ? TouchableOpacity : View;
  return (
    <Wrap onPress={onPress} activeOpacity={0.9} style={[s.card, { height }, style]}>
      <LinearGradient
        colors={[mix(accent, '#FFFFFF', 0.35), accent, mix(accent, '#000000', 0.35)]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {dim && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.25)' }]} />}
      <View style={s.iconWrap}>
        <Icon name={icon} size={height * 0.34} color="rgba(255,255,255,0.4)" strokeWidth={1.4} />
      </View>
      {badge ? <View style={s.badge}><Text style={s.badgeText}>{badge}</Text></View> : null}
      {children}
      {overlay && title ? (
        <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(20,16,10,0.72)']} style={s.scrim}>
          <Text style={s.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={s.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </LinearGradient>
      ) : null}
    </Wrap>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: RADIUS.lg, overflow: 'hidden', justifyContent: 'flex-end' },
  iconWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: RADIUS.pill, paddingVertical: 3, paddingHorizontal: 9 },
  badgeText: { fontSize: 10, fontWeight: '700', color: C.text },
  scrim: { paddingHorizontal: SPACING.md, paddingTop: SPACING.xl, paddingBottom: SPACING.md },
  title: { color: '#fff', fontSize: 15, fontWeight: '700' },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
});
