import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SystemText } from './SystemText';
import { COLORS, SYSTEM_GLOW } from '../theme';
import { XP_THRESHOLDS } from '../services/xpEngine';

interface RankBadgeProps {
  rank: string;
  rankIndex: number;
  xp: number;
  onPress?: () => void;
}

export const RankBadge: React.FC<RankBadgeProps> = ({ rank, rankIndex, xp, onPress }) => {
  const currentThreshold = XP_THRESHOLDS[rankIndex];
  const nextThreshold = XP_THRESHOLDS[Math.min(XP_THRESHOLDS.length - 1, rankIndex + 1)];
  
  const xpInRank = Math.max(0, xp - currentThreshold);
  const xpNeeded = nextThreshold - currentThreshold;
  const progress = xpNeeded > 0 ? Math.min(1, xpInRank / xpNeeded) : 1;

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.8}>
      <View style={[styles.badgeContainer, SYSTEM_GLOW]}>
        <SystemText variant="h1" color={COLORS.background} style={{ fontSize: 48, fontWeight: 'bold' }}>
          {rank}
        </SystemText>
      </View>
      
      <View style={styles.barContainer}>
        <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
      </View>
      <SystemText variant="mono" style={styles.xpText}>
        {xp} / {nextThreshold} XP
      </SystemText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  badgeContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  barContainer: {
    width: 200,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  xpText: {
    fontSize: 12,
    color: COLORS.textMuted,
  }
});
