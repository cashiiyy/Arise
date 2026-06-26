import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SystemText } from './SystemText';
import { SystemCard } from './SystemCard';
import { COLORS } from '../theme';
import { Quest } from '../types/arise';
import { CheckCircle2, Circle } from 'lucide-react-native';

interface QuestCardProps {
  quest: Quest;
  onPress?: () => void;
}

export const QuestCard: React.FC<QuestCardProps> = ({ quest, onPress }) => {
  const progressPercent = Math.min(1, quest.progress / quest.target);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <SystemCard style={quest.completed ? styles.completedCard : undefined} glow={!quest.completed}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {quest.completed ? (
              <CheckCircle2 color={COLORS.primary} size={20} style={{ marginRight: 8 }} />
            ) : (
              <Circle color={COLORS.textMuted} size={20} style={{ marginRight: 8 }} />
            )}
            <SystemText variant="body" color={quest.completed ? COLORS.primary : COLORS.text}>
              {quest.title}
            </SystemText>
          </View>
          <View style={styles.xpBadge}>
            <SystemText variant="mono" style={{ fontSize: 10, color: COLORS.background }}>
              +{quest.xpReward} XP
            </SystemText>
          </View>
        </View>
        
        <SystemText variant="muted" style={styles.desc}>
          {quest.description}
        </SystemText>

        <View style={styles.progressContainer}>
          <View style={styles.barBackground}>
            <View style={[styles.barFill, { width: `${progressPercent * 100}%` }]} />
          </View>
          <SystemText variant="mono" style={styles.progressText}>
            {quest.progress} / {quest.target} {quest.unit}
          </SystemText>
        </View>

      </SystemCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpBadge: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  desc: {
    marginLeft: 28,
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 28,
  },
  barBackground: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 12,
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  completedCard: {
    opacity: 0.7,
    borderColor: COLORS.primary,
  }
});
