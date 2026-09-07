// ─────────────────────────────────────────────────────
//  Palette — Clean Minimal
//  Warm near-white · warm near-black · single amber accent
// ─────────────────────────────────────────────────────
export const C = {
  // Grounds
  cream:    '#F8F7F4',   // warm near-white — app background
  white:    '#FFFFFF',   // card surfaces
  ink:      '#1A1918',   // warm near-black

  // Single accent — warm amber
  moss:     '#BF7B4B',   // primary action / accent (alias kept for compat)
  mossDark: '#A0622C',
  clay:     '#E6E4E0',   // neutral secondary

  // Support
  sage:     '#A8A5A0',
  muted:    '#7A7875',
  border:   '#E6E4E0',
  shell:    '#FFFFFF',

  // Tinted highlights — amber tints
  sagePale:  '#FBF0E6',
  sageLight: '#F2DCC8',
  sageMid:   '#E8C8A8',
  goldPale:  '#F0EFEC',
  goldLight: '#E6E4E0',
  clayLight: '#ECEAE6',
  clayPale:  '#F0EFEC',

  // Compat aliases
  pinkDark:  '#1A1918',
  forest:    '#1A1918',
  gold:      '#BF7B4B',

  // Legacy washes
  lavWash:  '#FBF0E6',
  mintWash: '#F0EFEC',
  skyWash:  '#F0EFEC',
  pinkWash: '#FAEAEA',
  lavender: '#A8A5A0',
  mint:     '#A8A5A0',
  sky:      '#A8A5A0',
  pink:     '#D4BAB0',
  lavDark:  '#BF7B4B',
  mintDark: '#BF7B4B',
  skyDark:  '#BF7B4B',

  // Priority pill colors
  pillPinkBg:   '#FAEAEA',   pillPinkText: '#C24B4B',   // urgent
  pillLavBg:    '#FBF0E6',   pillLavText:  '#BF7B4B',   // medium
  pillSkyBg:    '#F0EFEC',   pillSkyText:  '#7A7875',   // low
  pillMintBg:   '#FBF0E6',   pillMintText: '#BF7B4B',

  // Dark mode ground
  darkBg:      '#0F0E0D',
  darkCard:    '#1C1A18',
  darkBorder:  '#2E2B28',
  darkText:    '#F0EEE8',
  darkSubtext: '#8A8784',
  darkInput:   '#0F0E0D',

  overlay: 'rgba(26,25,24,0.22)',
};

export const AESTHETICS = {
  bloom: {
    name: 'Bloom', emoji: '✦', description: 'Warm minimal', isDark: false,
    bg:            '#F8F7F4',
    card:          '#FFFFFF',
    accent:        '#BF7B4B',
    accentDark:    '#A0622C',
    accentPale:    '#FBF0E6',
    accentLight:   '#F2DCC8',
    ink:           '#1A1918',
    subtext:       '#7A7875',
    border:        '#E6E4E0',
    chatBubble:    '#1A1918',
    calloutAccent: '#F2DCC8',
  },
};

export const GOAL_ACCENTS = ['#BF7B4B', '#D4935E', '#E8AA78', '#A0622C', '#8A5030'];
