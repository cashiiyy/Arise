import { create } from 'zustand';
import { getDB } from '../database/sqliteDB';
import { UserProfile } from '../types/arise';

interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateBiometrics: (updates: Partial<UserProfile['biometrics']>) => Promise<void>;
  updateStats: (updates: Partial<UserProfile['stats']>) => Promise<void>;
  updateXPAndRank: (xp: number, rankIndex: number, rank: string) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: true,

  loadProfile: async () => {
    set({ isLoading: true });
    try {
      const db = getDB();
      const result = await db.getAllAsync('SELECT * FROM Users LIMIT 1');
      if (result && result.length > 0) {
        const row: any = result[0];
        set({
          profile: {
            id: row.id,
            name: row.name,
            goal: row.goal,
            diet: 'standard', // default for now
            equipment: [],
            biometrics: {
              weight: row.weight,
              height: row.height,
              age: row.age,
              sex: 'male',
              hrv_baseline: 60,
            },
            stats: {
              STR: 10, END: 10, AGI: 10, VIT: 10, INT: 10,
            },
            rankIndex: row.rank_index,
            rank: 'E',
            xp: row.xp,
            aura: 0,
            streak: 0,
            focusAreas: [],
            frequency: 3,
            motivation: 'Health',
            healthIssues: []
          },
          isLoading: false
        });
      } else {
        // Fallback default profile if not in DB
        const defaultProfile: UserProfile = {
          id: 'u_1', name: 'Sung Jin-Woo', goal: 'gain', diet: 'standard', equipment: [],
          biometrics: { weight: 70, height: 175, age: 24, sex: 'male', hrv_baseline: 60 },
          stats: { STR: 10, END: 10, AGI: 10, VIT: 10, INT: 10 },
          rankIndex: 0, rank: 'E', xp: 0, aura: 0, streak: 0,
          focusAreas: [], frequency: 4, motivation: 'Health', healthIssues: []
        };
        set({ profile: defaultProfile, isLoading: false });
      }
    } catch (e) {
      console.error('[ProfileStore] Failed to load profile', e);
      set({ isLoading: false });
    }
  },

  updateProfile: async (updates) => {
    const { profile } = get();
    if (!profile) return;
    const updated = { ...profile, ...updates };
    set({ profile: updated });
    // In future, execute SQLite UPDATE
  },

  updateBiometrics: async (updates) => {
    const { profile } = get();
    if (!profile) return;
    const updated = { ...profile, biometrics: { ...profile.biometrics, ...updates } };
    set({ profile: updated });
  },

  updateStats: async (updates) => {
    const { profile } = get();
    if (!profile) return;
    const updated = { ...profile, stats: { ...profile.stats, ...updates } };
    set({ profile: updated });
  },

  updateXPAndRank: async (xp, rankIndex, rank) => {
    const { profile } = get();
    if (!profile) return;
    const updated = { ...profile, xp, rankIndex, rank };
    set({ profile: updated });
    
    try {
      const db = getDB();
      await db.runAsync('UPDATE Users SET xp = ?, rank_index = ? WHERE id = ?', [xp, rankIndex, profile.id]);
    } catch (e) {
      console.warn('[ProfileStore] XP update to DB failed', e);
    }
  }
}));
