/**
 * Stats Screen — Advanced analytics dashboard with workout history and progress.
 * Extends existing player status with real workout stats from the database.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SystemText } from '../../components/SystemText';
import { SystemCard } from '../../components/SystemCard';
import { useUserStore } from '../../store/useUserStore';
import { COLORS } from '../../theme';
import { StatRadarChart } from '../../components/StatRadarChart';
import { RankBadge } from '../../components/RankBadge';
import { RANKS } from '../../services/xpEngine';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getWorkoutStats } from '../../database/workoutHistoryDB';
import { useNutritionStore } from '../../stores/nutritionStore';

interface WorkoutStats {
  totalSessions: number;
  completedSessions: number;
  missedSessions: number;
  consistency: number;
  totalXp: number;
  totalCalories: number;
  totalDurationMin: number;
  avgDurationMin: number;
}

const TABS = ['STATS', '30 DAYS', 'NUTRITION'] as const;
type Tab = typeof TABS[number];

function StatBar({
  label, value, max, color
}: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(1, value / (max || 1));
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <SystemText variant="muted" style={{ fontSize: 11 }}>{label}</SystemText>
        <SystemText variant="mono" style={{ fontSize: 11, color }}>{value}/{max}</SystemText>
      </View>
      <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <View style={{ width: `${pct * 100}%` as any, height: '100%', backgroundColor: color, borderRadius: 2 }} />
      </View>
    </View>
  );
}

export default function Stats() {
  const { stats, rank, xp, biometrics } = useUserStore();
  const { dailyTotals, targets } = useNutritionStore();
  const rankIndex = RANKS.indexOf(rank);
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<Tab>('STATS');
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null);

  const statData = [
    { label: 'STR', value: stats.STR },
    { label: 'END', value: stats.END },
    { label: 'AGI', value: stats.AGI },
    { label: 'VIT', value: stats.VIT },
    { label: 'INT', value: stats.INT },
  ];

  useEffect(() => {
    getWorkoutStats(30).then(s => setWorkoutStats(s as WorkoutStats));
  }, []);

  // Calculate BMI
  const bmi = biometrics.weight / Math.pow(biometrics.height / 100, 2);
  const bmiCategory = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: Math.max(20, insets.top + 16) }]}
    >
      <SystemText variant="h2" align="center" style={{ marginBottom: 16 }}>
        PLAYER STATUS
      </SystemText>

      {/* Tab Selector */}
      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <SystemText style={[styles.tabTxt, activeTab === tab && { color: COLORS.background }]}>
              {tab}
            </SystemText>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── STATS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'STATS' && (
        <>
          <RankBadge rank={rank} rankIndex={rankIndex >= 0 ? rankIndex : 0} xp={xp} />

          <SystemCard glow style={styles.radarContainer}>
            <SystemText variant="h2" align="center" style={{ marginBottom: 16 }}>ATTRIBUTES</SystemText>
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <StatRadarChart data={statData} />
            </View>
            <View style={{ marginTop: 16 }}>
              <StatBar label="STR (Strength)" value={stats.STR} max={100} color={COLORS.danger} />
              <StatBar label="END (Endurance)" value={stats.END} max={100} color={COLORS.primary} />
              <StatBar label="AGI (Agility)" value={stats.AGI} max={100} color={COLORS.success} />
              <StatBar label="VIT (Vitality)" value={stats.VIT} max={100} color={COLORS.gold} />
              <StatBar label="INT (Intelligence)" value={stats.INT} max={100} color={COLORS.secondary} />
            </View>
          </SystemCard>

          {/* Biometrics */}
          <SystemCard glow={false} style={{ marginTop: 16 }}>
            <SystemText variant="h2" style={{ marginBottom: 12 }}>BIOMETRIC DATA</SystemText>
            <View style={styles.bioGrid}>
              <View style={styles.bioCell}>
                <SystemText variant="h2" color={COLORS.primary}>{biometrics.weight}kg</SystemText>
                <SystemText variant="muted" style={styles.bioLabel}>WEIGHT</SystemText>
              </View>
              <View style={styles.bioCell}>
                <SystemText variant="h2" color={COLORS.primary}>{biometrics.height}cm</SystemText>
                <SystemText variant="muted" style={styles.bioLabel}>HEIGHT</SystemText>
              </View>
              <View style={styles.bioCell}>
                <SystemText variant="h2" color={bmi > 25 ? COLORS.danger : COLORS.success}>
                  {bmi.toFixed(1)}
                </SystemText>
                <SystemText variant="muted" style={styles.bioLabel}>BMI</SystemText>
              </View>
              <View style={styles.bioCell}>
                <SystemText variant="h2" color={COLORS.primary}>{biometrics.age}y</SystemText>
                <SystemText variant="muted" style={styles.bioLabel}>AGE</SystemText>
              </View>
            </View>
            <SystemText variant="muted" align="center" style={{ fontSize: 11, marginTop: 8 }}>
              BMI Category: {bmiCategory}
            </SystemText>
          </SystemCard>
        </>
      )}

      {/* ── 30 DAYS TAB ───────────────────────────────────────────────────── */}
      {activeTab === '30 DAYS' && (
        <>
          {workoutStats ? (
            <>
              <SystemCard style={{ marginBottom: 12 }}>
                <SystemText variant="h2" style={{ marginBottom: 12 }}>WORKOUT SUMMARY</SystemText>
                <View style={styles.bioGrid}>
                  <View style={styles.bioCell}>
                    <SystemText variant="h2" color={COLORS.primary}>{workoutStats.completedSessions}</SystemText>
                    <SystemText variant="muted" style={styles.bioLabel}>COMPLETED</SystemText>
                  </View>
                  <View style={styles.bioCell}>
                    <SystemText variant="h2" color={workoutStats.consistency >= 70 ? COLORS.success : COLORS.danger}>
                      {workoutStats.consistency}%
                    </SystemText>
                    <SystemText variant="muted" style={styles.bioLabel}>CONSISTENCY</SystemText>
                  </View>
                  <View style={styles.bioCell}>
                    <SystemText variant="h2" color={COLORS.gold}>+{workoutStats.totalXp}</SystemText>
                    <SystemText variant="muted" style={styles.bioLabel}>XP EARNED</SystemText>
                  </View>
                  <View style={styles.bioCell}>
                    <SystemText variant="h2" color={COLORS.success}>{workoutStats.totalCalories}</SystemText>
                    <SystemText variant="muted" style={styles.bioLabel}>KCAL BURNED</SystemText>
                  </View>
                </View>

                <View style={{ marginTop: 16 }}>
                  <StatBar
                    label="Workout Consistency"
                    value={workoutStats.consistency}
                    max={100}
                    color={workoutStats.consistency >= 70 ? COLORS.success : COLORS.danger}
                  />
                </View>
              </SystemCard>

              {workoutStats.totalSessions === 0 && (
                <SystemCard style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <SystemText style={{ fontSize: 48, marginBottom: 12 }}>⚔️</SystemText>
                  <SystemText variant="h2" align="center" color={COLORS.secondary}>
                    NO SESSIONS YET
                  </SystemText>
                  <SystemText variant="muted" align="center" style={{ marginTop: 8 }}>
                    Complete your first workout session to see analytics here.
                  </SystemText>
                </SystemCard>
              )}

              <SystemCard glow={false}>
                <SystemText variant="h2" style={{ marginBottom: 12 }}>PROGRESS REPORT</SystemText>
                <SystemText variant="body" color={COLORS.primary} style={{ lineHeight: 22, fontSize: 13 }}>
                  {workoutStats.completedSessions === 0
                    ? '"Hunter status: Inactive. Begin your training to unlock system upgrades."'
                    : workoutStats.consistency >= 80
                    ? `"Hunter performance: Elite. ${workoutStats.completedSessions} sessions completed. Consistency at ${workoutStats.consistency}%. Rank advancement imminent."`
                    : workoutStats.consistency >= 50
                    ? `"Hunter performance: Acceptable. ${workoutStats.completedSessions} sessions logged. Increase training frequency for accelerated progression."`
                    : `"Hunter performance: Below threshold. Only ${workoutStats.completedSessions} sessions logged. Immediate improvement required."`}
                </SystemText>
              </SystemCard>
            </>
          ) : (
            <SystemCard style={{ alignItems: 'center', paddingVertical: 32 }}>
              <SystemText variant="muted">LOADING ANALYTICS...</SystemText>
            </SystemCard>
          )}
        </>
      )}

      {/* ── NUTRITION TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'NUTRITION' && (
        <>
          <SystemCard style={{ marginBottom: 12 }}>
            <SystemText variant="h2" style={{ marginBottom: 12 }}>TODAY'S MACROS</SystemText>
            <StatBar label="Protein" value={Math.round(dailyTotals.protein)} max={targets.protein} color={COLORS.danger} />
            <StatBar label="Carbohydrates" value={Math.round(dailyTotals.carbs)} max={targets.carbs} color={COLORS.primary} />
            <StatBar label="Fat" value={Math.round(dailyTotals.fat)} max={targets.fat} color={COLORS.gold} />
            <StatBar label="Calories" value={dailyTotals.kcal} max={targets.kcal} color={COLORS.secondary} />
          </SystemCard>

          <SystemCard glow={false}>
            <SystemText variant="h2" style={{ marginBottom: 12 }}>CALORIE TARGETS</SystemText>
            <View style={styles.bioGrid}>
              <View style={styles.bioCell}>
                <SystemText variant="h2" color={COLORS.primary}>{targets.kcal}</SystemText>
                <SystemText variant="muted" style={styles.bioLabel}>TARGET</SystemText>
              </View>
              <View style={styles.bioCell}>
                <SystemText variant="h2" color={COLORS.success}>{dailyTotals.kcal}</SystemText>
                <SystemText variant="muted" style={styles.bioLabel}>CONSUMED</SystemText>
              </View>
              <View style={styles.bioCell}>
                <SystemText variant="h2" color={COLORS.gold}>
                  {Math.max(0, targets.kcal - dailyTotals.kcal)}
                </SystemText>
                <SystemText variant="muted" style={styles.bioLabel}>REMAINING</SystemText>
              </View>
            </View>
          </SystemCard>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabTxt: {
    fontSize: 10,
    fontFamily: 'SpaceMono',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  radarContainer: {
    paddingVertical: 24,
  },
  bioGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bioCell: {
    alignItems: 'center',
    gap: 4,
  },
  bioLabel: {
    fontSize: 9,
    letterSpacing: 1,
  },
});
