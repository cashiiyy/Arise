/**
 * Home Screen — Live quests from AI generator, watch widget, and daily resources.
 * Replaces hardcoded quests with dynamic quest cards.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SystemText } from '../../components/SystemText';
import { SystemCard } from '../../components/SystemCard';
import { SystemButton } from '../../components/SystemButton';
import { QuestCard } from '../../components/QuestCard';
import { LiveWatchWidget } from '../../components/LiveWatchWidget';
import { useUserStore } from '../../store/useUserStore';
import { useNutritionStore } from '../../stores/nutritionStore';
import { COLORS } from '../../theme';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Quest } from '../../types/arise';
import { loadOrGenerateQuests, updateQuestProgress, saveQuests } from '../../ai/questGenerator';

export default function Home() {
  const { name, rank, xp, biometrics, goal, addXP } = useUserStore();
  const { loadTodayLogs, dailyTotals, waterIntakeMl, logWater } = useNutritionStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [quests, setQuests] = useState<Quest[]>([]);
  const [loadingQuests, setLoadingQuests] = useState(true);

  const rankIndexMap: Record<string, number> = { E: 0, D: 2, C: 4, B: 5, A: 6, S: 7 };

  useEffect(() => {
    loadTodayLogs();
    loadOrGenerateQuests({
      rankIndex: rankIndexMap[rank] ?? 0,
      completedWorkouts: 3,
      avgSteps: 6000,
      avgSleepHours: 7,
      goal,
      biometrics: {
        weight: biometrics.weight,
        height: biometrics.height,
        age: biometrics.age,
      },
    }).then(q => {
      setQuests(q);
      setLoadingQuests(false);
    });
  }, []);

  const handleQuestPress = async (quest: Quest) => {
    if (quest.completed) return;
    if (quest.type === 'workout' && quest.title.includes('Dungeon Clear')) {
      router.push('/workout' as any);
      return;
    }
    // Quick-complete lifestyle/nutrition quests manually
    if (quest.type !== 'workout') {
      const updated = await updateQuestProgress(quest.id, quest.target);
      const completedQuest = updated.find(q => q.id === quest.id);
      if (completedQuest?.completed) {
        addXP(quest.xpReward);
      }
      setQuests(updated);
    }
  };

  const completedCount = quests.filter(q => q.completed).length;
  const totalQuests = quests.length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: Math.max(20, insets.top + 16) }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.rankBadge}>
          <SystemText variant="h1" color={COLORS.background} style={{ fontWeight: 'bold' }}>
            {rank}
          </SystemText>
        </View>
        <View style={styles.headerText}>
          <SystemText variant="h2">{name}</SystemText>
          <SystemText variant="muted">Hunter Rank: {rank} • XP: {xp.toLocaleString()}</SystemText>
        </View>
      </View>

      {/* Watch Widget */}
      <LiveWatchWidget />

      {/* Daily Resource Logger (Mini) */}
      <SystemCard glow={false} style={styles.resourceCard}>
        <View style={styles.resourceRow}>
          <SystemText>💧</SystemText>
          <SystemText variant="muted" style={{ flex: 1, marginLeft: 8 }}>Water</SystemText>
          <SystemText variant="mono" color={COLORS.primary}>{waterIntakeMl}ml</SystemText>
          <View style={styles.quickBtns}>
            <SystemButton
              title="+250ml"
              variant="outline"
              onPress={() => logWater(250)}
              style={styles.quickBtn}
            />
            <SystemButton
              title="+500ml"
              variant="outline"
              onPress={() => logWater(500)}
              style={styles.quickBtn}
            />
          </View>
        </View>
        <View style={[styles.resourceRow, { marginTop: 10 }]}>
          <SystemText>🔥</SystemText>
          <SystemText variant="muted" style={{ flex: 1, marginLeft: 8 }}>Calories</SystemText>
          <SystemText variant="mono" color={COLORS.primary}>{dailyTotals.kcal} kcal</SystemText>
        </View>
      </SystemCard>

      {/* Daily Quests */}
      <View style={styles.questHeader}>
        <SystemText variant="h2">DAILY QUESTS</SystemText>
        {!loadingQuests && (
          <View style={styles.questProgress}>
            <SystemText variant="mono" color={COLORS.gold} style={{ fontSize: 12 }}>
              {completedCount}/{totalQuests}
            </SystemText>
          </View>
        )}
      </View>

      {loadingQuests ? (
        <SystemCard style={{ alignItems: 'center', paddingVertical: 24 }}>
          <SystemText variant="muted">LOADING QUEST DATA...</SystemText>
        </SystemCard>
      ) : (
        quests.map(quest => (
          <QuestCard
            key={quest.id}
            quest={quest}
            onPress={() => handleQuestPress(quest)}
          />
        ))
      )}

      {/* Begin Today's Quest CTA */}
      <View style={{ marginTop: 24, marginBottom: 16 }}>
        <SystemButton
          title="BEGIN TODAY'S QUEST"
          onPress={() => router.push('/workout' as any)}
        />
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
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
  resourceCard: {
    marginBottom: 16,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickBtns: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 4,
  },
  quickBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginVertical: 0,
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  questProgress: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
});
