import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@bloom_theme_v3';
const ThemeContext = createContext(null);

// ─── Token sets ───────────────────────────────────────
const LIGHT = {
  bg:           '#F8F7F4',
  card:         '#FFFFFF',
  input:        '#FFFFFF',
  border:       '#E6E4E0',
  text:         '#1A1918',
  subtext:      '#7A7875',
  muted:        '#9E9B97',

  // Accent — warm amber
  accent:       '#BF7B4B',
  accentDark:   '#A0622C',
  accentPale:   '#FBF0E6',
  accentLight:  '#F2DCC8',

  // Semantic
  urgent:       '#C24B4B',
  urgentPale:   '#FAEAEA',

  // Chat — user bubbles are near-black (clean/deliberate)
  chatBubble:   '#1A1918',

  // Compat aliases
  moss:         '#BF7B4B',
  sagePale:     '#FBF0E6',
  sageLight:    '#F2DCC8',
  pinkDark:     '#1A1918',
  white:        '#FFFFFF',
  shell:        '#FFFFFF',
  overlay:      'rgba(26,25,24,0.18)',

  // Priority pills
  pillPinkBg:   '#FAEAEA',   pillPinkText: '#C24B4B',
  pillLavBg:    '#FBF0E6',   pillLavText:  '#BF7B4B',
  pillSkyBg:    '#F0EFEC',   pillSkyText:  '#7A7875',
};

const DARK = {
  bg:           '#0F0E0D',
  card:         '#1C1A18',
  input:        '#0F0E0D',
  border:       '#2E2B28',
  text:         '#F0EEE8',
  subtext:      '#8A8784',
  muted:        '#8A8784',

  accent:       '#D4935E',
  accentDark:   '#E8AA78',
  accentPale:   '#241A10',
  accentLight:  '#342410',

  urgent:       '#D47070',
  urgentPale:   '#2A1818',

  chatBubble:   '#D4935E',

  moss:         '#D4935E',
  sagePale:     '#241A10',
  sageLight:    '#342410',
  pinkDark:     '#D4935E',
  white:        '#1C1A18',
  shell:        '#1C1A18',
  overlay:      'rgba(0,0,0,0.5)',

  pillPinkBg:   '#2A1818',   pillPinkText: '#D47070',
  pillLavBg:    '#241A10',   pillLavText:  '#D4935E',
  pillSkyBg:    '#1E1C1A',   pillSkyText:  '#8A8784',
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

  // Compat stubs
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
