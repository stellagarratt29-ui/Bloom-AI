import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import Play3DView from '../three/Play3DView';
import { C, SPACING, FONT, RADIUS } from '../constants/theme';
import { useGame } from '../context/AppContext';
import { PIECES, COLORS } from '../constants/catalog';
import { FRIENDS } from '../constants/mockData';

const CATALOG_SECTIONS = [
  { key: 'furniture', label: 'Furniture', categories: ['living', 'kitchen', 'dining', 'bedroom', 'bathroom', 'laundry', 'office', 'closet', 'outdoor', 'garage'] },
  { key: 'decor', label: 'Decor', categories: ['decor', 'wallart', 'storage'] },
  { key: 'lighting', label: 'Lighting', categories: ['lighting'] },
  { key: 'plants', label: 'Plants', categories: ['plants'] },
];

const LEVELS = [24, 21, 18, 16, 14];

function CatalogSheet({ visible, onClose, recent, favorites, toggleFavorite, onPick, activePiece, room, onFloorColor, onWallColor }) {
  const [query, setQuery] = useState('');
  const [section, setSection] = useState('furniture');
  const sectionPieces = useMemo(() => {
    if (query.trim()) {
      const q = query.toLowerCase();
      return PIECES.filter(p => p.name.toLowerCase().includes(q));
    }
    const cats = CATALOG_SECTIONS.find(s => s.key === section)?.categories || [];
    return PIECES.filter(p => cats.includes(p.category));
  }, [query, section]);

  if (!visible) return null;

  const recentPieces = recent.map(id => PIECES.find(p => p.id === id)).filter(Boolean);
  const favoritePieces = PIECES.filter(p => favorites.includes(p.id));

  return (
    <View style={s.sheet}>
      <View style={s.sheetHandle} />
      <View style={s.sheetHeader}>
        <Text style={FONT.h3}>Furniture Catalog</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="x" size={18} color={C.textFaint} />
        </TouchableOpacity>
      </View>
      <View style={s.searchBox}>
        <Icon name="search" size={13} color={C.textFaint} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search furniture..." placeholderTextColor={C.textFaint} style={s.searchInput} />
      </View>

      <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionLabel}>FLOORING &amp; WALLS</Text>
        <View style={s.swatchRow}>
          <Text style={s.swatchGroupLabel}>Floor</Text>
          {COLORS.slice(0, 6).map(c => (
            <TouchableOpacity key={c.name} onPress={() => onFloorColor(c.name)} style={[s.swatch, { backgroundColor: c.hex, borderColor: room.floorColor === c.name ? C.accent : 'transparent' }]} />
          ))}
        </View>
        <View style={s.swatchRow}>
          <Text style={s.swatchGroupLabel}>Wall</Text>
          {COLORS.slice(0, 6).map(c => (
            <TouchableOpacity key={c.name} onPress={() => onWallColor(c.name)} style={[s.swatch, { backgroundColor: c.hex, borderColor: room.wallColor === c.name ? C.accent : 'transparent' }]} />
          ))}
        </View>

        {!query.trim() && recentPieces.length > 0 && (
          <>
            <Text style={s.sectionLabel}>RECENTLY USED</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              {recentPieces.map(p => (
                <CatalogCard key={'r' + p.id} piece={p} active={activePiece?.id === p.id} favorite={favorites.includes(p.id)} onPress={() => onPick(p)} onFavorite={() => toggleFavorite(p.id)} />
              ))}
            </ScrollView>
          </>
        )}

        {!query.trim() && favoritePieces.length > 0 && (
          <>
            <Text style={s.sectionLabel}>FAVORITES</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              {favoritePieces.map(p => (
                <CatalogCard key={'f' + p.id} piece={p} active={activePiece?.id === p.id} favorite onPress={() => onPick(p)} onFavorite={() => toggleFavorite(p.id)} />
              ))}
            </ScrollView>
          </>
        )}

        {!query.trim() && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.sm }}>
            {CATALOG_SECTIONS.map(sec => (
              <TouchableOpacity key={sec.key} onPress={() => setSection(sec.key)} style={[s.sectionChip, section === sec.key && s.sectionChipActive]}>
                <Text style={[s.sectionChipLabel, section === sec.key && s.sectionChipLabelActive]}>{sec.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <Text style={s.sectionLabel}>{query.trim() ? 'RESULTS' : CATALOG_SECTIONS.find(s2 => s2.key === section)?.label.toUpperCase()}</Text>
        <View style={s.cardGrid}>
          {sectionPieces.map(p => (
            <CatalogCard key={p.id} piece={p} active={activePiece?.id === p.id} favorite={favorites.includes(p.id)} onPress={() => onPick(p)} onFavorite={() => toggleFavorite(p.id)} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function CatalogCard({ piece, active, favorite, onPress, onFavorite }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.catalogCard, active && s.catalogCardActive]}>
      <View style={s.catalogThumb}><Icon name={piece.icon} size={24} color={C.accent} /></View>
      <Text style={s.catalogName} numberOfLines={1}>{piece.name}</Text>
      <View style={s.catalogFooter}>
        <Text style={s.catalogPrice}>${piece.price}</Text>
        <TouchableOpacity onPress={onFavorite} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Icon name={favorite ? 'star-fill' : 'star'} size={14} color={favorite ? C.gold : C.textFaint} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function Play3DScreen({ navigation, route }) {
  const { worldId, lotId, roomId } = route.params;
  const { worlds, profile, setRoomCells, setRoomStyle, awardXP } = useGame();
  const world = worlds.find(w => w.id === worldId);
  const lot = world?.lots.find(l => l.id === lotId);
  const room = lot?.rooms.find(r => r.id === roomId);

  const [activePiece, setActivePiece] = useState(null);
  const [activeColor, setActiveColor] = useState(COLORS[3].name);
  const [recent, setRecent] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [daytime, setDaytime] = useState(true);
  const [flying, setFlying] = useState(false);
  const [running, setRunning] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [chatLog, setChatLog] = useState([
    { name: 'ChloeBuilds', text: 'love this kitchen!', color: '#7C9473' },
    { name: 'OceanView', text: 'tysm!!', color: '#5C87A6' },
    { name: 'Savannahh', text: 'how did u do the ceiling?', color: '#C79A3A' },
    { name: 'OceanView', text: 'custom height!', color: '#5C87A6' },
  ]);
  const [chatDraft, setChatDraft] = useState('');
  const [note, setNote] = useState('');

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
    setCatalogOpen(false);
  };

  const toggleFavorite = (id) => setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

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

      {/* top-left: single menu button */}
      <View style={s.topLeft}>
        <TouchableOpacity style={s.roundBtn} onPress={() => setMenuOpen(v => !v)}>
          <Icon name="grid" size={17} color="#fff" />
        </TouchableOpacity>
        {menuOpen && (
          <View style={s.menuPanel}>
            <MenuRow icon="arrow-left" label="Exit to Worlds" onPress={() => navigation.goBack()} />
            <MenuRow icon="map" label="Plot Info" onPress={() => flash(`${lot.name} · ${world.theme.name}`)} />
            <MenuRow icon="settings" label="Settings" onPress={() => navigation.navigate('Settings')} />
            <View style={s.menuDivider} />
            <MenuRow icon="trending-up" label={flying ? 'Fly: On' : 'Fly: Off'} active={flying} onPress={() => setFlying(v => !v)} />
            <MenuRow icon="zap" label={running ? 'Run: On' : 'Run: Off'} active={running} onPress={() => setRunning(v => !v)} />
            <MenuRow icon={daytime ? 'sun' : 'cloud'} label={daytime ? 'Day' : 'Night'} onPress={() => setDaytime(v => !v)} />
          </View>
        )}
      </View>

      {/* top-center: world info */}
      <View style={s.topCenter}>
        <Icon name="map" size={13} color="#fff" />
        <Text style={s.worldInfoText} numberOfLines={1}>
          {lot.name} · {world.theme.name} · {daytime ? 'Day' : 'Night'} · {world.settings?.season || 'Summer'} · {world.settings?.weather || 'Clear'}
        </Text>
      </View>

      {/* top-right: currency + social */}
      <View style={s.topRight}>
        <View style={s.currencyPill}>
          <Icon name="star" size={13} color="#F2C94C" />
          <Text style={s.currencyText}>{profile.currency.toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={s.roundBtn} onPress={() => setSocialOpen(v => !v)}>
          <Icon name="message-circle" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {socialOpen && (
        <View style={s.socialPanel}>
          <Text style={s.socialTitle}>Neighborhood Chat</Text>
          {chatLog.slice(-4).map((m, i) => (
            <Text key={i} style={s.chatLine}><Text style={{ color: m.color, fontWeight: '700' }}>{m.name}: </Text>{m.text}</Text>
          ))}
          <View style={s.chatInputRow}>
            <TextInput value={chatDraft} onChangeText={setChatDraft} onSubmitEditing={sendChat} placeholder="Say something..." placeholderTextColor="rgba(255,255,255,0.5)" style={s.chatInput} />
          </View>
          <View style={s.menuDivider} />
          <Text style={s.socialTitle}>People Nearby</Text>
          <View style={s.leaderRow}>
            <Text style={s.leaderText}>{profile.name} (you)</Text>
            <Text style={s.leaderLevel}>{profile.level}</Text>
          </View>
          {FRIENDS.map((f, i) => (
            <View key={f.id} style={s.leaderRow}>
              <Text style={s.leaderText}>{f.name}</Text>
              <Text style={s.leaderLevel}>{LEVELS[i]}</Text>
            </View>
          ))}
        </View>
      )}

      {!!note && <View style={s.noteBanner}><Text style={s.noteText}>{note}</Text></View>}

      {/* bottom: hotbar + browse trigger (contextual catalog opens on demand) */}
      <View style={s.bottomBar}>
        {activePiece && (
          <View style={s.placingPill}>
            <Text style={s.placingText}>Placing: {activePiece.name}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: 10 }}>
              {activePiece.colors.map(cn => {
                const hex = COLORS.find(c => c.name === cn)?.hex;
                return <TouchableOpacity key={cn} onPress={() => setActiveColor(cn)} style={[s.colorDot, { backgroundColor: hex, borderColor: activeColor === cn ? '#fff' : 'transparent' }]} />;
              })}
            </ScrollView>
            <Text style={s.objCount}>{objectCount} objects</Text>
          </View>
        )}
        <View style={s.hotbarRow}>
          <TouchableOpacity style={s.browseBtn} onPress={() => setCatalogOpen(v => !v)}>
            <Icon name={catalogOpen ? 'chevron-down' : 'grid'} size={16} color="#fff" />
            <Text style={s.browseLabel}>Catalog</Text>
          </TouchableOpacity>
          <View style={s.hotbar}>
            {Array.from({ length: 8 }).map((_, i) => {
              const pieceId = recent[i];
              const piece = pieceId ? PIECES.find(p => p.id === pieceId) : null;
              return (
                <TouchableOpacity key={i} style={[s.hotSlot, activePiece && piece?.id === activePiece.id && s.hotSlotActive]} onPress={() => piece && pickPiece(piece)}>
                  <Text style={s.hotIndex}>{i + 1}</Text>
                  {piece && <Icon name={piece.icon} size={16} color="#fff" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <CatalogSheet
          visible={catalogOpen}
          onClose={() => setCatalogOpen(false)}
          recent={recent}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          onPick={pickPiece}
          activePiece={activePiece}
          room={room}
          onFloorColor={(name) => setRoomStyle(worldId, lotId, roomId, { floorColor: name })}
          onWallColor={(name) => setRoomStyle(worldId, lotId, roomId, { wallColor: name })}
        />
      </View>
    </SafeAreaView>
  );
}

function MenuRow({ icon, label, onPress, active }) {
  return (
    <TouchableOpacity style={s.menuRow} onPress={onPress}>
      <Icon name={icon} size={15} color={active ? C.accent : '#fff'} />
      <Text style={[s.menuRowLabel, active && { color: C.accent }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  topLeft: { position: 'absolute', top: 14, left: 14 },
  roundBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(20,16,12,0.55)', alignItems: 'center', justifyContent: 'center' },
  menuPanel: { marginTop: 8, backgroundColor: 'rgba(20,16,12,0.82)', borderRadius: RADIUS.md, padding: 8, width: 190 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 8 },
  menuRowLabel: { color: '#fff', fontSize: 13, fontWeight: '600' },
  menuDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 4 },
  topCenter: { position: 'absolute', top: 14, left: 60, right: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(20,16,12,0.55)', borderRadius: RADIUS.pill, paddingVertical: 8, paddingHorizontal: 14 },
  worldInfoText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  topRight: { position: 'absolute', top: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  currencyPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(20,16,12,0.55)', borderRadius: RADIUS.pill, paddingVertical: 8, paddingHorizontal: 12 },
  currencyText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  socialPanel: { position: 'absolute', top: 60, right: 14, backgroundColor: 'rgba(20,16,12,0.85)', borderRadius: RADIUS.md, padding: 12, width: 220 },
  socialTitle: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', marginBottom: 6 },
  chatLine: { color: '#fff', fontSize: 12, marginBottom: 2 },
  chatInputRow: { marginTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 6, marginBottom: 6 },
  chatInput: { color: '#fff', fontSize: 12 },
  leaderRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  leaderText: { color: '#fff', fontSize: 12 },
  leaderLevel: { color: '#F2C94C', fontSize: 12, fontWeight: '700' },
  noteBanner: { position: 'absolute', top: 68, alignSelf: 'center', backgroundColor: 'rgba(20,16,12,0.7)', borderRadius: RADIUS.pill, paddingVertical: 6, paddingHorizontal: 14 },
  noteText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  placingPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(76,143,209,0.85)', marginHorizontal: 14, marginBottom: 8, borderRadius: RADIUS.pill, paddingVertical: 6, paddingHorizontal: 12 },
  placingText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  objCount: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginLeft: 'auto' },
  colorDot: { width: 18, height: 18, borderRadius: 5, marginRight: 6, borderWidth: 2 },
  hotbarRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(20,16,12,0.72)', paddingVertical: 10, paddingHorizontal: 14, gap: 10 },
  browseBtn: { alignItems: 'center', backgroundColor: C.accent, borderRadius: RADIUS.md, paddingVertical: 8, paddingHorizontal: 12, gap: 2 },
  browseLabel: { color: '#fff', fontSize: 9, fontWeight: '700' },
  hotbar: { flexDirection: 'row', gap: 6, flex: 1 },
  hotSlot: { width: 42, height: 42, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  hotSlotActive: { borderWidth: 2, borderColor: C.accent },
  hotIndex: { position: 'absolute', top: 2, left: 4, color: 'rgba(255,255,255,0.6)', fontSize: 9 },

  sheet: { backgroundColor: C.surface, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.md, paddingTop: 6 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 8 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceAlt, borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 6, gap: 6, marginBottom: SPACING.sm },
  searchInput: { flex: 1, fontSize: 13, color: C.text },
  sectionLabel: { ...FONT.label, marginTop: SPACING.sm, marginBottom: 6 },
  swatchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  swatchGroupLabel: { ...FONT.caption, fontWeight: '700', marginRight: 4, width: 34 },
  swatch: { width: 22, height: 22, borderRadius: 6, borderWidth: 2 },
  sectionChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: RADIUS.pill, backgroundColor: C.surfaceAlt, marginRight: 6 },
  sectionChipActive: { backgroundColor: C.accent },
  sectionChipLabel: { ...FONT.caption, fontWeight: '700', color: C.textMuted },
  sectionChipLabelActive: { color: C.textOnAccent },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: SPACING.lg },
  catalogCard: { width: 96, backgroundColor: C.surfaceAlt, borderRadius: RADIUS.md, padding: 8 },
  catalogCardActive: { borderWidth: 2, borderColor: C.accent },
  catalogThumb: { width: '100%', height: 52, borderRadius: RADIUS.sm, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  catalogName: { fontSize: 11, fontWeight: '700', color: C.text },
  catalogFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 },
  catalogPrice: { fontSize: 11, color: C.textMuted },
});
