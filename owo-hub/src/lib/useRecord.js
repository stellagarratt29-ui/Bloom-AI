import { useCallback, useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Firestore-backed single record (Development timeline, Visual Guide
// typography notes), synced live across every device.
export function useRecord(key, seed) {
  const [value, setValue] = useState(seed);
  const seededRef = useRef(false);

  useEffect(() => {
    const ref = doc(db, '_singletons', key);
    const unsub = onSnapshot(ref, async (snap) => {
      if (!snap.exists()) {
        if (!seededRef.current) {
          seededRef.current = true;
          await setDoc(ref, seed);
        }
        return;
      }
      setValue(snap.data());
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback((patch) => {
    setDoc(doc(db, '_singletons', key), patch, { merge: true });
  }, [key]);

  return [value, update];
}
