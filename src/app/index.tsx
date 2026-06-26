import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SystemText } from '../components/SystemText';
import { COLORS } from '../theme';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Simulate loading/initialization time
    const timer = setTimeout(() => {
      router.replace('/onboarding');
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
