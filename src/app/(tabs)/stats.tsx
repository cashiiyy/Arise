import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SystemText } from '../../components/SystemText';
import { SystemCard } from '../../components/SystemCard';
import { useUserStore } from '../../store/useUserStore';
import { COLORS } from '../../theme';
import { StatRadarChart } from '../../components/StatRadarChart';
import { RankBadge } from '../../components/RankBadge';
import { RANKS } from '../../services/xpEngine';

export default function Stats() {
  const { stats, rank, xp } = useUserStore();
  const rankIndex = RANKS.indexOf(rank);

  const statData = [
    { label: 'STR', value: stats.STR },
    { label: 'END', value: stats.END },
    { label: 'AGI', value: stats.AGI },
    { label: 'VIT', value: stats.VIT },
    { label: 'INT', value: stats.INT },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SystemText variant="h2" align="center" style={{ marginBottom: 24 }}>
        PLAYER STATUS
      </SystemText>

      <RankBadge rank={rank} rankIndex={rankIndex >= 0 ? rankIndex : 0} xp={xp} />

      <SystemCard glow style={styles.radarContainer}>
        <SystemText variant="h2" align="center" style={{ marginBottom: 16 }}>ATTRIBUTES</SystemText>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <StatRadarChart data={statData} />
        </View>
        <View style={styles.statList}>
          {statData.map(stat => (
            <SystemText key={stat.label} variant="mono" style={{ marginVertical: 2 }}>
              {stat.label}: {stat.value}/100
            </SystemText>
          ))}
        </View>
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
  radarContainer: {
    paddingVertical: 24,
  },
  statList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 16,
    paddingHorizontal: 16,
  }
});

