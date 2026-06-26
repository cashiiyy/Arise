import { UserProfile } from '../types/arise';
import { buildSystemMessage } from './notificationEngine';

/**
 * Updates streak based on whether the user completed their daily quests.
 */
export function updateStreak(u: UserProfile, todayComplete: boolean): { updatedUser: UserProfile, streakAtRiskWarning: boolean, resetPenalty: boolean, achievement: string | null } {
  let newStreak = u.streak || 0;
  let newAura = u.aura || 0;
  let streakAtRiskWarning = false;
  let resetPenalty = false;
  let achievement = null;

  if (todayComplete) {
    newStreak += 1;
    
    // Check milestones
    if (newStreak === 7) achievement = 'Week Warrior';
    if (newStreak === 30) achievement = 'Iron Will';
    if (newStreak === 100) achievement = 'Shadow Sovereign';

  } else {
    if (newStreak >= 3) {
      streakAtRiskWarning = true;
    }
    // Note: Actually resetting to 0 happens at midnight if 0 quests done.
    // We assume this function is called at midnight to evaluate the day.
    if (newStreak > 0) {
      resetPenalty = true;
      newStreak = 0;
      newAura = Math.max(0, newAura - 30);
    }
  }

  return {
    updatedUser: { ...u, streak: newStreak, aura: newAura },
    streakAtRiskWarning,
    resetPenalty,
    achievement
  };
}

/**
 * Calculates the XP multiplier based on current streak.
 */
export function streakMultiplier(streak: number): number {
  const multiplier = 1 + Math.floor(streak / 7) * 0.10;
  return Math.min(2.0, multiplier); // Cap at 2.0
}
