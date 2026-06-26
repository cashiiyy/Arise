import { BleAdapter } from './BleAdapter';

export class MiBandAdapter implements BleAdapter {
  name = 'Mi Band / Amazfit';
  
  private hrCallback: ((bpm: number) => void) | null = null;
  private interval: any = null;

  getScanServiceUUIDs(): string[] {
    return ['fee0', 'fee1', '180d']; // Proprietary Huami services + Standard HR
  }

  async connect(deviceId: string): Promise<void> {
    // Requires Auth Handshake for Mi Bands
    console.log(`[MiBandAdapter] Connecting and authenticating with ${deviceId}`);
  }

  async disconnect(): Promise<void> {
    this.unsubscribeHeartRate();
    console.log('[MiBandAdapter] Disconnected');
  }

  async subscribeHeartRate(callback: (bpm: number) => void): Promise<void> {
    this.hrCallback = callback;
    // Stub
    this.interval = setInterval(() => {
      if (this.hrCallback) this.hrCallback(80 + Math.floor(Math.random() * 5));
    }, 1000);
  }

  unsubscribeHeartRate(): void {
    if (this.interval) clearInterval(this.interval);
    this.hrCallback = null;
  }

  async readSpO2(): Promise<number> {
    return 99; // Stub
  }

  async readSteps(): Promise<number> {
    return 1500; // Stub read from Mi Band specific characteristic
  }
}
