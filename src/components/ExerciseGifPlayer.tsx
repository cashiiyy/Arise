/**
 * ExerciseGifPlayer — Displays an exercise GIF with auto-play, loop, and fallback.
 * Maintains the Solo Leveling dark aesthetic with neon glow border.
 */
import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  Text,
} from 'react-native';
import { COLORS } from '../theme';
import { getExerciseGifSource } from '../exercise/exerciseService';

interface Props {
  exerciseId: string;
  exerciseName: string;
  size?: number;
}

export const ExerciseGifPlayer: React.FC<Props> = ({
  exerciseId,
  exerciseName,
  size = 260,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const gifSource = getExerciseGifSource(exerciseId);

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size },
      ]}
    >
      {/* Neon glow border */}
      <View style={[styles.glowBorder, { width: size, height: size, borderRadius: 12 }]} />

      {gifSource && !error ? (
        <>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={COLORS.primary} size="large" />
              <Text style={styles.loadingText}>LOADING...</Text>
            </View>
          )}
          <Image
            source={gifSource}
            style={[styles.gif, { width: size - 4, height: size - 4 }]}
            resizeMode="contain"
            onLoad={() => setLoading(false)}
            onError={() => { setError(true); setLoading(false); }}
          />
        </>
      ) : (
        // Fallback placeholder
        <View style={[styles.fallback, { width: size - 4, height: size - 4 }]}>
          <Text style={styles.fallbackIcon}>⚡</Text>
          <Text style={styles.fallbackName} numberOfLines={2}>
            {exerciseName.toUpperCase()}
          </Text>
          <Text style={styles.fallbackSub}>GIF NOT AVAILABLE</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: COLORS.primary,
    // Shadow glow effect
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 12,
    backgroundColor: 'transparent',
  },
  gif: {
    borderRadius: 10,
    backgroundColor: '#0A0C12',
  },
  loadingOverlay: {
    position: 'absolute',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: 'SpaceMono',
    marginTop: 8,
    letterSpacing: 2,
  },
  fallback: {
    borderRadius: 10,
    backgroundColor: '#080A0F',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderStyle: 'dashed',
  },
  fallbackIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  fallbackName: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  fallbackSub: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: 'SpaceMono',
    letterSpacing: 2,
  },
});
