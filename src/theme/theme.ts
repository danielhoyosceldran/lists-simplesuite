import { useSyncExternalStore } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const KEY = 'theme-mode';
const BG = { light: '#F7F7F5', dark: '#121214' };
const media = matchMedia('(prefers-color-scheme: dark)');
const listeners = new Set<() => void>();

function read(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* storage unavailable */
  }
  return 'system';
}

let mode = read();

function apply() {
  const resolved = mode === 'system' ? (media.matches ? 'dark' : 'light') : mode;
  document.documentElement.dataset.theme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BG[resolved]);
}

media.addEventListener('change', () => mode === 'system' && apply());
apply();

export function setThemeMode(next: ThemeMode) {
  mode = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* storage unavailable */
  }
  apply();
  listeners.forEach((l) => l());
}

export function useThemeMode() {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => mode,
  );
}
