import { create } from 'zustand';
import { ActiveSessionContext, SessionEngine, SessionState } from './sessionEngine';
import { DayWorkoutPlan } from '../exercise/exerciseTypes';
import { useProfileStore } from '../profile/profileStore';
import { processXPEvent } from '../ai/engines/achievementEngine';

interface SessionStoreState {
  context: ActiveSessionContext | null;
  startSession: (plan: DayWorkoutPlan) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  logSet: (weightKg: number, reps: number, rpe: number) => void;
  nextExercise: () => void;
  skipRest: () => void;
  finishSession: () => Promise<void>;
  cancelSession: () => void;
}

export const useSessionStore = create<SessionStoreState>((set, get) => ({
  context: null,

  startSession: (plan) => {
    const ctx = SessionEngine.startSession(plan);
    set({ context: ctx });
  },

  pauseSession: () => {
    const { context } = get();
    if (!context) return;
    set({ context: SessionEngine.pauseSession(context) });
  },

  resumeSession: () => {
    const { context } = get();
    if (!context) return;
    set({ context: SessionEngine.resumeSession(context) });
  },

  logSet: (weightKg, reps, rpe) => {
    const { context } = get();
    if (!context) return;
    set({ context: SessionEngine.logSet(context, weightKg, reps, rpe) });
  },

  nextExercise: () => {
    const { context } = get();
    if (!context) return;
    set({ context: SessionEngine.nextExercise(context) });
  },

  skipRest: () => {
    const { context } = get();
    if (!context) return;
    set({ context: SessionEngine.skipRest(context) });
  },

  finishSession: async () => {
    const { context } = get();
    if (!context) return;
    
    const finishedCtx = SessionEngine.finishSession(context);
    set({ context: finishedCtx });

    // Persist to DB
    const sessionRecord = await SessionEngine.persistSession(finishedCtx);

    // Apply XP via Achievement Engine
    const profileStore = useProfileStore.getState();
    if (profileStore.profile) {
      const { updatedProfile, xpGained, rankUp } = processXPEvent(
        profileStore.profile,
        { reason: 'workoutComplete', amount: sessionRecord.totalDurationMin, timestamp: new Date().toISOString() }
      );
      
      await profileStore.updateXPAndRank(updatedProfile.xp, updatedProfile.rankIndex, updatedProfile.rank);
      if (rankUp) {
        console.log(`[RankUp] New Rank: ${rankUp.newRank}`);
      }
    }

    // Clear context
    set({ context: null });
  },

  cancelSession: () => {
    set({ context: null });
  }
}));
