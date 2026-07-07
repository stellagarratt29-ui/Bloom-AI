import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import PhotoCard from '../components/PhotoCard';
import FloorPlanRoom from '../components/FloorPlanRoom';
import { ScreenHeader, Button, Chip } from '../components/UI';
import { C, SPACING, FONT, RADIUS } from '../constants/theme';
import { useGame } from '../context/AppContext';
import { PIECES, FURNITURE_CATEGORIES, ROOM_TYPES, EXTERIOR_OPTIONS, COLORS } from '../constants/catalog';
import { layoutRooms } from '../utils/layoutRooms';

const CELL_SIZE = 26;
const DECORATE_CATS = ['decor', 'lighting', 'plants', 'wallart', 'storage'];

const TOOL_RAIL = [
  { key: 'rooms', icon: 'grid', label: 'Rooms', enabled: true },
  { key: 'walls', icon: 'layers', label: 'Walls', enabled: false },
  { key: 'windows', icon: 'image', label: 'Windows', enabled: false },
  { key: 'doors', icon: 'move', label: 'Doors', enabled: false },
  { key: 'stairs', icon: 'trending-up', label: 'Stairs', enabled: false },
  { key: 'roofs', icon: 'home', label: 'Roofs', enabled: true },
  { key: 'exterior', icon: 'tree', label: 'Exterior', enabled: true },
  { key: 'paths', icon: 'map', label: 'Paths', enabled: false },
  { key: 'pools', icon: 'droplet', label: 'Pools', enabled: true },
  { key: 'lighting', icon: 'sun', label: 'Lighting', enabled: true },
  { key: 'more', icon: 'more-horizontal', label: 'More', enabled: false },
];

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
    <ScrollView contentContainerStyle={{ padding: SPACING.lg, maxWidth: 640 }}>
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

function RoomDetailPanel({ world, lot, room, objectCount, onClose, onRecolorWall, onRecolorFloor, onReplaceAll, onRename, onOpenAI }) {
  const [nameEdit, setNameEdit] = useState(room.name);
  useEffect(() => setNameEdit(room.name), [room.id, room.name]);
  const rt = ROOM_TYPES.find(r => r.id === room.typeId) || ROOM_TYPES[0];
  const cap = room.gridW * room.gridH;

  return (
    <View style={s.panel}>
      <View style={s.panelHeader}>
        <TextInput
          value={nameEdit}
          onChangeText={setNameEdit}
          onSubmitEditing={() => onRename(nameEdit)}
          onBlur={() => onRename(nameEdit)}
          style={s.panelTitleInput}
        />
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="x" size={16} color={C.textFaint} />
        </TouchableOpacity>
      </View>
      <PhotoCard icon={rt.icon} accent={world.theme.palette} height={90} style={{ marginTop: SPACING.sm }} />

      <TouchableOpacity style={s.aiRow} onPress={onOpenAI}>
        <Icon name="sparkles" size={14} color={C.accentDeep} />
        <Text style={s.aiRowText}>Furnish with AI Designer</Text>
      </TouchableOpacity>

      <View style={s.panelRow}>
        <Text style={FONT.bodyMuted}>Objects</Text>
        <Text style={FONT.body}>{objectCount}/{cap}</Text>
      </View>

      <Text style={[FONT.label, { marginTop: SPACING.md }]}>WALL COLOR</Text>
      <View style={s.swatchRow}>
        {COLORS.slice(0, 8).map(c => (
          <TouchableOpacity key={c.name} onPress={() => onRecolorWall(c.name)} style={[s.swatch, { backgroundColor: c.hex, borderColor: room.wallColor === c.name ? C.accent : 'transparent' }]} />
        ))}
      </View>

      <Text style={[FONT.label, { marginTop: SPACING.md }]}>FLOORING</Text>
      <View style={s.swatchRow}>
        {COLORS.slice(0, 8).map(c => (
          <TouchableOpacity key={c.name} onPress={() => onRecolorFloor(c.name)} style={[s.swatch, { backgroundColor: c.hex, borderColor: room.floorColor === c.name ? C.accent : 'transparent' }]} />
        ))}
      </View>

      <Button label="Replace All" icon="refresh-cw" variant="secondary" onPress={onReplaceAll} style={{ marginTop: SPACING.lg }} />
    </View>
  );
}

function FurnitureBrowser({ categories, category, setCategory, search, setSearch, brushPiece, setBrushPiece, disabled }) {
  const pieces = useMemo(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return PIECES.filter(p => p.name.toLowerCase().includes(q));
    }
    const cats = category ? [category] : categories.map(c => c.id);
    return PIECES.filter(p => cats.includes(p.category));
  }, [search, category, categories]);

  return (
    <View style={s.furniturePanel}>
      <View style={s.furnitureHeader}>
        <Text style={FONT.h3}>Furniture</Text>
        <View style={s.searchBox}>
          <Icon name="search" size={13} color={C.textFaint} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search furniture..." placeholderTextColor={C.textFaint} style={s.searchInput} />
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
        <Chip label="All" active={!category} onPress={() => setCategory(null)} />
        {categories.map(c => <Chip key={c.id} label={c.name} active={category === c.id} onPress={() => setCategory(c.id)} />)}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
        {pieces.map(p => (
          <TouchableOpacity
            key={p.id}
            disabled={disabled}
            onPress={() => setBrushPiece(brushPiece?.id === p.id ? null : p)}
            style={[s.pieceCard, brushPiece?.id === p.id && s.pieceCardActive, disabled && { opacity: 0.4 }]}
          >
            <View style={s.pieceThumb}><Icon name={p.icon} size={20} color={C.accent} /></View>
            <Text style={s.pieceName} numberOfLines={1}>{p.name}</Text>
            <Text style={s.piecePrice}>${p.price}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {disabled && <Text style={[FONT.caption, { marginTop: 6 }]}>Select a room in the plan to start placing furniture.</Text>}
    </View>
  );
}

function BrushBar({ piece, mode, color, onColor, onApplyAll }) {
  if (!piece) return null;
  return (
    <View style={s.brushBar}>
      <Text style={s.brushBarLabel}>{mode === 'edit' ? 'Editing' : 'Placing'}: {piece.name}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: 12, flex: 1 }}>
        {piece.colors.map(cn => {
          const hex = COLORS.find(c => c.name === cn)?.hex;
          return (
            <TouchableOpacity key={cn} onPress={() => onColor(cn)} style={[s.swatchSm, { backgroundColor: hex, borderColor: color === cn ? C.accent : 'transparent' }]} />
          );
        })}
      </ScrollView>
      {mode === 'edit' && <Button label="Apply to All Matching" variant="ghost" onPress={onApplyAll} />}
    </View>
  );
}

function BulkEditPanel({ count, onDelete, onDuplicate, onDeselect }) {
  return (
    <View style={s.bulkPanel}>
      <Text style={FONT.h3}>Bulk Edit</Text>
      <Text style={[FONT.bodyMuted, { marginTop: 2 }]}>{count} item{count === 1 ? '' : 's'} selected</Text>
      <View style={{ marginTop: SPACING.sm, gap: 6 }}>
        <Button label="Delete Selected" icon="trash-2" variant="secondary" onPress={onDelete} disabled={!count} />
        <Button label="Duplicate Selected" icon="copy" variant="secondary" onPress={onDuplicate} disabled={!count} />
        <Button label="Deselect All" variant="ghost" onPress={onDeselect} />
      </View>
    </View>
  );
}

export default function BuildScreen({ navigation, route }) {
  const { worldId, lotId } = route.params;
  const { worlds, addRoom, deleteRoom, setRoomCells, setRoomStyle, renameRoom, updateExterior } = useGame();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const world = worlds.find(w => w.id === worldId);
  const lot = world?.lots.find(l => l.id === lotId);

  const [mode, setMode] = useState('build');
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [category, setCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [brushPiece, setBrushPiece] = useState(null);
  const [brushColor, setBrushColor] = useState(COLORS[0].name);
  const [selectedCellKey, setSelectedCellKey] = useState(null);
  const [multiMode, setMultiMode] = useState(false);
  const [multiSelected, setMultiSelected] = useState({});
  const [clipboard, setClipboard] = useState(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [note, setNote] = useState('');

  const [cells, setCells] = useState({});
  const [history, setHistory] = useState([{}]);
  const [histIndex, setHistIndex] = useState(0);

  const selectedRoom = lot?.rooms.find(r => r.id === selectedRoomId) || null;

  useEffect(() => {
    if (selectedRoom) {
      setCells(selectedRoom.cells);
      setHistory([selectedRoom.cells]);
      setHistIndex(0);
      setSelectedCellKey(null);
      setMultiSelected({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoomId]);

  const flashNote = (text) => { setNote(text); setTimeout(() => setNote(''), 1800); };

  if (!world || !lot) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <ScreenHeader title="Build" onBack={() => navigation.goBack()} />
        <Text style={[FONT.bodyMuted, { textAlign: 'center', marginTop: SPACING.xxl }]}>This lot no longer exists.</Text>
      </SafeAreaView>
    );
  }

  const rt = selectedRoom ? (ROOM_TYPES.find(r => r.id === selectedRoom.typeId) || ROOM_TYPES[0]) : null;
  const roomCats = rt ? FURNITURE_CATEGORIES.filter(c => rt.categories.includes(c.id)) : FURNITURE_CATEGORIES;
  const allowedCats = mode === 'decorate' ? roomCats.filter(c => DECORATE_CATS.includes(c.id)) : roomCats;

  const canvasWidthCells = Math.max(6, Math.floor(((isDesktop ? width - 240 - 280 - 60 : width - 40)) / CELL_SIZE));
  const { placed, totalW, totalH } = layoutRooms(lot.rooms, CELL_SIZE, 46, canvasWidthCells);
  const selectedPlaced = placed.find(p => p.room.id === selectedRoomId);

  const commit = useCallback((newCells) => {
    setCells(newCells);
    const truncated = history.slice(0, histIndex + 1);
    const nextHist = [...truncated, newCells];
    setHistory(nextHist);
    setHistIndex(nextHist.length - 1);
    setRoomCells(worldId, lotId, selectedRoomId, newCells);
  }, [history, histIndex, worldId, lotId, selectedRoomId, setRoomCells]);

  const undo = () => { if (histIndex <= 0) return; const idx = histIndex - 1; setHistIndex(idx); setCells(history[idx]); setRoomCells(worldId, lotId, selectedRoomId, history[idx]); };
  const redo = () => { if (histIndex >= history.length - 1) return; const idx = histIndex + 1; setHistIndex(idx); setCells(history[idx]); setRoomCells(worldId, lotId, selectedRoomId, history[idx]); };

  const handleSelectRoom = (roomId) => { setSelectedRoomId(roomId); setBrushPiece(null); };

  const handleCellPress = (gx, gy) => {
    const key = `${gx},${gy}`;
    if (multiMode) {
      setMultiSelected(prev => { const next = { ...prev }; if (next[key]) delete next[key]; else next[key] = true; return next; });
      return;
    }
    if (brushPiece) {
      commit({ ...cells, [key]: { pieceId: brushPiece.id, color: brushColor, material: brushPiece.materials[0] } });
      return;
    }
    setSelectedCellKey(cells[key] ? key : null);
  };

  const deleteSelected = () => {
    if (multiMode) { const next = { ...cells }; Object.keys(multiSelected).forEach(k => delete next[k]); commit(next); setMultiSelected({}); return; }
    if (selectedCellKey) { const next = { ...cells }; delete next[selectedCellKey]; commit(next); setSelectedCellKey(null); }
  };

  const duplicateSelected = () => {
    if (multiMode && Object.keys(multiSelected).length) {
      const next = { ...cells };
      const empties = [];
      for (let y = 0; y < selectedRoom.gridH; y++) for (let x = 0; x < selectedRoom.gridW; x++) { const k = `${x},${y}`; if (!next[k]) empties.push(k); }
      Object.keys(multiSelected).forEach((k, i) => { if (cells[k] && empties[i]) next[empties[i]] = { ...cells[k] }; });
      commit(next);
      return;
    }
    if (!selectedCellKey || !cells[selectedCellKey]) return;
    for (let y = 0; y < selectedRoom.gridH; y++) for (let x = 0; x < selectedRoom.gridW; x++) {
      const k = `${x},${y}`;
      if (!cells[k]) { commit({ ...cells, [k]: { ...cells[selectedCellKey] } }); return; }
    }
  };

  const mirrorRoom = () => {
    const next = {};
    Object.entries(cells).forEach(([k, v]) => { const [x, y] = k.split(',').map(Number); next[`${selectedRoom.gridW - 1 - x},${y}`] = v; });
    commit(next);
  };

  const copyLayout = () => setClipboard(cells);
  const pasteLayout = () => { if (clipboard) commit({ ...cells, ...clipboard }); };

  const duplicateRoom = () => {
    if (!selectedRoom) return;
    const newRoomId = addRoom(worldId, lotId, selectedRoom.typeId);
    setTimeout(() => setRoomCells(worldId, lotId, newRoomId, selectedRoom.cells), 0);
    flashNote('Room duplicated');
  };

  const deleteRoomAction = () => {
    if (!selectedRoom) return;
    deleteRoom(worldId, lotId, selectedRoom.id);
    setSelectedRoomId(null);
  };

  const replaceAll = () => {
    if (!selectedRoom) return;
    const next = {};
    Object.entries(cells).forEach(([k, v]) => { next[k] = { ...v, color: selectedRoom.wallColor }; });
    commit(next);
  };

  const handleRailPress = (item) => {
    if (item.key === 'exterior' || item.key === 'roofs' || item.key === 'paths') { setMode('landscape'); return; }
    if (item.key === 'pools') { updateExterior(worldId, lotId, { extras: lot.exterior.extras.includes('Pool') ? lot.exterior.extras.filter(e => e !== 'Pool') : [...lot.exterior.extras, 'Pool'] }); flashNote(lot.exterior.extras.includes('Pool') ? 'Pool removed' : 'Pool added'); return; }
    if (item.key === 'lighting') { setCategory('lighting'); if (!selectedRoomId && lot.rooms[0]) handleSelectRoom(lot.rooms[0].id); return; }
    if (item.key === 'rooms') { setShowAddRoom(v => !v); return; }
    flashNote(`${item.label} tools are coming soon`);
  };

  const objectCount = selectedRoom ? Object.keys(cells).length : 0;
  const editingPiece = selectedCellKey && cells[selectedCellKey] ? PIECES.find(p => p.id === cells[selectedCellKey].pieceId) : null;
  const activePiece = editingPiece || brushPiece;
  const activeMode = editingPiece ? 'edit' : 'place';
  const activeColor = editingPiece ? cells[selectedCellKey].color : brushColor;

  const handleColorPick = (cn) => {
    if (editingPiece) commit({ ...cells, [selectedCellKey]: { ...cells[selectedCellKey], color: cn } });
    else setBrushColor(cn);
  };

  const applyToAllMatching = () => {
    if (!editingPiece) return;
    const pid = cells[selectedCellKey].pieceId;
    const next = { ...cells };
    Object.keys(next).forEach(k => { if (next[k].pieceId === pid) next[k] = { ...next[k], color: activeColor }; });
    commit(next);
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScreenHeader title={lot.name} onBack={() => navigation.goBack()} />

      <View style={s.modeBar}>
        <View style={s.modeTabs}>
          {['build', 'decorate', 'landscape'].map(m => (
            <TouchableOpacity key={m} style={[s.modeTab, mode === m && s.modeTabActive]} onPress={() => setMode(m)}>
              <Text style={[s.modeTabLabel, mode === m && s.modeTabLabelActive]}>{m[0].toUpperCase() + m.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {mode !== 'landscape' && (
          <View style={s.toolbar}>
            <TouchableOpacity style={s.toolBtn} disabled={!selectedRoom || histIndex <= 0} onPress={undo}><Icon name="undo" size={15} color={C.text} /></TouchableOpacity>
            <TouchableOpacity style={s.toolBtn} disabled={!selectedRoom || histIndex >= history.length - 1} onPress={redo}><Icon name="redo" size={15} color={C.text} /></TouchableOpacity>
            <TouchableOpacity style={[s.toolBtn, multiMode && s.toolBtnActive]} onPress={() => { setMultiMode(v => !v); setMultiSelected({}); }}>
              <Icon name="grid" size={15} color={multiMode ? C.textOnAccent : C.text} />
            </TouchableOpacity>
            <TouchableOpacity style={s.toolBtn} disabled={!selectedRoom} onPress={copyLayout}><Icon name="copy" size={15} color={C.text} /></TouchableOpacity>
            <TouchableOpacity style={s.toolBtn} disabled={!clipboard} onPress={pasteLayout}><Icon name="save" size={15} color={C.text} /></TouchableOpacity>
            <TouchableOpacity style={s.toolBtn} disabled={!selectedCellKey} onPress={deleteSelected}><Icon name="trash-2" size={15} color={C.text} /></TouchableOpacity>
          </View>
        )}
      </View>
      {!!note && <View style={s.noteBar}><Text style={s.noteText}>{note}</Text></View>}

      {mode === 'landscape' ? (
        <ExteriorTab world={world} lot={lot} updateExterior={updateExterior} />
      ) : (
        <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>
          <View style={s.rail}>
            {TOOL_RAIL.map(item => (
              <TouchableOpacity key={item.key} style={[s.railBtn, !item.enabled && s.railBtnDisabled]} onPress={() => handleRailPress(item)}>
                <Icon name={item.icon} size={17} color={item.enabled ? C.text : C.textFaint} />
                <Text style={[s.railLabel, !item.enabled && { color: C.textFaint }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.xl }}>
            {showAddRoom && (
              <View style={s.addRoomPopover}>
                <Text style={[FONT.label, { marginBottom: SPACING.sm }]}>ADD A ROOM</Text>
                <View style={s.roomTypeGrid}>
                  {ROOM_TYPES.map(t => (
                    <TouchableOpacity key={t.id} style={s.roomTypeItem} onPress={() => { const id = addRoom(worldId, lotId, t.id); setShowAddRoom(false); handleSelectRoom(id); }}>
                      <Icon name={t.icon} size={16} color={C.accent} />
                      <Text style={s.roomTypeLabel}>{t.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={{ width: Math.max(totalW, 300), height: totalH + 30 }}>
              {placed.map(p => (
                <FloorPlanRoom
                  key={p.room.id}
                  room={p.room.id === selectedRoomId ? { ...p.room, cells } : p.room}
                  x={p.x}
                  y={p.y + 22}
                  cellSize={CELL_SIZE}
                  selected={p.room.id === selectedRoomId}
                  onSelectRoom={handleSelectRoom}
                  onCellPress={handleCellPress}
                  selectedCellKey={selectedCellKey}
                  multiSelected={multiSelected}
                />
              ))}
              {selectedPlaced && (
                <View style={[s.quickToolbar, { left: selectedPlaced.x, top: selectedPlaced.y - 6 }]}>
                  <TouchableOpacity style={s.quickBtn} onPress={duplicateRoom}><Icon name="copy" size={13} color={C.text} /></TouchableOpacity>
                  <TouchableOpacity style={s.quickBtn} onPress={mirrorRoom}><Icon name="move" size={13} color={C.text} /></TouchableOpacity>
                  <TouchableOpacity style={s.quickBtn} onPress={deleteRoomAction}><Icon name="trash-2" size={13} color={C.danger} /></TouchableOpacity>
                </View>
              )}
            </View>

            {!lot.rooms.length && <Text style={FONT.bodyMuted}>No rooms yet — use the Rooms tool to add one.</Text>}
            <Button label="Add Room" icon="plus" variant="secondary" onPress={() => setShowAddRoom(true)} style={{ marginTop: SPACING.lg, alignSelf: 'flex-start' }} />
          </ScrollView>

          {isDesktop && (
            selectedRoom
              ? <RoomDetailPanel
                  world={world} lot={lot} room={selectedRoom} objectCount={objectCount}
                  onClose={() => setSelectedRoomId(null)}
                  onRecolorWall={(name) => setRoomStyle(worldId, lotId, selectedRoom.id, { wallColor: name })}
                  onRecolorFloor={(name) => setRoomStyle(worldId, lotId, selectedRoom.id, { floorColor: name })}
                  onReplaceAll={replaceAll}
                  onRename={(name) => renameRoom(worldId, lotId, selectedRoom.id, name || selectedRoom.name)}
                  onOpenAI={() => navigation.navigate('AIDesigner', { worldId, lotId, roomId: selectedRoom.id })}
                />
              : <View style={s.panel}><Text style={FONT.h3}>Lot Overview</Text><Text style={[FONT.bodyMuted, { marginTop: 6 }]}>Select a room in the floor plan to edit its furniture, wall color, and flooring.</Text></View>
          )}
        </View>
      )}

      {mode !== 'landscape' && (
        <View>
          <BrushBar piece={activePiece} mode={activeMode} color={activeColor} onColor={handleColorPick} onApplyAll={applyToAllMatching} />
          <View style={s.bottomRow}>
            <FurnitureBrowser
              categories={allowedCats} category={category} setCategory={setCategory}
              search={search} setSearch={setSearch}
              brushPiece={brushPiece} setBrushPiece={(p) => { setSelectedCellKey(null); setBrushPiece(p); if (p) setBrushColor(p.colors[3] || p.colors[0]); }}
              disabled={!selectedRoom}
            />
            {multiMode && <BulkEditPanel count={Object.keys(multiSelected).length} onDelete={deleteSelected} onDuplicate={duplicateSelected} onDeselect={() => setMultiSelected({})} />}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  modeBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm, flexWrap: 'wrap', gap: 8 },
  modeTabs: { flexDirection: 'row', backgroundColor: C.surfaceAlt, borderRadius: RADIUS.pill, padding: 3 },
  modeTab: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: RADIUS.pill },
  modeTabActive: { backgroundColor: C.accent },
  modeTabLabel: { ...FONT.caption, fontWeight: '700', color: C.textMuted },
  modeTabLabelActive: { color: C.textOnAccent },
  toolbar: { flexDirection: 'row', gap: 6 },
  toolBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  toolBtnActive: { backgroundColor: C.accent },
  noteBar: { alignItems: 'center', paddingBottom: 6 },
  noteText: { ...FONT.caption, backgroundColor: C.accentSoft, color: C.accentDeep, paddingVertical: 4, paddingHorizontal: 12, borderRadius: RADIUS.pill },
  rail: { width: 88, borderRightWidth: 1, borderRightColor: C.border, paddingVertical: SPACING.md, backgroundColor: C.surface },
  railBtn: { alignItems: 'center', paddingVertical: 10, gap: 3 },
  railBtnDisabled: { opacity: 0.45 },
  railLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted, textAlign: 'center' },
  addRoomPopover: { backgroundColor: C.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: C.border, maxWidth: 420 },
  roomTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roomTypeItem: { width: 84, alignItems: 'center', paddingVertical: 10, backgroundColor: C.surfaceAlt, borderRadius: RADIUS.md },
  roomTypeLabel: { ...FONT.caption, marginTop: 4, color: C.textMuted, textAlign: 'center' },
  quickToolbar: { position: 'absolute', flexDirection: 'row', gap: 4, backgroundColor: C.surface, borderRadius: RADIUS.pill, padding: 4, ...({ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6 }) },
  quickBtn: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surfaceAlt },
  panel: { width: 280, borderLeftWidth: 1, borderLeftColor: C.border, padding: SPACING.lg, backgroundColor: C.surface },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelTitleInput: { ...FONT.h3, flex: 1, paddingVertical: 2 },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.accentSoft, borderRadius: RADIUS.pill, paddingVertical: 6, paddingHorizontal: 10, alignSelf: 'flex-start', marginTop: SPACING.sm },
  aiRowText: { ...FONT.caption, color: C.accentDeep, fontWeight: '700' },
  panelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  swatch: { width: 26, height: 26, borderRadius: 8, borderWidth: 2 },
  bottomRow: { borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface, flexDirection: 'row', flexWrap: 'wrap' },
  brushBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: 8, backgroundColor: C.accentSoft, borderTopWidth: 1, borderTopColor: C.border, flexWrap: 'wrap', gap: 8 },
  brushBarLabel: { ...FONT.caption, color: C.accentDeep, fontWeight: '700' },
  swatchSm: { width: 20, height: 20, borderRadius: 6, marginRight: 6, borderWidth: 2 },
  furniturePanel: { flex: 1, minWidth: 280, padding: SPACING.md },
  furnitureHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceAlt, borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 6, gap: 6, minWidth: 180 },
  searchInput: { flex: 1, fontSize: 13, color: C.text, outlineStyle: 'none' },
  pieceCard: { width: 92, marginRight: 8, backgroundColor: C.surfaceAlt, borderRadius: RADIUS.md, padding: 8, alignItems: 'flex-start' },
  pieceCardActive: { backgroundColor: C.accentSoft, borderWidth: 2, borderColor: C.accent },
  pieceThumb: { width: '100%', height: 40, borderRadius: RADIUS.sm, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  pieceName: { fontSize: 11, fontWeight: '700', color: C.text },
  piecePrice: { fontSize: 11, color: C.textMuted, marginTop: 1 },
  bulkPanel: { width: 240, borderLeftWidth: 1, borderLeftColor: C.border, padding: SPACING.md },
  pickerItem: { alignItems: 'center', marginRight: 4 },
  colorDot: { width: 22, height: 22, borderRadius: 11, marginBottom: 4, marginRight: 6 },
  extrasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
});
