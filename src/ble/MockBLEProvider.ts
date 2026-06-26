// Mock BLE Provider for MVP
import { useEffect, useState } from 'react';

export function useMockBLE() {
  const [isConnected, setIsConnected] = useState(false);
  const [heartRate, setHeartRate] = useState(65);
  const [steps, setSteps] = useState(4500);
  const [hrv, setHrv] = useState(60);

  const connect = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsConnected(true);
        resolve(true);
      }, 2000);
    });
  };

  const disconnect = () => {
    setIsConnected(false);
  };

  // Simulate live HR changes during workout
  useEffect(() => {
    if (!isConnected) return;
    
    const interval = setInterval(() => {
      // Randomly fluctuate HR between 120 and 160 during an "active" state
      setHeartRate((prev) => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.min(180, Math.max(60, prev + change));
      });
      
      // Simulate taking steps
      setSteps((prev) => prev + Math.floor(Math.random() * 3));
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  return { isConnected, connect, disconnect, heartRate, steps, hrv };
}
