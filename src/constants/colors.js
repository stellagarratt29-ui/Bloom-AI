// ─────────────────────────────────────────────────────
//  Palette — Indigo + Stone
//  Stone-white ground · muted indigo accent · warm near-black
// ─────────────────────────────────────────────────────
export const C = {
  // Core
  cream:    '#F9F8F6',   // stone-white — the app background
  white:    '#FFFFFF',   // card surfaces
  ink:      '#1A1918',   // near-black (tiny warm bias)

  // Accent — indigo
  moss:     '#5A5FD4',   // primary action / accent (renamed for compat)
  mossDark: '#4448B0',   // pressed states
  clay:     '#E4E2DF',   // neutral secondary tone

  // Muted support
  sage:     '#C0BEC8',
  muted:    '#78777A',
  border:   '#E4E2DF',
  shell:    '#FFFFFF',   // card surface alias

  // Tinted highlights
  sagePale:  '#EEEFFC',  // indigo tint — selected states, insight banners
  sageLight: '#D8DAFC',  // lighter indigo tint
  sageMid:   '#A8ABEE',
  goldPale:  '#F3F2F0',
  goldLight: '#E4E2DF',
  clayLight: '#E8E6E0',
  clayPale:  '#F3F2F0',

  // Alias (used across screens)
  pinkDark:  '#5A5FD4',  // section titles (now indigo)
  forest:    '#1A1918',
  gold:      '#D4B89C',

  // Legacy washes
  lavWash:  '#F4F3FC',
  mintWash: '#F3F2F0',
  skyWash:  '#F3F2F0',
  pinkWash: '#FAEAEA',
  lavender: '#C0BEC8',
  mint:     '#BEC4C0',
  sky:      '#BCC4CC',
  pink:     '#E0C4C8',
  lavDark:  '#5A5FD4',
  mintDark: '#5A5FD4',
  skyDark:  '#5A5FD4',

  // Priority pill colors
  pillPinkBg:   '#FAEAEA',   pillPinkText: '#CC5A5A',   // urgent / high
  pillLavBg:    '#EEEFFC',   pillLavText:  '#5A5FD4',   // medium
  pillSkyBg:    '#F3F2F0',   pillSkyText:  '#78777A',   // low / leisure
  pillMintBg:   '#EEEFFC',   pillMintText: '#5A5FD4',

  // Dark mode ground
  darkBg:      '#0F0F12',
  darkCard:    '#1A1920',
  darkBorder:  '#2A2930',
  darkText:    '#F0EFF4',
  darkSubtext: '#8C8B96',
  darkInput:   '#0F0F12',

  overlay: 'rgba(26,25,24,0.22)',
};

// ─────────────────────────────────────────────────────
//  Single aesthetic — kept for ThemeContext compat
// ─────────────────────────────────────────────────────
export const AESTHETICS = {
  bloom: {
    name: 'Bloom', emoji: '✦', description: 'Indigo + stone', isDark: false,
    bg:            '#F9F8F6',
    card:          '#FFFFFF',
    accent:        '#5A5FD4',
    accentDark:    '#4448B0',
    accentPale:    '#EEEFFC',
    accentLight:   '#D8DAFC',
    ink:           '#1A1918',
    subtext:       '#78777A',
    border:        '#E4E2DF',
    chatBubble:    '#5A5FD4',
    calloutAccent: '#D8DAFC',
  },
};

export const GOAL_ACCENTS = ['#5A5FD4', '#7B78EE', '#9B98F4', '#4448B0', '#C4C3F4'];
