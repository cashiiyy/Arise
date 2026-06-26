import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { SystemText } from './SystemText';
import { SystemCard } from './SystemCard';
import { SystemButton } from './SystemButton';
import { ProgressRing } from './ProgressRing';
import { COLORS } from '../theme';
import { useWatchStore } from '../stores/watchStore';

export const LiveWatchWidget: React.FC = () => {
  const {
    connected,
    deviceName,
    isManualMode,
    liveBPM,
    currentZone,
    spO2,
    safetyStatus,
    todaySteps,
    recoveryScore,
    waterIntakeMl,
    caloriesConsumedKcal,
    caloriesTargetKcal,
    caloriesBurnedKcal,
    scanAndConnect,
    setManualMode,
    disconnect,
    startWorkoutTracking,
    stopWorkoutTracking,
    updateManualBPM,
    logWater,
    logCalories,
    syncNightly,
  } = useWatchStore();

  const [manualHRInput, setManualHRInput] = useState('');
  const [manualCalInput, setManualCalInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Pulse animation scale and opacity for the Heart Rate Ring
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.8);

  useEffect(() => {
    if (liveBPM > 0) {
      const cycleDuration = 60000 / liveBPM;
      pulseScale.value = 1;
      pulseOpacity.value = 0.8;
      
      pulseScale.value = withRepeat(
        withTiming(1.3, { duration: cycleDuration / 2, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withTiming(0.2, { duration: cycleDuration / 2, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulseScale.value = 1;
      pulseOpacity.value = 0.4;
    }
  }, [liveBPM]);

  // Color mapping based on target heart rate zone
  const getZoneColor = (zone: number) => {
    switch (zone) {
      case 1: return '#9CA3AF'; // Gray (Warm-up)
      case 2: return '#10B981'; // Green (Fat Burn)
      case 3: return '#FBBF24'; // Yellow (Aerobic)
      case 4: return '#F97316'; // Orange (Anaerobic)
      case 5: return '#EF4444'; // Red (Maximum)
      default: return '#9CA3AF';
    }
  };

  // Color mapping for Recovery Score
  const getRecoveryColor = (score: number) => {
    if (score < 40) return '#EF4444'; // Red
    if (score < 70) return '#FBBF24'; // Yellow/Gold
    return '#10B981'; // Green
  };

  const handleConnect = async () => {
    setIsScanning(true);
    const success = await scanAndConnect();
    setIsScanning(false);
    if (success) {
      startWorkoutTracking(24); // mock age 24
    } else {
      // Automatic fallback to manual entry mode if BLE fails/times out
      setManualMode(true);
    }
  };

  const handleManualHRSubmit = () => {
    const bpm = parseInt(manualHRInput, 10);
    if (!isNaN(bpm) && bpm > 30 && bpm < 240) {
      updateManualBPM(bpm, 24);
      setManualHRInput('');
    }
  };

  const handleManualCalSubmit = () => {
    const kcal = parseInt(manualCalInput, 10);
    if (!isNaN(kcal) && kcal > 0) {
      logCalories(kcal);
      setManualCalInput('');
    }
  };

  const animatedPulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
      opacity: pulseOpacity.value,
    };
  });

  return (
    <View style={styles.container}>
      {/* 1. Safety Alert Banner */}
      {safetyStatus !== 'OK' && (
        <View style={[styles.safetyBanner, { backgroundColor: safetyStatus === 'STOP' ? '#EF4444' : '#F97316' }]}>
          <SystemText variant="h2" color="#FFFFFF" align="center" style={{ fontWeight: 'bold', fontSize: 14 }}>
            {safetyStatus === 'STOP' 
              ? '🚨 EMERGENCY: CRITICAL SpO2 LEVEL (<90%). STOP WORKOUT IMMEDIATELY!'
              : safetyStatus === 'REDUCE'
              ? '⚠️ WARNING: LOW SpO2 LEVEL (<94%). REDUCE WORKOUT INTENSITY!'
              : '⚠️ ALERT: HEART RATE EXCEEDS SAFE ZONE! WORKOUT WITH CAUTION.'
            }
          </SystemText>
        </View>
      )}

      {/* 2. Core Dashboard Card */}
      <SystemCard glow>
        <View style={styles.cardHeader}>
          <View>
            <SystemText variant="h2" color={COLORS.primary}>WATCH telemetry</SystemText>
            <SystemText variant="muted">
              {connected ? `Connected: ${deviceName}` : isManualMode ? 'System Fallback: Manual Mode' : 'Watch disconnected'}
            </SystemText>
          </View>
          {connected && (
            <TouchableOpacity onPress={disconnect} style={styles.disconnectBtn}>
              <SystemText variant="mono" style={{ fontSize: 11, color: COLORS.danger }}>DISCONNECT</SystemText>
            </TouchableOpacity>
          )}
        </View>

        {/* Real-time Telemetry Row */}
        <View style={styles.telemetryRow}>
          {/* Heart Rate Pulse Animation */}
          <View style={styles.hrContainer}>
            <Animated.View style={[styles.pulseRing, animatedPulseStyle, { borderColor: getZoneColor(currentZone) }]} />
            <View style={[styles.hrInner, { borderColor: getZoneColor(currentZone) }]}>
              <SystemText variant="h1" style={{ fontSize: 36, color: getZoneColor(currentZone), fontWeight: 'bold' }}>
                {liveBPM > 0 ? liveBPM : '--'}
              </SystemText>
              <SystemText variant="mono" style={{ fontSize: 10, color: COLORS.textMuted }}>BPM</SystemText>
            </View>
            {liveBPM > 0 && (
              <View style={[styles.zoneBadge, { backgroundColor: getZoneColor(currentZone) }]}>
                <SystemText variant="mono" style={{ fontSize: 9, fontWeight: 'bold', color: COLORS.background }}>
                  ZONE {currentZone}
                </SystemText>
              </View>
            )}
          </View>

          {/* Steps Progress Circle */}
          <View style={styles.stepsContainer}>
            <ProgressRing progress={Math.min(1, todaySteps / 10000)} radius={48} strokeWidth={8} color={COLORS.secondary}>
              <View style={{ alignItems: 'center' }}>
                <SystemText variant="h2" color={COLORS.secondary}>{todaySteps}</SystemText>
                <SystemText variant="muted" style={{ fontSize: 9 }}>/10k Steps</SystemText>
              </View>
            </ProgressRing>
          </View>
        </View>

        {/* Biometrics Summary Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricBadge}>
            <SystemText variant="muted" style={{ fontSize: 10 }}>Pulse Ox (SpO2)</SystemText>
            <SystemText variant="h2" color={spO2 < 94 ? COLORS.danger : COLORS.primary} style={{ fontSize: 18 }}>{spO2}%</SystemText>
          </View>
          <View style={[styles.metricBadge, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]}>
            <SystemText variant="muted" style={{ fontSize: 10 }}>Recovery Score</SystemText>
            <SystemText variant="h2" color={getRecoveryColor(recoveryScore)} style={{ fontSize: 18 }}>{recoveryScore}/100</SystemText>
          </View>
          <TouchableOpacity onPress={syncNightly} style={styles.syncBtn}>
            <SystemText variant="mono" style={{ fontSize: 11, color: COLORS.secondary }}>HEALTH SYNC</SystemText>
          </TouchableOpacity>
        </View>

        {/* Reconnect / Manual Switch buttons */}
        {!connected && (
          <View style={styles.setupContainer}>
            <SystemButton 
              title={isScanning ? 'SCANNING SYSTEM...' : "SYNC SMARTWATCH"} 
              onPress={handleConnect} 
              disabled={isScanning}
            />
            <TouchableOpacity 
              onPress={() => setManualMode(!isManualMode)} 
              style={{ marginTop: 12, alignSelf: 'center' }}
            >
              <SystemText variant="mono" style={{ fontSize: 12, textDecorationLine: 'underline', color: COLORS.secondary }}>
                {isManualMode ? 'Switch to BLE Watch Scan' : 'Switch to Manual Entry Mode'}
              </SystemText>
            </TouchableOpacity>
          </View>
        )}

        {/* Manual Telemetry Entry Interface */}
        {isManualMode && (
          <View style={styles.manualHRSection}>
            <SystemText variant="muted" style={{ marginBottom: 8, fontSize: 12 }}>MANUAL TELEMETRY RECORDING</SystemText>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Log Heart Rate (BPM)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="numeric"
                value={manualHRInput}
                onChangeText={setManualHRInput}
              />
              <TouchableOpacity onPress={handleManualHRSubmit} style={styles.logSubBtn}>
                <SystemText variant="mono" style={{ fontSize: 12, color: COLORS.background, fontWeight: 'bold' }}>LOG BPM</SystemText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SystemCard>

      {/* 3. Water Intake & Calorie Loggers */}
      <SystemCard glow={false}>
        <SystemText variant="h2" color={COLORS.secondary} style={{ marginBottom: 12 }}>daily resource logger</SystemText>
        
        {/* Water Logger */}
        <View style={styles.loggerSection}>
          <View style={styles.loggerHeader}>
            <SystemText variant="body" color={COLORS.primary}>💧 WATER INTAKE</SystemText>
            <SystemText variant="h2" style={{ fontSize: 18 }}>{waterIntakeMl} ml</SystemText>
          </View>
          <View style={styles.btnRow}>
            <TouchableOpacity onPress={() => logWater(250)} style={styles.logQtyBtn}>
              <SystemText variant="mono" style={{ fontSize: 12, color: COLORS.primary }}>+250 ml</SystemText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => logWater(500)} style={styles.logQtyBtn}>
              <SystemText variant="mono" style={{ fontSize: 12, color: COLORS.primary }}>+500 ml</SystemText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Calorie Logger */}
        <View style={styles.loggerSection}>
          <View style={styles.loggerHeader}>
            <View>
              <SystemText variant="body" color={COLORS.primary}>🔥 CALORIE TRACKER</SystemText>
              <SystemText variant="muted" style={{ fontSize: 11 }}>
                Goal: {caloriesTargetKcal} kcal • Burned: {caloriesBurnedKcal} kcal
              </SystemText>
            </View>
            <SystemText variant="h2" style={{ fontSize: 16 }}>{caloriesConsumedKcal} / {caloriesTargetKcal} kcal</SystemText>
          </View>
          
          <View style={styles.calorieInputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Add Calories (kcal)"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="numeric"
              value={manualCalInput}
              onChangeText={setManualCalInput}
            />
            <TouchableOpacity onPress={handleManualCalSubmit} style={styles.logSubBtn}>
              <SystemText variant="mono" style={{ fontSize: 12, color: COLORS.background, fontWeight: 'bold' }}>ADD KCAL</SystemText>
            </TouchableOpacity>
          </View>
          
          <View style={styles.btnRow}>
            <TouchableOpacity onPress={() => logCalories(200)} style={styles.logQtyBtn}>
              <SystemText variant="mono" style={{ fontSize: 11 }}>+200 kcal Snack</SystemText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => logCalories(500)} style={styles.logQtyBtn}>
              <SystemText variant="mono" style={{ fontSize: 11 }}>+500 kcal Meal</SystemText>
            </TouchableOpacity>
          </View>
        </View>
      </SystemCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    gap: 16,
  },
  safetyBanner: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  disconnectBtn: {
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 12,
  },
  hrContainer: {
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
  },
  hrInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#080A0F',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoneBadge: {
    position: 'absolute',
    bottom: -6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  stepsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    marginTop: 16,
  },
  metricBadge: {
    flex: 1,
    alignItems: 'center',
  },
  syncBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupContainer: {
    marginTop: 16,
  },
  manualHRSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontSize: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  logSubBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loggerSection: {
    marginVertical: 4,
  },
  loggerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  logQtyBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  calorieInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 12,
  }
});
