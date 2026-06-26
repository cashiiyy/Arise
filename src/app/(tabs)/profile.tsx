import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Vibration } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SystemText } from '../../components/SystemText';
import { SystemCard } from '../../components/SystemCard';
import { SystemButton } from '../../components/SystemButton';
import { RankBadge } from '../../components/RankBadge';
import { useUserStore } from '../../store/useUserStore';
import { COLORS, SYSTEM_GLOW } from '../../theme';
import { RANKS } from '../../services/xpEngine';
import { ShieldAlert, Trash2, Dumbbell, Activity, Shield, User } from 'lucide-react-native';

export default function Profile() {
  const router = useRouter();
  const {
    name,
    rank,
    xp,
    stats,
    biometrics,
    focusAreas,
    equipment,
    frequency,
    motivation,
    resetData
  } = useUserStore();

  const rankIndex = RANKS.indexOf(rank);

  // Calculate BMI
  const weight = biometrics?.weight || 70;
  const height = biometrics?.height || 175;
  const heightInMeters = height / 100;
  const bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
  
  let bmiCategory = 'Normal';
  let bmiColor = '#10B981'; // Green
  if (bmi < 18.5) {
    bmiCategory = 'Underweight';
    bmiColor = '#00BFFF'; // Light blue
  } else if (bmi < 25) {
    bmiCategory = 'Normal';
    bmiColor = '#10B981'; // Green
  } else if (bmi < 30) {
    bmiCategory = 'Overweight';
    bmiColor = '#FBBF24'; // Yellow
  } else {
    bmiCategory = 'Obese';
    bmiColor = '#EF4444'; // Red
  }

  const handleResetSystem = async () => {
    // Vibrate to provide feedback
    Vibration.vibrate(200);
    try {
      await AsyncStorage.removeItem('onboarding_completed');
      resetData();
      router.replace('/onboarding');
    } catch (e) {
      console.error('Failed to reset onboarding:', e);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SystemText variant="h2" align="center" style={styles.titleText}>
        HUNTER STATUS
      </SystemText>

      {/* Profile Rank Badge */}
      <RankBadge rank={rank} rankIndex={rankIndex >= 0 ? rankIndex : 0} xp={xp} />

      {/* Hunter details */}
      <SystemCard glow style={styles.identityCard}>
        <View style={styles.sectionHeader}>
          <User size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
          <SystemText variant="mono" style={{ fontWeight: 'bold' }}>HUNTER IDENTITY</SystemText>
        </View>
        <View style={styles.row}>
          <SystemText variant="muted">Codename:</SystemText>
          <SystemText variant="body" style={{ fontWeight: 'bold' }}>{name}</SystemText>
        </View>
        <View style={styles.row}>
          <SystemText variant="muted">Rank class:</SystemText>
          <SystemText variant="body" color={COLORS.gold} style={{ fontWeight: 'bold' }}>{rank}-Rank</SystemText>
        </View>
        <View style={styles.row}>
          <SystemText variant="muted">Current motivation:</SystemText>
          <SystemText variant="body">{motivation}</SystemText>
        </View>
      </SystemCard>

      {/* Biometrics Card */}
      <SystemCard style={styles.bioCard}>
        <View style={styles.sectionHeader}>
          <Activity size={20} color="#10B981" style={{ marginRight: 8 }} />
          <SystemText variant="mono" style={{ fontWeight: 'bold' }}>BIOMETRIC SCAN</SystemText>
        </View>
        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <SystemText variant="muted" style={styles.gridColLabel}>Height</SystemText>
            <SystemText variant="h2" style={{ fontWeight: 'bold' }}>{height} cm</SystemText>
          </View>
          <View style={styles.gridCol}>
            <SystemText variant="muted" style={styles.gridColLabel}>Weight</SystemText>
            <SystemText variant="h2" style={{ fontWeight: 'bold' }}>{weight} kg</SystemText>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.bmiSection}>
          <View style={styles.row}>
            <SystemText variant="muted">BMI Index:</SystemText>
            <SystemText variant="h2" style={{ fontWeight: 'bold' }}>{bmi}</SystemText>
          </View>
          <View style={styles.row}>
            <SystemText variant="muted">Classification:</SystemText>
            <SystemText variant="body" style={{ fontWeight: 'bold', color: bmiColor }}>
              {bmiCategory}
            </SystemText>
          </View>
        </View>
      </SystemCard>

      {/* Attribute Stats Card */}
      <SystemCard style={styles.statsCard}>
        <View style={styles.sectionHeader}>
          <Shield size={20} color="#EF4444" style={{ marginRight: 8 }} />
          <SystemText variant="mono" style={{ fontWeight: 'bold' }}>STATS & ABILITIES</SystemText>
        </View>
        <View style={styles.statList}>
          {Object.entries(stats).map(([statName, val]) => (
            <View key={statName} style={styles.statRow}>
              <View style={styles.statInfo}>
                <SystemText variant="mono" style={{ fontWeight: 'bold' }}>{statName}</SystemText>
                <SystemText variant="mono" color="#EF4444" style={{ fontWeight: 'bold' }}>{val}</SystemText>
              </View>
              <View style={styles.statProgressTrack}>
                <View style={[styles.statProgressFill, { width: `${Math.min(100, (val / 100) * 100)}%` }]} />
              </View>
            </View>
          ))}
        </View>
      </SystemCard>

      {/* Onboarding Preferences Card */}
      <SystemCard style={styles.preferencesCard}>
        <View style={styles.sectionHeader}>
          <Dumbbell size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
          <SystemText variant="mono" style={{ fontWeight: 'bold' }}>COACHING PROFILE</SystemText>
        </View>
        <View style={styles.rowItem}>
          <SystemText variant="muted" style={{ marginBottom: 4 }}>Focus Areas:</SystemText>
          <View style={styles.badgeRow}>
            {focusAreas && focusAreas.length > 0 ? (
              focusAreas.map((area) => (
                <View key={area} style={[styles.badge, { borderColor: '#10B981' }]}>
                  <SystemText variant="mono" style={{ fontSize: 11, color: '#10B981' }}>{area}</SystemText>
                </View>
              ))
            ) : (
              <SystemText variant="body">None selected</SystemText>
            )}
          </View>
        </View>

        <View style={styles.rowItem}>
          <SystemText variant="muted" style={{ marginBottom: 4 }}>Equipment Available:</SystemText>
          <View style={styles.badgeRow}>
            {equipment && equipment.length > 0 ? (
              equipment.map((eq) => (
                <View key={eq} style={[styles.badge, { borderColor: COLORS.primary }]}>
                  <SystemText variant="mono" style={{ fontSize: 11, color: COLORS.primary }}>{eq}</SystemText>
                </View>
              ))
            ) : (
              <SystemText variant="body">None selected</SystemText>
            )}
          </View>
        </View>

        <View style={styles.rowItem}>
          <SystemText variant="muted">Weekly Commitment:</SystemText>
          <SystemText variant="body" style={{ fontWeight: 'bold' }}>{frequency} Workouts / Week</SystemText>
        </View>
      </SystemCard>

      {/* Danger Zone */}
      <View style={styles.dangerZone}>
        <SystemCard style={{ borderColor: '#EF4444' }}>
          <View style={styles.sectionHeader}>
            <ShieldAlert size={20} color="#EF4444" style={{ marginRight: 8 }} />
            <SystemText variant="mono" color="#EF4444" style={{ fontWeight: 'bold' }}>SYSTEM OVERRIDE</SystemText>
          </View>
          <SystemText variant="muted" style={{ fontSize: 12, marginBottom: 16 }}>
            Resetting system data clears your Hunter profile, deletes progress state, and recalibrates the onboarding protocols.
          </SystemText>
          <TouchableOpacity style={styles.resetButton} onPress={handleResetSystem}>
            <Trash2 size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
            <SystemText variant="mono" color="#FFFFFF" style={{ fontWeight: 'bold' }}>
              RESET HUNTER SYSTEM
            </SystemText>
          </TouchableOpacity>
        </SystemCard>
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
    paddingBottom: 60,
  },
  titleText: {
    letterSpacing: 4,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  identityCard: {
    padding: 16,
    marginVertical: 12,
  },
  bioCard: {
    padding: 16,
    marginVertical: 12,
  },
  statsCard: {
    padding: 16,
    marginVertical: 12,
  },
  preferencesCard: {
    padding: 16,
    marginVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  gridCol: {
    flex: 1,
    alignItems: 'center',
  },
  gridColLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 12,
  },
  bmiSection: {
    gap: 4,
  },
  statList: {
    gap: 12,
  },
  statRow: {
    gap: 6,
  },
  statInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statProgressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  statProgressFill: {
    height: '100%',
    backgroundColor: '#EF4444',
  },
  rowItem: {
    marginVertical: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  dangerZone: {
    marginTop: 20,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 6,
  }
});
