import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { ThemePref, setThemePref, useIsDark, useThemePref } from '../theme';

const NEXT: Record<ThemePref, ThemePref> = { system: 'light', light: 'dark', dark: 'system' };
const LABEL: Record<ThemePref, string> = { system: 'Ikut sistem', light: 'Mode terang', dark: 'Mode gelap' };

/** Tombol ganti tema: terang → gelap → ikut sistem (HP / laptop) */
export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const pref = useThemePref();
  const dark = useIsDark();
  const next = NEXT[pref];
  const Icon = pref === 'system' ? Monitor : dark ? Moon : Sun;
  return (
    <button
      onClick={() => setThemePref(next)}
      className={`p-2 rounded-lg text-stone-700 hover:bg-stone-100 cursor-pointer ${className}`}
      title={`${LABEL[pref]} · ketuk untuk: ${LABEL[next].toLowerCase()}`}
      aria-label={`Tema: ${LABEL[pref]}. Ganti ke ${LABEL[next].toLowerCase()}`}
    >
      <Icon className="w-5 h-5 sm:w-4 sm:h-4" />
    </button>
  );
};
