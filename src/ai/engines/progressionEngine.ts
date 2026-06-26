import { Exercise, OverloadSuggestion } from '../../exercise/exerciseTypes';

interface HistoryEntry {
  exerciseId: string;
  sets: number;
  reps: number;
  weightKg: number;
  date: string;
  rpe?: number;
  completionPct?: number;
}

export interface ProgressionContext {
  recoveryScore: number;
  sleepScore: number;
  nutritionScore: number; // 0-100 based on adherence
  skippedWorkouts: number;
  fatigueLevel: number;
  hrvTrend: 'improving' | 'declining' | 'stable';
}

/**
 * Determine the progressive overload suggestion considering extended context.
 */
export function checkOverload(
  history: HistoryEntry[],
  exercise: Exercise,
  context: ProgressionContext
): OverloadSuggestion | null {
  if (history.length === 0) return null;

  const sorted = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const last = sorted[0];
  const prev = sorted[1];

  const topOfRepRange = exercise.defaultReps ?? 12;
  const bottomOfRepRange = Math.max(topOfRepRange - 4, 1);

  const { recoveryScore, sleepScore, nutritionScore, skippedWorkouts, fatigueLevel, hrvTrend } = context;

  // ── Rule 1: Deload — poor recovery / high fatigue ─────────────────────────
  if (
    (recoveryScore < 50 || sleepScore < 50 || fatigueLevel > 80 || hrvTrend === 'declining') && 
    last.weightKg > 0
  ) {
    const deloadPct = fatigueLevel > 90 ? 0.8 : 0.9;
    const deloadWeight = Math.round((last.weightKg * deloadPct) / 2.5) * 2.5;
    return {
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.name,
      type: 'deload',
      previousValue: last.weightKg,
      suggestedValue: deloadWeight,
      delta: deloadWeight - last.weightKg,
      reason: `System fatigue detected (Recovery: ${recoveryScore}, Sleep: ${sleepScore}). Initiating ${Math.round((1-deloadPct)*100)}% deload to ${deloadWeight}kg.`,
      confidence: 0.95,
    };
  }

  // ── Rule 2: Missed workouts — conservative volume ──────────────────────────
  if (skippedWorkouts > 2 && last.sets > 2) {
    return {
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.name,
      type: 'sets',
      previousValue: last.sets,
      suggestedValue: Math.max(2, last.sets - 1),
      delta: -1,
      reason: `Missed ${skippedWorkouts} recent workouts. Easing back in with reduced volume.`,
      confidence: 0.9,
    };
  }

  // ── Rule 3: Weight increase — completed top of range twice ─────────────────
  if (
    prev &&
    last.reps >= topOfRepRange &&
    prev.reps >= topOfRepRange &&
    last.weightKg === prev.weightKg &&
    last.weightKg > 0 &&
    (last.rpe ?? 7) <= 8.5 &&
    nutritionScore >= 70 // Require decent nutrition for strength gains
  ) {
    const increment = last.weightKg >= 40 ? 2.5 : 1.25;
    const newWeight = last.weightKg + increment;
    return {
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.name,
      type: 'weight',
      previousValue: last.weightKg,
      suggestedValue: newWeight,
      delta: increment,
      reason: `Hit ${topOfRepRange} reps for 2 sessions with good nutrition. Increase to ${newWeight}kg.`,
      confidence: 0.95,
    };
  }

  // ── Rule 4: Rep increase — below top of range ──────────────────────────────
  if (last.reps < topOfRepRange && last.reps >= bottomOfRepRange && last.weightKg > 0) {
    return {
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.name,
      type: 'reps',
      previousValue: last.reps,
      suggestedValue: Math.min(topOfRepRange, last.reps + 1),
      delta: 1,
      reason: `Target ${last.reps + 1} reps at ${last.weightKg}kg before increasing weight.`,
      confidence: 0.85,
    };
  }

  // ── Rule 5: High RPE — maintain ────────────────────────────────────────────
  if ((last.rpe ?? 7) > 8.5 && last.reps >= topOfRepRange && last.weightKg > 0) {
    return {
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.name,
      type: 'maintain',
      previousValue: last.weightKg,
      suggestedValue: last.weightKg,
      delta: 0,
      reason: `RPE ${last.rpe}/10 — maintain ${last.weightKg}kg and focus on form.`,
      confidence: 0.8,
    };
  }

  // ── Rule 6: 3 consecutive sessions complete → +1 set ──────────────────────
  if (sorted.length >= 3 && recoveryScore > 70) {
    const last3 = sorted.slice(0, 3);
    const allComplete = last3.every(s => (s.completionPct ?? 100) >= 95);
    if (allComplete && last.sets < 6) {
      return {
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.name,
        type: 'sets',
        previousValue: last.sets,
        suggestedValue: last.sets + 1,
        delta: 1,
        reason: `3 consecutive complete sessions & good recovery — add 1 set (${last.sets + 1} total).`,
        confidence: 0.75,
      };
    }
  }

  return null;
}

export function buildProgressionMessage(suggestion: OverloadSuggestion): string {
  switch (suggestion.type) {
    case 'weight': return `STRENGTH PROTOCOL: +${suggestion.delta}kg on ${suggestion.exerciseName}. Target: ${suggestion.suggestedValue}kg.`;
    case 'reps': return `ENDURANCE PROTOCOL: Reps increased to ${suggestion.suggestedValue} on ${suggestion.exerciseName}.`;
    case 'sets': return `VOLUME UPDATE: Total sets modified to ${suggestion.suggestedValue} on ${suggestion.exerciseName}.`;
    case 'deload': return `RECOVERY PROTOCOL: Load reduced to ${suggestion.suggestedValue}kg on ${suggestion.exerciseName}.`;
    case 'maintain': return `OPTIMIZATION: Maintain ${suggestion.suggestedValue}kg on ${suggestion.exerciseName}. Focus on technique.`;
    default: return `PROTOCOL UPDATE: ${suggestion.reason}`;
  }
}
