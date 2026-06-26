import { create } from 'zustand';
import { calculateRank, RANKS } from '../services/xpEngine';

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
  setInitialData: (data: Partial<UserState>) => void;
  addXP: (amount: number) => void;
  updateStats: (newStats: Partial<UserState['stats']>) => void;
}

export const useUserStore = create<UserState>((set) => ({
  name: 'Sung Jin-Woo',
  rank: 'E',
  xp: 1500,
  levelProgress: 25,
  stats: {
    STR: 15,
    END: 12,
    AGI: 14,
    VIT: 10,
    INT: 18,
  },
  goal: 'gain',
  biometrics: {
    weight: 70,
    height: 175,
    age: 24,
    sex: 'male',
    hrv_baseline: 60,
  },
  setInitialData: (data) => set((state) => ({ ...state, ...data })),
  addXP: (amount) => set((state) => {
    const newXp = state.xp + amount;
    const { rank, progressPct } = calculateRank(newXp);
    return { xp: newXp, rank, levelProgress: progressPct };
  }),
  updateStats: (newStats) => set((state) => ({
    stats: { ...state.stats, ...newStats }
  }))
}));
