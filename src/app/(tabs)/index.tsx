import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SystemText } from '../../components/SystemText';
import { SystemCard } from '../../components/SystemCard';
import { SystemButton } from '../../components/SystemButton';
import { ProgressRing } from '../../components/ProgressRing';
import { useUserStore } from '../../store/useUserStore';
import { useMockBLE } from '../../ble/MockBLEProvider';
import { COLORS } from '../../theme';
import { useRouter } from 'expo-router';

export default function Home() {
  const { name, rank, xp, levelProgress } = useUserStore();
  const { isConnected, heartRate, steps } = useMockBLE();
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Profile Section */}
      <View style={styles.header}>
        <View style={styles.rankBadge}>
          <SystemText variant="h1" color={COLORS.background} style={{ fontWeight: 'bold' }}>{rank}</SystemText>
        </View>
        <View style={styles.headerText}>
          <SystemText variant="h2">{name}</SystemText>
          <SystemText variant="muted">Hunter Rank: {rank} • XP: {xp}</SystemText>
        </View>
      </View>

      {/* Daily Quests */}
      <SystemText variant="h2" style={{ marginVertical: 16 }}>DAILY QUESTS</SystemText>
      
      <SystemCard>
        <SystemText variant="body" color={COLORS.primary}>[Incomplete] Push-ups</SystemText>
        <SystemText variant="muted">100 Reps • Reward: 50 XP</SystemText>
      </SystemCard>
      
      <SystemCard>
        <SystemText variant="body" color={COLORS.primary}>[Incomplete] Running</SystemText>
        <SystemText variant="muted">10 km • Reward: 100 XP</SystemText>
      </SystemCard>

      <SystemCard>
        <SystemText variant="body" color={COLORS.primary}>[Complete] Sleep Recovery</SystemText>
        <SystemText variant="muted" style={{ textDecorationLine: 'line-through' }}>8 Hours • Reward: 20 XP</SystemText>
      </SystemCard>

      {/* Watch Widget */}
      <SystemText variant="h2" style={{ marginVertical: 16 }}>SYSTEM SENSORS</SystemText>
      <SystemCard glow={false} style={styles.sensorsContainer}>
        <View style={styles.sensorItem}>
          <ProgressRing progress={steps / 10000} radius={40} color={COLORS.secondary}>
            <SystemText variant="h2">{steps}</SystemText>
            <SystemText variant="muted">Steps</SystemText>
          </ProgressRing>
        </View>
        <View style={styles.sensorItem}>
          <ProgressRing progress={heartRate / 200} radius={40} color={COLORS.danger}>
            <SystemText variant="h2">{heartRate}</SystemText>
            <SystemText variant="muted">BPM</SystemText>
          </ProgressRing>
        </View>
      </SystemCard>
      
      {!isConnected && (
        <SystemText variant="muted" align="center" style={{ marginTop: 8 }}>
          Watch not connected. Showing mock data.
        </SystemText>
      )}

      {/* CTA */}
      <View style={{ marginTop: 32 }}>
        <SystemButton title="BEGIN TODAY'S QUEST" onPress={() => router.push('/workout')} />
      </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  rankBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  headerText: {
    flex: 1,
  },
  sensorsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
  },
  sensorItem: {
    alignItems: 'center',
  }
});
