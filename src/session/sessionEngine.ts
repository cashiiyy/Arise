import { DayWorkoutPlan, ExerciseLog, ExerciseSet, WorkoutSession } from '../exercise/exerciseTypes';
import { getDB } from '../database/sqliteDB';

export type SessionState = 'idle' | 'active' | 'paused' | 'resting' | 'finished';

export interface ActiveSessionContext {
  sessionId: string;
  plan: DayWorkoutPlan;
  state: SessionState;
  startTime: number;
  pauseTime: number | null;
  totalPausedTime: number;
  activeExerciseIndex: number;
  logs: ExerciseLog[];
  restEndTime: number | null;
}

export class SessionEngine {
  
  static startSession(plan: DayWorkoutPlan): ActiveSessionContext {
    return {
      sessionId: `sess_${Date.now()}`,
      plan,
      state: 'active',
      startTime: Date.now(),
      pauseTime: null,
      totalPausedTime: 0,
      activeExerciseIndex: 0,
      logs: plan.exercises.map(e => ({
        exerciseId: e.exercise.exerciseId,
        exerciseName: e.exercise.name,
        sets: [],
        totalVolumeKg: 0,
        avgRpe: 0,
        durationMin: 0,
      })),
      restEndTime: null,
    };
  }

  static pauseSession(ctx: ActiveSessionContext): ActiveSessionContext {
    if (ctx.state !== 'active' && ctx.state !== 'resting') return ctx;
    return { ...ctx, state: 'paused', pauseTime: Date.now() };
  }

  static resumeSession(ctx: ActiveSessionContext): ActiveSessionContext {
    if (ctx.state !== 'paused') return ctx;
    const pausedDuration = Date.now() - (ctx.pauseTime ?? Date.now());
    
    // Adjust rest end time if we were resting
    const newRestEndTime = ctx.restEndTime ? ctx.restEndTime + pausedDuration : null;
    
    return { 
      ...ctx, 
      state: newRestEndTime ? 'resting' : 'active', 
      pauseTime: null, 
      totalPausedTime: ctx.totalPausedTime + pausedDuration,
      restEndTime: newRestEndTime,
    };
  }

  static logSet(ctx: ActiveSessionContext, weightKg: number, reps: number, rpe: number): ActiveSessionContext {
    const exercise = ctx.plan.exercises[ctx.activeExerciseIndex];
    if (!exercise) return ctx;

    const log = ctx.logs[ctx.activeExerciseIndex];
    const newSet: ExerciseSet = {
      setNumber: log.sets.length + 1,
      targetReps: exercise.plannedReps,
      completedReps: reps,
      weightKg,
      rpe,
      restSeconds: exercise.restSeconds,
      completed: true,
      timestamp: new Date().toISOString(),
    };

    const updatedLog = { ...log, sets: [...log.sets, newSet] };
    updatedLog.totalVolumeKg = updatedLog.sets.reduce((sum, s) => sum + (s.weightKg * s.completedReps), 0);
    updatedLog.avgRpe = updatedLog.sets.reduce((sum, s) => sum + s.rpe, 0) / updatedLog.sets.length;

    const newLogs = [...ctx.logs];
    newLogs[ctx.activeExerciseIndex] = updatedLog;

    // Start rest timer
    const restEndTime = Date.now() + (exercise.restSeconds * 1000);

    return {
      ...ctx,
      logs: newLogs,
      state: 'resting',
      restEndTime,
    };
  }

  static nextExercise(ctx: ActiveSessionContext): ActiveSessionContext {
    if (ctx.activeExerciseIndex >= ctx.plan.exercises.length - 1) {
      return this.finishSession(ctx);
    }
    return {
      ...ctx,
      activeExerciseIndex: ctx.activeExerciseIndex + 1,
      state: 'active',
      restEndTime: null,
    };
  }

  static skipRest(ctx: ActiveSessionContext): ActiveSessionContext {
    return { ...ctx, state: 'active', restEndTime: null };
  }

  static finishSession(ctx: ActiveSessionContext): ActiveSessionContext {
    return { ...ctx, state: 'finished', restEndTime: null };
  }

  static async persistSession(ctx: ActiveSessionContext): Promise<WorkoutSession> {
    const totalDurationMs = Date.now() - ctx.startTime - ctx.totalPausedTime;
    const totalDurationMin = Math.round(totalDurationMs / 60000);
    
    // Calculate total calories based on active exercises
    let totalKcal = 0;
    ctx.logs.forEach((log, idx) => {
      const planned = ctx.plan.exercises[idx];
      if (planned && log.sets.length > 0) {
        // Proportion of planned calories
        totalKcal += (log.sets.length / planned.plannedSets) * planned.estimatedCalories;
      }
    });

    const session: WorkoutSession = {
      id: ctx.sessionId,
      date: new Date().toISOString(),
      planName: ctx.plan.dayName,
      dayLabel: ctx.plan.label,
      exercises: ctx.logs,
      totalDurationMin,
      totalCaloriesBurned: Math.round(totalKcal),
      totalXpEarned: ctx.plan.totalXpReward, // Will be adjusted by achievement engine
      avgHeartRate: 110, // Stub
      completed: true,
      completionPct: 100,
    };

    try {
      const db = getDB();
      // Store in ExerciseHistory
      for (const log of session.exercises) {
        for (const set of log.sets) {
          const setId = `set_${Date.now()}_${Math.random()}`;
          await db.runAsync(
            `INSERT INTO ExerciseHistory (id, session_id, exercise_id, weight, reps, rpe, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [setId, session.id, log.exerciseId, set.weightKg, set.completedReps, set.rpe, set.timestamp]
          );
        }
      }
    } catch (e) {
      console.error('[SessionEngine] Failed to persist session to DB', e);
    }

    return session;
  }
}
