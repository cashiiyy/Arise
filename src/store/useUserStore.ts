import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateRank } from '../services/xpEngine';

interface UserState {
  name: string;
  rank: string;
  xp: number;
  levelProgress: number;
  stats: {
    STR: number;
    END: number;
    AGI: number;
    VIT: number;
    INT: number;
  };
  goal: string;
  biometrics: {
    weight: number;
    height: number;
    age: number;
    sex: string;
    hrv_baseline: number;
  };
  // New survey fields
  focusAreas: string[];
  equipment: string[];
  frequency: number;
  motivation: string;
  healthIssues: string[];
  
  setInitialData: (data: Partial<UserState>) => void;
  addXP: (amount: number) => void;
  updateStats: (newStats: Partial<UserState['stats']>) => void;
  resetData: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      name: 'Sung Jin-Woo',
      rank: 'E',
      xp: 1000,
      levelProgress: 0,
      stats: {
        STR: 10,
        END: 10,
        AGI: 10,
        VIT: 10,
        INT: 10,
      },
      goal: 'gain',
      biometrics: {
        weight: 70,
        height: 175,
        age: 24,
        sex: 'male',
        hrv_baseline: 60,
      },
      focusAreas: [],
      equipment: [],
      frequency: 4,
      motivation: 'Health',
      healthIssues: [],

      setInitialData: (data) => set((state) => {
        // If data contains biometrics or stats, merge them properly
        const updated = { ...state };
        if (data.biometrics) {
          updated.biometrics = { ...state.biometrics, ...data.biometrics };
        }
        if (data.stats) {
          updated.stats = { ...state.stats, ...data.stats };
        }
        // Merge top level fields
        Object.keys(data).forEach((key) => {
          if (key !== 'biometrics' && key !== 'stats') {
            (updated as any)[key] = (data as any)[key];
          }
        });
        return updated;
      }),
      addXP: (amount) => set((state) => {
        const newXp = state.xp + amount;
        const { rank, progressPct } = calculateRank(newXp);
        return { xp: newXp, rank, levelProgress: progressPct };
      }),
      updateStats: (newStats) => set((state) => ({
        stats: { ...state.stats, ...newStats }
      })),
      resetData: () => set({
        name: 'Sung Jin-Woo',
        rank: 'E',
        xp: 1000,
        levelProgress: 0,
        stats: {
          STR: 10,
          END: 10,
          AGI: 10,
          VIT: 10,
          INT: 10,
        },
        goal: 'gain',
        biometrics: {
          weight: 70,
          height: 175,
          age: 24,
          sex: 'male',
          hrv_baseline: 60,
        },
        focusAreas: [],
        equipment: [],
        frequency: 4,
        motivation: 'Health',
        healthIssues: [],
      }),
    }),
    {
      name: 'arise-user-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
