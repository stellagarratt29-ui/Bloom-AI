import { useCallback, useState } from 'react';
import { loadJSON, saveJSON } from './storage';
import { makeId } from './id';

// Generic localStorage-backed list of records, shared by every CRUD section.
export function useCollection(key, seed) {
  const [items, setItems] = useState(() => loadJSON(key, seed));

  const persist = useCallback((next) => {
    setItems(next);
    saveJSON(key, next);
  }, [key]);

  const addItem = useCallback((record) => {
    const withId = { id: makeId(), ...record };
    persist([withId, ...items]);
    return withId;
  }, [items, persist]);

  const updateItem = useCallback((id, patch) => {
    persist(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, [items, persist]);

  const deleteItem = useCallback((id) => {
    persist(items.filter((it) => it.id !== id));
  }, [items, persist]);

  const deleteMany = useCallback((ids) => {
    const idSet = new Set(ids);
    persist(items.filter((it) => !idSet.has(it.id)));
  }, [items, persist]);

  return { items, addItem, updateItem, deleteItem, deleteMany };
}
