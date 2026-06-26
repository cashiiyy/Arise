import { Platform } from 'react-native';
import { BiometricSnapshot } from '../types/arise';
import { generateMockSleep } from './mockWatchData';

/**
 * Requests permissions for Android Health Connect.
 */
export async function requestHealthConnectPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  
  try {
    const { initialize, requestPermission } = require('react-native-health-connect');
    await initialize();
    const isGranted = await requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'HeartRate' },
      { accessType: 'read', recordType: 'HeartRateVariability' },
      { accessType: 'read', recordType: 'SleepSession' },
      { accessType: 'read', recordType: 'OxygenSaturation' },
      { accessType: 'read', recordType: 'SkinTemperature' },
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' }
    ]);
    return isGranted;
  } catch (e) {
    console.warn('Health Connect permission request failed:', e);
    return false;
  }
}

/**
 * Fetches batch daily metrics from Android Health Connect for a specific date.
 */
export async function fetchHealthConnectBatch(date: Date): Promise<BiometricSnapshot> {
  const dateString = date.toISOString().split('T')[0];

  if (Platform.OS !== 'android') {
    // Return mock fallback for non-Android / Web
    return {
      date: dateString,
      hrv_ms: 62 + Math.floor(Math.random() * 15),
      restingHR: 60 + Math.floor(Math.random() * 10),
      steps: 8000 + Math.floor(Math.random() * 4000),
      skinTemp_c: 36.4 + Math.random() * 0.5,
      sleepMin: generateMockSleep(),
      caloriesBurned: 400 + Math.floor(Math.random() * 200)
    };
  }

  try {
    const { initialize, readRecords } = require('react-native-health-connect');
    await initialize();

    const startTime = new Date(date);
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(23, 59, 59, 999);

    const timeRange = {
      operator: 'between' as const,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    };

    // 1. Fetch Steps
    let steps = 0;
    try {
      const stepRecords = await readRecords('Steps', { timeRangeFilter: timeRange });
      steps = stepRecords.records.reduce((acc: number, r: any) => acc + (r.count || 0), 0);
    } catch (e) {
      console.warn('Failed to read Steps from Health Connect:', e);
    }

    // 2. Fetch Heart Rate
    let restingHR = 65;
    let hrv_ms = 58;
    try {
      const hrRecords = await readRecords('HeartRate', { timeRangeFilter: timeRange });
      const bpmValues: number[] = [];
      hrRecords.records.forEach((r: any) => {
        if (r.samples) {
          r.samples.forEach((s: any) => bpmValues.push(s.beatsPerMinute));
        }
      });
      if (bpmValues.length > 0) {
        bpmValues.sort((a, b) => a - b);
        restingHR = bpmValues[Math.floor(bpmValues.length / 2)]; // Median HR
      }

      // Read HRV
      const hrvRecords = await readRecords('HeartRateVariability', { timeRangeFilter: timeRange });
      if (hrvRecords.records.length > 0) {
        const sum = hrvRecords.records.reduce((acc: number, r: any) => acc + (r.rms || r.heartRateVariabilityMillis || 55), 0);
        hrv_ms = Math.round(sum / hrvRecords.records.length);
      }
    } catch (e) {
      console.warn('Failed to read Heart Rate from Health Connect:', e);
    }

    // 3. Fetch Skin Temp
    let skinTemp_c = 36.6;
    try {
      const tempRecords = await readRecords('SkinTemperature', { timeRangeFilter: timeRange });
      if (tempRecords.records.length > 0) {
        const sum = tempRecords.records.reduce((acc: number, r: any) => acc + (r.temperature?.celsius || 36.6), 0);
        skinTemp_c = parseFloat((sum / tempRecords.records.length).toFixed(1));
      }
    } catch (e) {
      console.warn('Failed to read Skin Temp from Health Connect:', e);
    }

    // 4. Fetch Active Calories
    let caloriesBurned = 0;
    try {
      const calRecords = await readRecords('ActiveCaloriesBurned', { timeRangeFilter: timeRange });
      caloriesBurned = calRecords.records.reduce((acc: number, r: any) => acc + (r.energy?.kilocalories || 0), 0);
    } catch (e) {
      console.warn('Failed to read Calories from Health Connect:', e);
    }

    // 5. Fetch Sleep session stages (mock/simplified map as Health Connect sleep stages can vary)
    let sleepMin = generateMockSleep();
    try {
      const sleepRecords = await readRecords('SleepSession', { timeRangeFilter: timeRange });
      if (sleepRecords.records.length > 0) {
        // Compute sleep stage durations if detailed samples are present, else fallback
        let totalSleep = 0;
        sleepRecords.records.forEach((r: any) => {
          const duration = (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000;
          totalSleep += duration;
        });
        if (totalSleep > 0) {
          sleepMin = {
            deep: Math.round(totalSleep * 0.20),
            rem: Math.round(totalSleep * 0.18),
            light: Math.round(totalSleep * 0.55),
            awake: Math.round(totalSleep * 0.07)
          };
        }
      }
    } catch (e) {
      console.warn('Failed to read Sleep from Health Connect:', e);
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
    console.error('Health Connect batch fetch error:', e);
    // Fallback on error
    return {
      date: dateString,
      hrv_ms: 60,
      restingHR: 65,
      steps: 5000,
      skinTemp_c: 36.6,
      sleepMin: generateMockSleep(),
      caloriesBurned: 250
    };
  }
}
