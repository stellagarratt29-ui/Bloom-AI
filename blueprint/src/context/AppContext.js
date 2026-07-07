import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { matchTheme, ROOM_TYPES, EXTERIOR_OPTIONS } from '../constants/catalog';
import { MARKETPLACE_PACKS } from '../constants/mockData';

const STORAGE_KEY = '@blueprint_v1';
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

function makeRoom(roomTypeId) {
  const rt = ROOM_TYPES.find(r => r.id === roomTypeId) || ROOM_TYPES[0];
  return {
    id: uid('room'),
    typeId: rt.id,
    name: rt.name,
    gridW: rt.gridW,
    gridH: rt.gridH,
    cells: {},
    wallColor: 'Warm White',
    floorColor: 'Sand',
  };
}

function makeLot(name) {
  return {
    id: uid('lot'),
    name,
    exterior: defaultExterior(),
    rooms: [makeRoom('living')],
  };
}

function makeWorld(prompt, themeOverride, settings) {
  const theme = themeOverride || matchTheme(prompt);
  return {
    id: uid('world'),
    name: theme.name,
    prompt: prompt || '',
    theme,
    settings: settings || { timeOfDay: 'Golden Hour', season: 'Summer', weather: 'Clear' },
    createdAt: Date.now(),
    lots: [makeLot('Lot 1')],
  };
}

const DEFAULT_STATE = {
  profile: { name: 'Builder', level: 1, xp: 0, currency: 800, followers: 128, following: 34, bio: 'Designing my dream world.' },
  worlds: [],
  activeWorldId: null,
  boards: [{ id: 'board_default', name: 'My Inspiration', items: [] }],
  ownedPacks: MARKETPLACE_PACKS.filter(p => p.owned).map(p => p.id),
  communityLikes: {},
  communitySaves: {},
  followingCreators: {},
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

  const createWorld = useCallback((prompt, themeOverride, settings) => {
    const world = makeWorld(prompt, themeOverride, settings);
    update(prev => ({ ...prev, worlds: [world, ...prev.worlds], activeWorldId: world.id }));
    awardXP(50);
    return world.id;
  }, [update, awardXP]);

  const setActiveWorld = useCallback((worldId) => update(prev => ({ ...prev, activeWorldId: worldId })), [update]);

  const addLot = useCallback((worldId, name) => {
    let newLotId = null;
    update(prev => ({
      ...prev,
      worlds: prev.worlds.map(w => {
        if (w.id !== worldId) return w;
        const lot = makeLot(name || `Lot ${w.lots.length + 1}`);
        newLotId = lot.id;
        return { ...w, lots: [...w.lots, lot] };
      }),
    }));
    return newLotId;
  }, [update]);

  const deleteLot = useCallback((worldId, lotId) => {
    update(prev => ({
      ...prev,
      worlds: prev.worlds.map(w => w.id !== worldId ? w : { ...w, lots: w.lots.filter(l => l.id !== lotId) }),
    }));
  }, [update]);

  const addRoom = useCallback((worldId, lotId, roomTypeId) => {
    let newRoomId = null;
    update(prev => ({
      ...prev,
      worlds: prev.worlds.map(w => w.id !== worldId ? w : {
        ...w,
        lots: w.lots.map(l => {
          if (l.id !== lotId) return l;
          const room = makeRoom(roomTypeId);
          newRoomId = room.id;
          return { ...l, rooms: [...l.rooms, room] };
        }),
      }),
    }));
    awardXP(10);
    return newRoomId;
  }, [update, awardXP]);

  const deleteRoom = useCallback((worldId, lotId, roomId) => {
    update(prev => ({
      ...prev,
      worlds: prev.worlds.map(w => w.id !== worldId ? w : {
        ...w,
        lots: w.lots.map(l => l.id !== lotId ? l : { ...l, rooms: l.rooms.filter(r => r.id !== roomId) }),
      }),
    }));
  }, [update]);

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

  const renameRoom = useCallback((worldId, lotId, roomId, name) => {
    update(prev => ({
      ...prev,
      worlds: prev.worlds.map(w => w.id !== worldId ? w : {
        ...w,
        lots: w.lots.map(l => l.id !== lotId ? l : {
          ...l,
          rooms: l.rooms.map(r => r.id !== roomId ? r : { ...r, name }),
        }),
      }),
    }));
  }, [update]);

  const updateExterior = useCallback((worldId, lotId, patch) => {
    update(prev => ({
      ...prev,
      worlds: prev.worlds.map(w => w.id !== worldId ? w : {
        ...w,
        lots: w.lots.map(l => l.id !== lotId ? l : { ...l, exterior: { ...l.exterior, ...patch } }),
      }),
    }));
    awardXP(2);
  }, [update, awardXP]);

  const renameLot = useCallback((worldId, lotId, name) => {
    update(prev => ({
      ...prev,
      worlds: prev.worlds.map(w => w.id !== worldId ? w : { ...w, lots: w.lots.map(l => l.id !== lotId ? l : { ...l, name }) }),
    }));
  }, [update]);

  const toggleLike = useCallback((buildId) => {
    update(prev => ({ ...prev, communityLikes: { ...prev.communityLikes, [buildId]: !prev.communityLikes[buildId] } }));
  }, [update]);

  const toggleSave = useCallback((buildId) => {
    update(prev => ({ ...prev, communitySaves: { ...prev.communitySaves, [buildId]: !prev.communitySaves[buildId] } }));
  }, [update]);

  const toggleFollow = useCallback((creatorName) => {
    update(prev => ({ ...prev, followingCreators: { ...prev.followingCreators, [creatorName]: !prev.followingCreators[creatorName] } }));
  }, [update]);

  const addBoard = useCallback((name) => {
    const board = { id: uid('board'), name, items: [] };
    update(prev => ({ ...prev, boards: [...prev.boards, board] }));
    return board.id;
  }, [update]);

  const addToBoard = useCallback((boardId, item) => {
    update(prev => ({
      ...prev,
      boards: prev.boards.map(b => b.id !== boardId ? b : { ...b, items: [{ ...item, id: uid('item') }, ...b.items] }),
    }));
  }, [update]);

  const removeFromBoard = useCallback((boardId, itemId) => {
    update(prev => ({
      ...prev,
      boards: prev.boards.map(b => b.id !== boardId ? b : { ...b, items: b.items.filter(i => i.id !== itemId) }),
    }));
  }, [update]);

  const purchasePack = useCallback((packId, price) => {
    let ok = false;
    update(prev => {
      if (prev.ownedPacks.includes(packId)) { ok = true; return prev; }
      if (prev.profile.currency < price) return prev;
      ok = true;
      return {
        ...prev,
        profile: { ...prev.profile, currency: prev.profile.currency - price },
        ownedPacks: [...prev.ownedPacks, packId],
      };
    });
    return ok;
  }, [update]);

  const value = {
    loaded, ...state,
    createWorld, setActiveWorld, addLot, deleteLot, renameLot,
    addRoom, deleteRoom, setRoomCells, setRoomStyle, renameRoom, updateExterior,
    toggleLike, toggleSave, toggleFollow,
    addBoard, addToBoard, removeFromBoard,
    purchasePack, awardXP,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
