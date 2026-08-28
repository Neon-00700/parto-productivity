import { useState, useCallback } from 'react';
import { safeGet, safeSet } from '../utils/storageUtils';

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => safeGet(key, initialValue));
  const set = useCallback((v) => {
    setValue((prev) => {
      const next = typeof v === 'function' ? v(prev) : v;
      safeSet(key, next);
      return next;
    });
  }, [key]);
  return [value, set];
}
