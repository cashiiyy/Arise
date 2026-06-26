import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SystemText } from '../../components/SystemText';
import { SystemCard } from '../../components/SystemCard';
import { useUserStore } from '../../store/useUserStore';
import { COLORS } from '../../theme';
import { VictoryChart, VictoryPolarAxis, VictoryArea, VictoryTheme } from 'victory-native';

export default function Stats() {
  const { stats, rank, levelProgress } = useUserStore();

  const statData = [
    { x: 'STR', y: stats.STR },
    { x: 'END', y: stats.END },
    { x: 'AGI', y: stats.AGI },
    { x: 'VIT', y: stats.VIT },
    { x: 'INT', y: stats.INT },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SystemText variant="h2" align="center" style={{ marginBottom: 24 }}>
        PLAYER STATUS
      </SystemText>

      <View style={styles.rankContainer}>
        <View style={styles.bigBadge}>
          <SystemText variant="h1" color={COLORS.background} style={{ fontSize: 48, fontWeight: 'bold' }}>
            {rank}
          </SystemText>
        </View>
        <SystemText variant="body" style={{ marginTop: 16 }}>
          Level Progress: {levelProgress.toFixed(1)}%
        </SystemText>
      </View>

      <SystemCard glow style={styles.radarContainer}>
        <SystemText variant="h2" align="center">ATTRIBUTES</SystemText>
        <View pointerEvents="none" style={{ alignItems: 'center', marginTop: -20, marginBottom: -20 }}>
          <VictoryChart polar theme={VictoryTheme.material} height={300} width={300}>
            {statData.map((d, i) => (
              <VictoryPolarAxis
                key={i}
                dependentAxis
                style={{
                  axisLabel: { padding: 10, fill: COLORS.primary, fontSize: 14 },
                  axis: { stroke: COLORS.cardBorder },
                  grid: { stroke: 'rgba(255,255,255,0.1)' },
                  tickLabels: { fill: 'transparent' }
                }}
                labelPlacement="perpendicular"
                axisValue={d.x}
              />
            ))}
            <VictoryPolarAxis
              labelPlacement="parallel"
              tickFormat={() => ""}
              style={{
                axis: { stroke: "none" },
                grid: { stroke: "rgba(255,255,255,0.2)" }
              }}
            />
            <VictoryArea
              data={statData}
              style={{
                data: { fill: "rgba(0, 191, 255, 0.4)", stroke: COLORS.primary, strokeWidth: 2 }
              }}
            />
          </VictoryChart>
        </View>
        <View style={styles.statList}>
          {statData.map(stat => (
            <SystemText key={stat.x} variant="mono" style={{ marginVertical: 2 }}>
              {stat.x}: {stat.y}/100
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
  rankContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  bigBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
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
