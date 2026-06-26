import { FoodItem } from './nutritionTypes';

const INDIAN_FOODS: FoodItem[] = require('../../Nutrition/indian_foods_data.json');
const GLOBAL_FOODS: FoodItem[] = require('../../Nutrition/global_foods_data.json');

// Trie or simple dictionary for O(1) exact match and fast prefix matching
export const foodByNameIndex: Record<string, FoodItem> = {};
export const allFoods: FoodItem[] = [...INDIAN_FOODS, ...GLOBAL_FOODS];

let _initialized = false;

export function initializeNutritionIndex() {
  if (_initialized) return;

  for (const food of allFoods) {
    foodByNameIndex[food.name.toLowerCase()] = food;
  }

  _initialized = true;
  console.log(`[NutritionIndex] Initialized with ${allFoods.length} items.`);
}

/**
 * Fast prefix and fuzzy search across all foods.
 */
export function searchFoodIndex(query: string, limit: number = 20): FoodItem[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();

  // Exact match fast path
  if (foodByNameIndex[q]) {
    // If exact match, we still want to show others but exact match first
  }

  const results: { item: FoodItem; score: number }[] = [];

  for (const item of allFoods) {
    const name = item.name.toLowerCase();
    let score = 0;

    if (name === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (name.includes(q)) score = 50;
    
    // Add small points for word boundaries
    const words = name.split(' ');
    if (words.some(w => w.startsWith(q))) score += 10;

    if (score > 0) {
      results.push({ item, score });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(r => r.item);
}

/**
 * AI portion estimation heuristic.
 * e.g., "Apple" -> 150g, "Rice" -> 200g
 */
export function estimatePortionSize(foodName: string): number {
  const name = foodName.toLowerCase();
  
  if (name.includes('rice') || name.includes('pasta') || name.includes('noodles')) return 200;
  if (name.includes('chicken breast') || name.includes('steak')) return 150;
  if (name.includes('egg')) return 50;
  if (name.includes('apple') || name.includes('banana') || name.includes('orange')) return 120;
  if (name.includes('bread') || name.includes('toast')) return 35; // per slice
  if (name.includes('milk') || name.includes('juice')) return 250; // ml ~ g
  if (name.includes('cheese')) return 30;
  if (name.includes('nuts') || name.includes('almond')) return 30;
  
  return 100; // default standard portion
}
