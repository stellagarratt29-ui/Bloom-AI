import React, { useState, useRef, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import Play3DView from '../three/Play3DView';
import { C, SPACING, FONT, RADIUS } from '../constants/theme';
import { useGame } from '../context/AppContext';
import { PIECES, FURNITURE_CATEGORIES, COLORS } from '../constants/catalog';
import { FRIENDS } from '../constants/mockData';

const TABS = [
  { key: 'structure', label: 'Structure', enabled: false },
  { key: 'walls', label: 'Walls', enabled: false },
  { key: 'windows', label: 'Windows', enabled: false },
  { key: 'doors', label: 'Doors', enabled: false },
  { key: 'stairs', label: 'Stairs', enabled: false },
  { key: 'roofs', label: 'Roofs', enabled: false },
  { key: 'furniture', label: 'Furniture', enabled: true, categories: ['living', 'kitchen', 'dining', 'bedroom', 'bathroom', 'laundry', 'office', 'closet', 'outdoor', 'garage'] },
  { key: 'flooring', label: 'Flooring', enabled: true, isFlooring: true },
  { key: 'decor', label: 'Decor', enabled: true, categories: ['decor', 'wallart', 'storage'] },
  { key: 'lighting', label: 'Lighting', enabled: true, categories: ['lighting'] },
  { key: 'plants', label: 'Plants', enabled: true, categories: ['plants'] },
];

const LEVELS = [24, 21, 18, 16, 14];

export default function Play3DScreen({ navigation, route }) {
  const { worldId, lotId, roomId } = route.params;
  const { worlds, profile, setRoomCells, setRoomStyle, awardXP } = useGame();
  const world = worlds.find(w => w.id === worldId);
  const lot = world?.lots.find(l => l.id === lotId);
  const room = lot?.rooms.find(r => r.id === roomId);

  const [tab, setTab] = useState('furniture');
  const [activePiece, setActivePiece] = useState(null);
  const [activeColor, setActiveColor] = useState(COLORS[3].name);
  const [recent, setRecent] = useState([]);
  const [daytime, setDaytime] = useState(true);
  const [flying, setFlying] = useState(false);
  const [running, setRunning] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [chatLog, setChatLog] = useState([
    { name: 'ChloeBuilds', text: 'love this kitchen!', color: '#7C9473' },
    { name: 'OceanView', text: 'tysm!!', color: '#5C87A6' },
    { name: 'Savannahh', text: 'how did u do the ceiling?', color: '#C79A3A' },
    { name: 'OceanView', text: 'custom height!', color: '#5C87A6' },
  ]);
  const [chatDraft, setChatDraft] = useState('');
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [note, setNote] = useState('');

  const activeTab = TABS.find(t => t.key === tab);
  const tabPieces = useMemo(() => activeTab?.categories ? PIECES.filter(p => activeTab.categories.includes(p.category)) : [], [tab]);

  if (!world || !lot || !room) {
    return (
      <SafeAreaView style={s.root}>
        <Text style={{ color: '#fff', padding: 20 }}>This room no longer exists.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: '#fff', padding: 20 }}>Go back</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  const flash = (text) => { setNote(text); setTimeout(() => setNote(''), 1600); };

  const pickPiece = (p) => {
    setActivePiece(prev => (prev?.id === p.id ? null : p));
    setActiveColor(p.colors[3] || p.colors[0]);
    setRecent(prev => [p.id, ...prev.filter(id => id !== p.id)].slice(0, 9));
  };

  const handlePlace = (gx, gy) => {
    if (!activePiece) return;
    const key = `${gx},${gy}`;
    setRoomCells(worldId, lotId, roomId, { ...room.cells, [key]: { pieceId: activePiece.id, color: activeColor, material: activePiece.materials[0] } });
    awardXP(2);
  };

  const handleRemove = (key) => {
    const next = { ...room.cells };
    delete next[key];
    setRoomCells(worldId, lotId, roomId, next);
  };

  const sendChat = () => {
    if (!chatDraft.trim()) return;
    setChatLog(prev => [...prev, { name: profile.name, text: chatDraft.trim(), color: C.accent }].slice(-6));
    setChatDraft('');
  };

  const objectCount = Object.keys(room.cells).length;

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <Play3DView
        room={room}
        daytime={daytime}
        flying={flying}
        running={running}
        activePiece={activePiece}
        activeColor={activeColor}
        onPlaceCell={handlePlace}
        onRemoveCell={handleRemove}
      />

      {/* top-left: menu + chat */}
      <View style={s.topLeft}>
        <View style={s.iconRow}>
          <TouchableOpacity style={s.roundBtn} onPress={() => navigation.goBack()}><Icon name="chevron-left" size={18} color="#fff" /></TouchableOpacity>
          <TouchableOpacity style={s.roundBtn} onPress={() => setChatOpen(v => !v)}><Icon name="message-circle" size={16} color="#fff" /></TouchableOpacity>
          <TouchableOpacity style={s.roundBtn} onPress={() => setInventoryOpen(v => !v)}><Icon name="shopping-bag" size={16} color="#fff" /></TouchableOpacity>
        </View>
        {chatOpen && (
          <View style={s.chatBox}>
            {chatLog.slice(-4).map((m, i) => (
              <Text key={i} style={s.chatLine}><Text style={{ color: m.color, fontWeight: '700' }}>{m.name}: </Text>{m.text}</Text>
            ))}
            <View style={s.chatInputRow}>
              <TextInput
                value={chatDraft}
                onChangeText={setChatDraft}
                onSubmitEditing={sendChat}
                placeholder="Tap here to chat"
                placeholderTextColor="rgba(255,255,255,0.5)"
                style={s.chatInput}
              />
            </View>
          </View>
        )}
      </View>

      {/* top-center: currency */}
      <View style={s.topCenter}>
        <View style={s.currencyPill}>
          <Icon name="star" size={13} color="#F2C94C" />
          <Text style={s.currencyText}>{profile.currency.toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('Marketplace')}><Icon name="plus" size={14} color="#fff" /></TouchableOpacity>
        <View style={s.weatherPill}>
          <Icon name={daytime ? 'sun' : 'cloud'} size={14} color="#F2C94C" />
          <Text style={s.weatherText}>{world.settings?.weather || 'Clear'} · {world.settings?.season || 'Summer'}</Text>
        </View>
      </View>

      {/* top-right: mode buttons */}
      <View style={s.topRight}>
        {[
          { icon: 'grid', label: 'Build', onPress: () => navigation.goBack() },
          { icon: 'sliders', label: 'Decorate', onPress: () => setTab('decor') },
          { icon: 'layers', label: 'Inventory', onPress: () => setInventoryOpen(v => !v) },
          { icon: 'shopping-bag', label: 'Shop', onPress: () => navigation.navigate('Marketplace') },
        ].map(b => (
          <TouchableOpacity key={b.label} style={s.pillBtn} onPress={b.onPress}>
            <Icon name={b.icon} size={15} color="#fff" />
            <Text style={s.pillBtnLabel}>{b.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {inventoryOpen && (
        <View style={s.inventoryPanel}>
          <Text style={s.inventoryTitle}>Inventory</Text>
          <Text style={s.inventorySub}>{objectCount} objects placed in {room.name}</Text>
          <Text style={s.inventorySub}>Wall: {room.wallColor} · Floor: {room.floorColor}</Text>
        </View>
      )}

      {/* right: leaderboard */}
      <View style={s.leaderboard}>
        <View style={s.leaderboardHeader}>
          <Text style={s.leaderboardHeaderText}>People</Text>
          <Text style={s.leaderboardHeaderText}>Level</Text>
        </View>
        <View style={s.leaderRow}>
          <View style={s.leaderName}><Icon name="star" size={12} color="#F2C94C" /><Text style={s.leaderText}>{profile.name} (you)</Text></View>
          <Text style={s.leaderLevel}>{profile.level}</Text>
        </View>
        {FRIENDS.map((f, i) => (
          <View key={f.id} style={s.leaderRow}>
            <View style={s.leaderName}>
              <Icon name={i === 0 ? 'award' : 'user'} size={12} color={i === 0 ? '#F2C94C' : 'rgba(255,255,255,0.6)'} />
              <Text style={s.leaderText}>{f.name}</Text>
            </View>
            <Text style={s.leaderLevel}>{LEVELS[i]}</Text>
          </View>
        ))}
      </View>

      {!!note && <View style={s.noteBanner}><Text style={s.noteText}>{note}</Text></View>}

      {/* bottom-left: menu stack + hint */}
      <View style={s.bottomLeft}>
        <View style={s.menuStack}>
          <TouchableOpacity style={s.stackBtn} onPress={() => navigation.goBack()}>
            <Icon name="grid" size={15} color="#fff" /><Text style={s.stackLabel}>MENU</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.stackBtn} onPress={() => flash(`${lot.name} · ${world.theme.name}`)}>
            <Icon name="map" size={15} color="#fff" /><Text style={s.stackLabel}>PLOT INFO</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.stackBtn} onPress={() => navigation.navigate('Settings')}>
            <Icon name="settings" size={15} color="#fff" /><Text style={s.stackLabel}>SETTINGS</Text>
          </TouchableOpacity>
        </View>
        <View style={s.hintBox}>
          <Text style={s.hintText}>{activeTab.enabled ? `Placing: ${activeTab.label}` : `${activeTab.label} tools coming soon`}</Text>
          <Text style={s.hintCount}>{objectCount} objects</Text>
        </View>
        <View style={s.keyHints}>
          <Text style={s.keyHint}>WASD move · Space jump · Drag to look</Text>
        </View>
      </View>

      {/* bottom-right: fly/run/day-night */}
      <View style={s.bottomRight}>
        <TouchableOpacity style={[s.circleBtn, flying && s.circleBtnActive]} onPress={() => setFlying(v => !v)}>
          <Icon name="trending-up" size={16} color="#fff" />
          <Text style={s.circleLabel}>FLY</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.circleBtn, running && s.circleBtnActive]} onPress={() => setRunning(v => !v)}>
          <Icon name="zap" size={16} color="#fff" />
          <Text style={s.circleLabel}>RUN</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.dayBtn} onPress={() => setDaytime(v => !v)}>
          <Icon name={daytime ? 'sun' : 'cloud'} size={16} color="#F2C94C" />
          <Text style={s.dayLabel}>{daytime ? 'Day' : 'Night'}</Text>
        </TouchableOpacity>
      </View>

      {/* bottom-center: tabs + items + hotbar */}
      <View style={s.bottomCenter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabRow}>
          {TABS.map(t => (
            <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={[s.tab, tab === t.key && s.tabActive]}>
              <Text style={[s.tabLabel, tab === t.key && s.tabLabelActive, !t.enabled && s.tabLabelDisabled]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {activeTab.isFlooring ? (
          <View style={s.flooringRow}>
            <Text style={s.flooringLabel}>Floor</Text>
            {COLORS.slice(0, 8).map(c => (
              <TouchableOpacity key={c.name} onPress={() => setRoomStyle(worldId, lotId, roomId, { floorColor: c.name })} style={[s.swatch, { backgroundColor: c.hex, borderColor: room.floorColor === c.name ? '#fff' : 'transparent' }]} />
            ))}
            <Text style={s.flooringLabel}>Wall</Text>
            {COLORS.slice(0, 8).map(c => (
              <TouchableOpacity key={c.name} onPress={() => setRoomStyle(worldId, lotId, roomId, { wallColor: c.name })} style={[s.swatch, { backgroundColor: c.hex, borderColor: room.wallColor === c.name ? '#fff' : 'transparent' }]} />
            ))}
          </View>
        ) : activeTab.enabled ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.itemRow}>
            {tabPieces.map(p => (
              <TouchableOpacity key={p.id} onPress={() => pickPiece(p)} style={[s.itemCard, activePiece?.id === p.id && s.itemCardActive]}>
                <Icon name={p.icon} size={22} color="#fff" />
                <Text style={s.itemPrice}>${p.price}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={s.comingSoon}>Coming soon</Text>
        )}

        <View style={s.hotbar}>
          {Array.from({ length: 9 }).map((_, i) => {
            const pieceId = recent[i];
            const piece = pieceId ? PIECES.find(p => p.id === pieceId) : null;
            return (
              <TouchableOpacity key={i} style={[s.hotSlot, activePiece && piece?.id === activePiece.id && s.hotSlotActive]} onPress={() => piece && setActivePiece(piece)}>
                <Text style={s.hotIndex}>{i + 1}</Text>
                {piece && <Icon name={piece.icon} size={16} color="#fff" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  topLeft: { position: 'absolute', top: 14, left: 14, maxWidth: 260 },
  iconRow: { flexDirection: 'row', gap: 8 },
  roundBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  chatBox: { marginTop: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: RADIUS.md, padding: 10 },
  chatLine: { color: '#fff', fontSize: 12, marginBottom: 2 },
  chatInputRow: { marginTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 6 },
  chatInput: { color: '#fff', fontSize: 12 },
  topCenter: { position: 'absolute', top: 14, left: '50%', transform: [{ translateX: -160 }], flexDirection: 'row', alignItems: 'center', gap: 8, width: 320, justifyContent: 'center' },
  currencyPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: RADIUS.pill, paddingVertical: 6, paddingHorizontal: 12 },
  currencyText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  addBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.sage, alignItems: 'center', justifyContent: 'center' },
  weatherPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: RADIUS.pill, paddingVertical: 6, paddingHorizontal: 10 },
  weatherText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  topRight: { position: 'absolute', top: 14, right: 14, flexDirection: 'row', gap: 6 },
  pillBtn: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: RADIUS.md, paddingVertical: 6, paddingHorizontal: 10, gap: 2 },
  pillBtnLabel: { color: '#fff', fontSize: 9, fontWeight: '700' },
  inventoryPanel: { position: 'absolute', top: 60, right: 14, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: RADIUS.md, padding: 12, width: 200 },
  inventoryTitle: { color: '#fff', fontWeight: '700', marginBottom: 4 },
  inventorySub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },
  leaderboard: { position: 'absolute', top: 60, right: 14, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: RADIUS.md, padding: 10, width: 190 },
  leaderboardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  leaderboardHeaderText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700' },
  leaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  leaderName: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leaderText: { color: '#fff', fontSize: 12 },
  leaderLevel: { color: '#F2C94C', fontSize: 12, fontWeight: '700' },
  noteBanner: { position: 'absolute', top: 100, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: RADIUS.pill, paddingVertical: 6, paddingHorizontal: 14 },
  noteText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  bottomLeft: { position: 'absolute', left: 14, bottom: 150 },
  menuStack: { gap: 6, marginBottom: 10 },
  stackBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: RADIUS.md, paddingVertical: 6, paddingHorizontal: 10 },
  stackLabel: { color: '#fff', fontSize: 10, fontWeight: '700' },
  hintBox: { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: RADIUS.md, padding: 10, minWidth: 160 },
  hintText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  hintCount: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 },
  keyHints: { marginTop: 8 },
  keyHint: { color: 'rgba(255,255,255,0.55)', fontSize: 10 },
  bottomRight: { position: 'absolute', right: 14, bottom: 150, alignItems: 'center', gap: 10 },
  circleBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  circleBtnActive: { backgroundColor: C.accent },
  circleLabel: { color: '#fff', fontSize: 9, fontWeight: '700', marginTop: 2 },
  dayBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  dayLabel: { color: '#fff', fontSize: 9, fontWeight: '700', marginTop: 2 },
  bottomCenter: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,12,10,0.72)', paddingTop: 10, paddingBottom: 10 },
  tabRow: { paddingHorizontal: 14 },
  tab: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: RADIUS.pill, marginRight: 6 },
  tabActive: { backgroundColor: C.accent },
  tabLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' },
  tabLabelActive: { color: '#fff' },
  tabLabelDisabled: { color: 'rgba(255,255,255,0.35)' },
  itemRow: { paddingHorizontal: 14, marginTop: 8 },
  itemCard: { width: 60, height: 60, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  itemCardActive: { backgroundColor: C.accent },
  itemPrice: { color: '#fff', fontSize: 10, marginTop: 4, fontWeight: '700' },
  flooringRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginTop: 8, gap: 6, flexWrap: 'wrap' },
  flooringLabel: { color: '#fff', fontSize: 11, fontWeight: '700', marginRight: 4 },
  swatch: { width: 22, height: 22, borderRadius: 6, borderWidth: 2 },
  comingSoon: { color: 'rgba(255,255,255,0.5)', fontSize: 12, paddingHorizontal: 14, marginTop: 8 },
  hotbar: { flexDirection: 'row', paddingHorizontal: 14, marginTop: 10, gap: 6 },
  hotSlot: { width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  hotSlotActive: { borderWidth: 2, borderColor: C.accent },
  hotIndex: { position: 'absolute', top: 2, left: 4, color: 'rgba(255,255,255,0.6)', fontSize: 9 },
});
