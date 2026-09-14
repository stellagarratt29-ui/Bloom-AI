// ─────────────────────────────────────────────────────
//  Palette — Studio Minimal
//  Pure white · near-black text · dusty sage accent · muted sand secondary
// ─────────────────────────────────────────────────────
export const C = {
  // Grounds
  cream:    '#FFFFFF',   // pure white — app background
  white:    '#FFFFFF',   // card surfaces
  ink:      '#0F0F0F',   // near-black (primary text)

  // Primary accent — dusty sage (muted, refined)
  moss:     '#7A9A89',
  mossDark: '#5C7A6A',
  clay:     '#B09080',   // muted warm sand/rose (secondary)

  // Support
  sage:     '#6B6B6B',
  muted:    '#6B6B6B',
  border:   '#E8E8E7',
  shell:    '#FFFFFF',

  // Tinted highlights
  sagePale:  '#EFF4F2',
  sageLight: '#DDE8E3',
  sageMid:   '#AACABB',
  goldPale:  '#F5F1ED',
  goldLight: '#EDE7E2',
  clayLight: '#EAE2DE',
  clayPale:  '#F6F1EF',

  // Compat aliases
  pinkDark:  '#0F0F0F',   // used by GoalsScreen title — now near-black
  forest:    '#0F0F0F',
  gold:      '#B09080',

  // Legacy washes
  lavWash:  '#EFF4F2',
  mintWash: '#EFF4F2',
  skyWash:  '#EFF4F2',
  pinkWash: '#F6F1EF',
  lavender: '#AACABB',
  mint:     '#AACABB',
  sky:      '#AACABB',
  pink:     '#D4C0B8',
  lavDark:  '#7A9A89',
  mintDark: '#7A9A89',
  skyDark:  '#7A9A89',

  // Priority pill colors — very soft
  pillPinkBg:   '#FDF1F1',   pillPinkText: '#B85050',   // urgent
  pillLavBg:    '#EFF4F2',   pillLavText:  '#7A9A89',   // medium
  pillSkyBg:    '#F4F4F4',   pillSkyText:  '#6B6B6B',   // low
  pillMintBg:   '#EFF4F2',   pillMintText: '#7A9A89',

  // Dark mode
  darkBg:      '#111111',
  darkCard:    '#1A1A1A',
  darkBorder:  '#2E2E2E',
  darkText:    '#F0EFEE',
  darkSubtext: '#888888',
  darkInput:   '#111111',

  overlay: 'rgba(0,0,0,0.18)',
};

export const AESTHETICS = {
  bloom: {
    name: 'Bloom', emoji: '✦', description: 'Studio Minimal', isDark: false,
    bg:            '#FFFFFF',
    card:          '#FFFFFF',
    accent:        '#7A9A89',
    accentDark:    '#5C7A6A',
    accentPale:    '#EFF4F2',
    accentLight:   '#DDE8E3',
    ink:           '#0F0F0F',
    subtext:       '#6B6B6B',
    border:        '#E8E8E7',
    chatBubble:    '#0F0F0F',
    calloutAccent: '#DDE8E3',
  },
};

export const GOAL_ACCENTS = ['#7A9A89', '#5C7A6A', '#9BB5A8', '#B09080', '#AACABB'];
