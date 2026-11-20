import { useSyncExternalStore } from 'react';

/** Pilihan pengguna: ikut sistem (HP / laptop), terang, atau gelap */
export type ThemePref = 'system' | 'light' | 'dark';

const KEY = 'studiorangka_theme';
const media = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null);

export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

const resolve = (pref: ThemePref) => (pref === 'system' ? (media()?.matches ? 'dark' : 'light') : pref);

/** Pasang kelas .dark di <html> (dipanggil juga oleh skrip kecil di index.html sebelum aplikasi dimuat, supaya tidak berkedip) */
export function applyTheme(pref: ThemePref = getThemePref()) {
  const dark = resolve(pref) === 'dark';
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1c1b19' : '#ffffff');
}

export function setThemePref(pref: ThemePref) {
  try {
    if (pref === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {
    // penyimpanan browser tidak tersedia: tema tetap berlaku sampai halaman ditutup
  }
  applyTheme(pref);
  listeners.forEach((l) => l());
}

// ---------- langganan perubahan (untuk React) ----------
const listeners = new Set<() => void>();
let started = false;
function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!started) {
    started = true;
    // tema sistem berubah (mis. HP masuk mode gelap malam hari) saat pilihan = ikut sistem
    media()?.addEventListener?.('change', () => {
      if (getThemePref() === 'system') {
        applyTheme('system');
        listeners.forEach((l) => l());
      }
    });
  }
  return () => listeners.delete(cb);
}

const isDarkNow = () => document.documentElement.classList.contains('dark');

/** true bila tampilan sedang gelap */
export const useIsDark = () => useSyncExternalStore(subscribe, isDarkNow, () => false);
/** pilihan tema pengguna */
export const useThemePref = () => useSyncExternalStore(subscribe, getThemePref, () => 'system' as ThemePref);
