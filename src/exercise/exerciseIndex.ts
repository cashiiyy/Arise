import { Exercise } from './exerciseTypes';

const RAW_EXERCISES: Exercise[] = require('../../Exercises/exercisedb_v1_sample/exercises.json');

// Indexes
export const exerciseById: Record<string, Exercise> = {};
export const exerciseByMuscle: Record<string, string[]> = {};
export const exerciseByEquipment: Record<string, string[]> = {};
export const exerciseByDifficulty: Record<string, string[]> = {};

let _initialized = false;

export function initializeExerciseIndexes() {
  if (_initialized) return;

  for (const raw of RAW_EXERCISES) {
    // 1. By ID
    exerciseById[raw.exerciseId] = raw;

    // 2. By Muscle (Target + Body Parts)
    const muscles = new Set([...raw.targetMuscles, ...raw.bodyParts].map(m => m.toLowerCase()));
    for (const m of muscles) {
      if (!exerciseByMuscle[m]) exerciseByMuscle[m] = [];
      exerciseByMuscle[m].push(raw.exerciseId);
    }

    // 3. By Equipment
    const equipments = raw.equipments.length > 0 ? raw.equipments.map(e => e.toLowerCase()) : ['body weight'];
    for (const eq of equipments) {
      if (!exerciseByEquipment[eq]) exerciseByEquipment[eq] = [];
      exerciseByEquipment[eq].push(raw.exerciseId);
    }
    
    // We can compute difficulty inline or use the existing logic in exerciseService
  }
  
  _initialized = true;
  console.log('[ExerciseIndex] Initialized successfully');
}
