import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import { SystemText } from './SystemText';
import { COLORS } from '../theme';

interface AuraBarProps {
  aura: number;
}

export const AuraBar: React.FC<AuraBarProps> = ({ aura }) => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (aura > 500) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulse.value = 1;
    }
  }, [aura]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulse.value }]
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <SystemText variant="muted" style={{ marginRight: 12 }}>AURA</SystemText>
      <View style={styles.barBackground}>
        <View style={styles.barFill} />
      </View>
      <SystemText variant="mono" color={COLORS.secondary} style={{ marginLeft: 12, minWidth: 40 }}>
        {aura}
      </SystemText>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  barBackground: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  }
});
