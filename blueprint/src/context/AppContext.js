import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { matchTheme, ROOM_TYPES, EXTERIOR_OPTIONS } from '../constants/catalog';

const STORAGE_KEY = '@blueprint_v2';
const GameContext = createContext(null);

const uid = (p = 'id') => `${p}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

function defaultExterior() {
  return {
    roofStyle: EXTERIOR_OPTIONS.roofStyles[0],
    roofColor: EXTERIOR_OPTIONS.roofColors[0].name,
    siding: EXTERIOR_OPTIONS.siding[0],
    driveway: EXTERIOR_OPTIONS.driveway[0],
    fence: EXTERIOR_OPTIONS.fence[0],
    garden: EXTERIOR_OPTIONS.garden[0],
    extras: [],
  };
}

function makeRoom(roomTypeId, sizeOverride) {
  const rt = ROOM_TYPES.find(r => r.id === roomTypeId) || ROOM_TYPES[0];
  return {
    id: uid('room'),
    typeId: rt.id,
    name: rt.name,
    gridW: sizeOverride?.gridW || rt.gridW,
    gridH: sizeOverride?.gridH || rt.gridH,
    cells: {},
    wallColor: 'Warm White',
    floorColor: 'Sand',
  };
}

// A lot spawns as an empty buildable pad (no walls) inside the neighborhood —
// the player draws their own foundation rather than starting inside a pre-built box.
function makeLot(name) {
  return {
    id: uid('lot'),
    name,
    exterior: defaultExterior(),
    plotW: 14,
    plotH: 11,
    rooms: [],
  };
}

function makeWorld(name, themeOverride, settings) {
  const theme = themeOverride || matchTheme(name);
  return {
    id: uid('world'),
    name: name || theme.name,
    theme,
    settings: settings || { timeOfDay: 'Golden Hour', season: 'Summer', weather: 'Clear' },
    createdAt: Date.now(),
    lots: [makeLot('Lot 1')],
  };
}

const DEFAULT_STATE = {
  profile: { name: 'Builder', level: 1, xp: 0, currency: 800 },
  worlds: [],
  activeWorldId: null,
};

export function GameProvider({ children }) {
  const [loaded, setLoaded] = useState(false);
  const [state, setState] = useState(DEFAULT_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setState({ ...DEFAULT_STATE, ...JSON.parse(raw) });
      } catch (e) { /* fall back to defaults */ }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, loaded]);

  const update = useCallback((fn) => setState(prev => fn(prev)), []);

  const awardXP = useCallback((amount) => {
    update(prev => {
      let xp = prev.profile.xp + amount;
      let level = prev.profile.level;
      let xpToNext = level * 200;
      while (xp >= xpToNext) { xp -= xpToNext; level += 1; xpToNext = level * 200; }
      return { ...prev, profile: { ...prev.profile, xp, level } };
    });
  }, [update]);

  const createWorld = useCallback((name, themeOverride, settings) => {
    const world = makeWorld(name, themeOverride, settings);
    update(prev => ({ ...prev, worlds: [world, ...prev.worlds], activeWorldId: world.id }));
    awardXP(50);
    return world;
  }, [update, awardXP]);

  const deleteWorld = useCallback((worldId) => {
    update(prev => ({ ...prev, worlds: prev.worlds.filter(w => w.id !== worldId) }));
  }, [update]);

  const buildRoomFootprint = useCallback((worldId, lotId, gridW, gridH) => {
    const room = makeRoom('custom', { gridW, gridH });
    update(prev => ({
      ...prev,
      worlds: prev.worlds.map(w => w.id !== worldId ? w : {
        ...w,
        lots: w.lots.map(l => l.id !== lotId ? l : { ...l, rooms: [room] }),
      }),
    }));
    awardXP(30);
    return room;
  }, [update, awardXP]);

  const setRoomCells = useCallback((worldId, lotId, roomId, cells) => {
    update(prev => ({
      ...prev,
      worlds: prev.worlds.map(w => w.id !== worldId ? w : {
        ...w,
        lots: w.lots.map(l => l.id !== lotId ? l : {
          ...l,
          rooms: l.rooms.map(r => r.id !== roomId ? r : { ...r, cells }),
        }),
      }),
    }));
  }, [update]);

  const setRoomStyle = useCallback((worldId, lotId, roomId, patch) => {
    update(prev => ({
      ...prev,
      worlds: prev.worlds.map(w => w.id !== worldId ? w : {
        ...w,
        lots: w.lots.map(l => l.id !== lotId ? l : {
          ...l,
          rooms: l.rooms.map(r => r.id !== roomId ? r : { ...r, ...patch }),
        }),
      }),
    }));
  }, [update]);

  const value = {
    loaded, ...state,
    createWorld, deleteWorld, buildRoomFootprint, setRoomCells, setRoomStyle, awardXP,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
