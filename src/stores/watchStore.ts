import { create } from 'zustand';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WatchBridge } from '../services/WatchBridge';
import { fetchHealthConnectBatch } from '../services/androidHealthConnect';
import { fetchHealthKitBatch } from '../services/iosHealthKit';
import { generateMockHeartRate, generateMockSpO2 } from '../services/mockWatchData';

// Helper: Tanaka Formula for Max Heart Rate
export function calcMaxHR(age: number): number {
  return Math.round(208 - 0.7 * age);
}

// Helper: HR Zone Classifier
export function classifyZone(bpm: number, maxHR: number): 1 | 2 | 3 | 4 | 5 {
  const percentage = (bpm / maxHR) * 100;
  if (percentage < 60) return 1;
  if (percentage < 70) return 2;
  if (percentage < 80) return 3;
  if (percentage < 90) return 4;
  return 5;
}

// Helper: Safety Checker
export function checkSafety(spO2: number, bpm: number): 'OK' | 'WARN' | 'REDUCE' | 'STOP' {
  if (spO2 < 90) return 'STOP';
  if (spO2 < 94) return 'REDUCE';
  if (bpm > 185) return 'WARN';
  return 'OK';
}

interface WatchState {
  // Connection details
  connected: boolean;
  deviceName: string | null;
  isManualMode: boolean;

  // Real-time telemetry
  liveBPM: number;
  currentZone: 1 | 2 | 3 | 4 | 5;
  spO2: number;
  safetyStatus: 'OK' | 'WARN' | 'REDUCE' | 'STOP';
  todaySteps: number;
  recoveryScore: number;
  lastSync: Date | null;

  // Calorie & Water trackers
  waterIntakeMl: number;
  caloriesConsumedKcal: number;
  caloriesTargetKcal: number;
  caloriesBurnedKcal: number;

  // Connection & Scanner Actions
  scanAndConnect: () => Promise<boolean>;
  setManualMode: (enabled: boolean) => void;
  disconnect: () => void;

  // Heart Rate Tracking Actions
  startWorkoutTracking: (userAge: number) => void;
  stopWorkoutTracking: () => void;
  updateLiveBPM: (bpm: number, age: number) => void;
  updateManualBPM: (bpm: number, age: number) => void;

  // Sync Actions
  syncNightly: () => Promise<void>;
  syncBackground: () => Promise<{ bpm: number; steps: number; stressProxy: 'low' | 'moderate' | 'high' }>;

  // Calorie & Water Logging Actions
  logWater: (ml: number) => void;
  logCalories: (kcal: number) => void;
  logBurnedCalories: (kcal: number) => void;
  resetDailyCounters: () => void;
}

const STORAGE_KEYS = {
  WATER: 'watchStore:waterIntakeMl',
  CALORIES_CONSUMED: 'watchStore:caloriesConsumedKcal',
  CALORIES_BURNED: 'watchStore:caloriesBurnedKcal',
  STEPS: 'watchStore:todaySteps',
  RECOVERY: 'watchStore:recoveryScore',
  MANUAL: 'watchStore:isManualMode',
  CONNECTED: 'watchStore:connected',
  DEVICE_NAME: 'watchStore:deviceName'
};

export const useWatchStore = create<WatchState>((set, get) => {
  const watchBridge = WatchBridge.getInstance();

  // Load persisted logs on init
  const loadPersistedData = async () => {
    try {
      const keys = await AsyncStorage.multiGet([
        STORAGE_KEYS.WATER,
        STORAGE_KEYS.CALORIES_CONSUMED,
        STORAGE_KEYS.CALORIES_BURNED,
        STORAGE_KEYS.STEPS,
        STORAGE_KEYS.RECOVERY,
        STORAGE_KEYS.MANUAL,
        STORAGE_KEYS.CONNECTED,
        STORAGE_KEYS.DEVICE_NAME
      ]);
      
      const persistedState: Partial<WatchState> = {};
      keys.forEach(([key, val]) => {
        if (!val) return;
        switch (key) {
          case STORAGE_KEYS.WATER:
            persistedState.waterIntakeMl = parseInt(val, 10);
            break;
          case STORAGE_KEYS.CALORIES_CONSUMED:
            persistedState.caloriesConsumedKcal = parseInt(val, 10);
            break;
          case STORAGE_KEYS.CALORIES_BURNED:
            persistedState.caloriesBurnedKcal = parseInt(val, 10);
            break;
          case STORAGE_KEYS.STEPS:
            persistedState.todaySteps = parseInt(val, 10);
            break;
          case STORAGE_KEYS.RECOVERY:
            persistedState.recoveryScore = parseInt(val, 10);
            break;
          case STORAGE_KEYS.MANUAL:
            persistedState.isManualMode = val === 'true';
            break;
          case STORAGE_KEYS.CONNECTED:
            persistedState.connected = val === 'true';
            break;
          case STORAGE_KEYS.DEVICE_NAME:
            persistedState.deviceName = val;
            break;
        }
      });
      set(persistedState);
    } catch (e) {
      console.warn('Failed to load persisted watchStore state:', e);
    }
  };

  loadPersistedData();

  return {
    connected: false,
    deviceName: null,
    isManualMode: false,

    liveBPM: 0,
    currentZone: 1,
    spO2: 98,
    safetyStatus: 'OK',
    todaySteps: 0,
    recoveryScore: 80,
    lastSync: null,

    waterIntakeMl: 0,
    caloriesConsumedKcal: 0,
    caloriesTargetKcal: 2500, // standard baseline
    caloriesBurnedKcal: 0,

    scanAndConnect: async () => {
      try {
        console.log('Initiating BLE scan...');
        const device = await watchBridge.scan();
        if (device) {
          console.log('Device discovered, attempting connection:', device.name);
          const connected = await watchBridge.connect(device);
          const deviceName = watchBridge.getDeviceName();
          
          set({
            connected: true,
            deviceName,
            isManualMode: false
          });

          await AsyncStorage.multiSet([
            [STORAGE_KEYS.CONNECTED, 'true'],
            [STORAGE_KEYS.DEVICE_NAME, deviceName || 'Smart Band'],
            [STORAGE_KEYS.MANUAL, 'false']
          ]);

          // Fetch initial SpO2
          const initialSpO2 = await watchBridge.readSpO2();
          set({ spO2: initialSpO2 });
          return true;
        }
        return false;
      } catch (e) {
        console.warn('BLE connect failed, switching to fallback:', e);
        return false;
      }
    },

    setManualMode: async (enabled: boolean) => {
      set({ isManualMode: enabled });
      await AsyncStorage.setItem(STORAGE_KEYS.MANUAL, enabled ? 'true' : 'false');
    },

    disconnect: async () => {
      watchBridge.disconnect();
      set({
        connected: false,
        deviceName: null,
        liveBPM: 0,
        currentZone: 1,
        safetyStatus: 'OK'
      });
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.CONNECTED, 'false'],
        [STORAGE_KEYS.DEVICE_NAME, '']
      ]);
    },

    startWorkoutTracking: (userAge: number) => {
      const state = get();
      if (state.isManualMode) {
        console.log('Starting workout tracking in Manual Entry Mode...');
        return;
      }

      console.log('Starting real-time BLE HR tracking...');
      watchBridge.subscribeHR(async (bpm) => {
        const spO2 = await watchBridge.readSpO2();
        set({ spO2 });
        get().updateLiveBPM(bpm, userAge);
      });
    },

    stopWorkoutTracking: () => {
      console.log('Stopping real-time HR tracking...');
      watchBridge.disconnect();
      // Keep connection status true if we connected, but stop GATT subscription
      set({ liveBPM: 0, currentZone: 1, safetyStatus: 'OK' });
    },

    updateLiveBPM: (bpm: number, age: number) => {
      const maxHR = calcMaxHR(age);
      const currentZone = classifyZone(bpm, maxHR);
      const safetyStatus = checkSafety(get().spO2, bpm);

      set({
        liveBPM: bpm,
        currentZone,
        safetyStatus
      });
    },

    updateManualBPM: (bpm: number, age: number) => {
      const maxHR = calcMaxHR(age);
      const currentZone = classifyZone(bpm, maxHR);
      // For manual mode, simulate SpO2 or keep current SpO2
      const spO2 = get().spO2;
      const safetyStatus = checkSafety(spO2, bpm);

      set({
        liveBPM: bpm,
        currentZone,
        safetyStatus
      });
    },

    syncNightly: async () => {
      console.log('Syncing nightly batch health metrics...');
      let batchResult;

      if (Platform.OS === 'android') {
        batchResult = await fetchHealthConnectBatch(new Date());
      } else if (Platform.OS === 'ios') {
        batchResult = await fetchHealthKitBatch(new Date());
      } else {
        // Web/other mockup batch query
        batchResult = await fetchHealthKitBatch(new Date()); // calls the cross-platform mock fallback
      }

      // Calculate Recovery Score:
      // Weighted average: 40% HRV, 40% Sleep duration, 20% Resting HR
      const hrvScore = Math.min(100, (batchResult.hrv_ms / 80) * 100);
      
      const sleepStages = batchResult.sleepMin;
      const totalSleepMin = sleepStages.deep + sleepStages.rem + sleepStages.light;
      const sleepScore = Math.min(100, (totalSleepMin / 480) * 100); // 8 Hours ideal

      const hrScore = Math.min(100, (60 / batchResult.restingHR) * 100);

      const recoveryScore = Math.round(0.4 * hrvScore + 0.4 * sleepScore + 0.2 * hrScore);

      set({
        todaySteps: batchResult.steps,
        recoveryScore,
        caloriesBurnedKcal: get().caloriesBurnedKcal + batchResult.caloriesBurned,
        spO2: Math.round(batchResult.skinTemp_c) || 98, // loose proxy or keep SpO2
        lastSync: new Date()
      });

      await AsyncStorage.multiSet([
        [STORAGE_KEYS.STEPS, String(batchResult.steps)],
        [STORAGE_KEYS.RECOVERY, String(recoveryScore)],
        [STORAGE_KEYS.CALORIES_BURNED, String(get().caloriesBurnedKcal)]
      ]);
    },

    syncBackground: async () => {
      // Fetch background metrics: simulating current heart rate, steps, and stress indicators
      const stepsInc = Math.floor(Math.random() * 200) + 50;
      const currentBpm = generateMockHeartRate(70);
      
      // Stress proxy is determined based on heart rate elevation
      const stressProxy = currentBpm > 100 ? 'high' : currentBpm > 85 ? 'moderate' : 'low';
      
      set(state => ({
        todaySteps: state.todaySteps + stepsInc,
        lastSync: new Date()
      }));

      await AsyncStorage.setItem(STORAGE_KEYS.STEPS, String(get().todaySteps));

      return {
        bpm: currentBpm,
        steps: get().todaySteps,
        stressProxy
      };
    },

    logWater: async (ml: number) => {
      const newWater = get().waterIntakeMl + ml;
      set({ waterIntakeMl: newWater });
      await AsyncStorage.setItem(STORAGE_KEYS.WATER, String(newWater));
    },

    logCalories: async (kcal: number) => {
      const newCalories = get().caloriesConsumedKcal + kcal;
      set({ caloriesConsumedKcal: newCalories });
      await AsyncStorage.setItem(STORAGE_KEYS.CALORIES_CONSUMED, String(newCalories));
    },

    logBurnedCalories: async (kcal: number) => {
      const newBurned = get().caloriesBurnedKcal + kcal;
      set({ caloriesBurnedKcal: newBurned });
      await AsyncStorage.setItem(STORAGE_KEYS.CALORIES_BURNED, String(newBurned));
    },

    resetDailyCounters: async () => {
      set({
        waterIntakeMl: 0,
        caloriesConsumedKcal: 0,
        caloriesBurnedKcal: 0,
        todaySteps: 0
      });
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.WATER, '0'],
        [STORAGE_KEYS.CALORIES_CONSUMED, '0'],
        [STORAGE_KEYS.CALORIES_BURNED, '0'],
        [STORAGE_KEYS.STEPS, '0']
      ]);
    }
  };
});
