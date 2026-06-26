/**
 * Workout History Database — Persists workout sessions to AsyncStorage.
 * Offline-first, all reads/writes are local.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutSession, ExerciseLog, ExerciseSet } from '../exercise/exerciseTypes';

const KEYS = {
  SESSIONS: '@arise:workout_sessions',
  CURRENT_SESSION: '@arise:current_session',
  WEEK_PLAN: '@arise:week_plan',
};

/**
 * Save a completed workout session.
 */
export async function saveWorkoutSession(session: WorkoutSession): Promise<void> {
  try {
    const existing = await getAllSessions();
    existing.unshift(session); // newest first
    // Keep only last 120 sessions to save storage
    const trimmed = existing.slice(0, 120);
    await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('[WorkoutHistoryDB] Failed to save session:', e);
  }
}

/**
 * Get all stored workout sessions.
 */
export async function getAllSessions(): Promise<WorkoutSession[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SESSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('[WorkoutHistoryDB] Failed to read sessions:', e);
    return [];
  }
}

/**
 * Get sessions from the last N days.
 */
export async function getRecentSessions(days: number = 30): Promise<WorkoutSession[]> {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const all = await getAllSessions();
  return all.filter(s => new Date(s.date).getTime() >= cutoff);
}

/**
 * Get flat exercise history for the progression engine.
 */
export async function getExerciseHistory(
  exerciseId?: string,
  limit: number = 20
): Promise<Array<{
  exerciseId: string;
  sets: number;
  reps: number;
  weightKg: number;
  date: string;
  rpe?: number;
  completionPct?: number;
}>> {
  const sessions = await getRecentSessions(90);
  const history: any[] = [];

  for (const session of sessions) {
    for (const exLog of session.exercises) {
      if (exerciseId && exLog.exerciseId !== exerciseId) continue;
      if (exLog.sets.length === 0) continue;
      
      const completedSets = exLog.sets.filter(s => s.completed);
      if (completedSets.length === 0) continue;

      const avgReps = Math.round(
        completedSets.reduce((sum, s) => sum + s.completedReps, 0) / completedSets.length
      );
      const maxWeight = Math.max(...completedSets.map(s => s.weightKg));
      const avgRpe = Math.round(
        completedSets.reduce((sum, s) => sum + s.rpe, 0) / completedSets.length
      );
      const completionPct = Math.round((completedSets.length / exLog.sets.length) * 100);

      history.push({
        exerciseId: exLog.exerciseId,
        sets: completedSets.length,
        reps: avgReps,
        weightKg: maxWeight,
        date: session.date,
        rpe: avgRpe,
        completionPct,
      });
    }
  }

  return history.slice(0, limit);
}

/**
 * Save the current week's workout plan.
 */
export async function saveWeekPlan(plan: any): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.WEEK_PLAN, JSON.stringify(plan));
  } catch (e) {
    console.warn('[WorkoutHistoryDB] Failed to save week plan:', e);
  }
}

/**
 * Load the saved week plan.
 */
export async function loadWeekPlan(): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.WEEK_PLAN);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Get workout statistics for a time range.
 */
export async function getWorkoutStats(days: number = 30) {
  const sessions = await getRecentSessions(days);
  const completed = sessions.filter(s => s.completed);
  const totalXp = completed.reduce((sum, s) => sum + s.totalXpEarned, 0);
  const totalCalories = completed.reduce((sum, s) => sum + s.totalCaloriesBurned, 0);
  const totalDuration = completed.reduce((sum, s) => sum + s.totalDurationMin, 0);
  const consistency = sessions.length > 0 ? Math.round((completed.length / sessions.length) * 100) : 0;

  return {
    totalSessions: sessions.length,
    completedSessions: completed.length,
    missedSessions: sessions.length - completed.length,
    consistency,
    totalXp,
    totalCalories,
    totalDurationMin: totalDuration,
    avgDurationMin: completed.length > 0 ? Math.round(totalDuration / completed.length) : 0,
  };
}

/**
 * Clear all workout history (for reset).
 */
export async function clearWorkoutHistory(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.SESSIONS, KEYS.CURRENT_SESSION, KEYS.WEEK_PLAN]);
}
