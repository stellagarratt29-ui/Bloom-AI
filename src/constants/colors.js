// ─────────────────────────────────────────────────────
//  BLOOM — Botanical Palette
//  Earthy, grounded: warm cream · forest green · sage · clay
// ─────────────────────────────────────────────────────
export const C = {
  // === Core palette (per spec) ===
  cream:    '#FBF7EF',   // warm cream — main bg
  linen:    '#F5F0E8',   // warm linen — secondary tint
  ink:      '#3A4A3D',   // deep forest green — primary text
  moss:     '#7C9473',   // sage green — primary action accent
  mossDark: '#627864',   // deeper sage for pressed/active
  sage:     '#A8BB9E',   // soft sage — supporting elements
  clay:     '#C98B6B',   // dusty peach/clay — secondary accent
  clayDark: '#B07050',   // deeper clay
  gold:     '#D4A86A',   // warm amber-gold
  white:    '#FFFFFF',
  shell:    '#F5EFE6',   // warm shell

  // === Supporting tones ===
  lavender: '#A8AAC8',   // soft blue-grey (supporting)
  mint:     '#A8C4A8',   // fresh mint green
  sky:      '#7AAAC4',   // clear sky blue
  pink:     '#D4A8A0',   // soft terracotta-rose

  // === Per-theme accent darks ===
  lavDark:  '#7888B8',
  mintDark: '#6A9A78',
  skyDark:  '#5888A8',
  pinkDark: '#B88878',

  // === Category pill colors — warm botanical ===
  pillPinkBg:   '#FDE8E4',   pillPinkText: '#C06850',   // terracotta (School & Health)
  pillLavBg:    '#EEE8F5',   pillLavText:  '#7060A8',   // soft violet (Tasks)
  pillSkyBg:    '#E4EEF8',   pillSkyText:  '#4878A8',   // sky (Fun)
  pillMintBg:   '#E4F0E8',   pillMintText: '#508A60',   // sage (extra)

  // === Background washes ===
  lavWash:  '#F3EEF9',
  mintWash: '#EEF5EE',
  skyWash:  '#EEF4F8',
  pinkWash: '#FDF0EE',

  // === Dark mode (forest-based) ===
  darkBg:      '#1A221C',   // deep forest dark
  darkCard:    '#202E22',   // forest card
  darkBorder:  '#2E3E30',   // forest border
  darkText:    '#E4EDE4',   // soft greenish-white
  darkSubtext: '#78A080',   // muted sage
  darkInput:   '#1A221C',

  // === Aliases ===
  forest:    '#3A4A3D',
  sagePale:  '#EDF2E8',   // very light sage
  sageLight: '#C8D8C0',   // light sage
  sageMid:   '#A8BB9E',
  clayLight: '#E0C4A8',
  clayPale:  '#FBF0E8',
  goldLight: '#E8D0A8',
  goldPale:  '#FAF4E8',
  muted:     '#7A8A7A',   // muted forest grey-green
  border:    '#E4E0D8',   // warm linen border
  overlay:   'rgba(58,74,61,0.28)',
};

// Background theme hex values
export const BG_THEMES = {
  cream:    '#FBF7EF',   // warm cream (default)
  lavender: '#F3EEF9',   // soft lilac wash
  mint:     '#EEF5EE',   // very soft sage
  sky:      '#EEF4F8',   // soft sky
  pink:     '#FDF0EE',   // soft blush
};

// Goal card left-border accent colors — warm botanical
export const GOAL_ACCENTS = ['#C98B6B', '#7C9473', '#A8BB9E', '#7AAAC4', '#D4A86A'];
