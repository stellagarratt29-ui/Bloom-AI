import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { ScreenHeader, Card, Button } from '../components/UI';
import { C, SPACING, FONT, RADIUS } from '../constants/theme';
import { MARKETPLACE_PACKS } from '../constants/mockData';
import { useGame } from '../context/AppContext';

export default function MarketplaceScreen({ navigation }) {
  const { profile, ownedPacks, purchasePack } = useGame();

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScreenHeader title="Marketplace" right={
        <View style={s.currencyPill}>
          <Icon name="star" size={13} color={C.gold} />
          <Text style={s.currencyText}>{profile.currency}</Text>
        </View>
      } />
      <Text style={[FONT.bodyMuted, { paddingHorizontal: SPACING.lg }]}>
        Cosmetic collections and design variety — everyone can keep building without spending.
      </Text>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        {MARKETPLACE_PACKS.map(pack => {
          const owned = ownedPacks.includes(pack.id);
          return (
            <Card key={pack.id} style={s.packCard}>
              <View style={s.packGlyph}><Icon name="gift" size={20} color={C.accent} /></View>
              <View style={{ flex: 1 }}>
                <Text style={FONT.h3}>{pack.name}</Text>
                <Text style={FONT.bodyMuted}>{pack.category} · {pack.itemCount} items</Text>
              </View>
              {owned ? (
                <View style={s.ownedBadge}><Text style={s.ownedText}>Owned</Text></View>
              ) : (
                <Button
                  label={pack.price === 0 ? 'Free' : `${pack.price}`}
                  icon={pack.price === 0 ? undefined : 'star'}
                  onPress={() => purchasePack(pack.id, pack.price)}
                  disabled={profile.currency < pack.price}
                />
              )}
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  currencyPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.goldSoft, borderRadius: RADIUS.pill, paddingVertical: 4, paddingHorizontal: 10, gap: 4 },
  currencyText: { ...FONT.caption, fontWeight: '700', color: C.accentDeep },
  packCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  packGlyph: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  ownedBadge: { backgroundColor: C.sageSoft, borderRadius: RADIUS.pill, paddingVertical: 6, paddingHorizontal: 12 },
  ownedText: { ...FONT.caption, color: C.success, fontWeight: '700' },
});
