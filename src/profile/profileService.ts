import { UserProfile } from '../types/arise';

/**
 * Calculates BMI and returns the category.
 */
export function calculateBMI(weightKg: number, heightCm: number): { bmi: number, category: string } {
  if (!weightKg || !heightCm) return { bmi: 0, category: 'Unknown' };
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  
  let category = 'Unknown';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25) category = 'Normal';
  else if (bmi < 30) category = 'Overweight';
  else category = 'Obese';

  return { bmi: Math.round(bmi * 10) / 10, category };
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE) and BMR.
 */
export function calculateCalorieTargets(profile: UserProfile): { bmr: number, tdee: number, target: number } {
  const { weight, height, age, sex } = profile.biometrics;
  
  // Mifflin-St Jeor Equation
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  bmr += (sex === 'male') ? 5 : -161;

  // Activity Multiplier based on frequency
  const activityMultiplier = profile.frequency >= 5 ? 1.55 : profile.frequency >= 3 ? 1.375 : 1.2;
  const tdee = Math.round(bmr * activityMultiplier);

  let target = tdee;
  if (profile.goal === 'cut') target -= 500;
  else if (profile.goal === 'bulk') target += 500;

  return { bmr: Math.round(bmr), tdee, target };
}

/**
 * Calculates daily macro targets based on goal and calories.
 */
export function calculateMacroTargets(calories: number, weightKg: number, goal: string) {
  // Protein: 1.6 to 2.2g per kg depending on goal
  const proteinPerKg = goal === 'cut' ? 2.2 : goal === 'bulk' ? 1.8 : 1.6;
  const protein = Math.round(weightKg * proteinPerKg);
  
  // Fat: 25% of total calories (9 kcal per gram)
  const fat = Math.round((calories * 0.25) / 9);

  // Carbs: Remainder of calories (4 kcal per gram)
  const carbCalories = calories - (protein * 4) - (fat * 9);
  const carbs = Math.max(0, Math.round(carbCalories / 4));

  return { protein, fat, carbs, kcal: calories };
}
