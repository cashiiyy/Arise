import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { COLORS, SYSTEM_GLOW } from '../theme';

interface SystemCardProps extends ViewProps {
  children: React.ReactNode;
  glow?: boolean;
}

export const SystemCard: React.FC<SystemCardProps> = ({ children, style, glow = true, ...props }) => {
  return (
    <View style={[styles.card, glow && styles.glow, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 16,
    marginVertical: 8,
  },
  glow: {
    ...SYSTEM_GLOW,
  },
});
