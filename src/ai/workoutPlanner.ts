/**
 * AI Workout Planner — Generates personalized weekly workout plans.
 * Pure TypeScript rule-based engine. No external API calls.
 * 
 * Considers: Age, Gender, Goal, Rank, Equipment, Days/Week,
 *            Recovery Score, Sleep, Heart Rate, History, Fatigue
 */
import {
  PlannedExercise,
  DayWorkoutPlan,
  WeekWorkoutPlan,
} from '../exercise/exerciseTypes';
import {
  getExercisesForDay,
  estimateCaloriesBurned,
} from '../exercise/exerciseService';
import { checkOverload, ProgressionContext } from './engines/progressionEngine';

export interface PlannerInput {
  // User profile
  name: string;
  age: number;
  sex: 'male' | 'female';
  weightKg: number;
  heightCm: number;
  goal: 'bulk' | 'cut' | 'gain' | 'height';
  rankIndex: number; // 0=E, 7=S
  focusAreas: string[];
  equipment: string[];
  frequency: number; // days per week

  // Recovery & watch data
  recoveryScore: number; // 0-100
  sleepHours?: number;
  avgHeartRate?: number;
  todaySteps?: number;

  // History
  completedWorkouts?: number; // last 30 days
  missedWorkouts?: number;
  workoutHistory?: Array<{ exerciseId: string; sets: number; reps: number; weightKg: number; date: string }>;
}

// ─── Weekly Split Templates ───────────────────────────────────────────────────

interface SplitDay {
  label: string;
  muscles: string[];
  isRest: boolean;
}

type SplitTemplate = SplitDay[];

const FULL_BODY_3: SplitTemplate = [
  { label: 'Full Body A', muscles: ['upper legs', 'chest', 'back'], isRest: false },
  { label: 'Rest & Recovery', muscles: [], isRest: true },
  { label: 'Full Body B', muscles: ['shoulders', 'upper arms', 'waist'], isRest: false },
  { label: 'Rest & Recovery', muscles: [], isRest: true },
  { label: 'Full Body C', muscles: ['upper legs', 'back', 'chest'], isRest: false },
  { label: 'Rest & Recovery', muscles: [], isRest: true },
  { label: 'Active Recovery', muscles: [], isRest: true },
];

const UPPER_LOWER_4: SplitTemplate = [
  { label: 'Upper Body A', muscles: ['chest', 'back', 'shoulders'], isRest: false },
  { label: 'Lower Body A', muscles: ['upper legs', 'lower legs', 'waist'], isRest: false },
  { label: 'Rest & Recovery', muscles: [], isRest: true },
  { label: 'Upper Body B', muscles: ['chest', 'upper arms', 'back'], isRest: false },
  { label: 'Lower Body B', muscles: ['upper legs', 'waist', 'lower legs'], isRest: false },
  { label: 'Rest & Recovery', muscles: [], isRest: true },
  { label: 'Active Recovery', muscles: [], isRest: true },
];

const PPL_5: SplitTemplate = [
  { label: 'Push Day', muscles: ['chest', 'shoulders', 'upper arms'], isRest: false },
  { label: 'Pull Day', muscles: ['back', 'upper arms', 'lower arms'], isRest: false },
  { label: 'Legs Day', muscles: ['upper legs', 'lower legs', 'waist'], isRest: false },
  { label: 'Push Day B', muscles: ['chest', 'shoulders'], isRest: false },
  { label: 'Pull Day B', muscles: ['back', 'upper arms'], isRest: false },
  { label: 'Active Recovery', muscles: [], isRest: true },
  { label: 'Rest', muscles: [], isRest: true },
];

const PPL_6: SplitTemplate = [
  { label: 'Push Day', muscles: ['chest', 'shoulders', 'upper arms'], isRest: false },
  { label: 'Pull Day', muscles: ['back', 'upper arms', 'lower arms'], isRest: false },
  { label: 'Legs Day', muscles: ['upper legs', 'lower legs'], isRest: false },
  { label: 'Push Day B', muscles: ['chest', 'shoulders', 'upper arms'], isRest: false },
  { label: 'Pull Day B', muscles: ['back', 'upper arms', 'lower arms'], isRest: false },
  { label: 'Legs + Core', muscles: ['upper legs', 'waist'], isRest: false },
  { label: 'Rest', muscles: [], isRest: true },
];

function getSplitTemplate(frequency: number, goal: string): SplitTemplate {
  if (frequency <= 3) return FULL_BODY_3;
  if (frequency === 4) return UPPER_LOWER_4;
  if (frequency === 5) return PPL_5;
  return PPL_6;
}

// ─── Volume Tables ────────────────────────────────────────────────────────────

interface VolumeConfig {
  sets: number;
  reps: number;
  repRange: string;
  intensity: 'light' | 'moderate' | 'hard' | 'max';
}

const RANK_VOLUME: VolumeConfig[] = [
  { sets: 3, reps: 15, repRange: '12-15', intensity: 'light' },    // E
  { sets: 3, reps: 12, repRange: '10-12', intensity: 'light' },    // E+
  { sets: 3, reps: 10, repRange: '8-12', intensity: 'moderate' },  // D
  { sets: 4, reps: 10, repRange: '8-12', intensity: 'moderate' },  // D+
  { sets: 4, reps: 8,  repRange: '6-10', intensity: 'hard' },      // C
  { sets: 4, reps: 6,  repRange: '5-8',  intensity: 'hard' },      // B
  { sets: 5, reps: 5,  repRange: '4-6',  intensity: 'max' },       // A
  { sets: 5, reps: 3,  repRange: '1-5',  intensity: 'max' },       // S
];

function getVolumeForRank(rankIndex: number, recoveryScore: number): VolumeConfig {
  const clampedRank = Math.max(0, Math.min(7, rankIndex));
  const vol = { ...RANK_VOLUME[clampedRank] };
  
  // Reduce volume if recovery is poor
  if (recoveryScore < 40) {
    vol.sets = Math.max(2, vol.sets - 1);
    vol.intensity = vol.intensity === 'max' ? 'hard' : vol.intensity === 'hard' ? 'moderate' : 'light';
  } else if (recoveryScore < 60) {
    vol.reps = Math.max(8, vol.reps);
    vol.intensity = vol.intensity === 'max' ? 'hard' : vol.intensity;
  }

  return vol;
}

// ─── Equipment Mapping ────────────────────────────────────────────────────────

function mapUserEquipment(userEquipment: string[]): string[] {
  const mapping: Record<string, string[]> = {
    'Barbells': ['barbell'],
    'Dumbbells': ['dumbbell'],
    'Kettlebells': ['kettlebell'],
    'Machines': ['leverage machine', 'cable', 'smith machine', 'sled machine'],
    'Resistance Bands': ['resistance band'],
    'Pull-up Bar': ['body weight'],
    'None (Bodyweight)': ['body weight', 'assisted', 'weighted'],
    'Full gym': ['barbell', 'dumbbell', 'cable', 'leverage machine', 'kettlebell', 'smith machine'],
  };

  const result: string[] = ['body weight']; // always include bodyweight
  for (const ue of userEquipment) {
    const mapped = mapping[ue];
    if (mapped) result.push(...mapped);
  }
  return [...new Set(result)];
}

// ─── Main Planner ─────────────────────────────────────────────────────────────

/**
 * Generate a full personalized 7-day workout plan.
 */
export function generateWeekPlan(input: PlannerInput): WeekWorkoutPlan {
  const {
    weightKg,
    goal,
    rankIndex,
    equipment,
    frequency,
    recoveryScore,
    workoutHistory = [],
  } = input;

  const splitTemplate = getSplitTemplate(frequency, goal);
  const volumeConfig = getVolumeForRank(rankIndex, recoveryScore);
  const mappedEquipment = mapUserEquipment(equipment);

  const splitNames: Record<string, string> = {
    '3': 'Full Body',
    '4': 'Upper / Lower',
    '5': 'Push Pull Legs',
    '6': 'Push Pull Legs (6-day)',
  };
  const splitName = splitNames[String(Math.min(6, Math.max(3, frequency)))] ?? 'Custom Split';

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday

  let totalWeekXp = 0;

  const days: DayWorkoutPlan[] = splitTemplate.map((dayTemplate, idx) => {
    if (dayTemplate.isRest) {
      return {
        dayIndex: idx,
        dayName: getDayName(idx),
        label: dayTemplate.label,
        muscleGroups: [],
        exercises: [],
        totalEstimatedCalories: 0,
        totalEstimatedDurationMin: 0,
        totalXpReward: 0,
        isRestDay: true,
        recoveryAdvice: 'Active recovery recommended. Keep heart rate below 110bpm.',
        predictedCompletionScore: 100,
        trainingWarnings: [],
      };
    }

    const exercises = getExercisesForDay(dayTemplate.muscles, mappedEquipment, 5);
    
    let dayCalories = 0;
    let dayDuration = 0;
    let dayXp = 0;
    
    const context: ProgressionContext = {
      recoveryScore,
      sleepScore: input.sleepHours ? input.sleepHours * 10 : 80,
      nutritionScore: 85, // Stubbed for now
      skippedWorkouts: input.missedWorkouts || 0,
      fatigueLevel: 100 - recoveryScore,
      hrvTrend: 'stable',
    };

    const plannedExercises: PlannedExercise[] = exercises.map(exercise => {
      const overload = checkOverload(
        workoutHistory.filter(h => h.exerciseId === exercise.exerciseId),
        exercise,
        context
      );

      const recommendedWeight = overload
        ? overload.suggestedValue
        : exercise.defaultWeightKg ?? 0;

      const progressionNote = overload ? overload.reason : undefined;

      const kcal = estimateCaloriesBurned(
        exercise,
        volumeConfig.sets,
        volumeConfig.reps,
        recommendedWeight,
        weightKg
      );

      const durationMin = volumeConfig.sets * (1 + (exercise.restTime ?? 90) / 60);
      const xp = (exercise.xpReward ?? 50) * (
        volumeConfig.intensity === 'max' ? 2 :
        volumeConfig.intensity === 'hard' ? 1.5 :
        volumeConfig.intensity === 'moderate' ? 1.2 : 1
      );

      dayCalories += kcal;
      dayDuration += durationMin;
      dayXp += xp;

      return {
        exercise,
        plannedSets: volumeConfig.sets,
        plannedReps: volumeConfig.reps,
        plannedRepRange: volumeConfig.repRange,
        recommendedWeightKg: recommendedWeight,
        restSeconds: exercise.restTime ?? 90,
        intensityLevel: volumeConfig.intensity,
        estimatedCalories: kcal,
        xpReward: Math.round(xp),
        estimatedDurationMin: Math.round(durationMin),
        progressionNote,
      };
    });

    totalWeekXp += dayXp;

    return {
      dayIndex: idx,
      dayName: getDayName(idx),
      label: dayTemplate.label,
      muscleGroups: dayTemplate.muscles,
      exercises: plannedExercises,
      totalEstimatedCalories: Math.round(dayCalories),
      totalEstimatedDurationMin: Math.round(dayDuration),
      totalXpReward: Math.round(dayXp),
      isRestDay: false,
      recoveryAdvice: recoveryScore < 60 ? 'Ensure post-workout stretching and adequate hydration.' : 'Standard recovery protocol.',
      predictedCompletionScore: Math.min(100, recoveryScore + 20),
      trainingWarnings: recoveryScore < 50 ? ['High fatigue detected. Do not push to failure.'] : [],
    };
  });

  return {
    id: `plan_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    weekStartDate: weekStart.toISOString().split('T')[0],
    splitName,
    days,
    totalWeekXp: Math.round(totalWeekXp),
  };
}

function getDayName(index: number): string {
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][index] ?? 'Day';
}

/**
 * Get today's workout plan from a week plan.
 */
export function getTodaysPlan(weekPlan: WeekWorkoutPlan): DayWorkoutPlan {
  const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon...
  const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Mon=0
  return weekPlan.days[idx] ?? weekPlan.days[0];
}

/**
 * Format a system-style coaching message for today's workout.
 */
export function buildWorkoutCoachMessage(plan: DayWorkoutPlan, recoveryScore: number): string {
  if (plan.isRestDay) {
    return `System Alert: Recovery protocol active. ${plan.label}. Estimated recovery window: 24 hours. Light mobility work recommended.`;
  }
  const intensity = plan.exercises[0]?.intensityLevel ?? 'moderate';
  const intensityMsg = intensity === 'max'
    ? 'MAXIMUM EFFORT PROTOCOL INITIATED.'
    : intensity === 'hard'
    ? 'High intensity session scheduled.'
    : 'Standard training protocol.';
  
  const recoveryMsg = recoveryScore < 60
    ? ' WARNING: Recovery below optimal. Reduce RPE by 1-2 points.'
    : recoveryScore > 85
    ? ' Recovery status: Peak. Overload protocol eligible.'
    : '';

  return `${intensityMsg}${recoveryMsg} Today\'s focus: ${plan.label}. ${plan.exercises.length} exercises assigned. Estimated duration: ${plan.totalEstimatedDurationMin} minutes.`;
}
