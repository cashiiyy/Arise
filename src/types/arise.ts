export type GoalType = 'bulk' | 'cut' | 'gain' | 'height';
export type DietType = 'veg' | 'vegan' | 'keto' | 'standard';
export type ReadinessLabel = 'Poor — Rest day recommended' | 'Fair — Light quest assigned' | 'Good — Standard protocol' | 'Peak — Overload protocol eligible';

export interface UserProfile {
  id: string;
  name: string;
  goal: GoalType;
  diet: DietType;
  equipment: string[];
  weight_kg: number;
  height_cm: number;
  age: number;
  sex: 'male' | 'female';
  rankIndex: number;
  xp: number;
  aura: number;
  streak: number;
}

export interface SystemMessage {
  id: string;
  type: 'info' | 'warning' | 'achievement' | 'rankup' | 'quest_complete' | 'coach';
  title: string;
  body: string;
  xpBadge?: number;
  duration_ms: number;
}

export interface NightlyData {
  deep: number;
  rem: number;
  light: number;
  awake: number;
}

export interface BiometricSnapshot {
  date: string;
  hrv_ms: number;
  restingHR: number;
  steps: number;
  skinTemp_c: number;
  sleepMin: NightlyData;
  caloriesBurned: number;
}

export interface PassiveMetrics {
  avgHrv: number;
  restingHr: number;
  sleepScore: number;
  steps: number;
}

export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
  totalKcal: number;
  calcium_mg?: number;
  vitD_IU?: number;
  zinc_mg?: number;
}

export interface SessionLog {
  date: string;
  exercise: string;
  weight: number;
  reps: number;
  durationMin: number;
  type: 'strength' | 'cardio' | 'flexibility';
}

export interface CalibrationResult {
  newCalTarget: number;
  volumeModifier: number;
  overloadTrigger: boolean;
  systemMessage: string;
}

export interface AriseStats {
  STR: number;
  END: number;
  AGI: number;
  VIT: number;
  INT: number;
}

export interface Quest {
  id: string;
  type: 'workout' | 'nutrition' | 'lifestyle' | 'boss';
  title: string;
  description: string;
  target: number;
  unit: string;
  progress: number;
  xpReward: number;
  completed: boolean;
  deadline: string;
}

export interface FoodItem {
  id: string;
  name: string;
  protein: number;
  carbs: number;
  fat: number;
  kcal: number;
}

export interface Meal {
  name: string;
  foods: FoodItem[];
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalKcal: number;
}

export interface MealPlan {
  date: string;
  meals: Meal[];
}

export interface OverloadSuggestion {
  exercise: string;
  suggestWeightDelta: number;
}

export interface XPEvent {
  id: string;
  date: string;
  amount: number;
  reason: string;
}

export interface RankUpEvent {
  date: string;
  newRank: string;
  newRankIndex: number;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  sets: number;
  repRange: string;
}

export interface WorkoutPlan {
  split: string;
  daysPerWeek: number;
  exercises: WorkoutExercise[];
}

export interface HistorySummary {
  bestSets: SessionLog[];
  weeklyZone2Min: number;
  nutritionAdherence: number;
  planCompletion: number;
}
