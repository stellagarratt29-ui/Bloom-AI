import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@bloom_theme_v3';
const ThemeContext = createContext(null);

// ─── Studio Minimal palette ───────────────────────────
const LIGHT = {
  bg:           '#FFFFFF',
  card:         '#FFFFFF',
  input:        '#F5F5F4',
  border:       '#E8E8E7',
  text:         '#0F0F0F',
  subtext:      '#6B6B6B',
  muted:        '#ABABAB',

  // Dusty sage — primary accent
  accent:       '#7A9A89',
  accentDark:   '#5C7A6A',
  accentPale:   '#EFF4F2',
  accentLight:  '#DDE8E3',

  // Muted sand — secondary / warm highlight
  clay:         '#B09080',
  clayPale:     '#F6F1EF',
  clayLight:    '#EAE2DE',

  // Semantic
  urgent:       '#B85050',
  urgentPale:   '#FDF1F1',

  // User chat bubbles — near-black (clean, not green)
  chatBubble:   '#0F0F0F',

  // Compat aliases
  moss:         '#7A9A89',
  sagePale:     '#EFF4F2',
  sageLight:    '#DDE8E3',
  pinkDark:     '#0F0F0F',
  white:        '#FFFFFF',
  shell:        '#FFFFFF',
  overlay:      'rgba(0,0,0,0.14)',

  pillPinkBg:   '#FDF1F1',   pillPinkText: '#B85050',
  pillLavBg:    '#EFF4F2',   pillLavText:  '#7A9A89',
  pillSkyBg:    '#F4F4F4',   pillSkyText:  '#6B6B6B',
};

const DARK = {
  bg:           '#111111',
  card:         '#1A1A1A',
  input:        '#222222',
  border:       '#2E2E2E',
  text:         '#F0EFEE',
  subtext:      '#888888',
  muted:        '#555555',

  accent:       '#9BB8A8',
  accentDark:   '#B8CFBF',
  accentPale:   '#1C2520',
  accentLight:  '#243028',

  clay:         '#C0A090',
  clayPale:     '#27201E',
  clayLight:    '#322824',

  urgent:       '#E06060',
  urgentPale:   '#2A1818',

  chatBubble:   '#9BB8A8',

  moss:         '#9BB8A8',
  sagePale:     '#1C2520',
  sageLight:    '#243028',
  pinkDark:     '#F0EFEE',
  white:        '#1A1A1A',
  shell:        '#1A1A1A',
  overlay:      'rgba(0,0,0,0.5)',

  pillPinkBg:   '#2A1818',   pillPinkText: '#E06060',
  pillLavBg:    '#1C2520',   pillLavText:  '#9BB8A8',
  pillSkyBg:    '#1E1E1E',   pillSkyText:  '#888888',
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
