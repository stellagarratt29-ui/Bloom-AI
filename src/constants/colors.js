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

// Background themes — kept for any legacy references
export const BG_THEMES = {
  cream:    '#FAF7F4',
  lavender: '#F6F2F8',
  mint:     '#F2F5F2',
  sky:      '#F0F3F6',
  pink:     '#FBF0F2',
};

// ─────────────────────────────────────────────────────
//  AESTHETIC PRESETS — full palette per aesthetic
// ─────────────────────────────────────────────────────
export const AESTHETICS = {
  bloom: {
    name: 'Bloom',
    emoji: '🌸',
    description: 'Warm blush rose',
    isDark: false,
    bg:            '#FAF7F4',
    card:          '#FFFFFF',
    accent:        '#C4838E',
    accentDark:    '#A86870',
    accentPale:    '#FDF0F2',
    accentLight:   '#F0D8DC',
    ink:           '#1C1517',
    subtext:       '#9C8A8C',
    border:        '#EDE6E7',
    chatBubble:    '#C4838E',
    calloutAccent: '#E8BCC2',
  },
  matcha: {
    name: 'Matcha',
    emoji: '🍵',
    description: 'Earthy sage green',
    isDark: false,
    bg:            '#F3F6F0',
    card:          '#FFFFFF',
    accent:        '#6E9468',
    accentDark:    '#527050',
    accentPale:    '#ECF4EA',
    accentLight:   '#C8E0C4',
    ink:           '#182018',
    subtext:       '#68806A',
    border:        '#D4E4D0',
    chatBubble:    '#6E9468',
    calloutAccent: '#A8CCA4',
  },
  ocean: {
    name: 'Ocean',
    emoji: '🌊',
    description: 'Calm coastal blue',
    isDark: false,
    bg:            '#EDF4F8',
    card:          '#FFFFFF',
    accent:        '#4E87A4',
    accentDark:    '#35708A',
    accentPale:    '#E0EFF6',
    accentLight:   '#B4D4E8',
    ink:           '#102030',
    subtext:       '#5C8098',
    border:        '#C8DEE8',
    chatBubble:    '#4E87A4',
    calloutAccent: '#94C4DC',
  },
  lavender: {
    name: 'Lavender',
    emoji: '💜',
    description: 'Dreamy soft purple',
    isDark: false,
    bg:            '#F4F1FB',
    card:          '#FFFFFF',
    accent:        '#8A6CC8',
    accentDark:    '#6E54B0',
    accentPale:    '#EDE8FA',
    accentLight:   '#CEC4F0',
    ink:           '#1A1430',
    subtext:       '#826898',
    border:        '#DDD4F0',
    chatBubble:    '#8A6CC8',
    calloutAccent: '#C4B0EE',
  },
  peach: {
    name: 'Peach',
    emoji: '🍑',
    description: 'Sunny warm peach',
    isDark: false,
    bg:            '#FAF1E8',
    card:          '#FFFFFF',
    accent:        '#CC7850',
    accentDark:    '#B06038',
    accentPale:    '#FAE8DC',
    accentLight:   '#F0C8A8',
    ink:           '#2A1808',
    subtext:       '#946858',
    border:        '#ECDDD0',
    chatBubble:    '#CC7850',
    calloutAccent: '#F0B898',
  },
  midnight: {
    name: 'Midnight',
    emoji: '🌙',
    description: 'Deep dark violet',
    isDark: true,
    bg:            '#13121E',
    card:          '#1E1C2C',
    accent:        '#9B84E0',
    accentDark:    '#7B64C0',
    accentPale:    '#2A2840',
    accentLight:   '#3C3858',
    ink:           '#F0EEF8',
    subtext:       '#8880A0',
    border:        '#2E2C44',
    chatBubble:    '#9B84E0',
    calloutAccent: '#C8B8F8',
  },
};

// Goal card accents — warm, soft
export const GOAL_ACCENTS = ['#C4838E', '#E8BCC2', '#C4BABC', '#BCC4CC', '#D4B89C'];
