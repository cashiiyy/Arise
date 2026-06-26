import React from 'react';
import { TouchableOpacity, StyleSheet, TouchableOpacityProps, View } from 'react-native';
import { COLORS, SYSTEM_GLOW, SIZES } from '../theme';
import { SystemText } from './SystemText';

interface SystemButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const SystemButton: React.FC<SystemButtonProps> = ({ 
  title, 
  variant = 'primary', 
  style, 
  ...props 
}) => {
  const getButtonStyle = () => {
    switch(variant) {
      case 'primary': return [styles.button, styles.primary];
      case 'secondary': return [styles.button, styles.secondary];
      case 'outline': return [styles.button, styles.outline];
    }
  };

  return (
    <TouchableOpacity style={[getButtonStyle(), style]} activeOpacity={0.7} {...props}>
      <SystemText 
        variant="h2" 
        color={variant === 'outline' ? COLORS.primary : COLORS.background}
      >
        {title}
      </SystemText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  primary: {
    backgroundColor: COLORS.primary,
    ...SYSTEM_GLOW,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  }
});
