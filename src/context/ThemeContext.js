import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@bloom_theme_v3';
const ThemeContext = createContext(null);

// ─── Forest & Clay palette ────────────────────────────
const LIGHT = {
  bg:           '#FAFAF8',
  card:         '#FFFFFF',
  input:        '#FFFFFF',
  border:       '#EDEBE7',
  text:         '#1E2B20',
  subtext:      '#7A8A7C',
  muted:        '#9AA49C',

  // Forest sage — primary accent
  accent:       '#4A7C59',
  accentDark:   '#355A40',
  accentPale:   '#EBF3EE',
  accentLight:  '#D0E8D8',

  // Terracotta — secondary / warm highlight
  clay:         '#C4744A',
  clayPale:     '#FCF0EB',
  clayLight:    '#F0E4DA',

  // Semantic
  urgent:       '#B54040',
  urgentPale:   '#FAEAEA',

  // User chat bubbles — near-black for clean contrast
  chatBubble:   '#1E2B20',

  // Compat aliases (consumed by existing screens)
  moss:         '#4A7C59',
  sagePale:     '#EBF3EE',
  sageLight:    '#D0E8D8',
  pinkDark:     '#C4744A',
  white:        '#FFFFFF',
  shell:        '#FFFFFF',
  overlay:      'rgba(30,43,32,0.18)',

  pillPinkBg:   '#FCF0EB',   pillPinkText: '#B54040',
  pillLavBg:    '#EBF3EE',   pillLavText:  '#4A7C59',
  pillSkyBg:    '#F0F2F0',   pillSkyText:  '#7A8A7C',
};

const DARK = {
  bg:           '#0E1210',
  card:         '#1A211C',
  input:        '#0E1210',
  border:       '#2A332C',
  text:         '#E8F0EA',
  subtext:      '#7A8A7C',
  muted:        '#6A7A6C',

  accent:       '#6A9E78',
  accentDark:   '#8AB898',
  accentPale:   '#1A2A1E',
  accentLight:  '#203028',

  clay:         '#D4845A',
  clayPale:     '#2A1C14',
  clayLight:    '#342218',

  urgent:       '#D06060',
  urgentPale:   '#2A1818',

  chatBubble:   '#6A9E78',

  moss:         '#6A9E78',
  sagePale:     '#1A2A1E',
  sageLight:    '#203028',
  pinkDark:     '#D4845A',
  white:        '#1A211C',
  shell:        '#1A211C',
  overlay:      'rgba(0,0,0,0.5)',

  pillPinkBg:   '#2A1818',   pillPinkText: '#D06060',
  pillLavBg:    '#1A2A1E',   pillLavText:  '#6A9E78',
  pillSkyBg:    '#1C201C',   pillSkyText:  '#7A8A7C',
};

export function ThemeProvider({ children }) {
  const [isDark, _setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then(raw => {
        if (raw) {
          try { const s = JSON.parse(raw); if (s.isDark !== undefined) _setIsDark(s.isDark); } catch (_) {}
          return;
        }
        return AsyncStorage.getItem('@bloom_theme_v2').then(old => {
          if (!old) return;
          try { const s = JSON.parse(old); if (s.isDark !== undefined) _setIsDark(s.isDark); } catch (_) {}
        });
      })
      .catch(() => {});
  }, []);

  const setDarkMode = useCallback((d) => {
    _setIsDark(d);
    AsyncStorage.setItem(THEME_KEY, JSON.stringify({ isDark: d })).catch(() => {});
  }, []);

  const colors = isDark ? DARK : LIGHT;

  const aesthetic    = 'bloom';
  const setAesthetic = () => {};
  const setBgTheme   = () => {};

  return (
    <ThemeContext.Provider value={{ isDark, setDarkMode, colors, aesthetic, setAesthetic, setBgTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
