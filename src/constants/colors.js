// ─────────────────────────────────────────────────────
//  BLOOM — Clean Girl Palette
//  Crisp near-white · clean grey · dusty rose · near-black
//  Think: Glossier, Rhode Skin, The Row — edited, not earthy
// ─────────────────────────────────────────────────────
export const C = {
  // === Core palette ===
  cream:    '#F9F9F7',   // barely off-white — NOT warm, NOT sandy
  linen:    '#F3F3F1',   // clean off-white secondary
  ink:      '#18181B',   // clean near-black (no warm/green bias)
  moss:     '#B5909A',   // dusty rose-mauve — primary action
  mossDark: '#987480',   // deeper mauve
  sage:     '#C4BEBA',   // barely-warm neutral grey
  clay:     '#D4AEB6',   // soft petal rose — secondary accent
  clayDark: '#B88E98',   // deeper petal
  gold:     '#C8B090',   // champagne (used sparingly)
  white:    '#FFFFFF',
  shell:    '#F5F3F0',   // barely-off-white shell

  // === Supporting tones — clean, desaturated ===
  lavender: '#BEB8CC',   // barely lavender
  mint:     '#B8C4BC',   // barely sage
  sky:      '#B0BCCA',   // barely steel blue
  pink:     '#D8B8BC',   // petal pink

  // === Per-theme accent darks ===
  lavDark:  '#9088B0',
  mintDark: '#708878',
  skyDark:  '#6888A0',
  pinkDark: '#B08890',

  // === Category pills — barely-there, clean ===
  pillPinkBg:   '#F5E8EA',   pillPinkText: '#A87880',   // soft rose
  pillLavBg:    '#EEEAF4',   pillLavText:  '#8878A0',   // barely lavender
  pillSkyBg:    '#E8EEF2',   pillSkyText:  '#6888A0',   // barely steel
  pillMintBg:   '#E8EEEA',   pillMintText: '#688878',   // barely sage

  // === Background washes — extremely light ===
  lavWash:  '#F4F2F8',
  mintWash: '#F2F4F2',
  skyWash:  '#F0F2F6',
  pinkWash: '#F8F0F2',

  // === Dark mode — clean Apple-style dark ===
  darkBg:      '#111113',   // deep clean dark
  darkCard:    '#1C1C1E',   // Apple system card dark
  darkBorder:  '#2C2C2E',   // Apple system separator
  darkText:    '#F5F5F5',   // clean white
  darkSubtext: '#8E8E93',   // Apple system secondary label
  darkInput:   '#111113',

  // === Aliases ===
  forest:    '#18181B',
  sagePale:  '#F0EFED',   // barely grey
  sageLight: '#DCDAD8',   // clean light grey
  sageMid:   '#C4BEBA',
  clayLight: '#E8D0D4',
  clayPale:  '#FAF0F2',
  goldLight: '#E4D4B8',
  goldPale:  '#FAF4EC',
  muted:     '#9A9A9A',   // clean neutral grey — no earthy bias
  border:    '#EBEBEB',   // clean light grey border
  overlay:   'rgba(24,24,27,0.24)',
};

// Background themes — all extremely light, barely any color
export const BG_THEMES = {
  cream:    '#F9F9F7',   // barely off-white (default)
  lavender: '#F4F2F8',   // barely lavender
  mint:     '#F2F4F2',   // barely sage
  sky:      '#F0F2F6',   // barely steel
  pink:     '#F8F0F2',   // barely rose
};

// Goal card accents — clean, soft
export const GOAL_ACCENTS = ['#B5909A', '#D4AEB6', '#C4BEBA', '#B0BCCA', '#C8B090'];
