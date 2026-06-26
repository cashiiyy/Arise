import { UserProfile, HistorySummary, BiometricSnapshot, AriseStats } from '../types/arise';

export function estimateMax1RM(history: HistorySummary): number {
  if (!history.bestSets || history.bestSets.length === 0) return 0;
  
  let max1RM = 0;
  for (const set of history.bestSets) {
    // Epley formula
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

/**
 * Computes all 5 attributes for the Stat Panel Radar Chart.
 */
export function computeStats(profile: UserProfile, history: HistorySummary, bio: BiometricSnapshot): AriseStats {
  // STR: based on max estimated 1RM across all exercises
  const estimated1RM = estimateMax1RM(history);
  const STR = normalize(estimated1RM, 20, 250);
  
  // END: based on cumulative Zone 2 minutes this month
  const END = normalize(history.weeklyZone2Min, 0, 400);
  
  // AGI: based on avg daily steps + HIIT session count
  // Mocking HIIT count as 0 for this function since it's not strictly in history yet
  const AGI = normalize(bio.steps, 2000, 15000);
  
  // VIT: based on composite of HRV, resting HR, sleep quality
  const vitalityScore = bio.hrv_ms + (100 - bio.restingHR) + (bio.sleepMin.deep / 90) * 20;
  const VIT = normalize(vitalityScore, 10, 160);
  
  // INT: based on nutrition log completion rate + plan adherence %
  const intScore = history.nutritionAdherence + history.planCompletion;
  const INT = normalize(intScore, 0, 200);

  return { STR, END, AGI, VIT, INT };
}

/**
 * Helper to format stats into chart-ready data points for StatRadarChart
 */
export function formatStatsForChart(stats: AriseStats) {
  return [
    { label: 'STR', value: stats.STR },
    { label: 'END', value: stats.END },
    { label: 'AGI', value: stats.AGI },
    { label: 'VIT', value: stats.VIT },
    { label: 'INT', value: stats.INT },
  ];
}
