import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SystemText } from '../../components/SystemText';
import { SystemCard } from '../../components/SystemCard';
import { SystemButton } from '../../components/SystemButton';
import { useUserStore } from '../../store/useUserStore';
import { COLORS } from '../../theme';
import { useRouter } from 'expo-router';

export default function Workout() {
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(20);
  const addXP = useUserStore((state) => state.addXP);
  const router = useRouter();

  const handleComplete = () => {
    addXP(100);
    // In a real app we'd flash a big full-screen "QUEST COMPLETE"
    alert('QUEST COMPLETE! +100 XP');
    router.replace('/(tabs)');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SystemText variant="h1" align="center" style={{ marginBottom: 24, color: COLORS.secondary }}>
        CURRENT QUEST
      </SystemText>

      <SystemCard style={{ alignItems: 'center', padding: 32 }}>
        {/* Placeholder for Lottie Animation */}
        <View style={styles.animationPlaceholder}>
          <SystemText variant="muted">Animation Placeholder</SystemText>
        </View>
        <SystemText variant="h2" style={{ marginTop: 16 }}>Dumbbell Curl</SystemText>
      </SystemCard>

      <View style={styles.loggerContainer}>
        <View style={styles.loggerCol}>
          <SystemText variant="muted" align="center">WEIGHT (kg)</SystemText>
          <View style={styles.controls}>
            <SystemButton title="-" variant="outline" onPress={() => setWeight(w => Math.max(0, w - 2.5))} style={styles.smallBtn} />
            <SystemText variant="h2" style={{ width: 60, textAlign: 'center' }}>{weight}</SystemText>
            <SystemButton title="+" variant="outline" onPress={() => setWeight(w => w + 2.5)} style={styles.smallBtn} />
          </View>
        </View>

        <View style={styles.loggerCol}>
          <SystemText variant="muted" align="center">REPS</SystemText>
          <View style={styles.controls}>
            <SystemButton title="-" variant="outline" onPress={() => setReps(r => Math.max(0, r - 1))} style={styles.smallBtn} />
            <SystemText variant="h2" style={{ width: 60, textAlign: 'center' }}>{reps}</SystemText>
            <SystemButton title="+" variant="outline" onPress={() => setReps(r => r + 1)} style={styles.smallBtn} />
          </View>
        </View>
      </View>

      <SystemButton title="LOG SET" onPress={() => {}} style={{ marginBottom: 32 }} />

      <SystemCard glow={false} style={{ borderColor: COLORS.success }}>
        <SystemText variant="body" color={COLORS.success} align="center">
          "Strength stat increased. Progressive overload protocol: +2.5kg on next session."
        </SystemText>
      </SystemCard>

      <View style={{ flex: 1 }} />
      <SystemButton title="FINISH WORKOUT" variant="secondary" onPress={handleComplete} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 24,
    paddingTop: 60,
    flexGrow: 1,
  },
  animationPlaceholder: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  loggerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 24,
  },
  loggerCol: {
    flex: 1,
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 0,
  }
});
