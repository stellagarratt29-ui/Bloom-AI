import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AESTHETICS } from '../constants/colors';

const THEME_KEY = '@bloom_theme_v2';

const ThemeContext = createContext(null);

// Maps old bgTheme keys to new aesthetic keys
const MIGRATE_BG = { cream: 'bloom', lavender: 'lavender', mint: 'matcha', sky: 'ocean', pink: 'bloom' };

function makeColors(aesthetic, isDark) {
  const ae = AESTHETICS[aesthetic] ?? AESTHETICS.bloom;
  const dark = isDark || ae.isDark;

  if (dark) {
    // Midnight uses its own dark palette; other aesthetics use a generic warm dark
    // but keep the aesthetic's accent/chatBubble colors.
    const native = ae.isDark;
    return {
      bg:            native ? ae.bg           : '#141214',
      card:          native ? ae.card         : '#1E1C1E',
      input:         native ? ae.bg           : '#141214',
      text:          native ? ae.ink          : '#F4F0F2',
      subtext:       native ? ae.subtext      : '#909090',
      border:        native ? ae.border       : '#2C282C',
      // Accents are always from the aesthetic, even in dark mode
      moss:          ae.accent,
      clay:          ae.calloutAccent,
      gold:          '#D4B89C',
      sky:           ae.accentLight,
      sage:          ae.border,
      shell:         native ? ae.card         : '#241E24',
      sagePale:      ae.accentPale,
      sageLight:     ae.accentLight,
      goldPale:      native ? ae.accentPale   : '#241E1C',
      white:         native ? ae.card         : '#1E1C1E',
      muted:         native ? ae.subtext      : '#909090',
      overlay:       'rgba(0,0,0,0.5)',
      // Accent shades — all from aesthetic in dark mode
      lavDark:       ae.accentDark,
      mintDark:      ae.accentDark,
      skyDark:       ae.accentDark,
      pinkDark:      ae.accent,
      // Chat
      chatBubble:    ae.chatBubble,
      calloutAccent: ae.calloutAccent,
    };
  }

  return {
    bg:            ae.bg,
    card:          ae.card,
    input:         ae.card,
    text:          ae.ink,
    subtext:       ae.subtext,
    border:        ae.border,
    moss:          ae.accent,
    clay:          ae.calloutAccent,
    gold:          '#D4B89C',
    sky:           ae.accentLight,
    sage:          ae.border,
    shell:         ae.card,
    sagePale:      ae.accentPale,
    sageLight:     ae.accentLight,
    goldPale:      ae.accentPale,
    white:         '#FFFFFF',
    muted:         ae.subtext,
    overlay:       'rgba(0,0,0,0.18)',
    lavDark:       ae.accentDark,
    mintDark:      ae.accentDark,
    skyDark:       ae.accentDark,
    pinkDark:      ae.accent,
    chatBubble:    ae.chatBubble,
    calloutAccent: ae.calloutAccent,
  };
}

export function ThemeProvider({ children }) {
  const [aesthetic, _setAesthetic] = useState('bloom');
  const [isDark,    _setIsDark]    = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(raw => {
      if (!raw) {
        // Check old key for migration
        return AsyncStorage.getItem('@bloom_theme_v1').then(oldRaw => {
          if (!oldRaw) return;
          try {
            const s = JSON.parse(oldRaw);
            if (s.bgTheme && MIGRATE_BG[s.bgTheme]) _setAesthetic(MIGRATE_BG[s.bgTheme]);
            if (s.isDark !== undefined) _setIsDark(s.isDark);
          } catch (_) {}
        });
      }
      try {
        const s = JSON.parse(raw);
        if (s.aesthetic && AESTHETICS[s.aesthetic]) _setAesthetic(s.aesthetic);
        if (s.isDark !== undefined) _setIsDark(s.isDark);
      } catch (_) {}
    }).catch(() => {});
  }, []);

  const save = useCallback((ae, dark) => {
    AsyncStorage.setItem(THEME_KEY, JSON.stringify({ aesthetic: ae, isDark: dark })).catch(() => {});
  }, []);

  const setAesthetic = useCallback(ae => {
    if (!AESTHETICS[ae]) return;
    _setAesthetic(ae);
    // Midnight forces dark mode on; switching away from Midnight keeps current isDark
    const newDark = AESTHETICS[ae].isDark ? true : isDark;
    if (AESTHETICS[ae].isDark) _setIsDark(true);
    save(ae, newDark);
  }, [isDark, save]);

  const setDarkMode = useCallback(d => {
    // Can't toggle off dark if aesthetic is natively dark (Midnight)
    const ae = AESTHETICS[aesthetic];
    if (ae?.isDark && !d) return;
    _setIsDark(d);
    save(aesthetic, d);
  }, [aesthetic, save]);

  // Backward-compat aliases (SettingsScreen used setBgTheme/bgTheme)
  const setBgTheme = setAesthetic;
  const bgTheme    = aesthetic;

  const colors = makeColors(aesthetic, isDark);

  return (
    <ThemeContext.Provider value={{
      aesthetic, setAesthetic,
      bgTheme,   setBgTheme,
      isDark,    setDarkMode,
      colors,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
