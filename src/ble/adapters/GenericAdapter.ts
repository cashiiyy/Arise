import { BleAdapter } from './BleAdapter';

export class GenericAdapter implements BleAdapter {
  name = 'Generic BLE Watch';

  private hrCallback: ((bpm: number) => void) | null = null;
  private interval: any = null;

  getScanServiceUUIDs(): string[] {
    return ['180d']; // Standard HR service
  }

  async connect(deviceId: string): Promise<void> {
    console.log(`[GenericAdapter] Connected to ${deviceId}`);
  }

  async disconnect(): Promise<void> {
    this.unsubscribeHeartRate();
    console.log('[GenericAdapter] Disconnected');
  }

  async subscribeHeartRate(callback: (bpm: number) => void): Promise<void> {
    this.hrCallback = callback;
    // Stub: Simulate HR data
    this.interval = setInterval(() => {
      if (this.hrCallback) this.hrCallback(75 + Math.floor(Math.random() * 10));
    }, 1000);
  }

  unsubscribeHeartRate(): void {
    if (this.interval) clearInterval(this.interval);
    this.hrCallback = null;
  }

  async readSpO2(): Promise<number> {
    return 98; // Stub
  }

  async readSteps(): Promise<number> {
    return 0; // Stub
  }
}
