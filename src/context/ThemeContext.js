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
      // accents unchanged in dark
      moss:     C.moss,
      clay:     C.clay,
      gold:     C.gold,
      sky:      C.sky,
      sage:     C.sage,
      shell:    '#2E1E38',
      sagePale: '#261A30',
      sageLight:'#3D2E4A',
      goldPale: '#2A1E2E',
      white:    C.darkCard,
      muted:    C.darkSubtext,
      overlay:  'rgba(0,0,0,0.5)',
      // tab accents — floral-dark
      lavDark:  '#A890D8',
      mintDark: '#7BAAA0',
      skyDark:  '#7898C4',
      pinkDark: '#D890A8',
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
