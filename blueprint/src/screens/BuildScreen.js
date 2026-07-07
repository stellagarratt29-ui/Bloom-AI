import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import GridCanvas from '../components/GridCanvas';
import { ScreenHeader, Button, Card, Chip, SectionHeader } from '../components/UI';
import { C, SPACING, FONT, RADIUS } from '../constants/theme';
import { useGame } from '../context/AppContext';
import { PIECES, FURNITURE_CATEGORIES, ROOM_TYPES, EXTERIOR_OPTIONS, COLORS } from '../constants/catalog';

function ExteriorPicker({ label, options, value, onChange, isColor }) {
  return (
    <View style={{ marginBottom: SPACING.lg }}>
      <Text style={FONT.label}>{label.toUpperCase()}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
        {options.map(opt => {
          const name = isColor ? opt.name : opt;
          return (
            <TouchableOpacity key={name} onPress={() => onChange(name)} style={s.pickerItem}>
              {isColor && <View style={[s.colorDot, { backgroundColor: opt.hex, borderColor: value === name ? C.accent : C.border, borderWidth: value === name ? 2 : 1 }]} />}
              <Chip label={name} active={value === name} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function ExteriorTab({ world, lot, updateExterior }) {
  const ext = lot.exterior;
  const toggleExtra = (extra) => {
    const has = ext.extras.includes(extra);
    updateExterior(world.id, lot.id, { extras: has ? ext.extras.filter(e => e !== extra) : [...ext.extras, extra] });
  };
  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
      <ExteriorPicker label="Roof Style" options={EXTERIOR_OPTIONS.roofStyles} value={ext.roofStyle} onChange={v => updateExterior(world.id, lot.id, { roofStyle: v })} />
      <ExteriorPicker label="Roof Color" options={EXTERIOR_OPTIONS.roofColors} value={ext.roofColor} onChange={v => updateExterior(world.id, lot.id, { roofColor: v })} isColor />
      <ExteriorPicker label="Siding" options={EXTERIOR_OPTIONS.siding} value={ext.siding} onChange={v => updateExterior(world.id, lot.id, { siding: v })} />
      <ExteriorPicker label="Driveway" options={EXTERIOR_OPTIONS.driveway} value={ext.driveway} onChange={v => updateExterior(world.id, lot.id, { driveway: v })} />
      <ExteriorPicker label="Fence" options={EXTERIOR_OPTIONS.fence} value={ext.fence} onChange={v => updateExterior(world.id, lot.id, { fence: v })} />
      <ExteriorPicker label="Garden" options={EXTERIOR_OPTIONS.garden} value={ext.garden} onChange={v => updateExterior(world.id, lot.id, { garden: v })} />
      <Text style={FONT.label}>EXTRAS</Text>
      <View style={s.extrasRow}>
        {EXTERIOR_OPTIONS.extras.map(extra => (
          <Chip key={extra} label={extra} active={ext.extras.includes(extra)} onPress={() => toggleExtra(extra)} />
        ))}
      </View>
    </ScrollView>
  );
}

function RoomsListTab({ world, lot, navigation, addRoom, deleteRoom }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
      {lot.rooms.map(room => {
        const count = Object.keys(room.cells).length;
        const rt = ROOM_TYPES.find(r => r.id === room.typeId) || ROOM_TYPES[0];
        return (
          <TouchableOpacity key={room.id} activeOpacity={0.85} onPress={() => navigation.setParams({ roomId: room.id })}>
            <Card style={s.roomCard}>
              <View style={s.roomGlyph}><Icon name={rt.icon} size={18} color={C.accent} /></View>
              <View style={{ flex: 1 }}>
                <Text style={FONT.h3}>{room.name}</Text>
                <Text style={FONT.bodyMuted}>{count} item{count === 1 ? '' : 's'} placed</Text>
              </View>
              <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => deleteRoom(world.id, lot.id, room.id)}>
                <Icon name="trash-2" size={18} color={C.textFaint} />
              </TouchableOpacity>
            </Card>
          </TouchableOpacity>
        );
      })}

      {pickerOpen ? (
        <Card style={{ marginTop: SPACING.sm }}>
          <Text style={[FONT.label, { marginBottom: SPACING.sm }]}>CHOOSE A ROOM TYPE</Text>
          <View style={s.roomTypeGrid}>
            {ROOM_TYPES.map(rt => (
              <TouchableOpacity
                key={rt.id}
                style={s.roomTypeItem}
                onPress={() => {
                  const roomId = addRoom(world.id, lot.id, rt.id);
                  setPickerOpen(false);
                  navigation.setParams({ roomId });
                }}
              >
                <Icon name={rt.icon} size={18} color={C.accent} />
                <Text style={s.roomTypeLabel}>{rt.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      ) : (
        <Button label="Add Room" icon="plus" variant="secondary" onPress={() => setPickerOpen(true)} style={{ marginTop: SPACING.sm }} />
      )}
    </ScrollView>
  );
}

function RoomEditor({ world, lot, room, navigation, setRoomCells }) {
  const { width } = useWindowDimensions();
  const [cells, setCells] = useState(room.cells);
  const [history, setHistory] = useState([room.cells]);
  const [histIndex, setHistIndex] = useState(0);
  const [category, setCategory] = useState(FURNITURE_CATEGORIES.find(c => room.categoriesAllowed?.includes(c.id))?.id
    || (ROOM_TYPES.find(r => r.id === room.typeId)?.categories[0]) || 'decor');
  const [brushPiece, setBrushPiece] = useState(null);
  const [brushColor, setBrushColor] = useState(COLORS[0].name);
  const [selectedKey, setSelectedKey] = useState(null);
  const [multiMode, setMultiMode] = useState(false);
  const [multiSelected, setMultiSelected] = useState({});
  const [clipboard, setClipboard] = useState(null);

  const rt = ROOM_TYPES.find(r => r.id === room.typeId) || ROOM_TYPES[0];
  const allowedCats = FURNITURE_CATEGORIES.filter(c => rt.categories.includes(c.id));
  const categoryPieces = useMemo(() => PIECES.filter(p => p.category === category), [category]);

  const cellSize = Math.min(48, Math.floor((width - SPACING.lg * 2 - 16) / room.gridW));

  const commit = useCallback((newCells) => {
    setCells(newCells);
    const truncated = history.slice(0, histIndex + 1);
    const nextHist = [...truncated, newCells];
    setHistory(nextHist);
    setHistIndex(nextHist.length - 1);
    setRoomCells(world.id, lot.id, room.id, newCells);
  }, [history, histIndex, world.id, lot.id, room.id, setRoomCells]);

  const undo = () => {
    if (histIndex <= 0) return;
    const idx = histIndex - 1;
    setHistIndex(idx);
    setCells(history[idx]);
    setRoomCells(world.id, lot.id, room.id, history[idx]);
  };
  const redo = () => {
    if (histIndex >= history.length - 1) return;
    const idx = histIndex + 1;
    setHistIndex(idx);
    setCells(history[idx]);
    setRoomCells(world.id, lot.id, room.id, history[idx]);
  };

  const handleCellPress = (x, y) => {
    const key = `${x},${y}`;
    if (multiMode) {
      setMultiSelected(prev => {
        const next = { ...prev };
        if (next[key]) delete next[key]; else next[key] = true;
        return next;
      });
      return;
    }
    if (brushPiece) {
      commit({ ...cells, [key]: { pieceId: brushPiece.id, color: brushColor, material: brushPiece.materials[0] } });
      return;
    }
    setSelectedKey(cells[key] ? key : null);
  };

  const deleteSelected = () => {
    if (multiMode) {
      const next = { ...cells };
      Object.keys(multiSelected).forEach(k => delete next[k]);
      commit(next);
      setMultiSelected({});
      return;
    }
    if (selectedKey) {
      const next = { ...cells };
      delete next[selectedKey];
      commit(next);
      setSelectedKey(null);
    }
  };

  const duplicateSelected = () => {
    if (!selectedKey || !cells[selectedKey]) return;
    for (let y = 0; y < room.gridH; y++) {
      for (let x = 0; x < room.gridW; x++) {
        const k = `${x},${y}`;
        if (!cells[k]) {
          commit({ ...cells, [k]: { ...cells[selectedKey] } });
          return;
        }
      }
    }
  };

  const mirror = () => {
    const next = {};
    Object.entries(cells).forEach(([k, v]) => {
      const [x, y] = k.split(',').map(Number);
      next[`${room.gridW - 1 - x},${y}`] = v;
    });
    commit(next);
  };

  const copyLayout = () => setClipboard(cells);
  const pasteLayout = () => { if (clipboard) commit({ ...cells, ...clipboard }); };

  const recolorMatching = () => {
    if (!selectedKey || !cells[selectedKey]) return;
    const pid = cells[selectedKey].pieceId;
    const next = { ...cells };
    Object.keys(next).forEach(k => { if (next[k].pieceId === pid) next[k] = { ...next[k], color: brushColor }; });
    commit(next);
  };

  const selectedCell = selectedKey ? cells[selectedKey] : null;
  const selectedPieceMeta = selectedCell ? PIECES.find(p => p.id === selectedCell.pieceId) : null;

  const TOOLS = [
    { icon: 'undo', onPress: undo, disabled: histIndex <= 0 },
    { icon: 'redo', onPress: redo, disabled: histIndex >= history.length - 1 },
    { icon: 'grid', label: 'Select', onPress: () => { setMultiMode(m => !m); setMultiSelected({}); }, active: multiMode },
    { icon: 'copy', onPress: copyLayout },
    { icon: 'save', label: 'Paste', onPress: pasteLayout, disabled: !clipboard },
    { icon: 'layers', label: 'Duplicate', onPress: duplicateSelected, disabled: !selectedKey },
    { icon: 'move', label: 'Mirror', onPress: mirror },
    { icon: 'trash-2', onPress: deleteSelected, disabled: !selectedKey && Object.keys(multiSelected).length === 0 },
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={s.roomToolbar}>
        {TOOLS.map((t, i) => (
          <TouchableOpacity key={i} disabled={t.disabled} onPress={t.onPress} style={[s.toolBtn, t.active && s.toolBtnActive, t.disabled && { opacity: 0.35 }]}>
            <Icon name={t.icon} size={17} color={t.active ? C.textOnAccent : C.text} />
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[s.toolBtn, s.aiBtn]}
          onPress={() => navigation.navigate('AIDesigner', { worldId: world.id, lotId: lot.id, roomId: room.id })}
        >
          <Icon name="sparkles" size={17} color={C.textOnAccent} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingVertical: SPACING.lg }}>
        <GridCanvas gridW={room.gridW} gridH={room.gridH} cells={cells} cellSize={cellSize} selected={selectedKey} onCellPress={handleCellPress} />
        {multiMode && Object.keys(multiSelected).length > 0 && (
          <Text style={[FONT.caption, { marginTop: 8 }]}>{Object.keys(multiSelected).length} selected — tap trash to bulk delete</Text>
        )}

        {selectedPieceMeta && (
          <Card style={s.editPanel}>
            <Text style={FONT.h3}>{selectedPieceMeta.name}</Text>
            <Text style={[FONT.label, { marginTop: SPACING.sm }]}>COLOR</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
              {selectedPieceMeta.colors.map(cn => {
                const hex = COLORS.find(c => c.name === cn)?.hex;
                return (
                  <TouchableOpacity
                    key={cn}
                    onPress={() => { setBrushColor(cn); commit({ ...cells, [selectedKey]: { ...cells[selectedKey], color: cn } }); }}
                    style={[s.colorDot, { backgroundColor: hex, borderColor: selectedCell.color === cn ? C.accent : C.border, borderWidth: selectedCell.color === cn ? 2 : 1 }]}
                  />
                );
              })}
            </ScrollView>
            <Button label="Apply Color to All Matching" variant="ghost" onPress={recolorMatching} style={{ marginTop: SPACING.sm, alignSelf: 'flex-start' }} />
          </Card>
        )}
      </ScrollView>

      <View style={s.trayWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.categoryRow}>
          {allowedCats.map(c => (
            <Chip key={c.id} label={c.name} active={category === c.id} onPress={() => { setCategory(c.id); setBrushPiece(null); }} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pieceRow}>
          {categoryPieces.map(p => (
            <TouchableOpacity
              key={p.id}
              onPress={() => { setBrushPiece(p); setBrushColor(p.colors[0]); setSelectedKey(null); }}
              style={[s.pieceItem, brushPiece?.id === p.id && s.pieceItemActive]}
            >
              <Icon name={p.icon} size={20} color={brushPiece?.id === p.id ? C.textOnAccent : C.text} />
              <Text style={[s.pieceLabel, brushPiece?.id === p.id && { color: C.textOnAccent }]} numberOfLines={1}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {brushPiece && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {brushPiece.colors.map(cn => {
              const hex = COLORS.find(c => c.name === cn)?.hex;
              return (
                <TouchableOpacity key={cn} onPress={() => setBrushColor(cn)} style={[s.colorDot, { backgroundColor: hex, borderColor: brushColor === cn ? C.accent : C.border, borderWidth: brushColor === cn ? 2 : 1 }]} />
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

export default function BuildScreen({ navigation, route }) {
  const { worldId, lotId, roomId } = route.params;
  const { worlds, addRoom, deleteRoom, setRoomCells, updateExterior } = useGame();
  const [tab, setTab] = useState('rooms');

  const world = worlds.find(w => w.id === worldId);
  const lot = world?.lots.find(l => l.id === lotId);
  const room = roomId ? lot?.rooms.find(r => r.id === roomId) : null;

  if (!world || !lot) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <ScreenHeader title="Build" onBack={() => navigation.goBack()} />
        <Text style={[FONT.bodyMuted, { textAlign: 'center', marginTop: SPACING.xxl }]}>This lot no longer exists.</Text>
      </SafeAreaView>
    );
  }

  if (room) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <ScreenHeader title={room.name} onBack={() => navigation.setParams({ roomId: undefined })} />
        <RoomEditor world={world} lot={lot} room={room} navigation={navigation} setRoomCells={setRoomCells} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScreenHeader title={lot.name} onBack={() => navigation.goBack()} />
      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tabBtn, tab === 'rooms' && s.tabBtnActive]} onPress={() => setTab('rooms')}>
          <Text style={[s.tabLabel, tab === 'rooms' && s.tabLabelActive]}>Rooms</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, tab === 'exterior' && s.tabBtnActive]} onPress={() => setTab('exterior')}>
          <Text style={[s.tabLabel, tab === 'exterior' && s.tabLabelActive]}>Exterior</Text>
        </TouchableOpacity>
      </View>
      {tab === 'rooms'
        ? <RoomsListTab world={world} lot={lot} navigation={navigation} addRoom={addRoom} deleteRoom={deleteRoom} />
        : <ExteriorTab world={world} lot={lot} updateExterior={updateExterior} />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  tabRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.sm },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: RADIUS.pill, backgroundColor: C.surfaceAlt },
  tabBtnActive: { backgroundColor: C.accent },
  tabLabel: { ...FONT.label, color: C.textMuted },
  tabLabelActive: { color: C.textOnAccent },
  pickerItem: { alignItems: 'center', marginRight: 4 },
  colorDot: { width: 22, height: 22, borderRadius: 11, marginBottom: 4, marginRight: 6 },
  extrasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  roomCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  roomGlyph: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  roomTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roomTypeItem: { width: '30%', alignItems: 'center', paddingVertical: 10, backgroundColor: C.surfaceAlt, borderRadius: RADIUS.md },
  roomTypeLabel: { ...FONT.caption, marginTop: 4, color: C.textMuted, textAlign: 'center' },
  roomToolbar: { flexDirection: 'row', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: 6, borderBottomWidth: 1, borderBottomColor: C.border, flexWrap: 'wrap' },
  toolBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  toolBtnActive: { backgroundColor: C.accent },
  aiBtn: { backgroundColor: C.accentDeep, marginLeft: 'auto' },
  editPanel: { marginTop: SPACING.lg, width: '90%' },
  trayWrap: { borderTopWidth: 1, borderTopColor: C.border, paddingVertical: SPACING.sm, backgroundColor: C.surface },
  categoryRow: { paddingHorizontal: SPACING.md },
  pieceRow: { paddingHorizontal: SPACING.md, marginTop: 8 },
  pieceItem: { alignItems: 'center', justifyContent: 'center', width: 68, height: 60, borderRadius: RADIUS.md, backgroundColor: C.surfaceAlt, marginRight: 8 },
  pieceItemActive: { backgroundColor: C.accent },
  pieceLabel: { ...FONT.caption, marginTop: 4, textAlign: 'center', paddingHorizontal: 2 },
});
