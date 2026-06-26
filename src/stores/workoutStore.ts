/**
 * Workout Zustand Store — Manages active workout session, week plan, and progression.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  WeekWorkoutPlan,
  DayWorkoutPlan,
  PlannedExercise,
  WorkoutSession,
  ExerciseLog,
  ExerciseSet,
} from '../exercise/exerciseTypes';
import { generateWeekPlan, getTodaysPlan, buildWorkoutCoachMessage, PlannerInput } from '../ai/workoutPlanner';
import { buildProgressionMessage } from '../ai/progressionEngine';
import { saveWorkoutSession, saveWeekPlan, loadWeekPlan, getExerciseHistory } from '../database/workoutHistoryDB';

interface WorkoutState {
  // Week plan
  weekPlan: WeekWorkoutPlan | null;
  todaysPlan: DayWorkoutPlan | null;
  coachMessage: string;

  // Active session
  sessionActive: boolean;
  activeExerciseIndex: number;
  currentSession: Partial<WorkoutSession>;
  currentExerciseLogs: ExerciseLog[];
  currentSetLogs: ExerciseSet[];

  // Current set state
  currentWeight: number;
  currentReps: number;
  currentRpe: number;
  setCount: number;

  // Progression messages
  progressionMessages: string[];

  // Actions
  generatePlan: (input: PlannerInput) => Promise<void>;
  loadSavedPlan: () => Promise<void>;
  startSession: () => void;
  logSet: (weight: number, reps: number, rpe: number) => void;
  nextExercise: () => void;
  finishWorkout: () => Promise<WorkoutSession>;
  resetSession: () => void;
  setCurrentWeight: (w: number) => void;
  setCurrentReps: (r: number) => void;
  setCurrentRpe: (r: number) => void;
  addExerciseToPlan: (exercise: any, sets: number, reps: number, weightKg: number) => void;
}

const makeEmptySession = (): Partial<WorkoutSession> => ({
  id: `session_${Date.now()}`,
  date: new Date().toISOString(),
  planName: '',
  dayLabel: '',
  exercises: [],
  totalDurationMin: 0,
  totalCaloriesBurned: 0,
  totalXpEarned: 0,
  avgHeartRate: 0,
  completed: false,
  completionPct: 0,
});

export const useWorkoutStore = create<WorkoutState>()(
  (set, get) => ({
    weekPlan: null,
    todaysPlan: null,
    coachMessage: '',
    sessionActive: false,
    activeExerciseIndex: 0,
    currentSession: makeEmptySession(),
    currentExerciseLogs: [],
    currentSetLogs: [],
    currentWeight: 20,
    currentReps: 10,
    currentRpe: 7,
    setCount: 0,
    progressionMessages: [],

    generatePlan: async (input: PlannerInput) => {
      // Fetch exercise history for progression
      const history = await getExerciseHistory(undefined, 100);
      const planInput = { ...input, workoutHistory: history };
      const plan = generateWeekPlan(planInput);
      const today = getTodaysPlan(plan);
      const msg = buildWorkoutCoachMessage(today, input.recoveryScore);

      await saveWeekPlan(plan);
      set({ weekPlan: plan, todaysPlan: today, coachMessage: msg });
    },

    loadSavedPlan: async () => {
      const saved = await loadWeekPlan();
      if (saved) {
        const today = getTodaysPlan(saved);
        set({ weekPlan: saved, todaysPlan: today });
      }
    },

    startSession: () => {
      const { todaysPlan } = get();
      if (!todaysPlan) return;

      const firstExercise = todaysPlan.exercises[0];
      const startWeight = firstExercise?.recommendedWeightKg ?? 20;
      const startReps = firstExercise?.plannedReps ?? 10;

      set({
        sessionActive: true,
        activeExerciseIndex: 0,
        currentSession: {
          ...makeEmptySession(),
          planName: get().weekPlan?.splitName ?? 'Workout',
          dayLabel: todaysPlan.label,
        },
        currentExerciseLogs: [],
        currentSetLogs: [],
        setCount: 0,
        currentWeight: startWeight,
        currentReps: startReps,
        currentRpe: 7,
        progressionMessages: [],
      });
    },

    logSet: (weight: number, reps: number, rpe: number) => {
      const { currentSetLogs, setCount } = get();
      const newSet: ExerciseSet = {
        setNumber: setCount + 1,
        targetReps: reps,
        completedReps: reps,
        weightKg: weight,
        rpe,
        restSeconds: 90,
        completed: true,
        timestamp: new Date().toISOString(),
      };
      set({
        currentSetLogs: [...currentSetLogs, newSet],
        setCount: setCount + 1,
      });
    },

    nextExercise: () => {
      const {
        todaysPlan,
        activeExerciseIndex,
        currentExerciseLogs,
        currentSetLogs,
      } = get();

      if (!todaysPlan) return;

      const currentPlanned = todaysPlan.exercises[activeExerciseIndex];
      if (!currentPlanned) return;

      // Finalize current exercise log
      const totalVolume = currentSetLogs.reduce(
        (sum, s) => sum + s.weightKg * s.completedReps, 0
      );
      const avgRpe = currentSetLogs.length > 0
        ? Math.round(currentSetLogs.reduce((sum, s) => sum + s.rpe, 0) / currentSetLogs.length)
        : 7;

      const exerciseLog: ExerciseLog = {
        exerciseId: currentPlanned.exercise.exerciseId,
        exerciseName: currentPlanned.exercise.name,
        sets: currentSetLogs,
        totalVolumeKg: Math.round(totalVolume),
        avgRpe,
        durationMin: currentPlanned.estimatedDurationMin,
      };

      const updatedLogs = [...currentExerciseLogs, exerciseLog];
      const nextIdx = activeExerciseIndex + 1;
      const nextExercise = todaysPlan.exercises[nextIdx];

      // Build progression message if applicable
      const progressionMessages = [...get().progressionMessages];
      const suggestion = null; // Will be evaluated by progression engine later
      
      set({
        currentExerciseLogs: updatedLogs,
        activeExerciseIndex: nextIdx,
        currentSetLogs: [],
        setCount: 0,
        currentWeight: nextExercise?.recommendedWeightKg ?? 20,
        currentReps: nextExercise?.plannedReps ?? 10,
        currentRpe: 7,
        progressionMessages,
      });
    },

    finishWorkout: async (): Promise<WorkoutSession> => {
      const {
        todaysPlan,
        currentSession,
        currentExerciseLogs,
        currentSetLogs,
        activeExerciseIndex,
      } = get();

      // Flush any remaining set logs for current exercise
      let finalLogs = [...currentExerciseLogs];
      if (currentSetLogs.length > 0 && todaysPlan) {
        const currentPlanned = todaysPlan.exercises[activeExerciseIndex];
        if (currentPlanned) {
          const totalVolume = currentSetLogs.reduce(
            (sum, s) => sum + s.weightKg * s.completedReps, 0
          );
          finalLogs.push({
            exerciseId: currentPlanned.exercise.exerciseId,
            exerciseName: currentPlanned.exercise.name,
            sets: currentSetLogs,
            totalVolumeKg: Math.round(totalVolume),
            avgRpe: 7,
            durationMin: currentPlanned.estimatedDurationMin,
          });
        }
      }

      const totalPlanned = todaysPlan?.exercises.length ?? 1;
      const completed = finalLogs.length;
      const completionPct = Math.round((completed / Math.max(totalPlanned, 1)) * 100);
      const totalCalories = todaysPlan?.totalEstimatedCalories ?? 0;
      const totalXp = Math.round((todaysPlan?.totalXpReward ?? 100) * (completionPct / 100));
      const totalDuration = finalLogs.reduce((sum, l) => sum + l.durationMin, 0);

      const session: WorkoutSession = {
        id: currentSession.id ?? `session_${Date.now()}`,
        date: currentSession.date ?? new Date().toISOString(),
        planName: currentSession.planName ?? 'Workout',
        dayLabel: todaysPlan?.label ?? 'Session',
        exercises: finalLogs,
        totalDurationMin: Math.round(totalDuration),
        totalCaloriesBurned: totalCalories,
        totalXpEarned: totalXp,
        avgHeartRate: 0,
        completed: completionPct >= 80,
        completionPct,
      };

      await saveWorkoutSession(session);

      set({
        sessionActive: false,
        currentSession: makeEmptySession(),
        currentExerciseLogs: [],
        currentSetLogs: [],
        setCount: 0,
        activeExerciseIndex: 0,
      });

      return session;
    },

    resetSession: () => {
      set({
        sessionActive: false,
        currentSession: makeEmptySession(),
        currentExerciseLogs: [],
        currentSetLogs: [],
        setCount: 0,
        activeExerciseIndex: 0,
        progressionMessages: [],
      });
    },

    setCurrentWeight: (w: number) => set({ currentWeight: Math.max(0, w) }),
    setCurrentReps: (r: number) => set({ currentReps: Math.max(1, r) }),
    setCurrentRpe: (r: number) => set({ currentRpe: Math.max(1, Math.min(10, r)) }),

    addExerciseToPlan: (exercise: any, sets: number, reps: number, weightKg: number) => {
      const { todaysPlan } = get();
      if (!todaysPlan) return;

      const newPlannedExercise: PlannedExercise = {
        exercise,
        plannedSets: sets,
        plannedReps: reps,
        plannedRepRange: `${reps}-${reps + 2}`,
        recommendedWeightKg: weightKg,
        restSeconds: exercise.restTime || 90,
        intensityLevel: 'moderate',
        estimatedCalories: 50,
        xpReward: exercise.xpReward || 50,
        estimatedDurationMin: sets * 2,
        progressionNote: 'Manually Added',
      };

      const updatedPlan = {
        ...todaysPlan,
        exercises: [...todaysPlan.exercises, newPlannedExercise],
        totalEstimatedDurationMin: todaysPlan.totalEstimatedDurationMin + (sets * 2),
      };

      set({ todaysPlan: updatedPlan });
    },
  })
);
