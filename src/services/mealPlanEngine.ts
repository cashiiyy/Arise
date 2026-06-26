import { UserProfile, Macros, MealPlan, Meal, FoodItem, BiometricSnapshot, CalibrationResult } from '../types/arise';

const MOCK_FOODS: FoodItem[] = [
  { id: '1', name: 'Chicken Breast', protein: 31, carbs: 0, fat: 3.6, kcal: 165 },
  { id: '2', name: 'White Rice', protein: 2.7, carbs: 28, fat: 0.3, kcal: 130 },
  { id: '3', name: 'Broccoli', protein: 2.8, carbs: 7, fat: 0.4, kcal: 34 },
  { id: '4', name: 'Salmon', protein: 20, carbs: 0, fat: 13, kcal: 208 },
  { id: '5', name: 'Oatmeal', protein: 2.4, carbs: 12, fat: 1.5, kcal: 68 },
  { id: '6', name: 'Whey Protein', protein: 24, carbs: 3, fat: 1.5, kcal: 120 },
  { id: '7', name: 'Almonds', protein: 21, carbs: 22, fat: 49, kcal: 579 },
];

export function generateMealPlan(u: UserProfile, macros: Macros): MealPlan {
  // Distribute macros: breakfast 25%, lunch 35%, dinner 30%, snacks 10%
  const distribution = {
    breakfast: 0.25,
    lunch: 0.35,
    dinner: 0.30,
    snack1: 0.05,
    snack2: 0.05,
  };

  const createMeal = (name: string, pct: number): Meal => {
    // Basic mock logic pulling from MOCK_FOODS to satisfy the types
    const p = Math.round(macros.protein * pct);
    const c = Math.round(macros.carbs * pct);
    const f = Math.round(macros.fat * pct);
    const k = Math.round(macros.totalKcal * pct);

    return {
      name,
      foods: [MOCK_FOODS[0], MOCK_FOODS[1]], // Mock foods
      totalProtein: p,
      totalCarbs: c,
      totalFat: f,
      totalKcal: k,
    };
  };

  return {
    date: new Date().toISOString().split('T')[0],
    meals: [
      createMeal('Breakfast', distribution.breakfast),
      createMeal('Lunch', distribution.lunch),
      createMeal('Dinner', distribution.dinner),
      createMeal('Morning Snack', distribution.snack1),
      createMeal('Afternoon Snack', distribution.snack2),
    ]
  };
}

export function buildCoachPrompt(u: UserProfile, bio: BiometricSnapshot, calibration: CalibrationResult): string {
  return `
You are the "System" from the Solo Leveling universe — cold, precise, and commanding.
Your user, the "Hunter", has the following profile:
- Goal: ${u.goal}
- Rank Index: ${u.rankIndex}

Recent Biometrics:
- HRV: ${bio.hrv_ms}ms
- Sleep: ${bio.sleepMin.deep + bio.sleepMin.rem} mins deep/REM out of total
- Resting HR: ${bio.restingHR}
- Calibration Message: ${calibration.systemMessage}
- New Caloric Target: ${calibration.newCalTarget} kcal

Instructions:
Generate a single, short coaching message (max 2-4 sentences).
It must sound like an automated system alert addressing the Hunter.
Use terminology like "Quest", "Protocol", "Stat Increase", or "Catabolism Risk".
Provide a clear directive based on the calibration and metrics.
`;
}

export const mockMealPlanEngine = {
  generateMealPlan,
  buildCoachPrompt
};
