import { useCallback, useEffect, useRef, useState } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

// Firestore-backed list of records, shared by every CRUD section and synced
// live across every device. On first-ever load (empty collection) it seeds
// the starter data once so the hub isn't empty for the first person to open it.
export function useCollection(key, seed) {
  const [items, setItems] = useState([]);
  const seededRef = useRef(false);

  useEffect(() => {
    const colRef = collection(db, key);
    const unsub = onSnapshot(colRef, async (snap) => {
      if (snap.empty && !seededRef.current && seed.length > 0) {
        seededRef.current = true;
        const batch = writeBatch(db);
        seed.forEach(({ id, ...rest }) => batch.set(doc(colRef), rest));
        await batch.commit();
        return; // onSnapshot fires again once the seed write lands
      }
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const addItem = useCallback(async (record) => {
    const ref = await addDoc(collection(db, key), record);
    return { id: ref.id, ...record };
  }, [key]);

  const updateItem = useCallback((id, patch) => {
    updateDoc(doc(db, key, id), patch);
  }, [key]);

  const deleteItem = useCallback((id) => {
    deleteDoc(doc(db, key, id));
  }, [key]);

  const deleteMany = useCallback(async (ids) => {
    const batch = writeBatch(db);
    ids.forEach((id) => batch.delete(doc(db, key, id)));
    await batch.commit();
  }, [key]);

  return { items, addItem, updateItem, deleteItem, deleteMany };
}
