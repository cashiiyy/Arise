import { Platform } from 'react-native';
import { BiometricSnapshot } from '../types/arise';
import { generateMockSleep } from './mockWatchData';

/**
 * Requests permissions for iOS HealthKit.
 */
export async function requestHealthKitPermissions(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;

  try {
    const HealthKit = require('@kingstinct/react-native-healthkit').default;
    const { HKQuantityTypeIdentifier, HKCategoryTypeIdentifier } = require('@kingstinct/react-native-healthkit');

    const result = await HealthKit.requestAuthorization([
      HKQuantityTypeIdentifier.stepCount,
      HKQuantityTypeIdentifier.heartRate,
      HKQuantityTypeIdentifier.restingHeartRate,
      HKQuantityTypeIdentifier.heartRateVariabilitySDNN,
      HKQuantityTypeIdentifier.oxygenSaturation,
      HKQuantityTypeIdentifier.bodyTemperature,
      HKQuantityTypeIdentifier.activeEnergyBurned,
      HKCategoryTypeIdentifier.sleepAnalysis
    ]);
    
    return !!result;
  } catch (e) {
    console.warn('HealthKit permissions request failed:', e);
    return false;
  }
}

/**
 * Fetches batch daily metrics from iOS HealthKit for a specific date.
 */
export async function fetchHealthKitBatch(date: Date): Promise<BiometricSnapshot> {
  const dateString = date.toISOString().split('T')[0];

  if (Platform.OS !== 'ios') {
    // Return mock fallback for non-iOS / Web
    return {
      date: dateString,
      hrv_ms: 65 + Math.floor(Math.random() * 12),
      restingHR: 62 + Math.floor(Math.random() * 8),
      steps: 7500 + Math.floor(Math.random() * 5000),
      skinTemp_c: 36.5 + Math.random() * 0.4,
      sleepMin: generateMockSleep(),
      caloriesBurned: 350 + Math.floor(Math.random() * 300)
    };
  }

  try {
    const HealthKit = require('@kingstinct/react-native-healthkit').default;
    const { HKQuantityTypeIdentifier, HKCategoryTypeIdentifier } = require('@kingstinct/react-native-healthkit');

    const startTime = new Date(date);
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(23, 59, 59, 999);

    // 1. Fetch Steps
    let steps = 0;
    try {
      const stepData = await HealthKit.queryQuantityRecords(HKQuantityTypeIdentifier.stepCount, {
        startDate: startTime,
        endDate: endTime
      });
      steps = stepData.reduce((acc: number, r: any) => acc + (r.value || 0), 0);
    } catch (e) {
      console.warn('HealthKit failed to fetch steps:', e);
    }

    // 2. Fetch Resting Heart Rate
    let restingHR = 60;
    try {
      const hrData = await HealthKit.queryQuantityRecords(HKQuantityTypeIdentifier.restingHeartRate, {
        startDate: startTime,
        endDate: endTime
      });
      if (hrData.length > 0) {
        restingHR = Math.round(hrData[hrData.length - 1].value || 60);
      }
    } catch (e) {
      console.warn('HealthKit failed to fetch resting HR:', e);
    }

    // 3. Fetch HRV
    let hrv_ms = 60;
    try {
      const hrvData = await HealthKit.queryQuantityRecords(HKQuantityTypeIdentifier.heartRateVariabilitySDNN, {
        startDate: startTime,
        endDate: endTime
      });
      if (hrvData.length > 0) {
        const sum = hrvData.reduce((acc: number, r: any) => acc + (r.value || 60), 0);
        hrv_ms = Math.round(sum / hrvData.length);
      }
    } catch (e) {
      console.warn('HealthKit failed to fetch HRV:', e);
    }

    // 4. Fetch Skin Temp (Body Temperature)
    let skinTemp_c = 36.6;
    try {
      const tempData = await HealthKit.queryQuantityRecords(HKQuantityTypeIdentifier.bodyTemperature, {
        startDate: startTime,
        endDate: endTime
      });
      if (tempData.length > 0) {
        const sum = tempData.reduce((acc: number, r: any) => acc + (r.value || 36.6), 0);
        skinTemp_c = parseFloat((sum / tempData.length).toFixed(1));
      }
    } catch (e) {
      console.warn('HealthKit failed to fetch body temperature:', e);
    }

    // 5. Fetch Active Energy (Calories)
    let caloriesBurned = 0;
    try {
      const calData = await HealthKit.queryQuantityRecords(HKQuantityTypeIdentifier.activeEnergyBurned, {
        startDate: startTime,
        endDate: endTime
      });
      caloriesBurned = Math.round(calData.reduce((acc: number, r: any) => acc + (r.value || 0), 0));
    } catch (e) {
      console.warn('HealthKit failed to fetch calories:', e);
    }

    // 6. Fetch Sleep Analysis
    let sleepMin = generateMockSleep();
    try {
      const sleepData = await HealthKit.queryCategoryRecords(HKCategoryTypeIdentifier.sleepAnalysis, {
        startDate: startTime,
        endDate: endTime
      });
      if (sleepData.length > 0) {
        let totalSleepMin = 0;
        sleepData.forEach((s: any) => {
          const diffMs = new Date(s.endDate).getTime() - new Date(s.startDate).getTime();
          totalSleepMin += diffMs / 60000;
        });
        if (totalSleepMin > 0) {
          sleepMin = {
            deep: Math.round(totalSleepMin * 0.22),
            rem: Math.round(totalSleepMin * 0.18),
            light: Math.round(totalSleepMin * 0.54),
            awake: Math.round(totalSleepMin * 0.06)
          };
        }
      }
    } catch (e) {
      console.warn('HealthKit failed to fetch sleep:', e);
    }

    return {
      date: dateString,
      hrv_ms,
      restingHR,
      steps,
      skinTemp_c,
      sleepMin,
      caloriesBurned
    };
  } catch (e) {
    console.error('HealthKit batch fetch error:', e);
    return {
      date: dateString,
      hrv_ms: 60,
      restingHR: 65,
      steps: 5000,
      skinTemp_c: 36.6,
      sleepMin: generateMockSleep(),
      caloriesBurned: 200
    };
  }
}
