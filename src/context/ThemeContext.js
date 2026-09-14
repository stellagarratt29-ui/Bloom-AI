import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@bloom_theme_v3';
const ThemeContext = createContext(null);

// ─── SMEG Warm palette ────────────────────────────────
const LIGHT = {
  bg:           '#FAF7F2',   // warm cream
  card:         '#FFFFFF',   // white card on cream
  input:        '#F0EBE4',   // warm input
  border:       '#E5DDD5',   // warm border
  text:         '#1A1510',   // warm near-black
  subtext:      '#6B6560',   // warm gray
  muted:        '#ABA59E',   // warm muted

  // Sage green — SMEG primary accent
  accent:       '#7A9A89',
  accentDark:   '#5C7A6A',
  accentPale:   '#EBF2EE',
  accentLight:  '#D5E8DF',

  // Dusty peach / warm coral — SMEG secondary
  clay:         '#C98B6B',
  clayPale:     '#F7EFE9',
  clayLight:    '#EEE0D5',

  // Semantic
  urgent:       '#C05A5A',
  urgentPale:   '#FDEEED',

  // User chat bubbles — warm near-black
  chatBubble:   '#1A1510',

  // Compat aliases
  moss:         '#7A9A89',
  sagePale:     '#EBF2EE',
  sageLight:    '#D5E8DF',
  pinkDark:     '#1A1510',
  white:        '#FFFFFF',
  shell:        '#FAF7F2',
  overlay:      'rgba(26,21,16,0.14)',

  pillPinkBg:   '#FDEEED',   pillPinkText: '#C05A5A',
  pillLavBg:    '#EBF2EE',   pillLavText:  '#7A9A89',
  pillSkyBg:    '#F0EBE4',   pillSkyText:  '#6B6560',
};

const DARK = {
  bg:           '#1A1510',   // warm dark
  card:         '#231F1A',   // warm card
  input:        '#2C2720',   // warm input
  border:       '#3A342D',   // warm border
  text:         '#F5F0EA',   // warm light
  subtext:      '#9A9088',   // warm subtext
  muted:        '#6A6058',   // warm muted

  accent:       '#9BB8A8',
  accentDark:   '#B8CFBF',
  accentPale:   '#1C2820',
  accentLight:  '#243028',

  clay:         '#D4A088',
  clayPale:     '#2A201A',
  clayLight:    '#352820',

  urgent:       '#E07070',
  urgentPale:   '#2A1A1A',

  chatBubble:   '#9BB8A8',

  moss:         '#9BB8A8',
  sagePale:     '#1C2820',
  sageLight:    '#243028',
  pinkDark:     '#F5F0EA',
  white:        '#231F1A',
  shell:        '#231F1A',
  overlay:      'rgba(0,0,0,0.5)',

  pillPinkBg:   '#2A1A1A',   pillPinkText: '#E07070',
  pillLavBg:    '#1C2820',   pillLavText:  '#9BB8A8',
  pillSkyBg:    '#252018',   pillSkyText:  '#9A9088',
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
