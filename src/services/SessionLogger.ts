import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '../store/useUserStore';
import { useWatchStore } from '../stores/watchStore';
import { SessionLog } from '../types/arise';

export interface WorkoutSet {
  reps: number;
  weightKg: number;
  avgHr: number;
  timestamp: string;
}

export interface ExtendedSessionLog extends SessionLog {
  avgHR: number;
  maxHR: number;
  primaryZone: number;
  caloriesBurned: number;
  sets: WorkoutSet[];
}

class SessionLogger {
  private static instance: SessionLogger | null = null;
  private currentExercise: string = '';
  private currentType: 'strength' | 'cardio' | 'flexibility' = 'strength';
  private startTime: number = 0;
  private hrReadings: number[] = [];
  private loggedSets: WorkoutSet[] = [];
  private hrSamplingInterval: any = null;

  private constructor() {}

  public static getInstance(): SessionLogger {
    if (!SessionLogger.instance) {
      SessionLogger.instance = new SessionLogger();
    }
    return SessionLogger.instance;
  }

  /**
   * Starts a new workout tracking session.
   * @param exerciseName Name of the exercise
   * @param type Type of exercise: strength, cardio, or flexibility
   */
  public start(exerciseName: string, type: 'strength' | 'cardio' | 'flexibility' = 'strength'): void {
    this.currentExercise = exerciseName;
    this.currentType = type;
    this.startTime = Date.now();
    this.hrReadings = [];
    this.loggedSets = [];

    // Periodic sampling of live BPM from watchStore
    if (this.hrSamplingInterval) {
      clearInterval(this.hrSamplingInterval);
    }

    this.hrSamplingInterval = setInterval(() => {
      const liveBPM = useWatchStore.getState().liveBPM;
      if (liveBPM > 0) {
        this.hrReadings.push(liveBPM);
      }
    }, 1000);

    console.log(`Started logging session for: ${exerciseName}`);
  }

  /**
   * Logs a completed set.
   * @param reps Number of repetitions
   * @param weightKg Weight in kg
   */
  public logSet(reps: number, weightKg: number): void {
    const liveBPM = useWatchStore.getState().liveBPM;
    const currentAvgHr = this.hrReadings.length > 0 
      ? Math.round(this.hrReadings.reduce((a, b) => a + b, 0) / this.hrReadings.length) 
      : (liveBPM > 0 ? liveBPM : 75); // fallback to live BPM or 75

    const set: WorkoutSet = {
      reps,
      weightKg,
      avgHr: currentAvgHr,
      timestamp: new Date().toISOString()
    };

    this.loggedSets.push(set);
    console.log(`Logged set: ${reps} reps @ ${weightKg}kg (Avg HR: ${currentAvgHr})`);
  }

  /**
   * Ends the active session, calculates statistics, and saves to AsyncStorage.
   * @returns The extended session log summary
   */
  public async end(): Promise<ExtendedSessionLog> {
    if (this.hrSamplingInterval) {
      clearInterval(this.hrSamplingInterval);
      this.hrSamplingInterval = null;
    }

    const endTime = Date.now();
    const durationMin = Math.max(1, Math.round((endTime - this.startTime) / 60000));
    
    // Calculate Heart Rate Statistics
    let avgHR = 75;
    let maxHR = 75;
    if (this.hrReadings.length > 0) {
      avgHR = Math.round(this.hrReadings.reduce((a, b) => a + b, 0) / this.hrReadings.length);
      maxHR = Math.max(...this.hrReadings);
    }

    // Determine primary training zone (1-5)
    const primaryZone = useWatchStore.getState().currentZone;

    // Estimate Calories Burned (MET * Weight * Time)
    // MET values: strength = 6.0, cardio = 8.0, flexibility = 3.0
    const met = this.currentType === 'cardio' ? 8.0 : this.currentType === 'flexibility' ? 3.0 : 6.0;
    const userWeight = useUserStore.getState().biometrics?.weight || 70;
    const caloriesBurned = Math.round(met * userWeight * (durationMin / 60));

    const todayStr = new Date().toISOString().split('T')[0];

    const sessionSummary: ExtendedSessionLog = {
      date: new Date().toISOString(),
      exercise: this.currentExercise,
      weight: this.loggedSets.length > 0 ? this.loggedSets[0].weightKg : 0, // baseline/first set weight
      reps: this.loggedSets.length > 0 ? this.loggedSets[0].reps : 0,
      durationMin,
      type: this.currentType,
      avgHR,
      maxHR,
      primaryZone,
      caloriesBurned,
      sets: this.loggedSets
    };

    // Save to AsyncStorage
    const storageKey = `sessions:${todayStr}`;
    try {
      const existingSessionsJson = await AsyncStorage.getItem(storageKey);
      const existingSessions: ExtendedSessionLog[] = existingSessionsJson 
        ? JSON.parse(existingSessionsJson) 
        : [];
      
      existingSessions.push(sessionSummary);
      await AsyncStorage.setItem(storageKey, JSON.stringify(existingSessions));
      console.log(`Successfully saved session to ${storageKey}`);
      
      // Accumulate burned calories in watchStore
      useWatchStore.getState().logBurnedCalories(caloriesBurned);
    } catch (e) {
      console.error('Failed to save session to AsyncStorage:', e);
    }

    return sessionSummary;
  }
}

export default SessionLogger.getInstance();
