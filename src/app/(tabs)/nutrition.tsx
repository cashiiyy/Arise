import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SystemText } from '../../components/SystemText';
import { SystemCard } from '../../components/SystemCard';
import { SystemButton } from '../../components/SystemButton';
import { ProgressRing } from '../../components/ProgressRing';
import { COLORS } from '../../theme';

export default function Nutrition() {
  const macros = {
    protein: 140, // out of 180g
    carbs: 200,   // out of 250g
    fat: 50,      // out of 70g
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SystemText variant="h2" align="center" style={{ marginBottom: 24 }}>
        NUTRITION PROTOCOL
      </SystemText>

      {/* Macros */}
      <SystemCard style={styles.macroContainer}>
        <View style={styles.macroItem}>
          <ProgressRing progress={macros.protein / 180} radius={35} color={COLORS.danger}>
            <SystemText variant="body">{macros.protein}g</SystemText>
          </ProgressRing>
          <SystemText variant="muted" style={{ marginTop: 8 }}>Protein</SystemText>
        </View>

        <View style={styles.macroItem}>
          <ProgressRing progress={macros.carbs / 250} radius={35} color={COLORS.primary}>
            <SystemText variant="body">{macros.carbs}g</SystemText>
          </ProgressRing>
          <SystemText variant="muted" style={{ marginTop: 8 }}>Carbs</SystemText>
        </View>

        <View style={styles.macroItem}>
          <ProgressRing progress={macros.fat / 70} radius={35} color={COLORS.gold}>
            <SystemText variant="body">{macros.fat}g</SystemText>
          </ProgressRing>
          <SystemText variant="muted" style={{ marginTop: 8 }}>Fat</SystemText>
        </View>
      </SystemCard>

      <SystemCard glow={false}>
        <SystemText variant="h2" style={{ marginBottom: 16 }}>Meal Plan (Generated)</SystemText>
        <SystemText variant="body" color={COLORS.primary} style={{ marginBottom: 8 }}>
          • Pre-workout: Oatmeal + Whey (400 kcal)
        </SystemText>
        <SystemText variant="body" color={COLORS.primary} style={{ marginBottom: 8 }}>
          • Post-workout: Chicken Breast + Rice (600 kcal)
        </SystemText>
        <SystemText variant="body" color={COLORS.primary}>
          • Dinner: Salmon + Asparagus (500 kcal)
        </SystemText>
      </SystemCard>

      <SystemCard style={{ borderColor: COLORS.danger }}>
        <SystemText variant="body" color={COLORS.danger} align="center">
          "Warning: Caloric deficit exceeded threshold. Protein intake must reach 185g before midnight."
        </SystemText>
      </SystemCard>

      <View style={{ marginTop: 24 }}>
        <SystemButton title="SCAN MEAL" variant="secondary" />
        <SystemButton title="LOG WATER" variant="outline" />
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
    paddingBottom: 40,
  },
  macroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    marginBottom: 24,
  },
  macroItem: {
    alignItems: 'center',
  }
});
