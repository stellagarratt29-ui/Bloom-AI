import { useCallback, useState } from 'react';
import { loadJSON, saveJSON } from './storage';

// Generic localStorage-backed single record, for pages that aren't lists
// (Visual Guide typography notes, Development timeline).
export function useRecord(key, seed) {
  const [value, setValue] = useState(() => loadJSON(key, seed));

  const update = useCallback((patch) => {
    setValue((prev) => {
      const next = { ...prev, ...patch };
      saveJSON(key, next);
      return next;
    });
  }, [key]);

  return [value, update];
}
