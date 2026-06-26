export interface BleDevice {
  id: string;
  name: string;
  localName?: string;
  rssi?: number;
}

export interface BleAdapter {
  name: string;
  
  /**
   * Defines the primary service UUIDs this adapter scans for.
   */
  getScanServiceUUIDs(): string[];

  /**
   * Connect to the device and perform necessary handshakes.
   */
  connect(deviceId: string): Promise<void>;

  /**
   * Disconnect from the device.
   */
  disconnect(): Promise<void>;

  /**
   * Subscribe to heart rate updates.
   */
  subscribeHeartRate(callback: (bpm: number) => void): Promise<void>;

  /**
   * Unsubscribe from heart rate updates.
   */
  unsubscribeHeartRate(): void;

  /**
   * Read current SpO2 percentage.
   */
  readSpO2(): Promise<number>;

  /**
   * Read current steps.
   */
  readSteps(): Promise<number>;
}
