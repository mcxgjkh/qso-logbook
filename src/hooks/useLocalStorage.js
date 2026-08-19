import { useState } from 'react';
export function useLocalStorage(key, initial) {
  const [stored, setStored] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) || initial; } catch { return initial; }
  });
  const set = (value) => {
    localStorage.setItem(key, JSON.stringify(value));
    setStored(value);
  };
  return [stored, set];
}
