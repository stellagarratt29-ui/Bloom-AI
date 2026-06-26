import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, BG_THEMES } from '../constants/colors';

const THEME_KEY = '@bloom_theme_v1';

const ThemeContext = createContext(null);

const ACCENT_PAIRS = {
  cream:    { chatBubble: C.moss,     calloutAccent: C.clay     },
  lavender: { chatBubble: C.lavDark,  calloutAccent: C.pinkDark },
  mint:     { chatBubble: C.mintDark, calloutAccent: C.skyDark  },
  sky:      { chatBubble: C.skyDark,  calloutAccent: C.lavDark  },
  pink:     { chatBubble: C.pinkDark, calloutAccent: C.gold     },
};

function makeColors(bgTheme, isDark) {
  const bgColor = BG_THEMES[bgTheme] ?? C.cream;
  const pair = ACCENT_PAIRS[bgTheme] ?? ACCENT_PAIRS.cream;
  if (isDark) {
    return {
      bg:       C.darkBg,
      card:     C.darkCard,
      input:    C.darkInput,
      text:     C.darkText,
      subtext:  C.darkSubtext,
      border:   C.darkBorder,
      // accents unchanged
      moss:     C.moss,
      clay:     C.clay,
      gold:     C.gold,
      sky:      C.sky,
      sage:     C.sage,
      shell:    '#2E3C34',
      sagePale: '#1E2E26',
      sageLight:'#2E4038',
      goldPale: '#2A2818',
      white:    C.darkCard,
      muted:    C.darkSubtext,
      overlay:  'rgba(0,0,0,0.5)',
      // tab accents
      lavDark:  '#A090D4',
      mintDark: '#5AB890',
      skyDark:  '#5AACC8',
      pinkDark: '#E07090',
      // theme-aware chat/callout accents
      chatBubble:    pair.chatBubble,
      calloutAccent: pair.calloutAccent,
    };
  }
  return {
    bg:       bgColor,
    card:     C.white,
    input:    C.white,
    text:     C.ink,
    subtext:  C.muted,
    border:   C.border,
    moss:     C.moss,
    clay:     C.clay,
    gold:     C.gold,
    sky:      C.sky,
    sage:     C.sage,
    shell:    C.shell,
    sagePale: C.sagePale,
    sageLight:C.sageLight,
    goldPale: C.goldPale,
    white:    C.white,
    muted:    C.muted,
    overlay:  C.overlay,
    lavDark:  C.lavDark,
    mintDark: C.mintDark,
    skyDark:  C.skyDark,
    pinkDark: C.pinkDark,
    // theme-aware chat/callout accents
    chatBubble:    pair.chatBubble,
    calloutAccent: pair.calloutAccent,
  };
}

export function ThemeProvider({ children }) {
  const [bgTheme, _setBgTheme] = useState('cream');
  const [isDark,  _setIsDark]  = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(raw => {
      if (!raw) return;
      try {
        const s = JSON.parse(raw);
        if (s.bgTheme) _setBgTheme(s.bgTheme);
        if (s.isDark  !== undefined) _setIsDark(s.isDark);
      } catch (_) {}
    }).catch(() => {});
  }, []);

  const save = useCallback((bg, dark) => {
    AsyncStorage.setItem(THEME_KEY, JSON.stringify({ bgTheme: bg, isDark: dark })).catch(() => {});
  }, []);

  const setBgTheme = useCallback(t => {
    _setBgTheme(t);
    save(t, isDark);
  }, [isDark, save]);

  const setDarkMode = useCallback(d => {
    _setIsDark(d);
    save(bgTheme, d);
  }, [bgTheme, save]);

  const colors  = makeColors(bgTheme, isDark);

  return (
    <ThemeContext.Provider value={{ bgTheme, setBgTheme, isDark, setDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
