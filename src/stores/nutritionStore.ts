/**
 * Nutrition Zustand Store — Manages daily food logs, macros, and AI suggestions.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodItem, MealLog, MacroSummary, NutritionSuggestion, MealPlanItem } from '../nutrition/nutritionTypes';
import { generateNutritionSuggestions, generateMealPlan, getNutrition } from '../nutrition/nutritionService';

const STORAGE_KEY = '@arise:nutrition_log';
const TARGETS_KEY = '@arise:nutrition_targets';

const DEFAULT_TARGETS: MacroSummary = {
  kcal: 2500,
  protein: 150,
  carbs: 300,
  fat: 70,
  fiber: 30,
  sodium: 2300,
  water: 3000,
};

interface NutritionState {
  todayLogs: MealLog[];
  dailyTotals: MacroSummary;
  targets: MacroSummary;
  aiSuggestions: NutritionSuggestion[];
  mealPlan: MealPlanItem[];
  waterIntakeMl: number;
  waterGoalMl: number;
  isLoading: boolean;

  // Actions
  loadTodayLogs: () => Promise<void>;
  logFood: (
    food: FoodItem,
    servingG: number,
    mealType: MealLog['mealType']
  ) => Promise<void>;
  removeLog: (logId: string) => Promise<void>;
  updateTargets: (targets: Partial<MacroSummary>) => Promise<void>;
  refreshSuggestions: () => void;
  refreshMealPlan: (prefs?: { vegetarian?: boolean; vegan?: boolean }) => void;
  logWater: (ml: number) => Promise<void>;
  setWaterGoal: (ml: number) => void;
}

function buildTotals(logs: MealLog[]): MacroSummary {
  return logs.reduce(
    (acc, log) => ({
      kcal: acc.kcal + log.loggedKcal,
      protein: Math.round((acc.protein + log.loggedProtein) * 10) / 10,
      carbs: Math.round((acc.carbs + log.loggedCarbs) * 10) / 10,
      fat: Math.round((acc.fat + log.loggedFat) * 10) / 10,
      fiber: acc.fiber + (log.foodItem.fiber ?? 0) * (log.servingG / (log.foodItem.servingG || 100)),
      sodium: acc.sodium + (log.foodItem.sodium ?? 0) * (log.servingG / (log.foodItem.servingG || 100)),
      water: acc.water, // managed separately
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0, water: 0 }
  );
}

function todayKey(): string {
  return new Date().toISOString().split('T')[0]; // "2025-01-15"
}

export const useNutritionStore = create<NutritionState>()(
  (set, get) => ({
    todayLogs: [],
    dailyTotals: { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0, water: 0 },
    targets: DEFAULT_TARGETS,
    aiSuggestions: [],
    mealPlan: [],
    waterIntakeMl: 0,
    waterGoalMl: 3000,
    isLoading: false,

    loadTodayLogs: async () => {
      set({ isLoading: true });
      try {
        const dayKey = todayKey();
        const raw = await AsyncStorage.getItem(`${STORAGE_KEY}:${dayKey}`);
        const logs: MealLog[] = raw ? JSON.parse(raw) : [];

        const targetsRaw = await AsyncStorage.getItem(TARGETS_KEY);
        const targets: MacroSummary = targetsRaw ? JSON.parse(targetsRaw) : DEFAULT_TARGETS;

        // Load water from separate key
        const waterRaw = await AsyncStorage.getItem(`@arise:water:${dayKey}`);
        const waterMl = waterRaw ? parseInt(waterRaw, 10) : 0;

        const totals = buildTotals(logs);
        totals.water = waterMl;

        const suggestions = generateNutritionSuggestions(totals, targets);

        set({
          todayLogs: logs,
          dailyTotals: totals,
          targets,
          aiSuggestions: suggestions,
          waterIntakeMl: waterMl,
          isLoading: false,
        });
      } catch (e) {
        console.warn('[NutritionStore] Load error:', e);
        set({ isLoading: false });
      }
    },

    logFood: async (food: FoodItem, servingG: number, mealType: MealLog['mealType']) => {
      const scaled = getNutrition(food, servingG);
      const log: MealLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        foodItem: food,
        servingG,
        mealType,
        loggedKcal: scaled.kcal,
        loggedProtein: scaled.protein,
        loggedCarbs: scaled.carbs,
        loggedFat: scaled.fat,
      };

      const dayKey = todayKey();
      const { todayLogs, targets, waterIntakeMl } = get();
      const updatedLogs = [...todayLogs, log];
      const totals = buildTotals(updatedLogs);
      totals.water = waterIntakeMl;

      const suggestions = generateNutritionSuggestions(totals, targets);

      await AsyncStorage.setItem(`${STORAGE_KEY}:${dayKey}`, JSON.stringify(updatedLogs));

      set({ todayLogs: updatedLogs, dailyTotals: totals, aiSuggestions: suggestions });
    },

    removeLog: async (logId: string) => {
      const dayKey = todayKey();
      const { todayLogs, targets, waterIntakeMl } = get();
      const updatedLogs = todayLogs.filter(l => l.id !== logId);
      const totals = buildTotals(updatedLogs);
      totals.water = waterIntakeMl;
      const suggestions = generateNutritionSuggestions(totals, targets);

      await AsyncStorage.setItem(`${STORAGE_KEY}:${dayKey}`, JSON.stringify(updatedLogs));
      set({ todayLogs: updatedLogs, dailyTotals: totals, aiSuggestions: suggestions });
    },

    updateTargets: async (newTargets: Partial<MacroSummary>) => {
      const { targets, dailyTotals } = get();
      const updated = { ...targets, ...newTargets };
      await AsyncStorage.setItem(TARGETS_KEY, JSON.stringify(updated));
      const suggestions = generateNutritionSuggestions(dailyTotals, updated);
      set({ targets: updated, aiSuggestions: suggestions });
    },

    refreshSuggestions: () => {
      const { dailyTotals, targets } = get();
      const suggestions = generateNutritionSuggestions(dailyTotals, targets);
      set({ aiSuggestions: suggestions });
    },

    refreshMealPlan: (prefs = {}) => {
      const { targets } = get();
      const plan = generateMealPlan(
        targets.kcal,
        targets.protein,
        targets.carbs,
        targets.fat,
        { ...prefs, includeIndian: true }
      );
      set({ mealPlan: plan });
    },

    logWater: async (ml: number) => {
      const dayKey = todayKey();
      const { waterIntakeMl, targets, dailyTotals } = get();
      const newTotal = waterIntakeMl + ml;

      await AsyncStorage.setItem(`@arise:water:${dayKey}`, String(newTotal));

      const updatedTotals = { ...dailyTotals, water: newTotal };
      const suggestions = generateNutritionSuggestions(updatedTotals, targets);
      set({ waterIntakeMl: newTotal, dailyTotals: updatedTotals, aiSuggestions: suggestions });
    },

    setWaterGoal: (ml: number) => set({ waterGoalMl: ml }),
  })
);
