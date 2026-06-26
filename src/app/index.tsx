import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SystemText } from '../components/SystemText';
import { COLORS } from '../theme';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem('onboarding_completed');
        if (completed === 'true') {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      } catch (e) {
        console.warn('Failed to check onboarding state, redirecting to onboarding:', e);
        router.replace('/onboarding');
      }
    };

    const timer = setTimeout(() => {
      checkOnboarding();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <SystemText variant="h1" color={COLORS.primary} style={styles.glowText}>
        ARISE
      </SystemText>
      <SystemText variant="muted">System Initializing...</SystemText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowText: {
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 20,
    letterSpacing: 8,
  }
});

