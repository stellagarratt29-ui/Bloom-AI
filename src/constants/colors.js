// ─────────────────────────────────────────────────────
//  Palette — Forest & Clay
//  Warm near-white · deep forest ink · sage green accent · terracotta secondary
// ─────────────────────────────────────────────────────
export const C = {
  // Grounds
  cream:    '#FAFAF8',   // warm near-white — app background
  white:    '#FFFFFF',   // card surfaces
  ink:      '#1E2B20',   // deep warm forest-black (primary text)

  // Primary accent — sage forest green
  moss:     '#4A7C59',   // primary action / accent
  mossDark: '#355A40',
  clay:     '#C4744A',   // secondary accent — warm terracotta

  // Support
  sage:     '#7A8A7C',
  muted:    '#7A8A7C',
  border:   '#EDEBE7',
  shell:    '#FFFFFF',

  // Tinted highlights
  sagePale:  '#EBF3EE',  // sage tint — selected states
  sageLight: '#D0E8D8',  // lighter sage tint
  sageMid:   '#A8CCB4',
  goldPale:  '#F8F3EE',
  goldLight: '#F0E8DE',
  clayLight: '#F0E4DA',
  clayPale:  '#FCF0EB',

  // Compat aliases
  pinkDark:  '#C4744A',  // terracotta for section titles
  forest:    '#1E2B20',
  gold:      '#C4744A',

  // Legacy washes
  lavWash:  '#EBF3EE',
  mintWash: '#F0F4F0',
  skyWash:  '#EBF3EE',
  pinkWash: '#FCF0EB',
  lavender: '#A8B8AA',
  mint:     '#A8CCB4',
  sky:      '#A8C0B4',
  pink:     '#E4C4B0',
  lavDark:  '#4A7C59',
  mintDark: '#4A7C59',
  skyDark:  '#4A7C59',

  // Priority pill colors
  pillPinkBg:   '#FCF0EB',   pillPinkText: '#B54040',   // urgent
  pillLavBg:    '#EBF3EE',   pillLavText:  '#4A7C59',   // medium
  pillSkyBg:    '#F0F2F0',   pillSkyText:  '#7A8A7C',   // low
  pillMintBg:   '#EBF3EE',   pillMintText: '#4A7C59',

  // Dark mode
  darkBg:      '#0E1210',
  darkCard:    '#1A211C',
  darkBorder:  '#2A332C',
  darkText:    '#E8F0EA',
  darkSubtext: '#7A8A7C',
  darkInput:   '#0E1210',

  overlay: 'rgba(30,43,32,0.22)',
};

export const AESTHETICS = {
  bloom: {
    name: 'Bloom', emoji: '✦', description: 'Forest & clay', isDark: false,
    bg:            '#FAFAF8',
    card:          '#FFFFFF',
    accent:        '#4A7C59',
    accentDark:    '#355A40',
    accentPale:    '#EBF3EE',
    accentLight:   '#D0E8D8',
    ink:           '#1E2B20',
    subtext:       '#7A8A7C',
    border:        '#EDEBE7',
    chatBubble:    '#1E2B20',
    calloutAccent: '#D0E8D8',
  },
};

export const GOAL_ACCENTS = ['#4A7C59', '#6A9E78', '#355A40', '#C4744A', '#A8CCB4'];
