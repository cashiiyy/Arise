export const COLORS = {
  background: '#080A0F', // Deep void black
  primary: '#00BFFF',    // Electric blue
  secondary: '#7B68EE',  // Purple-indigo
  gold: '#D4AF37',       // Rank badges, XP
  text: '#E8F4F8',       // Ice white
  textMuted: '#8A99A8',  // Muted text
  card: 'rgba(25, 30, 45, 0.7)', // Semi-transparent dark panels
  cardBorder: 'rgba(0, 191, 255, 0.3)', // Glowing blue borders
  success: '#00E676',
  danger: '#FF3D00',
};

export const FONTS = {
  header: 'SpaceGrotesk-Bold', // Make sure to load this font
  body: 'Inter-Regular',       // Make sure to load this font
  mono: 'SpaceMono-Regular',   // For stat numbers
};

export const SIZES = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  badge: 48,
};

export const SYSTEM_GLOW = {
  shadowColor: COLORS.primary,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.8,
  shadowRadius: 10,
  elevation: 10,
};
