import { UserProfile, RankUpEvent, XPEvent } from '../types/arise';
import { streakMultiplier } from './streakEngine';

export const RANKS = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'National'];
export const XP_THRESHOLDS = [0, 1000, 3000, 7000, 15000, 30000, 60000, 120000];

/**
 * Calculates rank name and level progress percentage for a given XP.
 */
export function calculateRank(xp: number): { rank: string; progressPct: number } {
  const rankIndex = XP_THRESHOLDS.findLastIndex(t => xp >= t);
  const safeRankIndex = rankIndex === -1 ? 0 : rankIndex;
  const rank = RANKS[safeRankIndex];

  if (safeRankIndex === XP_THRESHOLDS.length - 1) {
    return { rank, progressPct: 100 };
  }

  const currentThreshold = XP_THRESHOLDS[safeRankIndex];
  const nextThreshold = XP_THRESHOLDS[safeRankIndex + 1];
  const progressPct = Math.round(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100);

  return { rank, progressPct };
}


/**
 * Calculates XP gain based on event reason, duration, and user streak.
 */
function calcXPGain(event: XPEvent, streak: number): number {
  const multiplier = streakMultiplier(streak);
  let baseXP = 0;

  switch (event.reason) {
    case 'workoutComplete':
      // Requires event to pass duration through amount or reason parsing, assuming amount is durationMin if workoutComplete
      baseXP = Math.min(500, event.amount * 4);
      break;
    case 'questBonus':
      baseXP = 50;
      break;
    case 'nutritionLog':
      baseXP = 30;
      break;
    case 'sleepBonus':
      baseXP = event.amount >= 90 ? 20 : 0; // Assuming amount passes deepSleepMin
      break;
    case 'bossQuestClear':
      baseXP = 200;
      break;
    case 'weeklyStreak':
      baseXP = 100;
      break;
    case 'watchSyncBonus':
      baseXP = 10;
      break;
    default:
      baseXP = event.amount;
  }

  return Math.round(baseXP * multiplier);
}

/**
 * Awards XP to user, applies streak multiplier, and checks for rank ups.
 */
export function awardXP(u: UserProfile, event: XPEvent): { updatedProfile: UserProfile, xpGained: number, rankUp: RankUpEvent | null } {
  const xpGained = calcXPGain(event, u.streak || 0);
  const newXP = u.xp + xpGained;
  
  const newRankIndex = XP_THRESHOLDS.findLastIndex(t => newXP >= t);
  const prevRankIndex = u.rankIndex;
  
  let rankUp: RankUpEvent | null = null;
  let updatedProfile = { ...u, xp: newXP };

  if (newRankIndex > prevRankIndex) {
    rankUp = checkRankUp(prevRankIndex, newRankIndex);
    updatedProfile.rankIndex = newRankIndex;
    // Aura bonus
    updatedProfile.aura = (updatedProfile.aura || 0) + (200 * (newRankIndex - prevRankIndex));
  }

  return { updatedProfile, xpGained, rankUp };
}

/**
 * Generates rank up event and unlocked features.
 */
export function checkRankUp(prevRankIndex: number, newRankIndex: number): RankUpEvent {
  const prevRank = RANKS[prevRankIndex];
  const newRank = RANKS[newRankIndex];
  
  return {
    date: new Date().toISOString(),
    newRank,
    newRankIndex,
  };
}

/**
 * Returns the unlocked features array for a given rank index.
 */
export function getUnlockedFeatures(rankIndex: number): string[] {
  switch (rankIndex) {
    case 2: return ['Advanced exercise library'];
    case 3: return ['Custom split builder'];
    case 4: return ['AI meal plan scanner'];
    case 5: return ['Coach mode'];
    case 6: return ['Shadow mode (anonymous leaderboard)'];
    case 7: return ['National Hunter badge', 'Prestige frame'];
    default: return [];
  }
}

/**
 * Updates aura based on quest completion status.
 */
export function auraUpdate(u: UserProfile, completed: boolean): UserProfile {
  let newAura = (u.aura || 0) + (completed ? 10 : -30);
  newAura = Math.max(0, newAura); // clamp to min 0
  return { ...u, aura: newAura };
}
