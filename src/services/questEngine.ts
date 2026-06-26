import { UserProfile, Quest, XPEvent, SystemMessage } from '../types/arise';
import { calcMacros } from './tdeeEngine';
import { buildSystemMessage } from './notificationEngine';
import { awardXP, auraUpdate } from './xpEngine';

function createId() {
  return `q_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function getEndOfDay(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function getNextSunday(): string {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

/**
 * Generates the daily quests (workout, nutrition, lifestyle).
 */
export function generateDailyQuests(u: UserProfile, recoveryScore: number): Quest[] {
  const quests: Quest[] = [];
  const deadline = getEndOfDay();

  // 1. Workout
  if (recoveryScore < 50) {
    quests.push({
      id: createId(), type: 'workout', title: 'Light Recovery Protocol', description: '30 min walk',
      target: 30, unit: 'min', progress: 0, xpReward: 80, completed: false, deadline
    });
  } else {
    quests.push({
      id: createId(), type: 'workout', title: 'Daily Workout Session', description: 'Complete today\'s planned session',
      target: 1, unit: 'session', progress: 0, xpReward: 200, completed: false, deadline
    });
  }

  // 2. Nutrition
  const macros = calcMacros(u);
  quests.push({
    id: createId(), type: 'nutrition', title: 'Protein Protocol', description: `Hit ${macros.protein}g protein today`,
    target: macros.protein, unit: 'g', progress: 0, xpReward: 50, completed: false, deadline
  });

  // 3. Lifestyle
  if (u.goal === 'height') {
    quests.push({
      id: createId(), type: 'lifestyle', title: 'Sleep Recovery', description: 'Sleep 8+ hours',
      target: 8, unit: 'hours', progress: 0, xpReward: 60, completed: false, deadline
    });
  } else {
    quests.push({
      id: createId(), type: 'lifestyle', title: 'Daily Movement', description: 'Reach 10,000 steps',
      target: 10000, unit: 'steps', progress: 0, xpReward: 40, completed: false, deadline
    });
  }

  return quests;
}

/**
 * Generates the weekly Boss Quest.
 */
export function generateBossQuest(u: UserProfile): Quest {
  const deadline = getNextSunday();
  
  if (u.goal === 'bulk') {
    return { id: createId(), type: 'boss', title: 'Hypertrophy Surge', description: 'Complete 4 workout sessions this week', target: 4, unit: 'sessions', progress: 0, xpReward: 500, completed: false, deadline };
  } else if (u.goal === 'cut') {
    return { id: createId(), type: 'boss', title: 'Deficit Discipline', description: 'Stay in caloric deficit all 7 days', target: 7, unit: 'days', progress: 0, xpReward: 500, completed: false, deadline };
  } else if (u.goal === 'gain') {
    return { id: createId(), type: 'boss', title: 'Consistency is Key', description: 'Log all meals for 7 days', target: 7, unit: 'days', progress: 0, xpReward: 500, completed: false, deadline };
  } else {
    // height
    return { id: createId(), type: 'boss', title: 'Growth Hormone Surge', description: 'Achieve 7+ hrs deep+REM sleep 5 nights', target: 5, unit: 'nights', progress: 0, xpReward: 500, completed: false, deadline };
  }
}

/**
 * Tracks quest progress and returns the updated quest.
 */
export function trackQuestProgress(quest: Quest, progressDelta: number): Quest {
  const newProgress = Math.min(quest.target, quest.progress + progressDelta);
  return {
    ...quest,
    progress: newProgress,
    completed: newProgress >= quest.target
  };
}

/**
 * Completes a quest, awards XP, and returns a system notification.
 */
export function completeQuest(quest: Quest, u: UserProfile): { updatedUser: UserProfile, xpEvent: XPEvent, notification: SystemMessage } {
  const xpEvent: XPEvent = {
    id: `xpe_${Date.now()}`,
    date: new Date().toISOString(),
    amount: quest.xpReward,
    reason: quest.type === 'boss' ? 'bossQuestClear' : 'questBonus'
  };

  const { updatedProfile } = awardXP(u, xpEvent);
  
  const notification = buildSystemMessage('quest_complete', {
    questTitle: quest.title,
    xp: xpEvent.amount,
    streak: updatedProfile.streak
  });

  return { updatedUser: updatedProfile, xpEvent, notification };
}

/**
 * Applies penalty for missing quests at midnight.
 */
export function missedQuestPenalty(u: UserProfile, missedCount: number): { updatedUser: UserProfile, notification: SystemMessage | null } {
  if (missedCount === 0) return { updatedUser: u, notification: null };
  
  let updatedUser = auraUpdate(u, false); // -30 aura

  let resetStreak = false;
  if (updatedUser.streak >= 3) {
    resetStreak = true; // Needs more complex state logic to know it was 3 consecutive missed days, but sticking to basic for now
    updatedUser.streak = 0;
  }

  const notification = buildSystemMessage('warning', {
    reason: `${missedCount} quests expired`,
    consequence: 'Aura reduced by 30' + (resetStreak ? '. Streak reset to 0' : '')
  });

  return { updatedUser, notification };
}
