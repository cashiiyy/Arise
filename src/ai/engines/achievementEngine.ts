import { UserProfile, XPEvent, RankUpEvent } from '../../types/arise';

export const RANKS = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'National'];
export const XP_THRESHOLDS = [0, 1000, 3000, 7000, 15000, 30000, 60000, 120000];

export interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
}

/**
 * Calculates rank name and progress percentage for a given XP.
 */
export function calculateRankInfo(xp: number): { rankIndex: number; rank: string; progressPct: number } {
  const rankIndex = XP_THRESHOLDS.findLastIndex(t => xp >= t);
  const safeRankIndex = rankIndex === -1 ? 0 : rankIndex;
  const rank = RANKS[safeRankIndex];

  if (safeRankIndex === XP_THRESHOLDS.length - 1) {
    return { rankIndex: safeRankIndex, rank, progressPct: 100 };
  }

  const currentThreshold = XP_THRESHOLDS[safeRankIndex];
  const nextThreshold = XP_THRESHOLDS[safeRankIndex + 1];
  const progressPct = Math.round(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100);

  return { rankIndex: safeRankIndex, rank, progressPct };
}

/**
 * Process an XP event and return the new profile state, XP gained, and any rank up events.
 */
export function processXPEvent(
  profile: UserProfile, 
  event: XPEvent
): { updatedProfile: UserProfile, xpGained: number, rankUp: RankUpEvent | null } {
  // Base XP Multipliers based on Streak
  let streakMultiplier = 1.0;
  if (profile.streak >= 30) streakMultiplier = 1.5;
  else if (profile.streak >= 14) streakMultiplier = 1.3;
  else if (profile.streak >= 7) streakMultiplier = 1.1;

  let baseXP = 0;
  switch (event.reason) {
    case 'workoutComplete':
      baseXP = Math.min(500, event.amount * 4); // amount = duration in min
      break;
    case 'questBonus':
      baseXP = 50;
      break;
    case 'bossQuestClear':
      baseXP = 200;
      break;
    case 'nutritionLog':
      baseXP = 30;
      break;
    default:
      baseXP = event.amount;
  }

  const xpGained = Math.round(baseXP * streakMultiplier);
  const newXP = profile.xp + xpGained;

  const { rankIndex, rank } = calculateRankInfo(newXP);
  
  let rankUp: RankUpEvent | null = null;
  const updatedProfile = { ...profile, xp: newXP, rankIndex, rank };

  if (rankIndex > profile.rankIndex) {
    rankUp = {
      date: new Date().toISOString(),
      newRank: rank,
      newRankIndex: rankIndex,
    };
    updatedProfile.aura = (updatedProfile.aura || 0) + (200 * (rankIndex - profile.rankIndex));
  }

  return { updatedProfile, xpGained, rankUp };
}

/**
 * Evaluates conditions for unlocking badges.
 */
export function evaluateBadges(profile: UserProfile, stats: any): AchievementBadge[] {
  const badges: AchievementBadge[] = [];

  // Example Logic
  if (stats.completedSessions >= 10) {
    badges.push({
      id: 'b_iron_will_10',
      name: 'Iron Will',
      description: 'Completed 10 workouts.',
      icon: '💪',
      unlockedAt: new Date().toISOString()
    });
  }

  if (profile.streak >= 7) {
    badges.push({
      id: 'b_streak_7',
      name: 'Shadow Step',
      description: 'Maintained a 7-day streak.',
      icon: '🔥',
      unlockedAt: new Date().toISOString()
    });
  }

  return badges;
}
