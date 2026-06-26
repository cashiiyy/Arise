import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  UserProfile, Quest, SystemMessage, CalibrationResult, 
  SessionLog, BiometricSnapshot 
} from '../types/arise';
import { generateDailyQuests, generateBossQuest, trackQuestProgress, completeQuest } from '../services/questEngine';
import { updateStreak } from '../services/streakEngine';
import { awardXP, auraUpdate } from '../services/xpEngine';
import { checkOverload } from '../services/workoutEngine';
import { computeStats } from '../services/statPanelEngine';
import { buildSystemMessage } from '../services/notificationEngine';
import { weeklyRecalibrate, recoveryScore } from '../services/recoveryEngine';

interface RPGState {
  profile: UserProfile | null;
  dailyQuests: Quest[];
  bossQuest: Quest | null;
  notifications: SystemMessage[];
  lastCalibration: CalibrationResult | null;
  
  initializeDay: (recoveryScoreOverride?: number) => void;
  completeWorkout: (session: SessionLog) => void;
  logNutrition: (proteinG: number) => void;
  syncBiometrics: (bio: BiometricSnapshot, baselineHRV: number, weightLog: number[]) => void;
  dismissNotification: (id: string) => void;
  pushNotification: (msg: SystemMessage) => void;
}

export const useRPGStore = create<RPGState>((set, get) => ({
  profile: null,
  dailyQuests: [],
  bossQuest: null,
  notifications: [],
  lastCalibration: null,

  initializeDay: async (recoveryScoreOverride = 80) => {
    const state = get();
    if (!state.profile) return;
    
    // Attempt to load from storage first
    try {
      const stored = await AsyncStorage.getItem('rpg:state');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure we load state
      }
    } catch (e) {
      console.log('No previous RPG state');
    }

    const dQ = generateDailyQuests(state.profile, recoveryScoreOverride);
    
    // If Monday, generate Boss Quest
    const isMonday = new Date().getDay() === 1;
    let bQ = state.bossQuest;
    if (isMonday || !bQ) {
      bQ = generateBossQuest(state.profile);
    }

    set({ dailyQuests: dQ, bossQuest: bQ });
    AsyncStorage.setItem('rpg:state', JSON.stringify(get()));
  },

  completeWorkout: (session: SessionLog) => {
    const { profile, dailyQuests, pushNotification } = get();
    if (!profile) return;

    // Award XP for Workout
    const { updatedProfile, xpGained, rankUp } = awardXP(profile, {
      id: `xp_wo_${Date.now()}`,
      date: new Date().toISOString(),
      amount: session.durationMin,
      reason: 'workoutComplete'
    });

    let currentProfile = updatedProfile;
    
    // Check Workout Quest
    let updatedQuests = [...dailyQuests];
    const workoutQuestIndex = updatedQuests.findIndex(q => q.type === 'workout' && !q.completed);
    if (workoutQuestIndex >= 0) {
      const q = updatedQuests[workoutQuestIndex];
      const progressedQ = trackQuestProgress(q, 1);
      updatedQuests[workoutQuestIndex] = progressedQ;
      
      if (progressedQ.completed) {
        const { updatedUser, notification } = completeQuest(progressedQ, currentProfile);
        currentProfile = updatedUser;
        pushNotification(notification);
      }
    }

    // Update Streak if all quests complete (mock checking logic here, assuming workout might be the last one)
    const allDone = updatedQuests.every(q => q.completed);
    if (allDone) {
      const { updatedUser, achievement } = updateStreak(currentProfile, true);
      currentProfile = updatedUser;
      if (achievement) {
        pushNotification(buildSystemMessage('achievement', { achievementName: achievement }));
      }
    }

    // Check Overload
    // In a real app we'd pass all logs. Here we mock passing just the current one twice to simulate detection if reps high.
    const overload = checkOverload([session, session], session.exercise);
    if (overload) {
      pushNotification(buildSystemMessage('info', { message: `Progressive overload suggested: +${overload.suggestWeightDelta}kg on ${overload.exercise}` }));
    }

    if (rankUp) {
      pushNotification(buildSystemMessage('rankup', { fromRank: rankUp.newRankIndex - 1, toRank: rankUp.newRank })); // Mocking fromRank string loosely
    }

    set({ profile: currentProfile, dailyQuests: updatedQuests });
    AsyncStorage.setItem('rpg:state', JSON.stringify(get()));
  },

  logNutrition: (proteinG: number) => {
    const { profile, dailyQuests, pushNotification } = get();
    if (!profile) return;

    let currentProfile = profile;
    let updatedQuests = [...dailyQuests];
    
    const nutritionQuestIndex = updatedQuests.findIndex(q => q.type === 'nutrition' && !q.completed);
    if (nutritionQuestIndex >= 0) {
      const q = updatedQuests[nutritionQuestIndex];
      const progressedQ = trackQuestProgress(q, proteinG);
      updatedQuests[nutritionQuestIndex] = progressedQ;
      
      if (progressedQ.completed) {
        const { updatedUser, notification } = completeQuest(progressedQ, currentProfile);
        currentProfile = updatedUser;
        pushNotification(notification);
      }
    }

    set({ profile: currentProfile, dailyQuests: updatedQuests });
    AsyncStorage.setItem('rpg:state', JSON.stringify(get()));
  },

  syncBiometrics: (bio: BiometricSnapshot, baselineHRV: number, weightLog: number[]) => {
    const { profile, pushNotification } = get();
    if (!profile) return;

    // Check Recalibration if Monday
    const isMonday = new Date().getDay() === 1;
    if (isMonday) {
      const calib = weeklyRecalibrate(profile, [bio], baselineHRV, weightLog, 2500); // 2500 is mock current target
      set({ lastCalibration: calib });
      
      pushNotification(buildSystemMessage('warning', { 
        reason: 'Weekly Recalibration', 
        consequence: calib.systemMessage 
      }));
    }
  },

  pushNotification: (msg: SystemMessage) => {
    set(state => ({ notifications: [...state.notifications, msg] }));
  },

  dismissNotification: (id: string) => {
    set(state => ({ notifications: state.notifications.filter(n => n.id !== id) }));
  }
}));
