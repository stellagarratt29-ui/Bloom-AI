import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from './Icon';
import { C, RADIUS } from '../constants/theme';
import { PIECES } from '../constants/catalog';
import { COLORS } from '../constants/catalog';

const pieceById = Object.fromEntries(PIECES.map(p => [p.id, p]));
const colorHex = (name) => (COLORS.find(c => c.name === name) || {}).hex || C.accent;

export default function GridCanvas({ gridW, gridH, cells, cellSize = 40, selected, onCellPress }) {
  const rows = [];
  for (let y = 0; y < gridH; y++) {
    const rowCells = [];
    for (let x = 0; x < gridW; x++) {
      const key = `${x},${y}`;
      const cell = cells[key];
      const piece = cell ? pieceById[cell.pieceId] : null;
      const isSelected = selected === key;
      rowCells.push(
        <TouchableOpacity
          key={key}
          onPress={() => onCellPress(x, y)}
          activeOpacity={0.7}
          style={[
            st.cell,
            { width: cellSize, height: cellSize },
            piece ? { backgroundColor: colorHex(cell.color) + '33', borderColor: colorHex(cell.color) } : null,
            isSelected && st.cellSelected,
          ]}
        >
          {piece ? (
            <Icon name={piece.icon} size={Math.max(14, cellSize * 0.42)} color={colorHex(cell.color)} />
          ) : null}
        </TouchableOpacity>
      );
    }
    rows.push(<View key={y} style={st.row}>{rowCells}</View>);
  }
  return <View style={st.grid}>{rows}</View>;
}

const st = StyleSheet.create({
  grid: {
    backgroundColor: C.surfaceAlt, borderRadius: RADIUS.md, padding: 4,
    borderWidth: 1, borderColor: C.border, alignSelf: 'center',
  },
  row: { flexDirection: 'row' },
  cell: {
    borderWidth: 1, borderColor: C.border, backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center', margin: 1, borderRadius: 4,
  },
  cellSelected: { borderColor: C.accent, borderWidth: 2 },
});
