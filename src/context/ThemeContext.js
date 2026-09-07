import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@bloom_theme_v3';
const ThemeContext = createContext(null);

// ─── Token sets ───────────────────────────────────────
const LIGHT = {
  bg:           '#F9F8F6',
  card:         '#FFFFFF',
  input:        '#FFFFFF',
  border:       '#E4E2DF',
  text:         '#1A1918',
  subtext:      '#78777A',
  muted:        '#78777A',

  // Accent — indigo
  accent:       '#5A5FD4',
  accentDark:   '#4448B0',
  accentPale:   '#EEEFFC',
  accentLight:  '#D8DAFC',

  // Semantic
  urgent:       '#CC5A5A',
  urgentPale:   '#FAEAEA',

  // Chat
  chatBubble:   '#5A5FD4',

  // Compat aliases used across existing screens
  moss:         '#5A5FD4',
  sagePale:     '#EEEFFC',
  sageLight:    '#D8DAFC',
  pinkDark:     '#5A5FD4',
  white:        '#FFFFFF',
  shell:        '#FFFFFF',
  overlay:      'rgba(26,25,24,0.18)',

  // Priority pills
  pillPinkBg:   '#FAEAEA',   pillPinkText: '#CC5A5A',
  pillLavBg:    '#EEEFFC',   pillLavText:  '#5A5FD4',
  pillSkyBg:    '#F3F2F0',   pillSkyText:  '#78777A',
};

const DARK = {
  bg:           '#0F0F12',
  card:         '#1A1920',
  input:        '#0F0F12',
  border:       '#2A2930',
  text:         '#F0EFF4',
  subtext:      '#8C8B96',
  muted:        '#8C8B96',

  accent:       '#7B78EE',
  accentDark:   '#9996F8',
  accentPale:   '#1E1D30',
  accentLight:  '#2A2848',

  urgent:       '#E07070',
  urgentPale:   '#2A1818',

  chatBubble:   '#7B78EE',

  moss:         '#7B78EE',
  sagePale:     '#1E1D30',
  sageLight:    '#2A2848',
  pinkDark:     '#7B78EE',
  white:        '#1A1920',
  shell:        '#1A1920',
  overlay:      'rgba(0,0,0,0.5)',

  pillPinkBg:   '#2A1818',   pillPinkText: '#E07070',
  pillLavBg:    '#1E1D30',   pillLavText:  '#7B78EE',
  pillSkyBg:    '#1E1E22',   pillSkyText:  '#8C8B96',
};

export function ThemeProvider({ children }) {
  const [isDark, _setIsDark] = useState(false);

  useEffect(() => {
    // Try new key first, then old key for migration
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

  // Compat: aesthetic/setAesthetic/setBgTheme were accessed by old SettingsScreen
  const aesthetic = 'bloom';
  const setAesthetic = () => {};
  const setBgTheme   = () => {};

  return (
    <ThemeContext.Provider value={{ isDark, setDarkMode, colors, aesthetic, setAesthetic, setBgTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
