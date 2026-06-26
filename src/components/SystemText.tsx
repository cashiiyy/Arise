import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';
import { COLORS, SIZES, FONTS } from '../theme';

interface SystemTextProps extends TextProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'body' | 'mono' | 'muted';
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export const SystemText: React.FC<SystemTextProps> = ({ 
  children, 
  variant = 'body', 
  color = COLORS.text, 
  align = 'auto',
  style, 
  ...props 
}) => {
  return (
    <Text 
      style={[
        styles[variant], 
        { color, textAlign: align }, 
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  h1: {
    // fontFamily: FONTS.header,
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
  },
  h2: {
    // fontFamily: FONTS.header,
    fontSize: SIZES.xl,
    fontWeight: 'bold',
  },
  body: {
    // fontFamily: FONTS.body,
    fontSize: SIZES.md,
  },
  mono: {
    // fontFamily: FONTS.mono,
    fontSize: SIZES.md,
    fontFamily: 'monospace',
  },
  muted: {
    // fontFamily: FONTS.body,
    fontSize: SIZES.sm,
    color: COLORS.textMuted,
  }
});
