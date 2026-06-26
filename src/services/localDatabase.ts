import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfileDb {
  name: string;
  age: number;
  height: number;        // in cm
  weight: number;        // in kg
  targetWeight: number;  // in kg
  sex: string;           // 'male' | 'female'
  motivation: string;
  focusAreas: string[];
  equipment: string[];
  frequency: number;     // workouts/week
  healthIssues: string[];
  
  // Calculated fields (updated dynamically in the database)
  bmi?: number;
  bmiCategory?: string;
  waterGoalCups?: number;
  bmr?: number;
  tdee?: number;
  macros?: {
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
  };
  rpgStats?: {
    STR: number;
    END: number;
    AGI: number;
    VIT: number;
    INT: number;
  };
}

const USER_DB_KEY = '@arise:user_profile_database';

export class LocalDatabase {
  /**
   * Saves the raw profile inputs, performs biometric calculations, and updates the database record.
   */
  public static async saveUserProfile(profile: Omit<UserProfileDb, 'bmi' | 'bmiCategory' | 'waterGoalCups' | 'bmr' | 'tdee' | 'macros' | 'rpgStats'>): Promise<UserProfileDb> {
    const heightM = profile.height / 100;
    const bmi = parseFloat((profile.weight / (heightM * heightM)).toFixed(1));
    
    // BMI classification
    let bmiCategory = 'Normal';
    if (bmi < 18.5) bmiCategory = 'Underweight';
    else if (bmi < 25) bmiCategory = 'Normal';
    else if (bmi < 30) bmiCategory = 'Overweight';
    else bmiCategory = 'Obese';

    // Mifflin-St Jeor formula for BMR
    // Male: 10w + 6.25h - 5a + 5
    // Female: 10w + 6.25h - 5a - 161
    const wFactor = 10 * profile.weight;
    const hFactor = 6.25 * profile.height;
    const aFactor = 5 * profile.age;
    const bmr = Math.round(
      profile.sex === 'female'
        ? wFactor + hFactor - aFactor - 161
        : wFactor + hFactor - aFactor + 5
    );

    // Activity multiplier based on frequency
    let multiplier = 1.2; // Sedentary
    if (profile.frequency >= 5) multiplier = 1.55; // Moderately active
    else if (profile.frequency >= 3) multiplier = 1.375; // Lightly active
    else if (profile.frequency >= 6) multiplier = 1.725; // Very active

    const tdee = Math.round(bmr * multiplier);

    // Caloric target based on motivation / goal
    const goalLower = profile.motivation.toLowerCase();
    let calorieTarget = tdee;
    if (goalLower.includes('loss') || goalLower.includes('weight')) {
      calorieTarget = tdee - 500; // Deficit
    } else if (goalLower.includes('appearance') || goalLower.includes('gain')) {
      calorieTarget = tdee + 300; // Surplus
    }

    // Macro distribution:
    // Protein: 2.0g per kg of bodyweight (4 kcal/g)
    // Fat: 1.0g per kg of bodyweight (9 kcal/g)
    // Carbs: Remaining calories (4 kcal/g)
    const proteinG = Math.round(2.0 * profile.weight);
    const fatG = Math.round(1.0 * profile.weight);
    const proteinKcal = proteinG * 4;
    const fatKcal = fatG * 9;
    const remainingKcal = Math.max(500, calorieTarget - (proteinKcal + fatKcal));
    const carbsG = Math.round(remainingKcal / 4);

    // Water Goal in cups
    const waterGoalCups = parseFloat((profile.weight * 0.033 * 4.226).toFixed(1));

    // RPG Stats mapping matching store
    const rpgStats = {
      STR: 10 + (profile.equipment.includes('Barbells') ? 3 : 1) + (profile.focusAreas.includes('Chest') ? 1 : 0),
      END: 10 + (profile.frequency >= 4 ? 3 : 1) + (profile.motivation === 'Enjoyment' ? 2 : 1),
      AGI: 10 + (profile.focusAreas.includes('Legs') ? 2 : 0) + (profile.motivation === 'Appearance' ? 2 : 1),
      VIT: 10 + (profile.healthIssues.includes('None') ? 3 : 1) + (profile.frequency <= 4 ? 2 : 1),
      INT: 10 + (profile.age > 20 ? 3 : 1) + (profile.motivation === 'Health' ? 2 : 1),
    };

    const completeProfile: UserProfileDb = {
      ...profile,
      bmi,
      bmiCategory,
      waterGoalCups,
      bmr,
      tdee,
      macros: {
        protein: proteinG,
        carbs: carbsG,
        fat: fatG,
        calories: calorieTarget
      },
      rpgStats
    };

    // Save complete profile record as a database entry in AsyncStorage
    await AsyncStorage.setItem(USER_DB_KEY, JSON.stringify(completeProfile));
    console.log('User profile successfully saved to local database.');
    return completeProfile;
  }

  /**
   * Retrieves the active user profile record from the database.
   */
  public static async getUserProfile(): Promise<UserProfileDb | null> {
    try {
      const data = await AsyncStorage.getItem(USER_DB_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Failed to read from local user database:', e);
      return null;
    }
  }

  /**
   * Clears the user database record.
   */
  public static async clearDatabase(): Promise<void> {
    await AsyncStorage.removeItem(USER_DB_KEY);
    console.log('Local user database cleared.');
  }
}
