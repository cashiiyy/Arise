import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, useAnimatedStyle, useSharedValue, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { SystemText } from './SystemText';
import { COLORS, SYSTEM_GLOW } from '../theme';
import { SystemMessage } from '../types/arise';

interface SystemMessageToastProps {
  message: SystemMessage;
  onDismiss: (id: string) => void;
}

export const SystemMessageToast: React.FC<SystemMessageToastProps> = ({ message, onDismiss }) => {
  const progress = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(0, { 
      duration: message.duration_ms,
      easing: Easing.linear
    }, (finished) => {
      if (finished) {
        runOnJS(onDismiss)(message.id);
      }
    });
  }, []);

  const barStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`
    };
  });

  const getBorderColor = () => {
    if (message.type === 'warning') return COLORS.danger;
    if (message.type === 'rankup' || message.type === 'achievement') return COLORS.gold;
    return COLORS.primary;
  };

  return (
    <Animated.View 
      entering={FadeInDown.duration(400)} 
      exiting={FadeOutDown.duration(400)}
      style={[styles.container, SYSTEM_GLOW, { borderColor: getBorderColor() }]}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={() => onDismiss(message.id)}>
        <View style={styles.timerBarContainer}>
          <Animated.View style={[styles.timerBar, barStyle, { backgroundColor: getBorderColor() }]} />
        </View>
        <View style={styles.content}>
          <View style={styles.header}>
            <SystemText variant="mono" style={{ color: getBorderColor() }}>
              [ SYSTEM ] {message.title}
            </SystemText>
            {message.xpBadge && (
              <View style={styles.xpBadge}>
                <SystemText variant="mono" style={{ fontSize: 10, color: COLORS.background }}>
                  +{message.xpBadge} XP
                </SystemText>
              </View>
            )}
          </View>
          <SystemText variant="body" style={styles.bodyText}>
            {message.body}
          </SystemText>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
  },
  timerBarContainer: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '100%',
  },
  timerBar: {
    height: '100%',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  xpBadge: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bodyText: {
    lineHeight: 20,
  }
});
