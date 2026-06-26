import { Platform } from 'react-native';
import { Buffer } from 'buffer';
import { generateMockHeartRate, generateMockSpO2 } from './mockWatchData';

// Constants for BLE GATT Services & Characteristics
const HR_SERVICE_UUID = '180d';
const HR_MEASUREMENT_CHAR_UUID = '2a37';
const SPO2_SERVICE_UUID = '1822';
const SPO2_MEASUREMENT_CHAR_UUID = '2a5f';

export class WatchBridge {
  private static instance: WatchBridge | null = null;
  private manager: any = null;
  private connectedDevice: any = null;
  private hrSubscription: any = null;
  private isDeviceConnected: boolean = false;
  private mockInterval: any = null;

  private constructor() {
    if (Platform.OS !== 'web') {
      try {
        const { BleManager } = require('react-native-ble-plx');
        this.manager = new BleManager();
      } catch (e) {
        console.warn('BLE Manager could not be initialized (likely simulator):', e);
      }
    }
  }

  /**
   * Singleton pattern to obtain a single WatchBridge instance.
   */
  public static getInstance(): WatchBridge {
    if (!WatchBridge.instance) {
      WatchBridge.instance = new WatchBridge();
    }
    return WatchBridge.instance;
  }

  /**
   * Scans for BLE heart rate devices (Service 0x180D).
   * Automatically resolves with mock device if no native BLE manager exists.
   */
  public async scan(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.manager) {
        console.log('No BLE Manager available. Scanning in Mock Mode...');
        setTimeout(() => {
          resolve({
            id: 'MOCK_HR_WATCH_001',
            name: 'Arise Hunter Band (Mock)',
            localName: 'Arise Hunter Band (Mock)'
          });
        }, 1500);
        return;
      }

      const foundDevices: any[] = [];
      let timeoutId = setTimeout(() => {
        this.manager.stopDeviceScan();
        if (foundDevices.length > 0) {
          resolve(foundDevices[0]);
        } else {
          // Resolve with mock fallback if no real watch is connected
          resolve({
            id: 'MOCK_HR_WATCH_FALLBACK',
            name: 'Fallback Simulator Watch',
            localName: 'Fallback Simulator Watch'
          });
        }
      }, 10000); // 10s scan window

      this.manager.startDeviceScan(
        [HR_SERVICE_UUID],
        null,
        (error: any, device: any) => {
          if (error) {
            console.warn('BLE Scan error:', error);
            clearTimeout(timeoutId);
            this.manager.stopDeviceScan();
            resolve({
              id: 'MOCK_HR_WATCH_FALLBACK',
              name: 'Fallback Simulator Watch',
              localName: 'Fallback Simulator Watch'
            });
            return;
          }

          if (device && !foundDevices.some(d => d.id === device.id)) {
            foundDevices.push(device);
            // Connect to first matching device immediately to complete promise
            clearTimeout(timeoutId);
            this.manager.stopDeviceScan();
            resolve(device);
          }
        }
      );
    });
  }

  /**
   * Connects to a selected BLE device and discovers services.
   */
  public async connect(device: any): Promise<any> {
    if (device.id.startsWith('MOCK_')) {
      console.log('Connecting to Mock device:', device.name);
      this.isDeviceConnected = true;
      this.connectedDevice = device;
      return device;
    }

    if (!this.manager) {
      throw new Error('BLE Manager is not initialized.');
    }

    try {
      const connected = await this.manager.connectToDevice(device.id);
      const discovered = await connected.discoverAllServicesAndCharacteristics();
      this.connectedDevice = discovered;
      this.isDeviceConnected = true;
      return discovered;
    } catch (e) {
      console.error('Failed to connect to BLE device:', e);
      this.isDeviceConnected = false;
      this.connectedDevice = null;
      throw e;
    }
  }

  /**
   * Subscribes to the Heart Rate Measurement characteristic.
   * Parses the binary BLE flag and passes decoded BPM to the callback.
   * @param cb Callback triggered at ~1 Hz with the current heart rate
   */
  public subscribeHR(cb: (bpm: number) => void): void {
    if (!this.isDeviceConnected) {
      console.warn('Cannot subscribe to HR: watch is not connected.');
      return;
    }

    // Clean up previous subscription first
    this.unsubscribeHR();

    if (this.connectedDevice?.id.startsWith('MOCK_')) {
      console.log('Subscribing to HR in Mock Mode...');
      this.mockInterval = setInterval(() => {
        cb(generateMockHeartRate());
      }, 1000);
      return;
    }

    if (!this.connectedDevice) return;

    try {
      this.hrSubscription = this.connectedDevice.monitorCharacteristicForService(
        HR_SERVICE_UUID,
        HR_MEASUREMENT_CHAR_UUID,
        (error: any, characteristic: any) => {
          if (error) {
            console.error('HR Monitor characteristic error:', error);
            // Graceful disconnect on errors
            this.disconnect();
            return;
          }

          if (characteristic?.value) {
            const rawBuffer = Buffer.from(characteristic.value, 'base64');
            const bpm = this.parseHeartRateMeasurement(rawBuffer);
            cb(bpm);
          }
        }
      );
    } catch (e) {
      console.error('Failed to monitor HR characteristic:', e);
    }
  }

  /**
   * Parses the raw BLE Heart Rate Measurement value buffer.
   * Specification: GATT Heart Rate Measurement (0x2A37)
   */
  private parseHeartRateMeasurement(buffer: Buffer): number {
    if (buffer.length < 2) return 0;
    
    const flags = buffer.readUInt8(0);
    const is16Bit = (flags & 0x01) === 0x01; // Bit 0 determines resolution
    
    if (is16Bit) {
      return buffer.readUInt16LE(1);
    } else {
      return buffer.readUInt8(1);
    }
  }

  /**
   * Reads SpO2 percentage from Pulse Ox Service (0x1822 / 0x2A5F).
   */
  public async readSpO2(): Promise<number> {
    if (!this.isDeviceConnected) return 98; // safe baseline fallback

    if (this.connectedDevice?.id.startsWith('MOCK_')) {
      return generateMockSpO2();
    }

    try {
      const char = await this.connectedDevice.readCharacteristicForService(
        SPO2_SERVICE_UUID,
        SPO2_MEASUREMENT_CHAR_UUID
      );
      if (char?.value) {
        const rawBuffer = Buffer.from(char.value, 'base64');
        if (rawBuffer.length >= 2) {
          return rawBuffer.readUInt8(1); // Typically Byte 1 holds the SpO2 %
        }
      }
      return 98;
    } catch (e) {
      console.warn('Could not read SpO2 from BLE device, using fallback:', e);
      return generateMockSpO2();
    }
  }

  /**
   * Cancels HR subscription and closes mock intervals.
   */
  private unsubscribeHR(): void {
    if (this.hrSubscription) {
      this.hrSubscription.remove();
      this.hrSubscription = null;
    }
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
  }

  /**
   * Disconnects the active BLE device.
   */
  public disconnect(): void {
    this.unsubscribeHR();
    
    if (this.connectedDevice && !this.connectedDevice.id.startsWith('MOCK_')) {
      try {
        this.connectedDevice.cancelConnection();
      } catch (e) {
        console.warn('Error disconnecting BLE device:', e);
      }
    }

    console.log('Watch disconnected.');
    this.connectedDevice = null;
    this.isDeviceConnected = false;
  }

  /**
   * Returns connection status.
   */
  public isConnected(): boolean {
    return this.isDeviceConnected;
  }

  /**
   * Helper to return connected device name.
   */
  public getDeviceName(): string | null {
    return this.connectedDevice ? (this.connectedDevice.name || this.connectedDevice.localName || 'Smart Band') : null;
  }
}
