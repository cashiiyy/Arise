import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SystemText } from '../components/SystemText';
import { SystemButton } from '../components/SystemButton';
import { SystemCard } from '../components/SystemCard';
import { useUserStore } from '../store/useUserStore';
import { COLORS } from '../theme';
import { useMockBLE } from '../ble/MockBLEProvider';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const setInitialData = useUserStore((state) => state.setInitialData);
  const { connect, isConnected } = useMockBLE();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleNext = () => setStep((s) => s + 1);

  const renderStep1 = () => (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.stepContainer}>
      <SystemText variant="h1" color={COLORS.primary} align="center" style={{ marginBottom: 24 }}>
        THE SYSTEM HAS FOUND YOU
      </SystemText>
      <SystemText variant="body" align="center" style={{ marginBottom: 40 }}>
        You have been selected as a Player. Will you accept the quest to level up your reality?
      </SystemText>
      <SystemButton title="ACCEPT QUEST" onPress={handleNext} />
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.stepContainer}>
      <SystemText variant="h2" align="center" style={{ marginBottom: 24 }}>
        CALIBRATING AVATAR
      </SystemText>
      <SystemCard>
        <SystemText variant="body" color={COLORS.primary}>Age: 24</SystemText>
        <SystemText variant="body" color={COLORS.primary}>Height: 175cm</SystemText>
        <SystemText variant="body" color={COLORS.primary}>Weight: 70kg</SystemText>
        <SystemText variant="body" color={COLORS.primary}>Sex: Male</SystemText>
      </SystemCard>
      <SystemText variant="muted" align="center" style={{ marginTop: 16 }}>
        (Mock Data Used for MVP)
      </SystemText>
      <View style={{ flex: 1 }} />
      <SystemButton title="CONFIRM STATS" onPress={handleNext} />
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.stepContainer}>
      <SystemText variant="h2" align="center" style={{ marginBottom: 24 }}>
        SELECT PATH
      </SystemText>
      <SystemButton variant="outline" title="Path of the Colossus (Bulk)" onPress={() => { setInitialData({ goal: 'bulk' }); handleNext(); }} />
      <SystemButton variant="outline" title="Path of the Assassin (Cut)" onPress={() => { setInitialData({ goal: 'cut' }); handleNext(); }} />
      <SystemButton variant="outline" title="Path of the Monarch (Gain)" onPress={() => { setInitialData({ goal: 'gain' }); handleNext(); }} />
    </Animated.View>
  );

  const renderStep4 = () => (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.stepContainer}>
      <SystemText variant="h2" align="center" style={{ marginBottom: 24 }}>
        CONNECT SENSORS
      </SystemText>
      <SystemCard>
        <SystemText align="center" style={{ marginBottom: 16 }}>
          {isConnected ? 'Watch Connected Successfully!' : (isConnecting ? 'Scanning...' : 'Pair your smartwatch to enable real-time tracking.')}
        </SystemText>
        {!isConnected && (
          <SystemButton 
            title={isConnecting ? "CONNECTING..." : "PAIR WATCH"} 
            variant="secondary"
            onPress={async () => {
              setIsConnecting(true);
              await connect();
              setIsConnecting(false);
            }} 
          />
        )}
      </SystemCard>
      <View style={{ flex: 1 }} />
      <SystemButton title={isConnected ? "ENTER SYSTEM" : "SKIP FOR NOW"} onPress={() => router.replace('/(tabs)')} />
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 24,
    justifyContent: 'center',
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
  }
});
