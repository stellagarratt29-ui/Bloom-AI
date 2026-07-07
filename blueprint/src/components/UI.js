import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from './Icon';
import { C, RADIUS, SPACING, FONT, SHADOW } from '../constants/theme';

export function Button({ label, onPress, variant = 'primary', icon, style, disabled }) {
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        s.btn,
        isPrimary && { backgroundColor: disabled ? C.borderStrong : C.accent },
        variant === 'secondary' && { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
        isGhost && { backgroundColor: 'transparent', paddingHorizontal: 4 },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={16} color={isPrimary ? C.textOnAccent : C.text} style={{ marginRight: 6 }} />}
      <Text style={[s.btnLabel, isPrimary && { color: C.textOnAccent }, isGhost && { color: C.accent }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ScreenHeader({ title, onBack, right }) {
  return (
    <View style={s.header}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={s.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
      ) : <View style={s.headerBtn} />}
      <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={s.headerBtn}>{right}</View>
    </View>
  );
}

export function SectionHeader({ title, action, onAction }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={FONT.h3}>{title}</Text>
      {action ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={s.sectionAction}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function Chip({ label, active, onPress, color }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.chip, active && { backgroundColor: color || C.accent, borderColor: color || C.accent }]}>
      <Text style={[s.chipLabel, active && { color: C.textOnAccent }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Card({ children, style, onPress }) {
  const Wrap = onPress ? TouchableOpacity : View;
  return <Wrap onPress={onPress} activeOpacity={0.85} style={[s.card, style]}>{children}</Wrap>;
}

export function ProgressBar({ progress, color = C.accent, height = 8 }) {
  return (
    <View style={[s.progressTrack, { height, borderRadius: height / 2 }]}>
      <View style={[s.progressFill, { width: `${Math.max(0, Math.min(1, progress)) * 100}%`, backgroundColor: color, borderRadius: height / 2 }]} />
    </View>
  );
}

export function Avatar({ name, size = 40, color = C.accent }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={{ color: C.textOnAccent, fontWeight: '700', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

export function StatPill({ icon, label, color }) {
  return (
    <View style={s.statPill}>
      <Icon name={icon} size={13} color={color || C.textMuted} />
      <Text style={s.statPillLabel}>{label}</Text>
    </View>
  );
}

export function EmptyState({ icon = 'grid', title, subtitle, actionLabel, onAction }) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}><Icon name={icon} size={28} color={C.accent} /></View>
      <Text style={[FONT.h3, { marginTop: SPACING.md, textAlign: 'center' }]}>{title}</Text>
      {subtitle ? <Text style={[FONT.bodyMuted, { marginTop: 4, textAlign: 'center' }]}>{subtitle}</Text> : null}
      {actionLabel ? <Button label={actionLabel} onPress={onAction} style={{ marginTop: SPACING.lg }} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, paddingHorizontal: 18, borderRadius: RADIUS.pill,
  },
  btnLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  headerBtn: { width: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...FONT.h3, flex: 1, textAlign: 'center' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sectionAction: { ...FONT.label, color: C.accent },
  chip: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.pill,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, marginRight: 8,
  },
  chipLabel: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  card: {
    backgroundColor: C.surface, borderRadius: RADIUS.lg, padding: SPACING.lg,
    ...SHADOW.card,
  },
  progressTrack: { backgroundColor: C.border, overflow: 'hidden', width: '100%' },
  progressFill: { height: '100%' },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  statPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceAlt,
    borderRadius: RADIUS.pill, paddingVertical: 5, paddingHorizontal: 10, marginRight: 8,
  },
  statPillLabel: { ...FONT.caption, marginLeft: 5, color: C.textMuted },
  empty: { alignItems: 'center', padding: SPACING.xxl },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: C.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
});
