// Nutrition data types for ARISE

export interface FoodItem {
  id: string;
  name: string;
  source: 'indian' | 'global';
  servingG: number;          // default serving size in grams
  kcal: number;              // per serving
  protein: number;           // grams per serving
  carbs: number;             // grams per serving
  fat: number;               // grams per serving
  fiber?: number;
  sugar?: number;
  sodium?: number;           // mg
  calcium?: number;          // mg
  iron?: number;             // mg
  vitaminC?: number;         // mg
  isEstimated?: boolean;     // true if AI-estimated fallback
}

export interface MealLog {
  id: string;
  timestamp: string;
  foodItem: FoodItem;
  servingG: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre-workout' | 'post-workout';
  // Scaled macros
  loggedKcal: number;
  loggedProtein: number;
  loggedCarbs: number;
  loggedFat: number;
}

export interface MacroSummary {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  water: number;
}

export interface DailyNutrition {
  date: string;
  logs: MealLog[];
  totals: MacroSummary;
  targets: MacroSummary;
  remainingKcal: number;
  remainingProtein: number;
  remainingCarbs: number;
  remainingFat: number;
  hydrationPct: number;
}

export interface NutritionSuggestion {
  id: string;
  type: 'warning' | 'success' | 'tip' | 'coach';
  message: string;
  priority: number; // higher = show first
}

export interface MealPlanItem {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre-workout' | 'post-workout';
  foods: FoodItem[];
  totalKcal: number;
  totalProtein: number;
  note?: string;
}
