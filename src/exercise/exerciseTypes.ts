// Exercise data types for ARISE Fitness RPG

export interface Exercise {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  secondaryMuscles: string[];
  instructions: string[];
  // Enriched metadata (computed)
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  restTime?: number; // seconds
  defaultSets?: number;
  defaultReps?: number;
  defaultRepRange?: string;
  defaultWeightKg?: number;
  tips?: string[];
  commonMistakes?: string[];
  metValue?: number; // MET for calorie estimation
  xpReward?: number;
  category?: string;
}

export interface ExerciseSet {
  setNumber: number;
  targetReps: number;
  completedReps: number;
  weightKg: number;
  rpe: number; // Rate of Perceived Exertion 1-10
  restSeconds: number;
  completed: boolean;
  timestamp: string;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: ExerciseSet[];
  totalVolumeKg: number; // sum of weight × reps
  avgRpe: number;
  durationMin: number;
}

export interface WorkoutSession {
  id: string;
  date: string;
  planName: string;
  dayLabel: string; // e.g., "Chest Day"
  exercises: ExerciseLog[];
  totalDurationMin: number;
  totalCaloriesBurned: number;
  totalXpEarned: number;
  avgHeartRate: number;
  completed: boolean;
  completionPct: number;
  notes?: string;
}

export interface PlannedExercise {
  exercise: Exercise;
  plannedSets: number;
  plannedReps: number;
  plannedRepRange: string;
  recommendedWeightKg: number;
  restSeconds: number;
  intensityLevel: 'light' | 'moderate' | 'hard' | 'max';
  estimatedCalories: number;
  xpReward: number;
  estimatedDurationMin: number;
  progressionNote?: string; // e.g., "+2.5kg from last session"
}

export interface DayWorkoutPlan {
  dayIndex: number; // 0=Monday
  dayName: string;
  label: string; // "Chest Day", "Rest & Recovery", etc.
  muscleGroups: string[];
  exercises: PlannedExercise[];
  totalEstimatedCalories: number;
  totalEstimatedDurationMin: number;
  totalXpReward: number;
  isRestDay: boolean;
  recoveryAdvice?: string;
  predictedCompletionScore?: number;
  trainingWarnings?: string[];
}

export interface WeekWorkoutPlan {
  id: string;
  generatedAt: string;
  weekStartDate: string;
  splitName: string; // "PPL", "Upper-Lower", "Full Body"
  days: DayWorkoutPlan[];
  totalWeekXp: number;
}

export interface OverloadSuggestion {
  exerciseId: string;
  exerciseName: string;
  type: 'weight' | 'reps' | 'sets' | 'deload' | 'maintain';
  previousValue: number;
  suggestedValue: number;
  delta: number;
  reason: string;
  confidence: number; // 0-1
}
