// Shelf-packs rooms left-to-right, wrapping rows, so a lot's rooms read as one
// continuous floor plan instead of a list.
export function layoutRooms(rooms, cellSize, gap, maxWidthCells) {
  let x = 0, y = 0, rowH = 0;
  const placed = [];
  for (const room of rooms) {
    const w = room.gridW * cellSize;
    const h = room.gridH * cellSize;
    if (x > 0 && (x + w) > maxWidthCells * cellSize) {
      x = 0;
      y += rowH + gap;
      rowH = 0;
    }
    placed.push({ room, x, y, w, h });
    x += w + gap;
    rowH = Math.max(rowH, h);
  }
  const totalW = Math.max(...placed.map(p => p.x + p.w), 0);
  const totalH = y + rowH;
  return { placed, totalW, totalH };
}
