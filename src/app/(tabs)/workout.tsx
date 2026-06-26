/**
 * Workout Screen — AI-powered session with real exercise GIFs and progression.
 * Replaces hardcoded "Dumbbell Curl" with dynamic plans from workoutStore.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Pressable,
} from 'react-native';
import { SystemText } from '../../components/SystemText';
import { SystemCard } from '../../components/SystemCard';
import { SystemButton } from '../../components/SystemButton';
import { ExerciseGifPlayer } from '../../components/ExerciseGifPlayer';
import { ExerciseInfoCard } from '../../components/ExerciseInfoCard';
import { useUserStore } from '../../store/useUserStore';
import { useWorkoutStore } from '../../stores/workoutStore';
import { COLORS } from '../../theme';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { buildProgressionMessage } from '../../ai/progressionEngine';

const RPE_LABELS: Record<number, string> = {
  1: 'Very Easy', 2: 'Easy', 3: 'Light', 4: 'Moderate',
  5: 'Somewhat Hard', 6: 'Hard', 7: 'Hard', 8: 'Very Hard',
  9: 'Extremely Hard', 10: 'Max Effort',
};

export default function Workout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { name, rank, xp, biometrics, equipment, focusAreas, goal, frequency, addXP } = useUserStore();

  const {
    weekPlan, todaysPlan, coachMessage, sessionActive,
    activeExerciseIndex, currentSetLogs, setCount,
    currentWeight, currentReps, currentRpe,
    progressionMessages,
    generatePlan, loadSavedPlan, startSession,
    logSet, nextExercise, finishWorkout,
    setCurrentWeight, setCurrentReps, setCurrentRpe,
  } = useWorkoutStore();

  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [sessionResult, setSessionResult] = useState<any>(null);
  const [showInfoCard, setShowInfoCard] = useState(false);

  // Derive rank index from rank letter
  const rankIndexMap: Record<string, number> = { E: 0, D: 2, C: 4, B: 5, A: 6, S: 7 };

  useEffect(() => {
    // Load saved plan or generate new one
    loadSavedPlan().then(() => {
      if (!weekPlan) {
        generatePlan({
          name,
          age: biometrics.age,
          sex: biometrics.sex as 'male' | 'female',
          weightKg: biometrics.weight,
          heightCm: biometrics.height,
          goal: goal as any,
          rankIndex: rankIndexMap[rank] ?? 0,
          focusAreas,
          equipment,
          frequency,
          recoveryScore: 80,
        });
      }
    });
  }, []);

  // Rest timer effect
  useEffect(() => {
    if (!showRestTimer || restSeconds <= 0) return;
    const timer = setTimeout(() => setRestSeconds(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [showRestTimer, restSeconds]);

  const currentExercise = todaysPlan?.exercises[activeExerciseIndex];
  const isLastExercise = todaysPlan && activeExerciseIndex >= todaysPlan.exercises.length - 1;

  const handleLogSet = useCallback(() => {
    logSet(currentWeight, currentReps, currentRpe);
    // Show rest timer
    const rest = currentExercise?.restSeconds ?? 90;
    setRestSeconds(rest);
    setShowRestTimer(true);
  }, [currentWeight, currentReps, currentRpe, currentExercise]);

  const handleNextExercise = useCallback(() => {
    nextExercise();
    setShowRestTimer(false);
    setShowInfoCard(false);
  }, [nextExercise]);

  const handleFinish = useCallback(async () => {
    const session = await finishWorkout();
    addXP(session.totalXpEarned);
    setSessionResult(session);
    setShowFinishModal(true);
  }, [finishWorkout, addXP]);

  // ── Plan not loaded yet ────────────────────────────────────────────────────
  if (!todaysPlan) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingTop: insets.top }]}>
        <SystemText variant="h2" color={COLORS.primary} align="center">
          GENERATING BATTLE PLAN...
        </SystemText>
        <SystemText variant="muted" align="center" style={{ marginTop: 12 }}>
          AI analyzing your stats
        </SystemText>
      </View>
    );
  }

  // ── Rest Day ───────────────────────────────────────────────────────────────
  if (todaysPlan.isRestDay) {
    return (
      <ScrollView style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: Math.max(20, insets.top + 16) }]}>
        <SystemText variant="h1" align="center" style={{ marginBottom: 8, color: COLORS.secondary }}>
          REST PROTOCOL
        </SystemText>
        <SystemText variant="muted" align="center" style={{ marginBottom: 24 }}>
          {todaysPlan.label}
        </SystemText>
        <SystemCard style={{ alignItems: 'center', padding: 32 }}>
          <SystemText style={{ fontSize: 64, marginBottom: 16 }}>🌙</SystemText>
          <SystemText variant="h2" color={COLORS.secondary} align="center">
            RECOVERY DAY
          </SystemText>
          <SystemText variant="muted" align="center" style={{ marginTop: 12, lineHeight: 22 }}>
            System Alert: Active recovery protocol engaged.{'\n'}
            Light stretching and mobility work recommended.{'\n'}
            Prepare for tomorrow's training session.
          </SystemText>
        </SystemCard>
        <SystemCard style={{ borderColor: COLORS.primary, marginTop: 16 }}>
          <SystemText variant="body" color={COLORS.primary}>
            {coachMessage || 'Rest and recharge. The dungeon awaits tomorrow.'}
          </SystemText>
        </SystemCard>
        <SystemButton
          title="VIEW WEEKLY PLAN"
          variant="outline"
          onPress={() => {}}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    );
  }

  // ── Pre-session (not started) ──────────────────────────────────────────────
  if (!sessionActive) {
    return (
      <ScrollView style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: Math.max(20, insets.top + 16) }]}>
        <SystemText variant="h1" align="center" style={{ marginBottom: 4, color: COLORS.secondary }}>
          {todaysPlan.label.toUpperCase()}
        </SystemText>
        <SystemText variant="muted" align="center" style={{ marginBottom: 24 }}>
          {todaysPlan.muscleGroups.join(' • ')}
        </SystemText>

        {/* AI Coach Message */}
        {coachMessage ? (
          <SystemCard style={{ borderColor: COLORS.primary, marginBottom: 16 }}>
            <SystemText variant="body" color={COLORS.primary} style={{ lineHeight: 20 }}>
              {coachMessage}
            </SystemText>
          </SystemCard>
        ) : null}

        {/* Session Preview */}
        <SystemCard style={{ marginBottom: 16 }}>
          <View style={styles.sessionStats}>
            <View style={styles.statBox}>
              <SystemText variant="h2" color={COLORS.primary}>{todaysPlan.exercises.length}</SystemText>
              <SystemText variant="muted" style={{ fontSize: 10 }}>EXERCISES</SystemText>
            </View>
            <View style={styles.statBox}>
              <SystemText variant="h2" color={COLORS.secondary}>{todaysPlan.totalEstimatedDurationMin}m</SystemText>
              <SystemText variant="muted" style={{ fontSize: 10 }}>DURATION</SystemText>
            </View>
            <View style={styles.statBox}>
              <SystemText variant="h2" color={COLORS.gold}>{todaysPlan.totalXpReward}</SystemText>
              <SystemText variant="muted" style={{ fontSize: 10 }}>XP REWARD</SystemText>
            </View>
            <View style={styles.statBox}>
              <SystemText variant="h2" color={COLORS.success}>{todaysPlan.totalEstimatedCalories}</SystemText>
              <SystemText variant="muted" style={{ fontSize: 10 }}>KCAL</SystemText>
            </View>
          </View>
        </SystemCard>

        {/* Exercise Preview List */}
        {todaysPlan.exercises.map((planned, idx) => (
          <SystemCard key={idx} glow={false} style={styles.exercisePreview}>
            <View style={styles.previewRow}>
              <SystemText variant="mono" color={COLORS.primary} style={{ width: 28 }}>
                {String(idx + 1).padStart(2, '0')}
              </SystemText>
              <View style={{ flex: 1 }}>
                <SystemText variant="body">{planned.exercise.name}</SystemText>
                <SystemText variant="muted" style={{ fontSize: 11 }}>
                  {planned.plannedSets} × {planned.plannedRepRange} reps
                  {planned.recommendedWeightKg > 0 ? ` • ${planned.recommendedWeightKg}kg` : ' • Bodyweight'}
                </SystemText>
              </View>
              {planned.progressionNote && (
                <View style={styles.progressionBadge}>
                  <SystemText style={{ fontSize: 9, color: COLORS.success }}>↑</SystemText>
                </View>
              )}
            </View>
          </SystemCard>
        ))}

        <SystemButton
          title="BEGIN SESSION"
          onPress={startSession}
          style={{ marginTop: 24 }}
        />
        <SystemButton
          title="REGENERATE PLAN"
          variant="outline"
          onPress={() => generatePlan({
            name, age: biometrics.age, sex: biometrics.sex as 'male' | 'female',
            weightKg: biometrics.weight, heightCm: biometrics.height,
            goal: goal as any, rankIndex: rankIndexMap[rank] ?? 0,
            focusAreas, equipment, frequency, recoveryScore: 80,
          })}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    );
  }

  // ── Active Session ─────────────────────────────────────────────────────────
  const exercise = currentExercise?.exercise;
  if (!exercise) return null;

  const setsCompleted = setCount;
  const setsTarget = currentExercise.plannedSets;
  const setProgress = Math.min(1, setsCompleted / setsTarget);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: Math.max(20, insets.top + 16), paddingBottom: 40 }]}
    >
      {/* Progress header */}
      <View style={styles.progressHeader}>
        <SystemText variant="mono" color={COLORS.textMuted} style={{ fontSize: 11 }}>
          EXERCISE {activeExerciseIndex + 1} / {todaysPlan.exercises.length}
        </SystemText>
        <SystemText variant="mono" color={COLORS.primary} style={{ fontSize: 11 }}>
          SET {Math.min(setsCompleted + 1, setsTarget)} / {setsTarget}
        </SystemText>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${setProgress * 100}%` as any }]} />
      </View>

      {/* GIF Player */}
      <View style={{ marginTop: 16, alignItems: 'center' }}>
        <ExerciseGifPlayer
          exerciseId={exercise.exerciseId}
          exerciseName={exercise.name}
          size={260}
        />
      </View>

      {/* Progression Message */}
      {currentExercise.progressionNote && (
        <SystemCard style={styles.progressionCard}>
          <SystemText variant="body" color={COLORS.success} style={{ fontSize: 12 }}>
            ↑ {currentExercise.progressionNote}
          </SystemText>
        </SystemCard>
      )}

      {/* Weight & Reps Controls */}
      <View style={styles.loggerContainer}>
        <View style={styles.loggerCol}>
          <SystemText variant="muted" align="center">WEIGHT (kg)</SystemText>
          <View style={styles.controls}>
            <TouchableOpacity style={styles.adjBtn} onPress={() => setCurrentWeight(currentWeight - 2.5)}>
              <SystemText variant="h2" color={COLORS.primary}>−</SystemText>
            </TouchableOpacity>
            <SystemText variant="h2" style={styles.adjVal}>{currentWeight}</SystemText>
            <TouchableOpacity style={styles.adjBtn} onPress={() => setCurrentWeight(currentWeight + 2.5)}>
              <SystemText variant="h2" color={COLORS.primary}>+</SystemText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.loggerCol}>
          <SystemText variant="muted" align="center">REPS</SystemText>
          <View style={styles.controls}>
            <TouchableOpacity style={styles.adjBtn} onPress={() => setCurrentReps(currentReps - 1)}>
              <SystemText variant="h2" color={COLORS.primary}>−</SystemText>
            </TouchableOpacity>
            <SystemText variant="h2" style={styles.adjVal}>{currentReps}</SystemText>
            <TouchableOpacity style={styles.adjBtn} onPress={() => setCurrentReps(currentReps + 1)}>
              <SystemText variant="h2" color={COLORS.primary}>+</SystemText>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* RPE Selector */}
      <View style={styles.rpeRow}>
        <SystemText variant="muted" style={{ fontSize: 11, marginRight: 8 }}>RPE:</SystemText>
        {[6, 7, 8, 9, 10].map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.rpeBtn, currentRpe === r && styles.rpeBtnActive]}
            onPress={() => setCurrentRpe(r)}
          >
            <SystemText style={[styles.rpeTxt, currentRpe === r && { color: COLORS.background }]}>
              {r}
            </SystemText>
          </TouchableOpacity>
        ))}
        <SystemText variant="muted" style={{ fontSize: 10, marginLeft: 8 }}>
          {RPE_LABELS[currentRpe]}
        </SystemText>
      </View>

      <SystemButton title="LOG SET" onPress={handleLogSet} style={{ marginTop: 8 }} />

      {/* Info Card Toggle */}
      <TouchableOpacity
        style={styles.infoToggle}
        onPress={() => setShowInfoCard(v => !v)}
        activeOpacity={0.7}
      >
        <SystemText variant="body" color={COLORS.secondary}>
          {showInfoCard ? '▼' : '▶'} EXERCISE INFO & TIPS
        </SystemText>
      </TouchableOpacity>

      {showInfoCard && (
        <ExerciseInfoCard
          exercise={exercise}
          plannedSets={currentExercise.plannedSets}
          plannedReps={currentExercise.plannedReps}
          recommendedWeightKg={currentExercise.recommendedWeightKg}
          restSeconds={currentExercise.restSeconds}
        />
      )}

      {/* Navigation Buttons */}
      {isLastExercise ? (
        <SystemButton
          title="FINISH WORKOUT"
          variant="secondary"
          onPress={handleFinish}
          style={{ marginTop: 16 }}
        />
      ) : (
        <SystemButton
          title="NEXT EXERCISE →"
          variant="outline"
          onPress={handleNextExercise}
          style={{ marginTop: 16 }}
        />
      )}

      {/* Rest Timer Modal */}
      <Modal visible={showRestTimer} transparent animationType="fade">
        <Pressable
          style={styles.restOverlay}
          onPress={() => setShowRestTimer(false)}
        >
          <SystemCard style={styles.restCard}>
            <SystemText variant="h2" color={COLORS.secondary} align="center">
              REST TIMER
            </SystemText>
            <SystemText
              style={{ fontSize: 72, color: COLORS.primary, textAlign: 'center', fontFamily: 'SpaceMono', marginVertical: 16 }}
            >
              {String(Math.floor(restSeconds / 60)).padStart(2, '0')}:
              {String(restSeconds % 60).padStart(2, '0')}
            </SystemText>
            {restSeconds <= 0 && (
              <SystemText variant="h2" color={COLORS.success} align="center">
                READY FOR NEXT SET!
              </SystemText>
            )}
            <SystemButton
              title={restSeconds > 0 ? "SKIP REST" : "START NEXT SET"}
              onPress={() => setShowRestTimer(false)}
              style={{ marginTop: 16 }}
            />
          </SystemCard>
        </Pressable>
      </Modal>

      {/* Session Complete Modal */}
      <Modal visible={showFinishModal} transparent animationType="slide">
        <Pressable style={styles.restOverlay}>
          <SystemCard style={styles.restCard}>
            <SystemText variant="h1" color={COLORS.gold} align="center" style={{ marginBottom: 4 }}>
              ⚔ SESSION COMPLETE
            </SystemText>
            <SystemText variant="muted" align="center" style={{ marginBottom: 20 }}>
              {sessionResult?.completionPct ?? 0}% completion rate
            </SystemText>

            <View style={styles.sessionStats}>
              <View style={styles.statBox}>
                <SystemText variant="h2" color={COLORS.gold}>+{sessionResult?.totalXpEarned ?? 0}</SystemText>
                <SystemText variant="muted" style={{ fontSize: 10 }}>XP EARNED</SystemText>
              </View>
              <View style={styles.statBox}>
                <SystemText variant="h2" color={COLORS.success}>{sessionResult?.totalCaloriesBurned ?? 0}</SystemText>
                <SystemText variant="muted" style={{ fontSize: 10 }}>KCAL</SystemText>
              </View>
              <View style={styles.statBox}>
                <SystemText variant="h2" color={COLORS.primary}>{sessionResult?.totalDurationMin ?? 0}m</SystemText>
                <SystemText variant="muted" style={{ fontSize: 10 }}>DURATION</SystemText>
              </View>
            </View>

            {progressionMessages.length > 0 && (
              <SystemCard style={{ borderColor: COLORS.success, marginTop: 16 }}>
                <SystemText variant="body" color={COLORS.success} style={{ fontSize: 12 }}>
                  {progressionMessages[0]}
                </SystemText>
              </SystemCard>
            )}

            <SystemButton
              title="RETURN TO BASE"
              onPress={() => {
                setShowFinishModal(false);
                router.replace('/(tabs)');
              }}
              style={{ marginTop: 20 }}
            />
          </SystemCard>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingTop: 60, flexGrow: 1 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressBarBg: {
    height: 3, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2, overflow: 'hidden', marginBottom: 4,
  },
  progressBarFill: {
    height: '100%', backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary, shadowRadius: 6, shadowOpacity: 0.8, elevation: 4,
  },
  progressionCard: { borderColor: COLORS.success, marginTop: 8, paddingVertical: 8 },
  loggerContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 16 },
  loggerCol: { flex: 1, alignItems: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  adjBtn: {
    width: 44, height: 44, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 8,
  },
  adjVal: { width: 68, textAlign: 'center', fontSize: 28 },
  rpeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 12, gap: 4 },
  rpeBtn: {
    borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 6,
    width: 36, height: 36, justifyContent: 'center', alignItems: 'center',
  },
  rpeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  rpeTxt: { fontSize: 13, color: COLORS.textMuted, fontFamily: 'SpaceMono' },
  infoToggle: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', marginTop: 8 },
  sessionStats: { flexDirection: 'row', justifyContent: 'space-around' },
  statBox: { alignItems: 'center', gap: 4 },
  exercisePreview: { marginBottom: 6, paddingVertical: 10 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressionBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)', borderWidth: 1,
    borderColor: COLORS.success, borderRadius: 4, width: 20, height: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  restOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 },
  restCard: { alignItems: 'center' },
});
