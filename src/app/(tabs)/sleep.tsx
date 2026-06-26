import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SystemText } from '../../components/SystemText';
import { SystemCard } from '../../components/SystemCard';
import { ProgressRing } from '../../components/ProgressRing';
import { COLORS } from '../../theme';

export default function Sleep() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SystemText variant="h2" align="center" style={{ marginBottom: 24 }}>
        RECOVERY PROTOCOL
      </SystemText>

      <SystemCard style={{ alignItems: 'center', paddingVertical: 32 }}>
        <ProgressRing progress={0.85} radius={60} color={COLORS.secondary}>
          <SystemText variant="h1">85</SystemText>
          <SystemText variant="muted">Score</SystemText>
        </ProgressRing>
        <SystemText variant="h2" style={{ marginTop: 16 }}>Good Recovery</SystemText>
      </SystemCard>

      <SystemText variant="h2" style={{ marginVertical: 16 }}>SLEEP STAGES</SystemText>

      <SystemCard glow={false}>
        <View style={styles.stageRow}>
          <SystemText variant="body" color="#FF3D00">Awake</SystemText>
          <SystemText variant="muted">45m</SystemText>
        </View>
        <View style={styles.stageRow}>
          <SystemText variant="body" color={COLORS.primary}>REM</SystemText>
          <SystemText variant="muted">2h 15m</SystemText>
        </View>
        <View style={styles.stageRow}>
          <SystemText variant="body" color={COLORS.secondary}>Light</SystemText>
          <SystemText variant="muted">4h 0m</SystemText>
        </View>
        <View style={styles.stageRow}>
          <SystemText variant="body" color={COLORS.gold}>Deep</SystemText>
          <SystemText variant="muted">1h 30m</SystemText>
        </View>
      </SystemCard>

      <SystemCard style={{ borderColor: COLORS.secondary }}>
        <SystemText variant="body" color={COLORS.secondary} align="center">
          "Hunter. Your recovery metrics indicate adequate sleep efficiency. Growth hormone secretion optimal."
        </SystemText>
      </SystemCard>

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
    paddingBottom: 40,
  },
  stageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  }
});
