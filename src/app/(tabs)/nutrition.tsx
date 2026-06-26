/**
 * Nutrition Screen — Connected to real food datasets with AI coach.
 * Replaces all hardcoded values with live data from nutritionStore.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SystemText } from '../../components/SystemText';
import { SystemCard } from '../../components/SystemCard';
import { SystemButton } from '../../components/SystemButton';
import { ProgressRing } from '../../components/ProgressRing';
import { FoodSearchBar } from '../../components/FoodSearchBar';
import { COLORS } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNutritionStore } from '../../stores/nutritionStore';
import { useUserStore } from '../../store/useUserStore';
import { MealLog } from '../../nutrition/nutritionTypes';

const WATER_PRESETS = [250, 500, 750, 1000];

export default function Nutrition() {
  const insets = useSafeAreaInsets();
  const {
    todayLogs,
    dailyTotals,
    targets,
    aiSuggestions,
    mealPlan,
    waterIntakeMl,
    waterGoalMl,
    loadTodayLogs,
    removeLog,
    logWater,
    refreshMealPlan,
  } = useNutritionStore();
  const { biometrics, goal } = useUserStore();

  const [showLoggedMeals, setShowLoggedMeals] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'log' | 'coach'>('overview');

  useEffect(() => {
    loadTodayLogs();
    refreshMealPlan({ vegetarian: false, vegan: false });
  }, []);

  const proteinPct = Math.min(1, dailyTotals.protein / (targets.protein || 1));
  const carbsPct = Math.min(1, dailyTotals.carbs / (targets.carbs || 1));
  const fatPct = Math.min(1, dailyTotals.fat / (targets.fat || 1));
  const kcalPct = Math.min(1, dailyTotals.kcal / (targets.kcal || 1));
  const waterPct = Math.min(1, waterIntakeMl / (waterGoalMl || 3000));

  const remainingKcal = Math.max(0, targets.kcal - dailyTotals.kcal);
  const remainingProtein = Math.max(0, targets.protein - dailyTotals.protein);

  const groupedLogs: Record<string, MealLog[]> = {};
  for (const log of todayLogs) {
    if (!groupedLogs[log.mealType]) groupedLogs[log.mealType] = [];
    groupedLogs[log.mealType].push(log);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: Math.max(20, insets.top + 16) }]}
      keyboardShouldPersistTaps="handled"
    >
      <SystemText variant="h2" align="center" style={{ marginBottom: 16 }}>
        NUTRITION PROTOCOL
      </SystemText>

      {/* Tab Selector */}
      <View style={styles.tabRow}>
        {(['overview', 'log', 'coach'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <SystemText
              style={[styles.tabTxt, activeTab === tab && { color: COLORS.background }]}
            >
              {tab === 'overview' ? '📊 OVERVIEW' : tab === 'log' ? '➕ LOG FOOD' : '🤖 AI COACH'}
            </SystemText>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── OVERVIEW TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          {/* Macro Rings */}
          <SystemCard style={styles.macroContainer}>
            <View style={styles.macroItem}>
              <ProgressRing progress={proteinPct} radius={40} color={COLORS.danger}>
                <SystemText style={{ fontSize: 13, fontFamily: 'SpaceMono', color: COLORS.text }}>
                  {Math.round(dailyTotals.protein)}g
                </SystemText>
              </ProgressRing>
              <SystemText variant="muted" style={styles.macroLabel}>Protein</SystemText>
              <SystemText style={styles.macroTarget}>{targets.protein}g goal</SystemText>
            </View>

            <View style={styles.macroItem}>
              <ProgressRing progress={carbsPct} radius={40} color={COLORS.primary}>
                <SystemText style={{ fontSize: 13, fontFamily: 'SpaceMono', color: COLORS.text }}>
                  {Math.round(dailyTotals.carbs)}g
                </SystemText>
              </ProgressRing>
              <SystemText variant="muted" style={styles.macroLabel}>Carbs</SystemText>
              <SystemText style={styles.macroTarget}>{targets.carbs}g goal</SystemText>
            </View>

            <View style={styles.macroItem}>
              <ProgressRing progress={fatPct} radius={40} color={COLORS.gold}>
                <SystemText style={{ fontSize: 13, fontFamily: 'SpaceMono', color: COLORS.text }}>
                  {Math.round(dailyTotals.fat)}g
                </SystemText>
              </ProgressRing>
              <SystemText variant="muted" style={styles.macroLabel}>Fat</SystemText>
              <SystemText style={styles.macroTarget}>{targets.fat}g goal</SystemText>
            </View>
          </SystemCard>

          {/* Calorie Summary */}
          <SystemCard glow={false} style={{ marginBottom: 12 }}>
            <View style={styles.kcalRow}>
              <View>
                <SystemText variant="muted" style={{ fontSize: 10, letterSpacing: 1 }}>TODAY'S CALORIES</SystemText>
                <SystemText variant="h2" color={COLORS.primary}>{dailyTotals.kcal} kcal</SystemText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <SystemText variant="muted" style={{ fontSize: 10 }}>REMAINING</SystemText>
                <SystemText variant="h2" color={remainingKcal > 0 ? COLORS.success : COLORS.danger}>
                  {remainingKcal > 0 ? `${remainingKcal} kcal` : 'GOAL MET'}
                </SystemText>
              </View>
            </View>
            <View style={styles.kcalBar}>
              <View style={[styles.kcalFill, { width: `${Math.min(100, kcalPct * 100)}%` as any }]} />
            </View>
            <SystemText variant="muted" style={{ fontSize: 10, marginTop: 4 }}>
              Goal: {targets.kcal} kcal
              {remainingProtein > 0 ? ` • Need ${Math.round(remainingProtein)}g more protein` : ''}
            </SystemText>
          </SystemCard>

          {/* Water Tracker */}
          <SystemCard glow={false} style={{ marginBottom: 12 }}>
            <View style={styles.waterHeader}>
              <SystemText>💧 <SystemText color={COLORS.primary} style={{ fontSize: 13, letterSpacing: 1 }}>HYDRATION</SystemText></SystemText>
              <SystemText variant="mono" style={{ fontSize: 12 }}>
                {waterIntakeMl}ml / {waterGoalMl}ml
              </SystemText>
            </View>
            <View style={styles.waterBar}>
              <View style={[styles.waterFill, { width: `${Math.min(100, waterPct * 100)}%` as any }]} />
            </View>
            <SystemText variant="muted" style={{ fontSize: 10, marginBottom: 10 }}>
              {Math.round(waterPct * 100)}% hydrated
            </SystemText>
            <View style={styles.waterPresets}>
              {WATER_PRESETS.map(ml => (
                <TouchableOpacity
                  key={ml}
                  style={styles.waterBtn}
                  onPress={() => logWater(ml)}
                  activeOpacity={0.7}
                >
                  <SystemText style={styles.waterBtnTxt}>+{ml}ml</SystemText>
                </TouchableOpacity>
              ))}
            </View>
          </SystemCard>

          {/* AI Meal Plan */}
          {mealPlan.length > 0 && (
            <SystemCard glow={false} style={{ marginBottom: 12 }}>
              <SystemText variant="h2" style={{ marginBottom: 12 }}>AI MEAL PLAN</SystemText>
              {mealPlan.map((meal, idx) => (
                <View key={idx} style={styles.mealPlanItem}>
                  <SystemText style={styles.mealTypeTag}>
                    {meal.mealType.toUpperCase()}
                  </SystemText>
                  <SystemText variant="body" color={COLORS.primary} style={{ flex: 1, fontSize: 13 }}>
                    {meal.note}
                  </SystemText>
                  <SystemText variant="muted" style={{ fontSize: 11 }}>
                    ~{meal.totalKcal} kcal
                  </SystemText>
                </View>
              ))}
            </SystemCard>
          )}
        </>
      )}

      {/* ── LOG FOOD TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'log' && (
        <>
          <FoodSearchBar />

          {/* Today's Logged Meals */}
          {todayLogs.length > 0 && (
            <SystemCard glow={false} style={{ marginTop: 8 }}>
              <TouchableOpacity
                style={styles.sectionToggle}
                onPress={() => setShowLoggedMeals(v => !v)}
              >
                <SystemText variant="body">
                  {showLoggedMeals ? '▼' : '▶'} TODAY'S LOG ({todayLogs.length} items)
                </SystemText>
                <SystemText variant="mono" color={COLORS.primary}>
                  {dailyTotals.kcal} kcal
                </SystemText>
              </TouchableOpacity>

              {showLoggedMeals && Object.entries(groupedLogs).map(([mealType, logs]) => (
                <View key={mealType} style={{ marginTop: 8 }}>
                  <SystemText style={styles.groupLabel}>{mealType.toUpperCase()}</SystemText>
                  {logs.map(log => (
                    <View key={log.id} style={styles.logRow}>
                      <View style={{ flex: 1 }}>
                        <SystemText variant="body" style={{ fontSize: 13 }} numberOfLines={1}>
                          {log.foodItem.name}
                        </SystemText>
                        <SystemText variant="muted" style={{ fontSize: 11 }}>
                          {log.servingG}g • {log.loggedKcal} kcal • {log.loggedProtein}g P
                        </SystemText>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeLog(log.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <SystemText color={COLORS.danger} style={{ fontSize: 18 }}>×</SystemText>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ))}
            </SystemCard>
          )}
        </>
      )}

      {/* ── AI COACH TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'coach' && (
        <>
          {aiSuggestions.length === 0 ? (
            <SystemCard style={{ alignItems: 'center', paddingVertical: 32 }}>
              <SystemText style={{ fontSize: 40, marginBottom: 12 }}>🤖</SystemText>
              <SystemText variant="h2" align="center" color={COLORS.secondary}>
                AI COACH
              </SystemText>
              <SystemText variant="muted" align="center" style={{ marginTop: 8 }}>
                Log your food to receive personalized nutrition coaching.
              </SystemText>
            </SystemCard>
          ) : (
            aiSuggestions.map((s, idx) => (
              <SystemCard
                key={s.id}
                glow={s.type === 'warning'}
                style={[
                  styles.suggestionCard,
                  { borderColor: s.type === 'warning' ? COLORS.danger : s.type === 'success' ? COLORS.success : COLORS.primary }
                ]}
              >
                <View style={styles.suggestionHeader}>
                  <SystemText style={{ fontSize: 16, marginRight: 8 }}>
                    {s.type === 'warning' ? '⚠️' : s.type === 'success' ? '✅' : s.type === 'coach' ? '🤖' : '💡'}
                  </SystemText>
                  <SystemText variant="mono" style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted }}>
                    {s.type.toUpperCase()}
                  </SystemText>
                </View>
                <SystemText
                  variant="body"
                  color={s.type === 'warning' ? COLORS.danger : s.type === 'success' ? COLORS.success : COLORS.text}
                  style={{ lineHeight: 20, fontSize: 13, marginTop: 4 }}
                >
                  "{s.message}"
                </SystemText>
              </SystemCard>
            ))
          )}
        </>
      )}

      {/* Scan Meal button */}
      <View style={{ marginTop: 24 }}>
        <SystemButton title="SCAN MEAL" variant="secondary" onPress={() => {}} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: {
    flex: 1, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderRadius: 8, paddingVertical: 8, alignItems: 'center',
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabTxt: { fontSize: 10, fontFamily: 'SpaceMono', color: COLORS.textMuted, letterSpacing: 0.5 },
  macroContainer: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 20, marginBottom: 12,
  },
  macroItem: { alignItems: 'center' },
  macroLabel: { marginTop: 8, fontSize: 12 },
  macroTarget: { fontSize: 10, color: COLORS.textMuted, fontFamily: 'SpaceMono', marginTop: 2 },
  kcalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  kcalBar: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2, overflow: 'hidden',
  },
  kcalFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  waterHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  waterBar: {
    height: 6, backgroundColor: 'rgba(0, 191, 255, 0.1)',
    borderRadius: 3, overflow: 'hidden',
  },
  waterFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  waterPresets: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  waterBtn: {
    borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 6,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  waterBtnTxt: { fontSize: 12, color: COLORS.text, fontFamily: 'SpaceMono' },
  mealPlanItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 8 },
  mealTypeTag: {
    fontSize: 9, color: COLORS.secondary, fontFamily: 'SpaceMono',
    borderWidth: 1, borderColor: COLORS.secondary,
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
    letterSpacing: 0.5, alignSelf: 'flex-start', marginTop: 2,
  },
  sectionToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  groupLabel: {
    fontSize: 9, letterSpacing: 2, color: COLORS.textMuted,
    fontFamily: 'SpaceMono', marginBottom: 4, marginTop: 4,
  },
  logRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 6,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
  },
  suggestionCard: { marginBottom: 10 },
  suggestionHeader: { flexDirection: 'row', alignItems: 'center' },
});
