/**
 * ExerciseService — Loads, searches, and enriches the exercise dataset.
 * Integrates with the local GIF map for bundled assets.
 */
import { Exercise } from './exerciseTypes';
import { getExerciseGif } from './exerciseGifMap';

// Import the raw dataset
const RAW_EXERCISES: Exercise[] = require('../../Exercises/exercisedb_v1_sample/exercises.json');

// ─── Metadata Enrichment Tables ─────────────────────────────────────────────

const DIFFICULTY_MAP: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
  'body weight': 'beginner',
  'assisted': 'beginner',
  'dumbbell': 'intermediate',
  'cable': 'intermediate',
  'barbell': 'advanced',
  'smith machine': 'intermediate',
  'leverage machine': 'intermediate',
  'kettlebell': 'intermediate',
  'sled machine': 'advanced',
  'weighted': 'intermediate',
  'resistance band': 'beginner',
  'ez barbell': 'intermediate',
};

const MUSCLE_MET: Record<string, number> = {
  'chest': 6.0,
  'back': 6.0,
  'upper arms': 4.5,
  'lower arms': 4.0,
  'upper legs': 7.0,
  'lower legs': 5.0,
  'shoulders': 5.5,
  'waist': 5.0,
};

const TIPS_MAP: Record<string, string[]> = {
  'biceps': [
    'Keep elbows pinned to your sides throughout the movement.',
    'Full range of motion — fully extend at the bottom for maximum stretch.',
    'Control the eccentric (lowering) phase for 2-3 seconds.',
  ],
  'triceps': [
    'Keep elbows close to your head for full tricep activation.',
    'Lock out fully at the top for complete contraction.',
    'Avoid flaring elbows outward.',
  ],
  'pectorals': [
    'Retract scapula and maintain chest arch throughout.',
    'Drive the bar in a slight arc, not straight up.',
    'Squeeze at the peak contraction.',
  ],
  'glutes': [
    'Drive through the heels, not the toes.',
    'Full hip extension at the top — squeeze hard.',
    'Knees should track over toes throughout.',
  ],
  'lats': [
    'Initiate the pull with your elbows, not hands.',
    'Full stretch at the top allows greater range of motion.',
    'Avoid shrugging shoulders.',
  ],
  'abs': [
    'Breathe out during the contraction phase.',
    'Avoid pulling on your neck — let abs do the work.',
    'Slow and controlled beats fast and sloppy.',
  ],
  'calves': [
    'Full range of motion — deep stretch at the bottom.',
    'Pause at the top for 1 second.',
    'Go slow — calf muscles respond well to time under tension.',
  ],
  'delts': [
    'Keep a slight bend in the elbows to protect joints.',
    'Lead with your elbows, not your wrists.',
    'Avoid using momentum — strict form is key.',
  ],
  'forearms': [
    'Rest forearms on a bench for stability.',
    'Full wrist extension and flexion for maximum activation.',
    'Use lighter weights for higher reps.',
  ],
};

const MISTAKES_MAP: Record<string, string[]> = {
  'biceps': [
    'Swinging the torso to use momentum.',
    'Incomplete range of motion — not fully extending.',
    'Using too heavy a weight sacrificing form.',
  ],
  'triceps': [
    'Flaring elbows outward during extensions.',
    'Not fully locking out at the top.',
    'Letting elbows drift forward.',
  ],
  'pectorals': [
    'Bouncing the bar off the chest.',
    'Uneven grip or bar path.',
    'Not retracting shoulder blades.',
  ],
  'glutes': [
    'Knees caving inward.',
    'Not reaching full depth.',
    'Leaning too far forward.',
  ],
  'lats': [
    'Using biceps instead of back to pull.',
    'Pulling with momentum.',
    'Incomplete range — not letting arms fully extend.',
  ],
  'abs': [
    'Using hip flexors instead of abs.',
    'Pulling on the neck.',
    'Going too fast with poor control.',
  ],
  'calves': [
    'Partial range of motion.',
    'Bouncing at the bottom.',
    'Too much weight, too little range.',
  ],
  'delts': [
    'Shrugging shoulders during raises.',
    'Using momentum to swing the weight.',
    'Going too heavy — reduces deltoid isolation.',
  ],
  'forearms': [
    'Using too much wrist deviation.',
    'Rushing through reps.',
    'Gripping too tightly at full extension.',
  ],
};

const REST_TIME_MAP: Record<string, number> = {
  'beginner': 60,
  'intermediate': 90,
  'advanced': 120,
};

const SETS_MAP: Record<string, number> = {
  'beginner': 3,
  'intermediate': 4,
  'advanced': 5,
};

const REPS_MAP: Record<string, string> = {
  'beginner': '12-15',
  'intermediate': '8-12',
  'advanced': '5-8',
};

// ─── Memoized enriched exercises ─────────────────────────────────────────────

let _enrichedCache: Exercise[] | null = null;

function enrichExercise(raw: Exercise): Exercise {
  const primaryEquipment = raw.equipments[0] ?? 'body weight';
  const primaryBodyPart = raw.bodyParts[0] ?? 'full body';
  const primaryTarget = raw.targetMuscles[0] ?? 'full body';

  const difficulty = DIFFICULTY_MAP[primaryEquipment.toLowerCase()] ?? 'intermediate';
  const metValue = MUSCLE_MET[primaryBodyPart.toLowerCase()] ?? 5.0;
  const tips = TIPS_MAP[primaryTarget.toLowerCase()] ?? [
    'Maintain proper form throughout the movement.',
    'Control both the concentric and eccentric phases.',
    'Breathe steadily — exhale during exertion.',
  ];
  const commonMistakes = MISTAKES_MAP[primaryTarget.toLowerCase()] ?? [
    'Using too much weight at the expense of form.',
    'Rushing through reps.',
    'Neglecting full range of motion.',
  ];

  const restTime = REST_TIME_MAP[difficulty];
  const defaultSets = SETS_MAP[difficulty];
  const defaultRepRange = REPS_MAP[difficulty];
  const defaultReps = difficulty === 'beginner' ? 15 : difficulty === 'intermediate' ? 10 : 6;

  // Weight recommendation: rough starting estimates by body part
  const weightMap: Record<string, number> = {
    'upper arms': 12, 'lower arms': 8, 'chest': 40, 'back': 35,
    'shoulders': 15, 'upper legs': 60, 'lower legs': 30, 'waist': 0,
  };
  const defaultWeightKg = weightMap[primaryBodyPart.toLowerCase()] ?? 20;

  const xpReward = difficulty === 'beginner' ? 30 : difficulty === 'intermediate' ? 50 : 80;

  return {
    ...raw,
    difficulty,
    restTime,
    defaultSets,
    defaultReps,
    defaultRepRange,
    defaultWeightKg,
    tips,
    commonMistakes,
    metValue,
    xpReward,
    category: primaryBodyPart,
  };
}

function getAllEnriched(): Exercise[] {
  if (_enrichedCache) return _enrichedCache;
  _enrichedCache = RAW_EXERCISES.map(enrichExercise);
  return _enrichedCache;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get all exercises (enriched with metadata).
 */
export function getAllExercises(): Exercise[] {
  return getAllEnriched();
}

/**
 * Get exercise by ID.
 */
export function getExerciseById(id: string): Exercise | null {
  return getAllEnriched().find(e => e.exerciseId === id) ?? null;
}

/**
 * Fuzzy search exercises by name.
 */
export function searchExercisesByName(query: string): Exercise[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();
  return getAllEnriched()
    .filter(e => e.name.toLowerCase().includes(q))
    .sort((a, b) => {
      // Exact match first
      const aExact = a.name.toLowerCase().startsWith(q) ? 0 : 1;
      const bExact = b.name.toLowerCase().startsWith(q) ? 0 : 1;
      return aExact - bExact;
    });
}

/**
 * Filter exercises by target muscle group.
 */
export function getExercisesByMuscle(muscle: string): Exercise[] {
  const m = muscle.toLowerCase();
  return getAllEnriched().filter(e =>
    e.targetMuscles.some(tm => tm.toLowerCase().includes(m)) ||
    e.bodyParts.some(bp => bp.toLowerCase().includes(m))
  );
}

/**
 * Filter exercises by equipment type.
 * Supports 'body weight' for home workouts.
 */
export function getExercisesByEquipment(equipments: string[]): Exercise[] {
  const eq = equipments.map(e => e.toLowerCase());
  return getAllEnriched().filter(e =>
    e.equipments.some(eeq => eq.some(q => eeq.toLowerCase().includes(q) || q.includes(eeq.toLowerCase())))
  );
}

/**
 * Filter by body part (chest, back, legs, shoulders, arms, waist).
 */
export function getExercisesByBodyPart(bodyPart: string): Exercise[] {
  const bp = bodyPart.toLowerCase();
  return getAllEnriched().filter(e =>
    e.bodyParts.some(p => p.toLowerCase().includes(bp))
  );
}

/**
 * Get the bundled GIF source for an exercise, or null if not available.
 */
export function getExerciseGifSource(exerciseId: string): any | null {
  return getExerciseGif(exerciseId);
}

/**
 * Get exercises suitable for a weekly split day.
 * Returns exercises for a specific muscle group filtered by available equipment.
 */
export function getExercisesForDay(
  muscleGroups: string[],
  availableEquipment: string[],
  count: number = 4
): Exercise[] {
  let candidates: Exercise[] = [];
  
  for (const muscle of muscleGroups) {
    const byMuscle = getExercisesByMuscle(muscle);
    const filtered = availableEquipment.length > 0
      ? byMuscle.filter(e => e.equipments.some(eq =>
          availableEquipment.some(ue =>
            ue.toLowerCase().includes(eq.toLowerCase()) ||
            eq.toLowerCase() === 'body weight'
          )
        ))
      : byMuscle;
    candidates.push(...filtered);
  }

  // Deduplicate
  const seen = new Set<string>();
  candidates = candidates.filter(e => {
    if (seen.has(e.exerciseId)) return false;
    seen.add(e.exerciseId);
    return true;
  });

  // Shuffle deterministically based on date so it varies day-to-day
  const seed = new Date().toDateString();
  candidates.sort((a, b) => {
    const ha = ((a.exerciseId + seed).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 100;
    const hb = ((b.exerciseId + seed).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 100;
    return ha - hb;
  });

  // Fallback: if no matching equipment exercises, use any bodyweight
  if (candidates.length === 0) {
    candidates = getAllEnriched().filter(e =>
      e.equipments.includes('body weight') &&
      muscleGroups.some(m => e.bodyParts.some(bp => bp.toLowerCase().includes(m.toLowerCase())))
    );
  }

  return candidates.slice(0, count);
}

/**
 * Estimate calories burned for an exercise session.
 */
export function estimateCaloriesBurned(
  exercise: Exercise,
  sets: number,
  reps: number,
  weightKg: number,
  userWeightKg: number
): number {
  const met = exercise.metValue ?? 5.0;
  // Rough estimate: each set takes ~1 minute of active work
  const activeDurationMin = sets * 1;
  return Math.round(met * userWeightKg * (activeDurationMin / 60));
}
