import { Platform } from 'react-native';
import { NightlyData } from '../types/arise';

/**
 * Generates a mock heart rate value (BPM) based on a sine-wave fluctuation.
 * @param baseBpm Base heart rate to oscillate around (default 72)
 */
export function generateMockHeartRate(baseBpm: number = 72): number {
  const time = Date.now() / 10000; // time-based variance
  const fluctuation = Math.sin(time) * 10 + Math.cos(time / 2) * 5;
  return Math.round(baseBpm + fluctuation);
}

/**
 * Generates mock SpO2 percentage readings (typically 95-100%).
 */
export function generateMockSpO2(): number {
  const rand = Math.random();
  if (rand > 0.95) return 94; // occasional dip for safety testing
  if (rand > 0.8) return 96;
  if (rand > 0.4) return 98;
  return 99;
}

/**
 * Generates mock sleep staging data (minutes spent in deep, REM, light, awake states).
 */
export function generateMockSleep(): NightlyData {
  return {
    deep: 90 + Math.floor(Math.random() * 40),
    rem: 70 + Math.floor(Math.random() * 30),
    light: 220 + Math.floor(Math.random() * 60),
    awake: 15 + Math.floor(Math.random() * 20),
  };
}

/**
 * Subscribes to the phone's accelerometer step tracker using expo-sensors Pedometer.
 * Falls back gracefully to mock increments if unavailable or running on web.
 * @param onStep Callback when step count increments
 * @returns Unsubscribe function
 */
export function startAccelerometerStepTracking(onStep: (steps: number) => void): () => void {
  let active = true;
  let stepsCount = 0;
  let subscription: any = null;

  if (Platform.OS === 'web') {
    // Web mock step tracker increments steps periodically
    const interval = setInterval(() => {
      if (active) {
        stepsCount += Math.floor(Math.random() * 3) + 1;
        onStep(stepsCount);
      }
    }, 2000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }

  // Native Pedometer logic
  const initPedometer = async () => {
    try {
      const { Pedometer } = require('expo-sensors');
      const isAvailable = await Pedometer.isAvailableAsync();
      if (isAvailable && active) {
        subscription = Pedometer.watchStepCount((result: any) => {
          onStep(result.steps);
        });
      } else {
        throw new Error('Pedometer not available');
      }
    } catch (e) {
      // Fallback if expo-sensors Pedometer fails
      const interval = setInterval(() => {
        if (active) {
          stepsCount += Math.floor(Math.random() * 3) + 1;
          onStep(stepsCount);
        }
      }, 2000);

      subscription = {
        remove: () => clearInterval(interval),
      };
    }
  };

  initPedometer();

  return () => {
    active = false;
    if (subscription) {
      subscription.remove();
    }
  };
}
