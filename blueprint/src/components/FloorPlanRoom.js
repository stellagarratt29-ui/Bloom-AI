import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from './Icon';
import { C } from '../constants/theme';
import { PIECES, COLORS } from '../constants/catalog';

const pieceById = Object.fromEntries(PIECES.map(p => [p.id, p]));
const colorHex = (name) => (COLORS.find(c => c.name === name) || {}).hex || C.accent;

export default function FloorPlanRoom({ room, x, y, cellSize, selected, onSelectRoom, onCellPress, selectedCellKey, multiSelected }) {
  const floorHex = colorHex(room.floorColor);
  const wallHex = colorHex(room.wallColor);

  const rows = [];
  for (let gy = 0; gy < room.gridH; gy++) {
    const cols = [];
    for (let gx = 0; gx < room.gridW; gx++) {
      const key = `${gx},${gy}`;
      const cell = room.cells[key];
      const piece = cell ? pieceById[cell.pieceId] : null;
      const isCellSelected = selected && selectedCellKey === key;
      const isMulti = selected && multiSelected && multiSelected[key];
      cols.push(
        <TouchableOpacity
          key={key}
          activeOpacity={selected ? 0.6 : 1}
          onPress={() => selected ? onCellPress(gx, gy) : onSelectRoom(room.id)}
          style={[
            st.cell,
            { width: cellSize, height: cellSize },
            piece && { backgroundColor: colorHex(cell.color) + '30' },
            isCellSelected && st.cellSelected,
            isMulti && st.cellMulti,
          ]}
        >
          {piece && <Icon name={piece.icon} size={Math.max(11, cellSize * 0.5)} color={colorHex(cell.color)} strokeWidth={1.6} />}
        </TouchableOpacity>
      );
    }
    rows.push(<View key={gy} style={{ flexDirection: 'row' }}>{cols}</View>);
  }

  return (
    <View style={[st.wrap, { left: x, top: y }]}>
      <TouchableOpacity onPress={() => onSelectRoom(room.id)} activeOpacity={0.85}>
        <Text style={[st.label, selected && st.labelActive]} numberOfLines={1}>{room.name}</Text>
      </TouchableOpacity>
      <View style={[st.room, { backgroundColor: floorHex + '35', borderColor: selected ? C.accent : wallHex, borderWidth: selected ? 3 : 4 }]}>
        {rows}
      </View>
      {selected && (
        <>
          <View style={[st.handle, { left: -4, top: 18 }]} />
          <View style={[st.handle, { right: -4, top: 18 }]} />
          <View style={[st.handle, { left: -4, bottom: -4 }]} />
          <View style={[st.handle, { right: -4, bottom: -4 }]} />
        </>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { position: 'absolute' },
  label: { fontSize: 12, fontWeight: '700', color: C.textMuted, marginBottom: 3 },
  labelActive: { color: C.accentDeep },
  room: { borderRadius: 4, overflow: 'hidden' },
  cell: { alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.05)' },
  cellSelected: { borderColor: C.accent, borderWidth: 2 },
  cellMulti: { backgroundColor: C.accentSoft },
  handle: { position: 'absolute', width: 9, height: 9, borderRadius: 2, backgroundColor: '#fff', borderWidth: 2, borderColor: C.accent },
});
