// ─────────────────────────────────────────────────────
//  BLOOM — Clean Girl Palette
//  Warm oat milk · caramel latte · soft blush · warm near-black
// ─────────────────────────────────────────────────────
export const C = {
  // === Core palette ===
  cream:    '#FAF8F5',   // warm oat milk — main bg
  linen:    '#F5F0EA',   // soft warm linen
  ink:      '#211F1C',   // deep warm near-black (not pure, not green)
  moss:     '#A88B68',   // caramel latte — primary action accent
  mossDark: '#8A7050',   // deeper caramel for pressed/active
  sage:     '#C8B8A0',   // soft warm nude-sand
  clay:     '#C9907E',   // soft blush-nude — secondary accent
  clayDark: '#A87060',   // deeper blush
  gold:     '#C8A870',   // warm honey gold
  white:    '#FFFFFF',
  shell:    '#F8F4EE',   // very soft warm shell

  // === Supporting tones ===
  lavender: '#BFB8CC',   // dusty muted mauve (very desaturated)
  mint:     '#B8C8B8',   // very desaturated sage
  sky:      '#A8B8CC',   // soft steel blue
  pink:     '#D8B8B0',   // soft blush-rose

  // === Per-theme accent darks ===
  lavDark:  '#8878A0',
  mintDark: '#608070',
  skyDark:  '#6080A0',
  pinkDark: '#B88878',

  // === Category pill colors — muted, sophisticated ===
  pillPinkBg:   '#FAE8E4',   pillPinkText: '#B87060',   // soft terracotta
  pillLavBg:    '#F0ECF4',   pillLavText:  '#887898',   // muted mauve
  pillSkyBg:    '#E8EEF4',   pillSkyText:  '#6080A0',   // soft steel
  pillMintBg:   '#E8EEE8',   pillMintText: '#608070',   // muted sage

  // === Background washes ===
  lavWash:  '#F4F0F8',
  mintWash: '#F0F4F0',
  skyWash:  '#EEF2F6',
  pinkWash: '#F8F0EE',

  // === Dark mode (warm dark) ===
  darkBg:      '#1A1814',   // deep warm dark
  darkCard:    '#241E18',   // warm dark card
  darkBorder:  '#342E26',   // warm dark border
  darkText:    '#F0E8DC',   // soft warm white
  darkSubtext: '#8A8078',   // warm muted
  darkInput:   '#1A1814',

  // === Aliases ===
  forest:    '#211F1C',
  sagePale:  '#F4EEE6',   // warm pale
  sageLight: '#DDD5C8',   // light warm sand
  sageMid:   '#C8B8A0',
  clayLight: '#E8CEC4',
  clayPale:  '#FAF0EC',
  goldLight: '#E8D4B0',
  goldPale:  '#FAF2E4',
  muted:     '#9A9490',   // warm neutral grey
  border:    '#EDEAE4',   // barely-there warm border
  overlay:   'rgba(33,31,28,0.24)',
};

// Background theme hex values
export const BG_THEMES = {
  cream:    '#FAF8F5',   // warm oat milk (default)
  lavender: '#F4F0F8',   // barely lilac
  mint:     '#F0F4F0',   // barely sage
  sky:      '#EEF2F6',   // barely steel
  pink:     '#F8F0EE',   // barely blush
};

// Goal card accent colors — warm, sophisticated
export const GOAL_ACCENTS = ['#A88B68', '#C9907E', '#C8B8A0', '#A8B8CC', '#C8A870'];
