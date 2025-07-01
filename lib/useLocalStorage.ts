import { useState, useEffect } from "react";

/**
 * 로컬스토리지와 동기화되는 상태를 관리하는 커스텀 훅
 * @param key localStorage key
 * @param initialValue 초기값
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        setValue(JSON.parse(stored));
      }
    } catch {
      // 무시
    }
    // eslint-disable-next-line
  }, [key]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 무시
    }
  }, [key, value]);

  return [value, setValue] as const;
}
