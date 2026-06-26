import { UserProfile, HistorySummary, BiometricSnapshot, AriseStats, SessionLog } from '../types/arise';

export function estimateMax1RM(history: HistorySummary): number {
  if (!history.bestSets || history.bestSets.length === 0) return 0;
  
  // Find the highest 1RM estimate across best sets using Epley formula: weight * (1 + reps/30)
  let max1RM = 0;
  for (const set of history.bestSets) {
    const rm = set.weight * (1 + set.reps / 30);
    if (rm > max1RM) {
      max1RM = rm;
    }
  }
  return max1RM;
}

export function normalize(val: number, min: number, max: number): number {
  const ratio = (val - min) / (max - min);
  const clamped = Math.max(0, Math.min(1, ratio));
  return Math.round(clamped * 99) + 1; // 1 to 100
}

export function computeStats(profile: UserProfile, history: HistorySummary, bio: BiometricSnapshot): AriseStats {
  const estimated1RM = estimateMax1RM(history);
  const STR = normalize(estimated1RM, 20, 250);
  const END = normalize(history.weeklyZone2Min, 0, 400);
  const AGI = normalize(bio.steps, 2000, 15000);
  
  const vitalityScore = bio.hrv_ms + (100 - bio.restingHR) + (bio.sleepMin.deep / 90) * 20;
  const VIT = normalize(vitalityScore, 10, 160);
  
  const intScore = history.nutritionAdherence + history.planCompletion;
  const INT = normalize(intScore, 0, 200);

  return { STR, END, AGI, VIT, INT };
}

export const mockStatsEngine = {
  estimateMax1RM,
  normalize,
  computeStats
};
