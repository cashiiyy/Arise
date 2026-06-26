import { UserProfile, SessionLog, WorkoutPlan, OverloadSuggestion, GoalType } from '../types/arise';

const SPLIT_MAP: Record<GoalType, Record<number, string>> = {
  bulk:   { 3: 'FullBody', 4: 'UpperLower', 5: 'PPL', 6: 'PPLUL' },
  cut:    { 3: 'FullBody', 4: 'UpperLower', 5: 'HIITUpperLower', 6: 'HIITPPLHybrid' },
  gain:   { 3: 'FullBody', 4: 'UpperLower', 5: 'PPL', 6: 'PPLAbsCardio' },
  height: { 3: 'DecompStretch', 4: 'DecompSwim', 5: 'DecompFull', 6: 'DecompFull' },
};

const VOLUME_BY_RANK = [
  { sets: 3, repRange: '12–15' },
  { sets: 3, repRange: '10–12' },
  { sets: 4, repRange: '8–12' },
  { sets: 4, repRange: '6–10' },
  { sets: 4, repRange: '6–8' },
  { sets: 5, repRange: '5–8' },
  { sets: 5, repRange: '3–6' },
  { sets: 6, repRange: '1–5' }
];

export function generatePlan(u: UserProfile, daysPerWeek: number, volumeModifier: number = 1.0): WorkoutPlan {
  const clampedDays = Math.max(3, Math.min(6, daysPerWeek));
  const split = SPLIT_MAP[u.goal][clampedDays];
  const rankIndex = Math.max(0, Math.min(7, u.rankIndex));
  const baseVolume = VOLUME_BY_RANK[rankIndex];
  
  const adjustedSets = Math.round(baseVolume.sets * volumeModifier);

  const exercises = [];
  
  if (u.goal === 'height') {
    exercises.push(
      { id: 'e1', name: 'Spine Decompression', sets: adjustedSets, repRange: '60s' },
      { id: 'e2', name: 'Cat-Cow Stretch', sets: adjustedSets, repRange: '10–12' },
      { id: 'e3', name: 'Cobra Stretch', sets: adjustedSets, repRange: '60s' },
      { id: 'e4', name: 'Hanging Stretch', sets: adjustedSets, repRange: '30s' }
    );
    if (u.equipment.includes('Jump Rope')) {
      exercises.push({ id: 'e5', name: 'Jump Rope', sets: adjustedSets, repRange: '3 min' });
    }
  } else {
    // Generic mock generation for MVP
    exercises.push(
      { id: 'e1', name: 'Barbell Squat', sets: adjustedSets, repRange: baseVolume.repRange },
      { id: 'e2', name: 'Bench Press', sets: adjustedSets, repRange: baseVolume.repRange },
      { id: 'e3', name: 'Deadlift', sets: adjustedSets, repRange: baseVolume.repRange },
      { id: 'e4', name: 'Pull-up', sets: adjustedSets, repRange: baseVolume.repRange }
    );
  }

  return {
    split,
    daysPerWeek: clampedDays,
    exercises
  };
}

export function checkOverload(logs: SessionLog[], exercise: string): OverloadSuggestion | null {
  const exerciseLogs = logs.filter(l => l.exercise === exercise).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  if (exerciseLogs.length < 2) return null;

  const lastLog = exerciseLogs[0];
  const prevLog = exerciseLogs[1];

  // Arbitrary logic assuming top of rep range is 12 (mocking checking rep ranges)
  const topOfRepRange = 12;

  if (lastLog.reps >= topOfRepRange && prevLog.reps >= topOfRepRange) {
    return {
      exercise,
      suggestWeightDelta: 2.5
    };
  }

  return null;
}

export function estimateCalsBurned(MET: number, weightKg: number, durationMin: number): number {
  return MET * weightKg * (durationMin / 60);
}

export const mockWorkoutEngine = {
  generatePlan,
  checkOverload,
  estimateCalsBurned
};
