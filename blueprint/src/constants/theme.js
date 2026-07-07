// Blueprint design system — warm, architectural, editorial. Calm neutrals with a
// terracotta accent so the UI recedes and player builds stay the visual focus.

export const C = {
  bg: '#F4F1EC',
  bgAlt: '#EAE5DC',
  surface: '#FFFFFF',
  surfaceAlt: '#FBF9F5',
  border: '#E2DCD0',
  borderStrong: '#C9C0AF',

  text: '#2B2620',
  textMuted: '#6E6459',
  textFaint: '#9C9184',
  textOnAccent: '#FFFFFF',

  accent: '#C1602E',
  accentSoft: '#F0DACB',
  accentDeep: '#8F4620',

  sage: '#7C9473',
  sageSoft: '#E1E9DC',
  sky: '#5C87A6',
  skySoft: '#DDE7EE',
  gold: '#C79A3A',
  goldSoft: '#F2E6C8',
  clay: '#B15544',
  claySoft: '#F1DBD4',

  success: '#4E8B5C',
  danger: '#B3452F',

  shadow: 'rgba(43, 38, 32, 0.12)',
};

export const RADIUS = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 };

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const FONT = {
  logo: { fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 22, fontWeight: '700', color: C.text, letterSpacing: 1 },
  h1: { fontSize: 28, fontWeight: '700', color: C.text },
  h2: { fontSize: 22, fontWeight: '700', color: C.text },
  h3: { fontSize: 17, fontWeight: '600', color: C.text },
  body: { fontSize: 15, fontWeight: '400', color: C.text },
  bodyMuted: { fontSize: 14, fontWeight: '400', color: C.textMuted },
  caption: { fontSize: 12, fontWeight: '500', color: C.textFaint },
  label: { fontSize: 13, fontWeight: '600', color: C.textMuted, letterSpacing: 0.3 },
};

export const SHADOW = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  float: {
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};
