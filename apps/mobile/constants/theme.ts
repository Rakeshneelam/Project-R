export const Colors = {
  bg: '#0D0F1A',
  bgSecondary: '#131627',
  bgTertiary: '#1A1D2E',
  surface: 'rgba(255,255,255,0.05)',
  surfaceHover: 'rgba(255,255,255,0.08)',
  border: 'rgba(124,58,237,0.2)',
  borderLight: 'rgba(255,255,255,0.08)',

  accent: '#7C3AED',
  accentLight: '#A855F7',
  accentDark: '#5B21B6',
  accentGlow: 'rgba(124,58,237,0.3)',

  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#475569',

  success: '#10B981',
  successLight: 'rgba(16,185,129,0.15)',
  warning: '#F59E0B',
  warningLight: 'rgba(245,158,11,0.15)',
  danger: '#EF4444',
  dangerLight: 'rgba(239,68,68,0.15)',
  gold: '#F59E0B',
  silver: '#94A3B8',
  bronze: '#CD7C40',

  white: '#FFFFFF',
  black: '#000000',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 20, fontWeight: '600' as const },
  h4: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodySmall: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 11, fontWeight: '500' as const },
  label: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.3 },
};
