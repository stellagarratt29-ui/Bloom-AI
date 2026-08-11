// ─────────────────────────────────────────────────────
//  BLOOM — Warm Blush Palette
//  Warm linen white · soft baby blush · warm near-black
//  Think: tulips on a marble table, morning light, clean & airy
// ─────────────────────────────────────────────────────
export const C = {
  // === Core palette ===
  cream:    '#FAF7F4',   // warm linen white — the base of everything
  linen:    '#F5F1EE',   // slightly deeper warm white for sections
  ink:      '#1C1517',   // warm near-black (slight rose bias)
  moss:     '#C4838E',   // soft blush rose — primary action
  mossDark: '#A86870',   // deeper blush for pressed states
  sage:     '#C4BABC',   // warm neutral — barely pinkish grey
  clay:     '#E8BCC2',   // petal pink — soft secondary accent
  clayDark: '#C898A0',   // deeper petal
  gold:     '#D4B89C',   // warm champagne (used sparingly)
  white:    '#FFFFFF',
  shell:    '#FDF8F7',   // barely-blush white for cards

  // === Supporting tones — warm, barely-there ===
  lavender: '#CEC4CC',   // warm mauve-grey
  mint:     '#BEC4C0',   // warm sage-grey
  sky:      '#BCC4CC',   // warm steel-grey
  pink:     '#E0C4C8',   // soft petal pink

  // === Per-theme accent darks ===
  lavDark:  '#9888A8',
  mintDark: '#708878',
  skyDark:  '#6888A0',
  pinkDark: '#B88890',

  // === Category pills — barely-there, warm ===
  pillPinkBg:   '#FAEAEC',   pillPinkText: '#A87880',   // soft rose
  pillLavBg:    '#F2EEF6',   pillLavText:  '#887898',   // warm mauve
  pillSkyBg:    '#EAF0F4',   pillSkyText:  '#6888A0',   // barely steel
  pillMintBg:   '#EAF0EC',   pillMintText: '#688870',   // barely sage

  // === Background washes — extremely light, warm ===
  lavWash:  '#F6F2F8',
  mintWash: '#F2F5F2',
  skyWash:  '#F0F3F6',
  pinkWash: '#FBF0F2',

  // === Dark mode — warm dark, not cold Apple grey ===
  darkBg:      '#161214',   // warm deep dark — slight rose undertone
  darkCard:    '#201C1E',   // warm charcoal card
  darkBorder:  '#302A2C',   // warm separator
  darkText:    '#F8F4F4',   // warm off-white text
  darkSubtext: '#948890',   // warm muted label
  darkInput:   '#161214',

  // === Aliases ===
  forest:    '#1C1517',
  sagePale:  '#FDF0F2',   // blush tint — used for selected states, highlights
  sageLight: '#F0D8DC',   // soft blush — used for progress bars, accents
  sageMid:   '#D4B8BC',
  clayLight: '#F0D0D6',
  clayPale:  '#FDF4F6',
  goldLight: '#EAD8C0',
  goldPale:  '#FAF4EC',
  muted:     '#9C8A8C',   // warm pinkish grey — subtext
  border:    '#EDE6E7',   // warm slightly-blush border
  overlay:   'rgba(28,21,23,0.22)',
};

// Background themes — all warm, barely any color
export const BG_THEMES = {
  cream:    '#FAF7F4',   // warm linen white (default)
  lavender: '#F6F2F8',   // barely warm mauve
  mint:     '#F2F5F2',   // barely warm sage
  sky:      '#F0F3F6',   // barely warm steel
  pink:     '#FBF0F2',   // barely blush rose
};

// Goal card accents — warm, soft
export const GOAL_ACCENTS = ['#C4838E', '#E8BCC2', '#C4BABC', '#BCC4CC', '#D4B89C'];
