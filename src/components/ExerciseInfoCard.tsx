/**
 * ExerciseInfoCard — Displays full exercise metadata in Solo Leveling card style.
 * Shows target muscle, equipment, difficulty, instructions, tips, mistakes.
 */
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SystemText } from './SystemText';
import { SystemCard } from './SystemCard';
import { COLORS } from '../theme';
import { Exercise } from '../exercise/exerciseTypes';

interface Props {
  exercise: Exercise;
  plannedSets: number;
  plannedReps: number;
  recommendedWeightKg: number;
  restSeconds: number;
}

const DifficultyBadge: React.FC<{ difficulty: string }> = ({ difficulty }) => {
  const colors: Record<string, string> = {
    beginner: '#10B981',
    intermediate: '#FBBF24',
    advanced: '#EF4444',
  };
  return (
    <View style={[styles.badge, { borderColor: colors[difficulty] ?? COLORS.primary }]}>
      <SystemText
        variant="mono"
        style={{ fontSize: 10, color: colors[difficulty] ?? COLORS.primary, letterSpacing: 1 }}
      >
        {difficulty?.toUpperCase() ?? 'INTERMEDIATE'}
      </SystemText>
    </View>
  );
};

export const ExerciseInfoCard: React.FC<Props> = ({
  exercise,
  plannedSets,
  plannedReps,
  recommendedWeightKg,
  restSeconds,
}) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const muscleLabel = [
    ...exercise.targetMuscles,
    ...(exercise.secondaryMuscles.length > 0 ? [`+${exercise.secondaryMuscles.join(', ')}`] : []),
  ].join(' • ');

  return (
    <SystemCard style={styles.card}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <SystemText variant="h2" style={styles.exerciseName} numberOfLines={2}>
            {exercise.name.toUpperCase()}
          </SystemText>
          <SystemText variant="muted" style={styles.muscles} numberOfLines={1}>
            🎯 {muscleLabel}
          </SystemText>
        </View>
        <DifficultyBadge difficulty={exercise.difficulty ?? 'intermediate'} />
      </View>

      {/* Equipment Tag */}
      <View style={styles.tagsRow}>
        {exercise.equipments.map(eq => (
          <View key={eq} style={styles.equipTag}>
            <SystemText variant="mono" style={styles.tagText}>⚙ {eq}</SystemText>
          </View>
        ))}
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCell}>
          <SystemText variant="h2" color={COLORS.primary} style={styles.statVal}>{plannedSets}</SystemText>
          <SystemText variant="muted" style={styles.statLabel}>SETS</SystemText>
        </View>
        <View style={[styles.statCell, styles.statBorder]}>
          <SystemText variant="h2" color={COLORS.primary} style={styles.statVal}>{plannedReps}</SystemText>
          <SystemText variant="muted" style={styles.statLabel}>REPS</SystemText>
        </View>
        <View style={[styles.statCell, styles.statBorder]}>
          <SystemText variant="h2" color={COLORS.secondary} style={styles.statVal}>
            {recommendedWeightKg > 0 ? `${recommendedWeightKg}kg` : 'BW'}
          </SystemText>
          <SystemText variant="muted" style={styles.statLabel}>WEIGHT</SystemText>
        </View>
        <View style={[styles.statCell, styles.statBorder]}>
          <SystemText variant="h2" color={COLORS.gold} style={styles.statVal}>{restSeconds}s</SystemText>
          <SystemText variant="muted" style={styles.statLabel}>REST</SystemText>
        </View>
      </View>

      {/* Instructions Toggle */}
      <TouchableOpacity
        style={styles.sectionToggle}
        onPress={() => setShowInstructions(v => !v)}
        activeOpacity={0.7}
      >
        <SystemText variant="body" color={COLORS.primary}>
          {showInstructions ? '▼' : '▶'} INSTRUCTIONS
        </SystemText>
      </TouchableOpacity>

      {showInstructions && (
        <View style={styles.listContainer}>
          {exercise.instructions.map((step, i) => (
            <View key={i} style={styles.listItem}>
              <SystemText variant="mono" color={COLORS.primary} style={styles.stepNum}>
                {String(i + 1).padStart(2, '0')}
              </SystemText>
              <SystemText variant="body" style={styles.stepText}>
                {step.replace(/^Step:\d+\s*/, '')}
              </SystemText>
            </View>
          ))}
        </View>
      )}

      {/* Tips + Mistakes Toggle */}
      <TouchableOpacity
        style={styles.sectionToggle}
        onPress={() => setShowTips(v => !v)}
        activeOpacity={0.7}
      >
        <SystemText variant="body" color={COLORS.secondary}>
          {showTips ? '▼' : '▶'} TIPS & MISTAKES
        </SystemText>
      </TouchableOpacity>

      {showTips && (
        <View style={styles.listContainer}>
          {(exercise.tips ?? []).map((tip, i) => (
            <View key={`tip-${i}`} style={styles.listItem}>
              <SystemText style={styles.tipIcon}>✅</SystemText>
              <SystemText variant="body" style={styles.stepText}>{tip}</SystemText>
            </View>
          ))}
          {(exercise.commonMistakes ?? []).map((m, i) => (
            <View key={`mistake-${i}`} style={styles.listItem}>
              <SystemText style={styles.tipIcon}>❌</SystemText>
              <SystemText variant="body" style={styles.stepText}>{m}</SystemText>
            </View>
          ))}
        </View>
      )}
    </SystemCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  exerciseName: {
    fontSize: 16,
    letterSpacing: 1,
    flexWrap: 'wrap',
  },
  muscles: {
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  equipTag: {
    backgroundColor: 'rgba(0, 191, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 191, 255, 0.25)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  statsGrid: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  statBorder: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.1)',
  },
  statVal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 2,
  },
  sectionToggle: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  listContainer: {
    paddingBottom: 8,
    gap: 6,
  },
  listItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  stepNum: {
    fontSize: 11,
    width: 24,
    flexShrink: 0,
    paddingTop: 1,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.75)',
  },
  tipIcon: {
    fontSize: 13,
    width: 22,
    flexShrink: 0,
  },
});
