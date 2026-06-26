import { UserProfile, BiometricSnapshot, Macros, GoalType } from '../types/arise';

const GOAL_OFFSET: Record<GoalType, number> = {
  bulk: 400,
  cut: -350,
  gain: 200,
  height: 0,
};

const MACRO_RATIOS: Record<GoalType, { protein: number; carbs: number; fat: number }> = {
  bulk: { protein: 2.0, carbs: 4.5, fat: 0.8 },
  cut: { protein: 2.4, carbs: 2.0, fat: 0.8 },
  gain: { protein: 1.8, carbs: 3.5, fat: 1.0 },
  height: { protein: 1.6, carbs: 4.0, fat: 0.9 },
};

export function calcBMR(u: UserProfile): number {
  const { weight: weight_kg, height: height_cm, age, sex } = u.biometrics;
  if (sex === 'male') {
    return 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  }
  return 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
}

export function activityMultiplier(steps: number): number {
  if (steps < 5000) return 1.20;
  if (steps < 8000) return 1.375;
  if (steps < 12000) return 1.55;
  return 1.725;
}

export function calcTDEE(u: UserProfile, bio: BiometricSnapshot): number {
  const bmr = calcBMR(u);
  const multiplier = activityMultiplier(bio.steps);
  const formulaTDEE = bmr * multiplier;
  return Math.round(formulaTDEE * 0.6 + bio.caloriesBurned * 0.4);
}

export function targetCalories(u: UserProfile, bio: BiometricSnapshot): number {
  const tdee = calcTDEE(u, bio);
  return tdee + GOAL_OFFSET[u.goal];
}

export function calcMacros(u: UserProfile): Macros {
  const ratios = MACRO_RATIOS[u.goal];
  const protein = Math.round(u.biometrics.weight * ratios.protein);
  const carbs = Math.round(u.biometrics.weight * ratios.carbs);
  const fat = Math.round(u.biometrics.weight * ratios.fat);
  const totalKcal = protein * 4 + carbs * 4 + fat * 9;

  const macros: Macros = {
    protein,
    carbs,
    fat,
    totalKcal,
  };

  if (u.goal === 'height') {
    macros.calcium_mg = 1200;
    macros.vitD_IU = 1000;
    macros.zinc_mg = 10;
  }

  return macros;
}

// Mock exports for testing
export const mockTdeeEngine = {
  calcBMR,
  activityMultiplier,
  calcTDEE,
  targetCalories,
  calcMacros
};
