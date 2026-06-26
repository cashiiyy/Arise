import { BleAdapter, BleDevice } from './adapters/BleAdapter';
import { GenericAdapter } from './adapters/GenericAdapter';
import { MiBandAdapter } from './adapters/MiBandAdapter';

export class BleService {
  private static instance: BleService;
  private adapters: BleAdapter[] = [];
  private activeAdapter: BleAdapter | null = null;
  private connectedDevice: BleDevice | null = null;

  private constructor() {
    this.registerAdapters();
  }

  static getInstance(): BleService {
    if (!BleService.instance) {
      BleService.instance = new BleService();
    }
    return BleService.instance;
  }

  private registerAdapters() {
    // Add specific adapters first, fallback to generic
    this.adapters.push(new MiBandAdapter());
    this.adapters.push(new GenericAdapter());
  }

  async scanAndConnect(): Promise<BleDevice | null> {
    // Determine the right adapter based on advertised services or device name.
    // For now, stub the connection process.
    console.log('[BleService] Scanning...');
    const device: BleDevice = { id: 'MOCK_001', name: 'Mock Band' };
    
    // Attempting to match adapter
    let matchedAdapter = this.adapters.find(a => a.name === 'Mi Band / Amazfit') || this.adapters[this.adapters.length - 1];
    
    await matchedAdapter.connect(device.id);
    this.activeAdapter = matchedAdapter;
    this.connectedDevice = device;

    return device;
  }

  async disconnect() {
    if (this.activeAdapter) {
      await this.activeAdapter.disconnect();
    }
    this.activeAdapter = null;
    this.connectedDevice = null;
  }

  subscribeHeartRate(callback: (bpm: number) => void) {
    if (this.activeAdapter) {
      this.activeAdapter.subscribeHeartRate(callback);
    }
  }

  unsubscribeHeartRate() {
    if (this.activeAdapter) {
      this.activeAdapter.unsubscribeHeartRate();
    }
  }

  async getSpO2(): Promise<number> {
    return this.activeAdapter ? this.activeAdapter.readSpO2() : 98;
  }

  async getSteps(): Promise<number> {
    return this.activeAdapter ? this.activeAdapter.readSteps() : 0;
  }
}
