// ─────────────────────────────────────────────────────
//  BLOOM — Floral Pastel Palette
//  Aesthetic stationery: rose · lilac · plum · sage
// ─────────────────────────────────────────────────────
export const C = {
  // === Core palette ===
  cream:    '#FAF6F8',   // petal white — barely-rose white, main bg
  linen:    '#F5EFF8',   // soft lavender linen
  ink:      '#3D2C4E',   // deep violet-plum (was earthy forest green)
  moss:     '#C490A8',   // dusty rose — primary action accent (replaces earthy green)
  mossDark: '#A87090',   // deeper rose for pressed/active
  sage:     '#B8A8D0',   // soft lavender-grey (replaces mid-sage green)
  clay:     '#9E8CC4',   // soft lilac — secondary accent (replaces terracotta)
  clayDark: '#8270AA',   // deeper lilac
  gold:     '#D4B8C8',   // soft mauve-rose (replaces yellow-gold)
  white:    '#FFFFFF',
  shell:    '#F2EBF7',   // lavender shell

  // === Floral accent pastels ===
  lavender: '#C0AEDD',   // medium lavender
  mint:     '#A8C4B8',   // very soft floral sage
  sky:      '#A8BCDC',   // periwinkle blue
  pink:     '#E8B0C4',   // soft blush

  // === Per-theme accent darks ===
  lavDark:  '#9878CC',   // medium lilac (Grow tab via lavender bg)
  mintDark: '#7BAAA0',   // soft sage-teal (Grow tab, muted nature)
  skyDark:  '#7898C4',   // periwinkle (Calendar, sky tab)
  pinkDark: '#D08098',   // dusty rose-pink (Goals tab)

  // === Category pill colors — all floral ===
  pillPinkBg:   '#FDE8F0',   pillPinkText: '#B86080',   // rose (School & Health)
  pillLavBg:    '#EEE8F8',   pillLavText:  '#8065B8',   // lilac (Tasks)
  pillSkyBg:    '#E4ECF8',   pillSkyText:  '#5878C4',   // periwinkle (Fun)
  pillMintBg:   '#E4F2EE',   pillMintText: '#5A8E7A',   // sage (extra)

  // === Background washes ===
  lavWash:  '#F3EEF9',   // soft lilac wash
  mintWash: '#EEF5F1',   // very soft sage wash
  skyWash:  '#EEF2F9',   // periwinkle wash
  pinkWash: '#FDF0F5',   // blush wash

  // === Dark mode (plum-based) ===
  darkBg:      '#1E1624',   // deep plum-dark
  darkCard:    '#2A1E34',   // medium plum
  darkBorder:  '#3D2E4A',   // plum border
  darkText:    '#EDE0F2',   // soft lavender-white
  darkSubtext: '#9078A8',   // muted lavender
  darkInput:   '#1E1624',

  // === Aliases ===
  forest:    '#3D2C4E',
  sagePale:  '#F0EAF6',   // very soft lavender wash (was sage-pale green)
  sageLight: '#DDD3E8',   // light lavender (was sage-light green)
  sageMid:   '#B8A8D0',   // lavender (was mid-sage)
  clayLight: '#D4BEDC',   // light lilac
  clayPale:  '#F5F0FA',   // near-white lilac
  goldLight: '#E8D0DC',   // soft rose-mauve light
  goldPale:  '#FBF5F8',   // near-white rose
  muted:     '#9B8FAA',   // dusty mauve (was neutral grey)
  border:    '#EAE3F0',   // soft lavender-grey border (was warm linen)
  overlay:   'rgba(61,44,78,0.28)',
};

// Background theme hex values (wash backgrounds, barely-tinted)
export const BG_THEMES = {
  cream:    '#FAF6F8',   // petal white (default)
  lavender: '#F3EEF9',   // soft lilac wash
  mint:     '#EEF5F1',   // very soft sage
  sky:      '#EEF2F9',   // soft periwinkle
  pink:     '#FDF0F5',   // soft blush
};

// Goal card left-border accent colors — soft floral pastels
export const GOAL_ACCENTS = ['#D4A5B8', '#9E8CC4', '#C0AEDD', '#96B5A4', '#D4B8C8'];
