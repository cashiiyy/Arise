import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, BiometricSnapshot, SessionLog, WorkoutPlan, CalibrationResult, XPEvent, AriseStats } from '../types/arise';

// Optional: you can install @react-native-async-storage/async-storage for this to work natively
// For this MVP file, we assume it's available or mocked.

interface EngineState {
  profile: UserProfile | null;
  dailyBio: Record<string, BiometricSnapshot>; // Keyed by date YYYY-MM-DD
  sessions: Record<string, SessionLog[]>;      // Keyed by date YYYY-MM-DD
  currentPlan: WorkoutPlan | null;
  latestCalibration: CalibrationResult | null;
  xpLog: XPEvent[];
  stats: AriseStats | null;

  // Actions
  initializeFromStorage: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  logSession: (date: string, log: SessionLog) => Promise<void>;
  syncToCloud: () => Promise<void>; // Stub for Supabase
}

export const useEngineStore = create<EngineState>((set, get) => ({
  profile: null,
  dailyBio: {},
  sessions: {},
  currentPlan: null,
  latestCalibration: null,
  xpLog: [],
  stats: null,

  initializeFromStorage: async () => {
    try {
      const profileStr = await AsyncStorage.getItem('user:profile');
      const planStr = await AsyncStorage.getItem('plan:current');
      const calibStr = await AsyncStorage.getItem('calibration:latest');
      const xpLogStr = await AsyncStorage.getItem('xp:log');

      set({
        profile: profileStr ? JSON.parse(profileStr) : null,
        currentPlan: planStr ? JSON.parse(planStr) : null,
        latestCalibration: calibStr ? JSON.parse(calibStr) : null,
        xpLog: xpLogStr ? JSON.parse(xpLogStr) : [],
      });
    } catch (e) {
      console.error('Failed to load from storage', e);
    }
  },

  updateProfile: async (partialProfile) => {
    const current = get().profile;
    if (!current) return;
    const updated = { ...current, ...partialProfile };
    set({ profile: updated });
    await AsyncStorage.setItem('user:profile', JSON.stringify(updated));
  },

  logSession: async (date, log) => {
    const sessions = { ...get().sessions };
    if (!sessions[date]) sessions[date] = [];
    sessions[date].push(log);
    set({ sessions });
    await AsyncStorage.setItem(`sessions:${date}`, JSON.stringify(sessions[date]));
  },

  syncToCloud: async () => {
    // Stub for Supabase syncing
    // Would use logic like: supabase.from('profiles').upsert(get().profile)
    console.log('Syncing to Supabase Cloud... (Stub)');
  }
}));
