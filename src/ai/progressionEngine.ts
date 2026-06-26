/**
 * Progression Engine — Applies progressive overload to workout planning.
 * Analyzes workout history to recommend weight/rep/set increases.
 * 
 * Rules (never random):
 * - 2+ sessions at top of rep range → +2.5kg next session
 * - All reps complete but RPE > 8.5 → maintain weight, add rest
 * - Recovery < 50 → deload 10%
 * - 3 consecutive PRs → add 1 set
 * - Missed last session → reduce volume by 1 set
 */
import { Exercise } from '../exercise/exerciseTypes';
import { OverloadSuggestion } from '../exercise/exerciseTypes';

interface HistoryEntry {
  exerciseId: string;
  sets: number;
  reps: number;
  weightKg: number;
  date: string;
  rpe?: number;
  completionPct?: number;
}

/**
 * Determine the progressive overload suggestion for a given exercise.
 */
export function checkOverload(
  history: HistoryEntry[],
  exercise: Exercise,
  recoveryScore: number = 80
): OverloadSuggestion | null {
  if (history.length === 0) return null;

  // Sort by date descending
  const sorted = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const last = sorted[0];
  const prev = sorted[1];

  const topOfRepRange = exercise.defaultReps ?? 12;
  const bottomOfRepRange = Math.max(topOfRepRange - 4, 1);

  // ── Rule 1: Deload — poor recovery ──────────────────────────────────────────
  if (recoveryScore < 50 && last.weightKg > 0) {
    const deloadWeight = Math.round((last.weightKg * 0.9) / 2.5) * 2.5;
    return {
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.name,
      type: 'deload',
      previousValue: last.weightKg,
      suggestedValue: deloadWeight,
      delta: deloadWeight - last.weightKg,
      reason: `Recovery score ${recoveryScore}/100 — deload to ${deloadWeight}kg`,
      confidence: 0.9,
    };
  }

  // ── Rule 2: Weight increase — completed top of range twice ─────────────────
  if (
    prev &&
    last.reps >= topOfRepRange &&
    prev.reps >= topOfRepRange &&
    last.weightKg === prev.weightKg &&
    last.weightKg > 0 &&
    (last.rpe ?? 7) <= 8.5
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
      reason: `Hit ${topOfRepRange} reps for 2 sessions — increase to ${newWeight}kg`,
      confidence: 0.95,
    };
  }

  // ── Rule 3: Rep increase — below top of range ──────────────────────────────
  if (last.reps < topOfRepRange && last.reps >= bottomOfRepRange && last.weightKg > 0) {
    return {
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.name,
      type: 'reps',
      previousValue: last.reps,
      suggestedValue: Math.min(topOfRepRange, last.reps + 1),
      delta: 1,
      reason: `Target ${last.reps + 1} reps at ${last.weightKg}kg before increasing weight`,
      confidence: 0.85,
    };
  }

  // ── Rule 4: High RPE — maintain ────────────────────────────────────────────
  if ((last.rpe ?? 7) > 8.5 && last.reps >= topOfRepRange && last.weightKg > 0) {
    return {
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.name,
      type: 'maintain',
      previousValue: last.weightKg,
      suggestedValue: last.weightKg,
      delta: 0,
      reason: `RPE ${last.rpe}/10 — maintain ${last.weightKg}kg and focus on form`,
      confidence: 0.8,
    };
  }

  // ── Rule 5: 3 consecutive sessions complete → +1 set ──────────────────────
  if (sorted.length >= 3) {
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
        reason: `3 consecutive complete sessions — add 1 set (${last.sets + 1} total)`,
        confidence: 0.75,
      };
    }
  }

  return null;
}

/**
 * Generate progressive overload suggestions for an entire workout history.
 * Returns one suggestion per exercise.
 */
export function generateOverloadSuggestions(
  history: HistoryEntry[],
  exerciseMap: Record<string, Exercise>,
  recoveryScore: number
): OverloadSuggestion[] {
  // Group history by exercise
  const grouped: Record<string, HistoryEntry[]> = {};
  for (const entry of history) {
    if (!grouped[entry.exerciseId]) grouped[entry.exerciseId] = [];
    grouped[entry.exerciseId].push(entry);
  }

  const suggestions: OverloadSuggestion[] = [];
  for (const [exerciseId, entries] of Object.entries(grouped)) {
    const exercise = exerciseMap[exerciseId];
    if (!exercise) continue;
    const suggestion = checkOverload(entries, exercise, recoveryScore);
    if (suggestion) suggestions.push(suggestion);
  }

  return suggestions;
}

/**
 * Format a Solo Leveling style system message for a progression event.
 */
export function buildProgressionMessage(suggestion: OverloadSuggestion): string {
  switch (suggestion.type) {
    case 'weight':
      return `STRENGTH STAT INCREASED. Progressive overload protocol: +${suggestion.delta}kg on ${suggestion.exerciseName}. New target: ${suggestion.suggestedValue}kg.`;
    case 'reps':
      return `ENDURANCE PROTOCOL UPDATE. Target reps increased to ${suggestion.suggestedValue} on ${suggestion.exerciseName}.`;
    case 'sets':
      return `VOLUME EXPANSION DETECTED. Add 1 set to ${suggestion.exerciseName}. Total volume: ${suggestion.suggestedValue} sets.`;
    case 'deload':
      return `SYSTEM WARNING: Recovery deficit detected. Initiating deload protocol on ${suggestion.exerciseName}. Load reduced to ${suggestion.suggestedValue}kg.`;
    case 'maintain':
      return `SYSTEM MESSAGE: Form optimization protocol. Maintain ${suggestion.suggestedValue}kg on ${suggestion.exerciseName}. Focus on technique.`;
    default:
      return `PROTOCOL UPDATE: ${suggestion.reason}`;
  }
}
