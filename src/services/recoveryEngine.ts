import { BiometricSnapshot, ReadinessLabel, UserProfile, CalibrationResult } from '../types/arise';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function recoveryScore(bio: BiometricSnapshot, baseline: BiometricSnapshot): number {
  const hrvScore = clamp((bio.hrv_ms / baseline.hrv_ms) * 25, 0, 25);
  const hrScore = clamp(((baseline.restingHR - bio.restingHR) / 10 + 1) * 12.5, 0, 25);
  const sleepScore = clamp((bio.sleepMin.deep + bio.sleepMin.rem) / 180 * 25, 0, 25);
  const tempScore = bio.skinTemp_c < 37.5 ? 25 : clamp(25 - (bio.skinTemp_c - 37.5) * 20, 0, 25);

  return Math.round(hrvScore + hrScore + sleepScore + tempScore);
}

export function readinessLabel(score: number): ReadinessLabel {
  if (score < 40) return 'Poor — Rest day recommended';
  if (score < 60) return 'Fair — Light quest assigned';
  if (score < 80) return 'Good — Standard protocol';
  return 'Peak — Overload protocol eligible';
}

function calculateLinearSlope(data: number[]): number {
  if (data.length < 2) return 0;
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope; // kg/day change
}

export function weeklyRecalibrate(
  u: UserProfile,
  weekBio: BiometricSnapshot[],
  baselineHRV: number,
  weightLog: number[],
  currentCalTarget: number
): CalibrationResult {
  const avgHRV = weekBio.reduce((sum, b) => sum + b.hrv_ms, 0) / (weekBio.length || 1);
  const hrvDelta = avgHRV / baselineHRV;
  
  let volumeModifier = 1.0;
  let systemMessage = 'Status nominal. Continue protocol.';
  let overloadTrigger = false;

  if (hrvDelta < 0.85) {
    volumeModifier = 0.80;
    systemMessage = 'Fatigue critical. Volume reduced 20%. Prioritize recovery.';
  } else if (hrvDelta < 0.95) {
    volumeModifier = 0.90;
    systemMessage = 'Mild fatigue detected. Volume reduced 10%.';
  } else if (hrvDelta > 1.05) {
    volumeModifier = 1.10;
    overloadTrigger = true;
    systemMessage = 'Peak condition verified. Overload protocol engaged (+10% volume).';
  }

  const wtTrend = calculateLinearSlope(weightLog);
  let newCalTarget = currentCalTarget;

  if (u.goal === 'bulk' && wtTrend < 0.02) {
    newCalTarget += 100;
    systemMessage += ' Weight stall detected. Caloric intake increased (+100 kcal).';
  } else if (u.goal === 'cut' && wtTrend > -0.07) {
    newCalTarget -= 100;
    systemMessage += ' Fat loss stalled. Caloric limit decreased (-100 kcal).';
  } else if (u.goal === 'cut' && wtTrend < -0.15) {
    newCalTarget += 100;
    systemMessage += ' Extreme catabolism risk. Caloric limit increased (+100 kcal).';
  }

  return {
    newCalTarget,
    volumeModifier,
    overloadTrigger,
    systemMessage,
  };
}

export const mockRecoveryEngine = {
  recoveryScore,
  readinessLabel,
  weeklyRecalibrate
};
