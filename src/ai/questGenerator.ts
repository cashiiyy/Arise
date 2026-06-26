/**
 * AI Quest Generator — Generates personalized daily quests at midnight.
 * Adapts difficulty to user's history, rank, and biometric data.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Quest } from '../types/arise';

const QUESTS_KEY = '@arise:daily_quests';
const LAST_DATE_KEY = '@arise:quests_last_date';

// ─── Quest Templates ─────────────────────────────────────────────────────────

interface QuestTemplate {
  type: Quest['type'];
  title: string;
  description: string;
  unit: string;
  baseTarget: number;
  xpBase: number;
  rankScaling: number; // multiplier per rank tier
  emoji: string;
  condition?: (profile: QuestGeneratorInput) => boolean;
}

const QUEST_TEMPLATES: QuestTemplate[] = [
  {
    type: 'workout',
    title: 'Iron Will',
    description: 'Complete push-ups without stopping',
    unit: 'reps',
    baseTarget: 50,
    xpBase: 80,
    rankScaling: 0.3,
    emoji: '💪',
  },
  {
    type: 'workout',
    title: 'Shadow Run',
    description: 'Run a distance without stopping',
    unit: 'km',
    baseTarget: 3,
    xpBase: 100,
    rankScaling: 0.25,
    emoji: '🏃',
  },
  {
    type: 'workout',
    title: 'Step Count',
    description: 'Reach the daily step goal',
    unit: 'steps',
    baseTarget: 8000,
    xpBase: 60,
    rankScaling: 0.15,
    emoji: '👣',
  },
  {
    type: 'workout',
    title: 'Calorie Furnace',
    description: 'Burn calories through any activity',
    unit: 'kcal',
    baseTarget: 300,
    xpBase: 80,
    rankScaling: 0.2,
    emoji: '🔥',
  },
  {
    type: 'workout',
    title: 'Dungeon Clear',
    description: 'Complete your assigned workout session',
    unit: 'sets',
    baseTarget: 1,
    xpBase: 150,
    rankScaling: 0,
    emoji: '⚔️',
  },
  {
    type: 'nutrition',
    title: 'Protein Protocol',
    description: 'Hit your daily protein target',
    unit: 'g protein',
    baseTarget: 120,
    xpBase: 70,
    rankScaling: 0.2,
    emoji: '🥩',
  },
  {
    type: 'nutrition',
    title: 'Hydration Hunter',
    description: 'Drink water throughout the day',
    unit: 'ml',
    baseTarget: 2000,
    xpBase: 50,
    rankScaling: 0.1,
    emoji: '💧',
  },
  {
    type: 'nutrition',
    title: 'Calorie Balance',
    description: 'Stay within your calorie target',
    unit: 'days',
    baseTarget: 1,
    xpBase: 60,
    rankScaling: 0,
    emoji: '🍱',
  },
  {
    type: 'lifestyle',
    title: 'Deep Sleep Protocol',
    description: 'Sleep for the target duration',
    unit: 'hours',
    baseTarget: 7,
    xpBase: 60,
    rankScaling: 0.1,
    emoji: '🌙',
  },
  {
    type: 'lifestyle',
    title: 'Meditation',
    description: 'Practice mindfulness meditation',
    unit: 'minutes',
    baseTarget: 10,
    xpBase: 40,
    rankScaling: 0.15,
    emoji: '🧘',
  },
  {
    type: 'lifestyle',
    title: 'Mobility Protocol',
    description: 'Complete stretching and mobility work',
    unit: 'minutes',
    baseTarget: 15,
    xpBase: 40,
    rankScaling: 0.15,
    emoji: '🤸',
  },
];

const BOSS_QUEST_TEMPLATES: QuestTemplate[] = [
  {
    type: 'boss',
    title: '⚠ BOSS: Century Challenge',
    description: 'Complete 100 push-ups in a single day',
    unit: 'push-ups',
    baseTarget: 100,
    xpBase: 300,
    rankScaling: 0,
    emoji: '💀',
  },
  {
    type: 'boss',
    title: '⚠ BOSS: Ironman',
    description: 'Complete a full workout AND hit protein AND water goals',
    unit: 'tasks',
    baseTarget: 3,
    xpBase: 400,
    rankScaling: 0,
    emoji: '🏆',
  },
];

export interface QuestGeneratorInput {
  rankIndex: number;
  completedWorkouts: number;   // last 7 days
  avgSteps: number;
  avgSleepHours: number;
  goal: string;
  biometrics: {
    weight: number;
    height: number;
    age: number;
  };
}

// ─── Main Generator ──────────────────────────────────────────────────────────

/**
 * Generate 4 daily quests + 1 optional boss quest.
 * Adapts targets to rank level.
 */
export function generateDailyQuests(input: QuestGeneratorInput): Quest[] {
  const { rankIndex } = input;
  const today = new Date().toISOString().split('T')[0];

  // Pick 4 quests from templates (shuffle deterministically by date)
  const seed = today.replace(/-/g, '');
  const shuffled = [...QUEST_TEMPLATES].sort((a, b) => {
    const ha = (a.title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * parseInt(seed.slice(-4), 10)) % 100;
    const hb = (b.title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * parseInt(seed.slice(-4), 10)) % 100;
    return ha - hb;
  });

  const selected = shuffled.slice(0, 4);

  const quests: Quest[] = selected.map((template, idx) => {
    const rankMultiplier = 1 + (template.rankScaling * rankIndex);
    const target = template.unit === 'days' || template.unit === 'tasks'
      ? template.baseTarget
      : Math.round(template.baseTarget * rankMultiplier);
    const xpReward = Math.round(template.xpBase * (1 + rankIndex * 0.2));

    return {
      id: `q_${today}_${idx}`,
      type: template.type,
      title: `${template.emoji} ${template.title}`,
      description: template.description,
      target,
      unit: template.unit,
      progress: 0,
      xpReward,
      completed: false,
      deadline: `${today}T23:59:59`,
    };
  });

  // Add boss quest every 3rd day
  const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  if (dayOfYear % 3 === 0 && rankIndex >= 2) {
    const bossTemplate = BOSS_QUEST_TEMPLATES[dayOfYear % BOSS_QUEST_TEMPLATES.length];
    const bossXp = Math.round(bossTemplate.xpBase * (1 + rankIndex * 0.3));
    quests.push({
      id: `boss_${today}`,
      type: 'boss',
      title: bossTemplate.title,
      description: bossTemplate.description,
      target: bossTemplate.baseTarget,
      unit: bossTemplate.unit,
      progress: 0,
      xpReward: bossXp,
      completed: false,
      deadline: `${today}T23:59:59`,
    });
  }

  return quests;
}

/**
 * Load today's quests from storage, or generate new ones if it's a new day.
 */
export async function loadOrGenerateQuests(
  input: QuestGeneratorInput
): Promise<Quest[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = await AsyncStorage.getItem(LAST_DATE_KEY);

    if (lastDate === today) {
      const saved = await AsyncStorage.getItem(QUESTS_KEY);
      if (saved) return JSON.parse(saved);
    }

    // New day — generate fresh quests
    const quests = generateDailyQuests(input);
    await AsyncStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
    await AsyncStorage.setItem(LAST_DATE_KEY, today);
    return quests;
  } catch (e) {
    console.warn('[QuestGenerator] Error:', e);
    return generateDailyQuests(input);
  }
}

/**
 * Update quest progress and mark completed.
 */
export async function updateQuestProgress(
  questId: string,
  delta: number
): Promise<Quest[]> {
  try {
    const saved = await AsyncStorage.getItem(QUESTS_KEY);
    const quests: Quest[] = saved ? JSON.parse(saved) : [];
    const updated = quests.map(q => {
      if (q.id !== questId) return q;
      const newProgress = Math.min(q.target, q.progress + delta);
      return { ...q, progress: newProgress, completed: newProgress >= q.target };
    });
    await AsyncStorage.setItem(QUESTS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('[QuestGenerator] Update error:', e);
    return [];
  }
}

/**
 * Save quests to storage.
 */
export async function saveQuests(quests: Quest[]): Promise<void> {
  await AsyncStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
}
