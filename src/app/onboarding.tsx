import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, Vibration } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeOut, Layout, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing, runOnJS } from 'react-native-reanimated';
import { ArrowLeft, Check, ChevronUp, ChevronDown, FlaskConical, PencilLine, Droplet, Clock, Calendar, ShieldAlert, Sparkles, User, Shield } from 'lucide-react-native';
import { SystemText } from '../components/SystemText';
import { SystemButton } from '../components/SystemButton';
import { SystemCard } from '../components/SystemCard';
import { useUserStore } from '../store/useUserStore';
import { COLORS, SYSTEM_GLOW } from '../theme';
import Svg, { Path, Circle, Rect, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Muscle highlight paths (simple SVG representations to highlight focus areas)
const MuscleHighlightIcon: React.FC<{ muscle: string; active: boolean }> = ({ muscle, active }) => {
  const color = active ? '#10B981' : '#4B5563';
  const fillOpacity = active ? '0.6' : '0.1';

  return (
    <Svg width="40" height="40" viewBox="0 0 100 100" style={{ opacity: active ? 1 : 0.6 }}>
      {/* Head */}
      <Circle cx="50" cy="15" r="8" fill={color} fillOpacity={fillOpacity} stroke={color} strokeWidth="2" />
      {/* Torso */}
      <Path d="M40 25 H60 L58 60 H42 Z" fill={color} fillOpacity={fillOpacity} stroke={color} strokeWidth="2" />
      {/* Arms */}
      <Path d="M38 25 L25 45 M62 25 L75 45" stroke={color} strokeWidth={muscle === 'arms' ? '6' : '3'} strokeLinecap="round" />
      {/* Chest highlights */}
      {muscle === 'chest' && (
        <Path d="M43 32 Q47 38 50 32 Q53 38 57 32" stroke="#EF4444" strokeWidth="4" fill="none" />
      )}
      {/* Back highlights */}
      {muscle === 'back' && (
        <Path d="M45 35 H55 M42 45 H58" stroke="#EF4444" strokeWidth="4" fill="none" />
      )}
      {/* Abs highlights */}
      {muscle === 'abs' && (
        <Path d="M47 42 H53 M47 48 H53 M47 54 H53" stroke="#EF4444" strokeWidth="4" fill="none" />
      )}
      {/* Shoulders */}
      {muscle === 'shoulders' && (
        <Circle cx="39" cy="25" r="4" fill="#EF4444" />
      )}
      {muscle === 'shoulders' && (
        <Circle cx="61" cy="25" r="4" fill="#EF4444" />
      )}
      {/* Legs */}
      <Path d="M44 60 L35 90 M56 60 L65 90" stroke={color} strokeWidth={muscle === 'legs' ? '6' : '3'} strokeLinecap="round" />
      {/* Glutes (Back view lower hips) */}
      {muscle === 'glutes' && (
        <Path d="M44 62 C46 68 54 68 56 62" stroke="#EF4444" strokeWidth="5" fill="none" />
      )}
    </Svg>
  );
};

export default function Onboarding() {
  const router = useRouter();
  const setInitialData = useUserStore((state) => state.setInitialData);

  // Onboarding wizard steps (1 to 22)
  const [step, setStep] = useState(1);

  // Form State
  const [playerName, setPlayerName] = useState('Sung Jin-Woo');
  const [motivation, setMotivation] = useState('Health');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [age, setAge] = useState(24);
  const [height, setHeight] = useState(173);
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weight, setWeight] = useState(72); // 160 lbs
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('lbs'); // defaults to lbs matching frame
  const [targetWeight, setTargetWeight] = useState(65); // 143 lbs
  const [targetWeightUnit, setTargetWeightUnit] = useState<'kg' | 'lbs'>('lbs');
  const [healthIssues, setHealthIssues] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [frequency, setFrequency] = useState(4); // 4x a week default
  const [believeInTransform, setBelieveInTransform] = useState<boolean | null>(null);

  // Status Animation State
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [statusText, setStatusText] = useState('Assessing your potential...');
  const [statusChecked, setStatusChecked] = useState<Record<string, boolean>>({
    physical: false,
    fitness: false,
    power: false,
    rank: false,
    workout: false,
  });

  // Derived calculations
  const weightInKg = weightUnit === 'lbs' ? Math.round(weight * 0.453592) : weight;
  const heightInCm = heightUnit === 'ft' ? Math.round(height * 30.48) : height;
  const targetWeightInKg = targetWeightUnit === 'lbs' ? Math.round(targetWeight * 0.453592) : targetWeight;

  const bmi = parseFloat((weightInKg / Math.pow(heightInCm / 100, 2)).toFixed(1));
  const bmiCategory = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
  const waterGoalCups = parseFloat((weightInKg * 0.033 * 4.226).toFixed(1)); // Approx water goal in cups

  // Calculated RPG attributes
  const stats = {
    STR: 10 + (equipment.includes('Barbells') ? 3 : 1) + (focusAreas.includes('Chest') ? 1 : 0),
    END: 10 + (frequency >= 4 ? 3 : 1) + (motivation === 'Enjoyment' ? 2 : 1),
    AGI: 10 + (focusAreas.includes('Legs') ? 2 : 0) + (motivation === 'Appearance' ? 2 : 1),
    VIT: 10 + (healthIssues.includes('None') ? 3 : 1) + (frequency <= 4 ? 2 : 1),
    INT: 10 + (age > 20 ? 3 : 1) + (motivation === 'Health' ? 2 : 1),
  };

  // Reanimated shared values
  const auraPulse = useSharedValue(1);
  const statsAnimProgress = useSharedValue(0);
  const surveyAnimProgress = useSharedValue(0);
  const scanSharedProgress = useSharedValue(0);
  const [isScanning, setIsScanning] = useState(false);

  // Pulse animation for Welcome shadow silhouette
  useEffect(() => {
    auraPulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedAuraStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: auraPulse.value }],
      opacity: 0.35 + (auraPulse.value - 1) * 2,
    };
  });

  // Reanimated survey header progress bar
  const totalSurveySteps = 10;
  const surveyProgress = step >= 3 && step <= 12 ? ((step - 3) / totalSurveySteps) * 100 : 0;

  useEffect(() => {
    surveyAnimProgress.value = withTiming(surveyProgress, { duration: 300 });
  }, [surveyProgress]);

  const surveyProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${surveyAnimProgress.value}%`,
    };
  });

  // Stats bar animation
  useEffect(() => {
    if (step === 17) {
      statsAnimProgress.value = 0;
      statsAnimProgress.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) });
    }
  }, [step]);

  const animatedBarWidth = (value: number) => {
    return useAnimatedStyle(() => ({
      width: `${statsAnimProgress.value * (value / 20) * 100}%`,
    }));
  };

  // Automatic transition for status screen (Step 16)
  useEffect(() => {
    if (step === 16) {
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          const next = prev + 1;
          if (next === 25) {
            setStatusChecked((s) => ({ ...s, physical: true }));
            setStatusText('Analyzing fitness thresholds...');
          } else if (next === 50) {
            setStatusChecked((s) => ({ ...s, fitness: true }));
            setStatusText('Calibrating current Hunter Rank...');
          } else if (next === 75) {
            setStatusChecked((s) => ({ ...s, power: true, rank: true }));
            setStatusText('Assembling training metrics...');
          } else if (next === 99) {
            setStatusChecked((s) => ({ ...s, workout: true }));
            setStatusText('Workout plan locked.');
          } else if (next >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep(17), 800); // transition to Arise Stats (step 17)
            return 100;
          }
          return next;
        });
      }, 35);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Thumb Scanner handlers
  const handleScanSuccess = () => {
    if (Vibration.cancel) {
      Vibration.cancel();
    }
    Vibration.vibrate([0, 150, 50, 400]);
    setTimeout(() => {
      handleNext();
    }, 800);
  };

  const startScanning = () => {
    setIsScanning(true);
    if (Vibration.vibrate) {
      Vibration.vibrate([100, 100], true);
    }
    scanSharedProgress.value = withTiming(1, { duration: 2200, easing: Easing.linear }, (finished) => {
      if (finished) {
        runOnJS(handleScanSuccess)();
      }
    });
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (Vibration.cancel) {
      Vibration.cancel();
    }
    if (scanSharedProgress.value < 1) {
      scanSharedProgress.value = withTiming(0, { duration: 400 });
    }
  };

  const scanFillStyle = useAnimatedStyle(() => {
    const scale = scanSharedProgress.value * 9;
    const opacity = scanSharedProgress.value;
    return {
      transform: [{ scale }],
      opacity: Math.min(1, opacity * 1.3),
    };
  });

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  // Onboarding UI Rendering Helper Methods

  // 1. Splash Welcome Screen
  const renderStep1 = () => (
    <Animated.View entering={FadeIn.duration(400)} style={styles.welcomeContainer}>
      {/* Background Silhouette Blue Shadow Aura */}
      <Animated.View style={[styles.silhouetteAura, animatedAuraStyle]}>
        <Svg width="350" height="350" viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="35" fill="rgba(0, 191, 255, 0.25)" filter="blur(20px)" />
        </Svg>
      </Animated.View>

      <View style={styles.topLogo}>
        <Svg width="50" height="50" viewBox="0 0 100 100">
          <Path d="M30 70 L70 30 H60 L20 70 Z" fill="#FFFFFF" />
          <Path d="M40 80 L80 40 H70 L30 80 Z" fill="#FFFFFF" opacity="0.6" />
        </Svg>
      </View>

      <View style={styles.welcomeCenter}>
        <SystemText 
          variant="h1" 
          align="center" 
          adjustsFontSizeToFit 
          numberOfLines={1} 
          style={styles.giantTitle}
        >
          ARISE
        </SystemText>
        <SystemText variant="muted" align="center" style={styles.welcomeSubtitle}>
          Level Up In Real Life
        </SystemText>
      </View>

      <SystemButton title="Get Started »" onPress={handleNext} />
    </Animated.View>
  );

  // 2. Class Acquisition System Notification Box
  const renderStep2 = () => (
    <View style={styles.centerBoxContainer}>
      <Animated.View entering={FadeIn.duration(500)} style={[styles.systemNotification, SYSTEM_GLOW]}>
        <View style={styles.notifHeader}>
          <ShieldAlert size={28} color="#FFFFFF" style={{ marginRight: 10 }} />
          <SystemText variant="h2" color="#FFFFFF">NOTIFICATION</SystemText>
        </View>

        <SystemText variant="body" align="center" style={styles.notifBody}>
          You have acquired the{"\n"}qualifications to be a{"\n"}
          <SystemText variant="body" color={COLORS.primary} style={{ fontStyle: 'italic', fontWeight: 'bold' }}>Player</SystemText>.
          {"\n"}Will you accept?
        </SystemText>

        <TouchableOpacity style={styles.acceptButton} onPress={handleNext}>
          <SystemText variant="h2" color="#FFFFFF" style={{ fontWeight: 'bold' }}>Accept</SystemText>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  // 3. Enter Name Screen (New)
  const renderStep3 = () => (
    <Animated.View entering={FadeIn.duration(400)} style={styles.surveyContainer}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}>
        <View>
          <SystemText variant="h2" align="center" style={styles.surveyTitle}>
            How shall the System{"\n"}address you, Hunter?
          </SystemText>
          
          <SystemCard glow style={{ marginTop: 40, padding: 20 }}>
            <SystemText variant="mono" style={{ fontSize: 11, color: COLORS.primary, marginBottom: 8 }}>PLAYER DESIGNATION</SystemText>
            <TextInput
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="Enter name..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              style={styles.nameInput}
            />
            <SystemText variant="muted" style={{ fontSize: 10, marginTop: 12 }}>
              This moniker will be bound to your stats board.
            </SystemText>
          </SystemCard>
        </View>

        <SystemButton
          title="Confirm Code Name"
          onPress={handleNext}
          disabled={!playerName.trim()}
          style={{ marginTop: 20 }}
        />
      </ScrollView>
    </Animated.View>
  );

  // 4. Motivation Screen
  const renderStep4 = () => {
    const motivations = ['Health', 'Weight Loss', 'Appearance', 'Stress Relief', 'Social Support', 'Enjoyment'];
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.surveyContainer}>
        <SystemText variant="h2" align="center" style={styles.surveyTitle}>
          What motivates you to{"\n"}work out?
        </SystemText>

        <ScrollView contentContainerStyle={styles.optionsList}>
          {motivations.map((m) => {
            const isSelected = motivation === m;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => setMotivation(m)}
              >
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <SystemText variant="body" color={isSelected ? COLORS.primary : '#FFFFFF'} style={{ fontWeight: '600' }}>
                  {m}
                </SystemText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <SystemButton title="Continue" onPress={handleNext} />
      </Animated.View>
    );
  };

  // 5. Muscle Focus Areas Screen
  const renderStep5 = () => {
    const areas = ['Full Body', 'Chest', 'Back', 'Arms', 'Shoulders', 'Abs', 'Legs', 'Glutes'];
    const toggleArea = (area: string) => {
      const subAreas = ['Chest', 'Back', 'Arms', 'Shoulders', 'Abs', 'Legs', 'Glutes'];
      if (area === 'Full Body') {
        if (focusAreas.includes('Full Body')) {
          setFocusAreas([]);
        } else {
          setFocusAreas(['Full Body', ...subAreas]);
        }
      } else {
        setFocusAreas((prev) => {
          let updated: string[];
          if (prev.includes(area)) {
            updated = prev.filter((a) => a !== area && a !== 'Full Body');
          } else {
            const nextTemp = [...prev, area];
            const allSelected = subAreas.every((sa) => nextTemp.includes(sa));
            if (allSelected) {
              updated = ['Full Body', ...subAreas];
            } else {
              updated = nextTemp;
            }
          }
          return updated;
        });
      }
    };

    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.surveyContainer}>
        <SystemText variant="h2" align="center" style={styles.surveyTitle}>
          Choose your focus areas
        </SystemText>

        <ScrollView contentContainerStyle={styles.optionsList}>
          {areas.map((area) => {
            const isSelected = focusAreas.includes(area);
            return (
              <TouchableOpacity
                key={area}
                style={[
                  styles.optionCard,
                  isSelected && (area === 'Full Body' ? styles.optionCardSelected : styles.focusCardSelected)
                ]}
                onPress={() => toggleArea(area)}
              >
                <View style={[styles.checkboxCircle, isSelected && styles.checkboxCircleSelected]}>
                  {isSelected && <Check size={14} color={COLORS.background} />}
                </View>
                <SystemText variant="body" color={isSelected ? (area === 'Full Body' ? COLORS.primary : '#10B981') : '#FFFFFF'} style={{ fontWeight: '600', flex: 1 }}>
                  {area}
                </SystemText>
                {area !== 'Full Body' && <MuscleHighlightIcon muscle={area.toLowerCase()} active={isSelected} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <SystemButton title="Continue" onPress={handleNext} />
      </Animated.View>
    );
  };

  // 6. Age Picker Screen
  const renderStep6 = () => {
    const handleIncrement = () => setAge((prev) => Math.min(100, prev + 1));
    const handleDecrement = () => setAge((prev) => Math.max(10, prev - 1));

    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.surveyContainer}>
        <SystemText variant="h2" align="center" style={styles.surveyTitle}>
          How old are you?
        </SystemText>

        <View style={styles.pickerSection}>
          <TouchableOpacity onPress={handleDecrement} style={styles.pickerArrow}>
            <ChevronUp size={36} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
          <SystemText variant="muted" align="center" style={styles.pickerDimmedText}>{age - 1}</SystemText>
          <View style={styles.pickerFocusBox}>
            <SystemText variant="h1" align="center" style={{ fontSize: 32, fontWeight: 'bold' }}>{age}</SystemText>
          </View>
          <SystemText variant="muted" align="center" style={styles.pickerDimmedText}>{age + 1}</SystemText>
          <TouchableOpacity onPress={handleIncrement} style={styles.pickerArrow}>
            <ChevronDown size={36} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        </View>

        <SystemButton title="Continue" onPress={handleNext} />
      </Animated.View>
    );
  };

  // 7. Height Picker Screen
  const renderStep7 = () => {
    const handleIncrement = () => setHeight((prev) => prev + 1);
    const handleDecrement = () => setHeight((prev) => Math.max(50, prev - 1));

    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.surveyContainer}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}>
          <View>
            <SystemText variant="h2" align="center" style={styles.surveyTitle}>
              How tall are you?
            </SystemText>

            <View style={styles.pickerSection}>
              <TouchableOpacity onPress={handleDecrement} style={styles.pickerArrow}>
                <ChevronUp size={36} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
              <SystemText variant="muted" align="center" style={styles.pickerDimmedText}>
                {height - 1} {heightUnit}
              </SystemText>
              <View style={styles.pickerFocusBox}>
                <SystemText variant="h1" align="center" style={{ fontSize: 32, fontWeight: 'bold' }}>
                  {height} {heightUnit}
                </SystemText>
              </View>
              <SystemText variant="muted" align="center" style={styles.pickerDimmedText}>
                {height + 1} {heightUnit}
              </SystemText>
              <TouchableOpacity onPress={handleIncrement} style={styles.pickerArrow}>
                <ChevronDown size={36} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>

            {/* Height Unit Toggle Switch */}
            <View style={styles.unitToggleRow}>
              <TouchableOpacity 
                onPress={() => {
                  if (heightUnit === 'ft') {
                    setHeight(Math.round(height * 30.48));
                    setHeightUnit('cm');
                  }
                }}
                style={styles.unitToggleLabel}
              >
                <SystemText variant="mono" color={heightUnit === 'cm' ? COLORS.primary : 'rgba(255,255,255,0.4)'}>cm</SystemText>
              </TouchableOpacity>
              <View style={styles.switchTrack}>
                <TouchableOpacity 
                  onPress={() => {
                    const newUnit = heightUnit === 'cm' ? 'ft' : 'cm';
                    const newVal = newUnit === 'ft' ? Math.round(height / 30.48) : Math.round(height * 30.48);
                    setHeightUnit(newUnit);
                    setHeight(newVal);
                  }}
                  style={[styles.switchThumb, { alignSelf: heightUnit === 'cm' ? 'flex-start' : 'flex-end' }]} 
                />
              </View>
              <TouchableOpacity 
                onPress={() => {
                  if (heightUnit === 'cm') {
                    setHeight(Math.round(height / 30.48));
                    setHeightUnit('ft');
                  }
                }}
                style={styles.unitToggleLabel}
              >
                <SystemText variant="mono" color={heightUnit === 'ft' ? COLORS.primary : 'rgba(255,255,255,0.4)'}>ft</SystemText>
              </TouchableOpacity>
            </View>
          </View>

          <SystemButton title="Continue" onPress={handleNext} style={{ marginTop: 20 }} />
        </ScrollView>
      </Animated.View>
    );
  };

  // 8. Current Weight Picker Screen
  const renderStep8 = () => {
    const handleIncrement = () => setWeight((prev) => prev + 1);
    const handleDecrement = () => setWeight((prev) => Math.max(20, prev - 1));

    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.surveyContainer}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}>
          <View>
            <SystemText variant="h2" align="center" style={styles.surveyTitle}>
              What is your current{"\n"}weight?
            </SystemText>

            <View style={styles.pickerSection}>
              <TouchableOpacity onPress={handleDecrement} style={styles.pickerArrow}>
                <ChevronUp size={36} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
              <SystemText variant="muted" align="center" style={styles.pickerDimmedText}>
                {weight - 1} {weightUnit}
              </SystemText>
              <View style={styles.pickerFocusBox}>
                <SystemText variant="h1" align="center" style={{ fontSize: 32, fontWeight: 'bold' }}>
                  {weight} {weightUnit}
                </SystemText>
              </View>
              <SystemText variant="muted" align="center" style={styles.pickerDimmedText}>
                {weight + 1} {weightUnit}
              </SystemText>
              <TouchableOpacity onPress={handleIncrement} style={styles.pickerArrow}>
                <ChevronDown size={36} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>

            {/* Weight Unit Toggle Switch */}
            <View style={styles.unitToggleRow}>
              <TouchableOpacity 
                onPress={() => {
                  if (weightUnit === 'lbs') {
                    setWeight(Math.round(weight * 0.453592));
                    setWeightUnit('kg');
                  }
                }}
                style={styles.unitToggleLabel}
              >
                <SystemText variant="mono" color={weightUnit === 'kg' ? COLORS.primary : 'rgba(255,255,255,0.4)'}>kg</SystemText>
              </TouchableOpacity>
              <View style={styles.switchTrack}>
                <TouchableOpacity 
                  onPress={() => {
                    const newUnit = weightUnit === 'kg' ? 'lbs' : 'kg';
                    const newVal = newUnit === 'lbs' ? Math.round(weight / 0.453592) : Math.round(weight * 0.453592);
                    setWeightUnit(newUnit);
                    setWeight(newVal);
                  }}
                  style={[styles.switchThumb, { alignSelf: weightUnit === 'kg' ? 'flex-start' : 'flex-end' }]} 
                />
              </View>
              <TouchableOpacity 
                onPress={() => {
                  if (weightUnit === 'kg') {
                    setWeight(Math.round(weight / 0.453592));
                    setWeightUnit('lbs');
                  }
                }}
                style={styles.unitToggleLabel}
              >
                <SystemText variant="mono" color={weightUnit === 'lbs' ? COLORS.primary : 'rgba(255,255,255,0.4)'}>lbs</SystemText>
              </TouchableOpacity>
            </View>
          </View>

          <SystemButton title="Continue" onPress={handleNext} style={{ marginTop: 20 }} />
        </ScrollView>
      </Animated.View>
    );
  };

  // 9. Target Weight Picker Screen
  const renderStep9 = () => {
    const handleIncrement = () => setTargetWeight((prev) => prev + 1);
    const handleDecrement = () => setTargetWeight((prev) => Math.max(20, prev - 1));

    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.surveyContainer}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}>
          <View>
            <SystemText variant="h2" align="center" style={styles.surveyTitle}>
              What is your target{"\n"}weight?
            </SystemText>

            <View style={styles.pickerSection}>
              <TouchableOpacity onPress={handleDecrement} style={styles.pickerArrow}>
                <ChevronUp size={36} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
              <SystemText variant="muted" align="center" style={styles.pickerDimmedText}>
                {targetWeight - 1} {targetWeightUnit}
              </SystemText>
              <View style={styles.pickerFocusBox}>
                <SystemText variant="h1" align="center" style={{ fontSize: 32, fontWeight: 'bold' }}>
                  {targetWeight} {targetWeightUnit}
                </SystemText>
              </View>
              <SystemText variant="muted" align="center" style={styles.pickerDimmedText}>
                {targetWeight + 1} {targetWeightUnit}
              </SystemText>
              <TouchableOpacity onPress={handleIncrement} style={styles.pickerArrow}>
                <ChevronDown size={36} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>

            {/* Target Weight Unit Toggle Switch */}
            <View style={styles.unitToggleRow}>
              <TouchableOpacity 
                onPress={() => {
                  if (targetWeightUnit === 'lbs') {
                    setTargetWeight(Math.round(targetWeight * 0.453592));
                    setTargetWeightUnit('kg');
                  }
                }}
                style={styles.unitToggleLabel}
              >
                <SystemText variant="mono" color={targetWeightUnit === 'kg' ? COLORS.primary : 'rgba(255,255,255,0.4)'}>kg</SystemText>
              </TouchableOpacity>
              <View style={styles.switchTrack}>
                <TouchableOpacity 
                  onPress={() => {
                    const newUnit = targetWeightUnit === 'kg' ? 'lbs' : 'kg';
                    const newVal = newUnit === 'lbs' ? Math.round(targetWeight / 0.453592) : Math.round(targetWeight * 0.453592);
                    setTargetWeightUnit(newUnit);
                    setTargetWeight(newVal);
                  }}
                  style={[styles.switchThumb, { alignSelf: targetWeightUnit === 'kg' ? 'flex-start' : 'flex-end' }]} 
                />
              </View>
              <TouchableOpacity 
                onPress={() => {
                  if (targetWeightUnit === 'kg') {
                    setTargetWeight(Math.round(targetWeight / 0.453592));
                    setTargetWeightUnit('lbs');
                  }
                }}
                style={styles.unitToggleLabel}
              >
                <SystemText variant="mono" color={targetWeightUnit === 'lbs' ? COLORS.primary : 'rgba(255,255,255,0.4)'}>lbs</SystemText>
              </TouchableOpacity>
            </View>
          </View>

          <SystemButton title="Continue" onPress={handleNext} style={{ marginTop: 20 }} />
        </ScrollView>
      </Animated.View>
    );
  };

  // 10. Health Issues Checklist
  const renderStep10 = () => {
    const issues = ['None', 'Knee', 'Hip Joints', 'Back or Hernia', 'Arms and Shoulders', 'Cant Do Jumps'];
    const toggleIssue = (issue: string) => {
      if (issue === 'None') {
        setHealthIssues(['None']);
      } else {
        setHealthIssues((prev) => {
          const filtered = prev.filter((i) => i !== 'None');
          return filtered.includes(issue) ? filtered.filter((i) => i !== issue) : [...filtered, issue];
        });
      }
    };

    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.surveyContainer}>
        <SystemText variant="h2" align="center" style={styles.surveyTitle}>
          Any health issues?
        </SystemText>

        <ScrollView contentContainerStyle={styles.optionsList}>
          {issues.map((issue) => {
            const isSelected = healthIssues.includes(issue);
            return (
              <TouchableOpacity
                key={issue}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => toggleIssue(issue)}
              >
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <SystemText variant="body" color={isSelected ? COLORS.primary : '#FFFFFF'} style={{ fontWeight: '600' }}>
                  {issue}
                </SystemText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <SystemButton title="Continue" onPress={handleNext} />
      </Animated.View>
    );
  };

  // 11. Equipment checklist
  const renderStep11 = () => {
    const items = ['None (Bodyweight)', 'Full gym', 'Barbells', 'Dumbbells', 'Kettlebells', 'Machines'];
    const toggleEquipment = (item: string) => {
      const gearOptions = ['Barbells', 'Dumbbells', 'Kettlebells', 'Machines'];
      const allGearWithGym = ['Full gym', ...gearOptions];
      
      if (item === 'None (Bodyweight)') {
        setEquipment((prev) => prev.includes('None (Bodyweight)') ? [] : ['None (Bodyweight)']);
      } else if (item === 'Full gym') {
        if (equipment.includes('Full gym')) {
          setEquipment([]);
        } else {
          setEquipment(allGearWithGym);
        }
      } else {
        setEquipment((prev) => {
          let updated: string[];
          if (prev.includes(item)) {
            updated = prev.filter((i) => i !== item && i !== 'Full gym' && i !== 'None (Bodyweight)');
          } else {
            const nextTemp = prev.filter((i) => i !== 'None (Bodyweight)');
            nextTemp.push(item);
            const allSelected = gearOptions.every((g) => nextTemp.includes(g));
            if (allSelected) {
              updated = allGearWithGym;
            } else {
              updated = nextTemp;
            }
          }
          return updated;
        });
      }
    };

    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.surveyContainer}>
        <SystemText variant="h2" align="center" style={styles.surveyTitle}>
          What equipment do you{"\n"}have access to?
        </SystemText>

        <ScrollView contentContainerStyle={styles.optionsList}>
          {items.map((item) => {
            const isSelected = equipment.includes(item);
            return (
              <TouchableOpacity
                key={item}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => toggleEquipment(item)}
              >
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <SystemText variant="body" color={isSelected ? COLORS.primary : '#FFFFFF'} style={{ fontWeight: '600' }}>
                  {item}
                </SystemText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <SystemButton title="Continue" onPress={handleNext} />
      </Animated.View>
    );
  };

  // 12. Workout Frequency Slider
  const renderStep12 = () => {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.surveyContainer}>
        <SystemText variant="h2" align="center" style={styles.surveyTitle}>
          How often would you{"\n"}like to work out?
        </SystemText>

        <View style={styles.sliderCenterSection}>
          <SystemText variant="h1" color={COLORS.primary} style={{ fontSize: 64, fontWeight: 'bold' }}>
            {frequency}x
          </SystemText>
          <SystemText variant="body" style={{ fontSize: 16, marginTop: -8, marginBottom: 40 }}>
            {frequency} workouts a week
          </SystemText>

          {/* Discrete slider component compatible with Web/Mobile */}
          <View style={styles.customSliderContainer}>
            <View style={styles.customSliderTrack} />
            <View style={[styles.customSliderProgress, { width: `${((frequency - 1) / 6) * 100}%` }]} />
            
            {/* Tick Mark Buttons */}
            {[1, 2, 3, 4, 5, 6, 7].map((num) => {
              const active = num === frequency;
              return (
                <TouchableOpacity
                  key={`tick-${num}`}
                  style={[styles.sliderTick, { left: `${((num - 1) / 6) * 100}%` }]}
                  onPress={() => setFrequency(num)}
                >
                  <View style={[styles.sliderTickDot, active && styles.sliderTickDotActive]} />
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sliderLabelRow}>
            <SystemText variant="muted">Less</SystemText>
            <SystemText variant="muted">More</SystemText>
          </View>
        </View>

        <SystemButton title="Continue" onPress={handleNext} />
      </Animated.View>
    );
  };

  // 13. Summary Preview
  const renderStep13 = () => {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.surveyContainer}>
        <SystemText variant="h2" align="center" style={styles.surveyTitle}>
          Here's your summary{"\n"}preview. Tap continue to get{"\n"}your custom plan
        </SystemText>

        <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 20 }}>
          {/* Card 1: Weight projection curve */}
          <SystemCard glow>
            <SystemText variant="mono" style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>Summary</SystemText>
            <View style={styles.projectionChartContainer}>
              <SystemText variant="body" style={{ position: 'absolute', right: 10, top: 5, fontSize: 12, fontWeight: 'bold' }}>
                {targetWeight} {targetWeightUnit}
              </SystemText>
              <SystemText variant="body" style={{ position: 'absolute', left: 10, bottom: 5, fontSize: 12 }}>
                {weight} {weightUnit}
              </SystemText>
              
              {/* Custom SVG line projection chart */}
              <Svg width="100%" height="110" style={{ marginTop: 20 }}>
                <Defs>
                  <LinearGradient id="gradientLine" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0%" stopColor="#F97316" />
                    <Stop offset="100%" stopColor="#10B981" />
                  </LinearGradient>
                </Defs>
                <Path
                  d="M10,95 Q100,85 180,45 T310,15"
                  fill="none"
                  stroke="url(#gradientLine)"
                  strokeWidth="3"
                />
                <Circle cx="10" cy="95" r="4" fill="#F97316" />
                <Circle cx="310" cy="15" r="4" fill="#10B981" />
              </Svg>
            </View>
          </SystemCard>

          {/* Card 2: BMI Index */}
          <SystemCard glow={false}>
            <SystemText variant="mono" style={{ fontSize: 12, color: COLORS.textMuted }}>BMI Index</SystemText>
            <View style={styles.bmiContent}>
              <SystemText variant="h1" style={{ fontSize: 36, fontWeight: 'bold' }}>{bmi}</SystemText>
              <SystemText variant="body" color={COLORS.primary} style={{ fontWeight: 'bold', marginLeft: 16 }}>
                You're {bmiCategory}
              </SystemText>
            </View>

            {/* BMI horizontal scale */}
            <View style={styles.bmiScaleContainer}>
              <View style={styles.bmiTicksRow}>
                {[...Array(30)].map((_, i) => {
                  let tickColor = 'rgba(255,255,255,0.1)';
                  if (i < 7) tickColor = '#00BFFF'; // Underweight
                  else if (i < 17) tickColor = '#10B981'; // Normal
                  else if (i < 24) tickColor = '#FBBF24'; // Overweight
                  else tickColor = '#EF4444'; // Obese
                  
                  return <View key={i} style={[styles.bmiTickBar, { backgroundColor: tickColor }]} />;
                })}
              </View>
              <View style={styles.bmiScaleLabels}>
                <SystemText variant="muted" style={{ fontSize: 9 }}>Underweight</SystemText>
                <SystemText variant="muted" style={{ fontSize: 9 }}>Normal</SystemText>
                <SystemText variant="muted" style={{ fontSize: 9 }}>Overweight</SystemText>
                <SystemText variant="muted" style={{ fontSize: 9 }}>Obese</SystemText>
              </View>
            </View>
          </SystemCard>

          {/* Card 3: Fitness level */}
          <SystemCard glow={false} style={styles.flexBadgeRow}>
            <SystemText variant="mono" style={{ fontSize: 12 }}>Fitness level</SystemText>
            <SystemText variant="h2" color={COLORS.primary} style={{ fontWeight: 'bold' }}>Intermediate</SystemText>
          </SystemCard>
        </ScrollView>

        <SystemButton title="Continue" onPress={handleNext} />
      </Animated.View>
    );
  };

  // 14. Additional Recommendations
  const renderStep14 = () => {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.surveyContainer}>
        {/* Top Weekly Goal Header */}
        <SystemCard glow={false} style={{ marginVertical: 0, paddingVertical: 12, alignItems: 'center' }}>
          <SystemText variant="h2" style={{ fontWeight: 'bold' }}>{frequency} workouts</SystemText>
          <SystemText variant="muted" style={{ fontSize: 10 }}>weekly goal</SystemText>
        </SystemCard>

        <SystemText variant="h2" style={{ marginVertical: 16 }}>
          Additional Recommendations
        </SystemText>

        <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 20 }}>
          {/* Card 1: Supplements */}
          <SystemCard glow>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <FlaskConical size={28} color="#10B981" />
            </View>
            <SystemText variant="h2" align="center" style={{ fontWeight: 'bold', marginBottom: 8 }}>Supplements</SystemText>
            <SystemText variant="body" align="center" style={{ fontSize: 13, lineHeight: 18 }}>
              Supplements can be beneficial in supporting your goals. Consider the following: Protein supplements, creatine monohydrate, BCAAs, beta-alanine.
            </SystemText>
          </SystemCard>

          {/* Card 2: System Advice */}
          <SystemCard glow={false}>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <PencilLine size={28} color={COLORS.primary} />
            </View>
            <SystemText variant="h2" align="center" style={{ fontWeight: 'bold', marginBottom: 8 }}>The System Advice</SystemText>
            <SystemText variant="body" align="center" style={{ fontSize: 13, lineHeight: 18 }}>
              To maximize muscle building, focus on compound exercises targeting multiple muscle groups and prioritize consuming enough protein to support muscle repair and growth.
            </SystemText>
          </SystemCard>
        </ScrollView>

        <SystemButton title="Continue" onPress={handleNext} />
      </Animated.View>
    );
  };

  // 15. Calendar Day Grid Generation
  const renderStep15 = () => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const getWorkoutDayIndices = (freq: number) => {
      if (freq === 1) return [1];
      if (freq === 2) return [1, 4];
      if (freq === 3) return [1, 3, 5];
      if (freq === 4) return [1, 2, 4, 5];
      if (freq === 5) return [1, 2, 4, 5, 6];
      if (freq === 6) return [1, 2, 3, 4, 5, 6];
      return [0, 1, 2, 3, 4, 5, 6];
    };
    
    const workoutIndices = getWorkoutDayIndices(frequency);

    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.surveyContainer}>
        <SystemText variant="h2" align="center" style={styles.surveyTitle}>
          All done! <Check size={18} color="#10B981" />
        </SystemText>
        <SystemText variant="h2" align="center" style={{ fontWeight: 'bold', marginBottom: 40 }}>
          Time to generate{"\n"}your custom plan
        </SystemText>

        {/* 4x7 grid showing workout days */}
        <View style={styles.calendarGrid}>
          <View style={styles.calendarRow}>
            {days.map((day, idx) => (
              <SystemText key={`head-${idx}`} variant="mono" style={styles.calendarDayHeader}>{day}</SystemText>
            ))}
          </View>

          {[...Array(4)].map((_, weekIdx) => (
            <View key={`week-${weekIdx}`} style={styles.calendarRow}>
              {days.map((_, dayIdx) => {
                const isWorkout = workoutIndices.includes(dayIdx);
                return (
                  <View key={`day-${weekIdx}-${dayIdx}`} style={styles.calendarCell}>
                    {isWorkout ? (
                      <Calendar size={18} color={COLORS.primary} style={{ opacity: 0.8 }} />
                    ) : (
                      <View style={styles.calendarEmptyCell} />
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <SystemButton title="Continue" onPress={handleNext} />
      </Animated.View>
    );
  };

  // 16. Plan Generation Status Progress Screen
  const renderStep16 = () => {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.surveyContainer}>
        <SystemText variant="h1" align="center" style={{ fontSize: 48, fontWeight: 'bold', color: COLORS.primary, marginBottom: 12 }}>
          {loadingProgress}%
        </SystemText>
        <SystemText variant="h2" align="center" style={{ fontWeight: 'bold', marginBottom: 24 }}>
          We're creating a{"\n"}personal plan for you
        </SystemText>

        {/* Progress Bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${loadingProgress}%` }]} />
        </View>

        <SystemText variant="mono" align="center" style={{ fontStyle: 'italic', marginBottom: 32, color: COLORS.primary }}>
          [{statusText}]
        </SystemText>

        {/* Checking Status Box */}
        <SystemCard glow={false}>
          <SystemText variant="mono" align="center" style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 16 }}>Status</SystemText>
          <View style={{ gap: 12 }}>
            <View style={styles.statusCheckRow}>
              <SystemText variant="body" color={statusChecked.physical ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}>Physical Attributes</SystemText>
              {statusChecked.physical && <Check size={16} color="#10B981" />}
            </View>
            <View style={styles.statusCheckRow}>
              <SystemText variant="body" color={statusChecked.fitness ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}>Fitness Level</SystemText>
              {statusChecked.fitness && <Check size={16} color="#10B981" />}
            </View>
            <View style={styles.statusCheckRow}>
              <SystemText variant="body" color={statusChecked.power ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}>Power Analysis</SystemText>
              {statusChecked.power && <Check size={16} color="#10B981" />}
            </View>
            <View style={styles.statusCheckRow}>
              <SystemText variant="body" color={statusChecked.rank ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}>Rank Calibration</SystemText>
              {statusChecked.rank && <Check size={16} color="#10B981" />}
            </View>
            <View style={styles.statusCheckRow}>
              <SystemText variant="body" color={statusChecked.workout ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}>Workout Generation</SystemText>
              {statusChecked.workout && <Check size={16} color="#10B981" />}
            </View>
          </View>
        </SystemCard>

        <View style={styles.generatingFooter}>
          <SystemText variant="muted" style={{ fontSize: 12 }}>Over 100,000+ Programs Generated</SystemText>
        </View>
      </Animated.View>
    );
  };

  // 17. RPG Stats Cards
  const renderStep17 = () => {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.surveyContainer}>
        <SystemText variant="h2" align="center" style={{ fontWeight: 'bold', marginBottom: 12 }}>
          Your Arise Stats
        </SystemText>
        <SystemText variant="body" align="center" style={{ marginBottom: 40, fontSize: 13, lineHeight: 18 }}>
          Based on your answers, this is your current Arise stats, which reflects your lifestyle and training habits.
        </SystemText>

        {/* 2x2 Grid of attribute cards */}
        <View style={styles.statsGrid}>
          <SystemCard glow={false} style={styles.statBox}>
            <View style={styles.statBoxHeader}>
              <SystemText variant="body">Strength</SystemText>
              <SystemText variant="h2" color="#EF4444" style={{ fontWeight: 'bold' }}>{stats.STR}</SystemText>
            </View>
            <View style={styles.statBarTrack}>
              <Animated.View style={[styles.statBarFill, animatedBarWidth(stats.STR)]} />
            </View>
          </SystemCard>

          <SystemCard glow={false} style={styles.statBox}>
            <View style={styles.statBoxHeader}>
              <SystemText variant="body">Vitality</SystemText>
              <SystemText variant="h2" color="#EF4444" style={{ fontWeight: 'bold' }}>{stats.VIT}</SystemText>
            </View>
            <View style={styles.statBarTrack}>
              <Animated.View style={[styles.statBarFill, animatedBarWidth(stats.VIT)]} />
            </View>
          </SystemCard>

          <SystemCard glow={false} style={styles.statBox}>
            <View style={styles.statBoxHeader}>
              <SystemText variant="body">Agility</SystemText>
              <SystemText variant="h2" color="#EF4444" style={{ fontWeight: 'bold' }}>{stats.AGI}</SystemText>
            </View>
            <View style={styles.statBarTrack}>
              <Animated.View style={[styles.statBarFill, animatedBarWidth(stats.AGI)]} />
            </View>
          </SystemCard>

          <SystemCard glow={false} style={styles.statBox}>
            <View style={styles.statBoxHeader}>
              <SystemText variant="body">Endurance</SystemText>
              <SystemText variant="h2" color="#EF4444" style={{ fontWeight: 'bold' }}>{stats.END}</SystemText>
            </View>
            <View style={styles.statBarTrack}>
              <Animated.View style={[styles.statBarFill, animatedBarWidth(stats.END)]} />
            </View>
          </SystemCard>
        </View>

        <SystemButton title="Show Potential" onPress={handleNext} />
      </Animated.View>
    );
  };

  // 18. Potential Growth Chart
  const renderStep18 = () => {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.surveyContainer}>
        <View style={styles.potentialChartContainer}>
          <Svg width="100%" height="150">
            <Line x1="40" y1="10" x2="300" y2="10" stroke="rgba(255,255,255,0.05)" />
            <Line x1="40" y1="50" x2="300" y2="50" stroke="rgba(255,255,255,0.05)" />
            <Line x1="40" y1="90" x2="300" y2="90" stroke="rgba(255,255,255,0.05)" />
            <Line x1="40" y1="130" x2="300" y2="130" stroke="rgba(255,255,255,0.05)" />
            
            <Rect x="10" y="10" width="20" height="15" fill="none" />
            <Line x1="35" y1="130" x2="35" y2="10" stroke="rgba(255,255,255,0.1)" />

            <Svg>
              <Line x1="35" y1="130" x2="280" y2="130" stroke="none" />
            </Svg>
            
            <Path
              d="M40,125 Q120,70 190,30 T280,10"
              fill="none"
              stroke="#10B981"
              strokeWidth="3"
            />
            <Path
              d="M40,125 L120,115 L200,112 L280,118"
              fill="none"
              stroke="#6B7280"
              strokeWidth="2"
              opacity="0.8"
            />

            <Svg>
              <Circle cx="190" cy="30" r="5" fill="#10B981" />
              <Line x1="190" y1="30" x2="190" y2="130" stroke="#10B981" strokeDasharray="3 3" />
            </Svg>
          </Svg>
          
          <SystemText variant="mono" style={{ position: 'absolute', left: 15, top: 10, fontSize: 10 }}>D</SystemText>
          <SystemText variant="mono" style={{ position: 'absolute', left: 15, top: 50, fontSize: 10 }}>C</SystemText>
          <SystemText variant="mono" style={{ position: 'absolute', left: 15, top: 90, fontSize: 10 }}>B</SystemText>
          <SystemText variant="mono" style={{ position: 'absolute', left: 15, top: 130, fontSize: 10 }}>A</SystemText>
          <SystemText variant="muted" style={{ position: 'absolute', right: 30, top: 100, fontSize: 9 }}>without Arise</SystemText>
          <SystemText variant="mono" style={{ position: 'absolute', left: 170, bottom: 5, fontSize: 10, color: '#10B981' }}>month 3</SystemText>
        </View>

        <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
          <SystemCard glow={false} style={styles.growthRow}>
            <View style={styles.checkIconWrapper}>
              <Check size={14} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <SystemText variant="body" style={{ fontWeight: 'bold' }}>
                Your <SystemText variant="body" color="#10B981" style={{ fontWeight: 'bold' }}>strength</SystemText> will increase significantly
              </SystemText>
              <SystemText variant="muted" style={{ fontSize: 11, marginTop: 2 }}>
                Progressive overload training will help you lift heavier weights and build lean muscle
              </SystemText>
            </View>
          </SystemCard>

          <SystemCard glow={false} style={styles.growthRow}>
            <View style={styles.checkIconWrapper}>
              <Check size={14} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <SystemText variant="body" style={{ fontWeight: 'bold' }}>
                You'll have more <SystemText variant="body" color="#10B981" style={{ fontWeight: 'bold' }}>energy</SystemText>
              </SystemText>
              <SystemText variant="muted" style={{ fontSize: 11, marginTop: 2 }}>
                Better conditioning means you won't get tired during daily activities
              </SystemText>
            </View>
          </SystemCard>

          <SystemCard glow={false} style={styles.growthRow}>
            <View style={styles.checkIconWrapper}>
              <Check size={14} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <SystemText variant="body" style={{ fontWeight: 'bold' }}>
                Your <SystemText variant="body" color="#10B981" style={{ fontWeight: 'bold' }}>confidence</SystemText> will drastically improve
              </SystemText>
              <SystemText variant="muted" style={{ fontSize: 11, marginTop: 2 }}>
                As you transform your body, you'll feel better in all aspects.
              </SystemText>
            </View>
          </SystemCard>
        </ScrollView>

        <SystemButton title="Unlock My Potential" onPress={handleNext} />
      </Animated.View>
    );
  };

  // 19. Awakening Belief Question
  const renderStep19 = () => {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.welcomeContainer}>
        <View style={styles.dungeonSilhouette}>
          <Svg width="100%" height="240" viewBox="0 0 100 100">
            <Path d="M10 90 V20 H25 V90 M30 90 V10 H45 V90 M55 90 V10 H70 V90 M75 90 V20 H90 V90" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
            <Path d="M45 80 L52 60 H56 L62 80 M52 68 H58 M54 58 L54 75" stroke="#00BFFF" strokeWidth="2" fill="none" />
            <Circle cx="54" cy="55" r="3" fill="#00BFFF" />
          </Svg>
        </View>

        <View style={styles.topLogo}>
          <SystemText variant="h2" style={{ fontWeight: 'bold', fontFamily: 'Space Grotesk' }}>Arise</SystemText>
        </View>

        <View style={styles.beliefBody}>
          <SystemText variant="h2" align="center" style={{ fontSize: 24, fontWeight: 'bold', lineHeight: 32 }}>
            Do you believe that{"\n"}small changes can lead{"\n"}to big{"\n"}transformations?
          </SystemText>
        </View>

        <View style={styles.beliefButtonsRow}>
          <TouchableOpacity 
            style={styles.noOutlineBtn} 
            onPress={() => { setBelieveInTransform(false); handleNext(); }}
          >
            <SystemText variant="h2" color="#FFFFFF" style={{ fontWeight: 'bold' }}>No</SystemText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.yesFilledBtn} 
            onPress={() => { setBelieveInTransform(true); handleNext(); }}
          >
            <SystemText variant="h2" color={COLORS.background} style={{ fontWeight: 'bold' }}>Yes</SystemText>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // 20. Google Account Authentication
  const renderStep20 = () => {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.welcomeContainer}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <SystemText variant="h2" style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
            Sign in to save your data
          </SystemText>
          <TouchableOpacity onPress={handleNext}>
            <SystemText variant="muted" style={{ textDecorationLine: 'underline' }}>Or skip for now</SystemText>
          </TouchableOpacity>

          <View style={styles.hudIllustrationContainer}>
            <View style={[styles.hudPanel, SYSTEM_GLOW]}>
              <View style={styles.hudSpinner} />
              <SystemText variant="mono" style={{ fontSize: 13, color: COLORS.primary, fontWeight: 'bold' }}>
                SAVING DATA...
              </SystemText>
            </View>
            <Svg width="150" height="150" viewBox="0 0 100 100" style={{ marginTop: 10 }}>
              <Path d="M10 80 Q30 50 45 40 L45 25 H55 L55 40 Q70 50 90 80" stroke="rgba(255,255,255,0.2)" strokeWidth="3" fill="none" />
              <Circle cx="50" cy="18" r="7" fill="rgba(255,255,255,0.2)" />
              <Line x1="45" y1="40" x2="60" y2="15" stroke={COLORS.primary} strokeWidth="2" />
            </Svg>
          </View>
        </View>

        <View style={{ width: '100%', paddingBottom: 24 }}>
          <SystemButton title="G  Continue with Google" onPress={handleNext} />
          
          <SystemText variant="muted" align="center" style={{ fontSize: 10, marginTop: 16 }}>
            By continuing, you agree to our <SystemText variant="muted" color={COLORS.primary} style={{ fontSize: 10 }}>Terms</SystemText> and <SystemText variant="muted" color={COLORS.primary} style={{ fontSize: 10 }}>Privacy Policy</SystemText>
          </SystemText>
        </View>
      </Animated.View>
    );
  };

  // 21. Thumbprint Impression Screen (New)
  const renderStep21 = () => {
    const percent = Math.round(scanSharedProgress.value * 100);
    return (
      <Animated.View entering={FadeIn.duration(400)} style={[styles.welcomeContainer, { justifyContent: 'center' }]}>
        {/* Full-screen fill transition overlay */}
        <Animated.View style={[styles.scanFillOverlay, scanFillStyle]} pointerEvents="none" />

        <SystemText variant="h2" align="center" style={{ color: COLORS.primary, letterSpacing: 4, marginBottom: 16, fontWeight: 'bold' }}>
          AWAKENING PROTOCOL
        </SystemText>
        
        <SystemText variant="body" align="center" style={{ marginBottom: 40, lineHeight: 22, paddingHorizontal: 12 }}>
          Place and hold your thumb on the biometric scanner below to finalize Hunter authorization.
        </SystemText>

        <View style={styles.scannerWrapper}>
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={startScanning}
            onPressOut={stopScanning}
            style={[styles.scannerButton, isScanning && styles.scannerButtonActive]}
          >
            {/* Simple pulsing SVG thumbprint */}
            <Svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke={isScanning ? COLORS.primary : '#FFFFFF'} strokeWidth="1.5">
              <Path d="M12 2a10 10 0 0 0-8 8m8-8a10 10 0 0 1 8 8" strokeLinecap="round" />
              <Path d="M12 6a6 6 0 0 0-4.8 6m4.8-6a6 6 0 0 1 4.8 6" strokeLinecap="round" />
              <Path d="M12 10a2 2 0 0 0-1.6 2m1.6-2a2 2 0 0 1 1.6 2" strokeLinecap="round" />
              <Path d="M8 15a4 4 0 0 0 8 0" strokeLinecap="round" />
              <Path d="M6 18a6 6 0 0 0 12 0" strokeLinecap="round" />
              <Path d="M4 21a8 8 0 0 0 16 0" strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>

          <SystemText variant="mono" align="center" style={{ marginTop: 24, fontSize: 16, color: isScanning ? COLORS.primary : '#FFFFFF' }}>
            {isScanning ? `AWAKENING SYNC: ${percent}%` : 'HOLD THUMB TO AUTHORIZE'}
          </SystemText>
        </View>
      </Animated.View>
    );
  };

  // 22. Awakening Program Final Summary & Launch
  const renderStep22 = () => {
    const activeMuscles = focusAreas.length > 0 ? focusAreas.join(', ').toLowerCase() : 'full-body muscles';
    const gearUsed = equipment.length > 0 ? equipment.join(', ').toLowerCase() : 'bodyweight';

    const handleStartProgram = async () => {
      // Save stats and preferences to Zustand store
      setInitialData({
        name: playerName,
        biometrics: {
          weight: weightInKg,
          height: heightInCm,
          age: age,
          sex: 'male',
          hrv_baseline: 60,
        },
        focusAreas: focusAreas,
        equipment: equipment,
        frequency: frequency,
        motivation: motivation,
        healthIssues: healthIssues,
        stats: stats, // save calculated RPG stats
        goal: motivation.toLowerCase().includes('loss') ? 'cut' : 'bulk',
      });

      try {
        // Set completed in storage
        await AsyncStorage.setItem('onboarding_completed', 'true');
      } catch (e) {
        console.warn('Failed to save onboarding completion state:', e);
      }

      // Navigate to tabs
      router.replace('/(tabs)');
    };

    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.surveyContainer}>
        <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 20 }}>
          {/* Card 1: Water Goal */}
          <SystemCard glow style={styles.resourceSummaryBox}>
            <Droplet size={28} color="#00BFFF" style={{ marginBottom: 6 }} />
            <SystemText variant="muted" style={{ fontSize: 10, textTransform: 'uppercase' }}>Your water goal</SystemText>
            <SystemText variant="h1" color="#FFFFFF" style={{ fontSize: 28, fontWeight: 'bold' }}>
              {waterGoalCups} cups
            </SystemText>
            <SystemText variant="muted" style={{ fontSize: 10 }}>per day</SystemText>
          </SystemCard>

          {/* Cards 2 & 3 Side by Side */}
          <View style={styles.resourceSideRow}>
            <SystemCard glow={false} style={[styles.resourceSummaryBox, { flex: 1 }]}>
              <Clock size={24} color="#FBBF24" style={{ marginBottom: 6 }} />
              <SystemText variant="h1" style={{ fontSize: 24, fontWeight: 'bold' }}>50 min</SystemText>
              <SystemText variant="muted" style={{ fontSize: 9 }}>workout</SystemText>
            </SystemCard>
            <SystemCard glow={false} style={[styles.resourceSummaryBox, { flex: 1 }]}>
              <Clock size={24} color="#10B981" style={{ marginBottom: 6 }} />
              <SystemText variant="h1" style={{ fontSize: 24, fontWeight: 'bold' }}>1.5 min</SystemText>
              <SystemText variant="muted" style={{ fontSize: 9 }}>rest time</SystemText>
            </SystemCard>
          </View>

          {/* Card 4: Weekly Goal */}
          <SystemCard glow={false} style={styles.resourceSummaryBox}>
            <Calendar size={24} color={COLORS.primary} style={{ marginBottom: 6 }} />
            <SystemText variant="h1" style={{ fontSize: 24, fontWeight: 'bold' }}>
              {frequency} workouts
            </SystemText>
            <SystemText variant="muted" style={{ fontSize: 9 }}>weekly goal</SystemText>
          </SystemCard>

          {/* Program description */}
          <View style={{ marginTop: 8 }}>
            <SystemText variant="h2" align="center" style={{ fontWeight: 'bold', marginBottom: 8 }}>
              The Awakening Program
            </SystemText>
            <SystemText variant="body" align="center" style={{ fontSize: 13, lineHeight: 18 }}>
              A {frequency}-day per week muscle building program targeting {activeMuscles} using {gearUsed} equipment.
            </SystemText>
          </View>
        </ScrollView>

        <SystemButton title="Start My Program" onPress={handleStartProgram} />
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Survey Header Progress Bar */}
      {step >= 3 && step <= 12 && (
        <View style={styles.surveyHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.surveyProgressTrack}>
            <Animated.View style={[styles.surveyProgressFill, surveyProgressStyle]} />
          </View>
        </View>
      )}

      {/* Conditional Steps Renderer */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      {step === 5 && renderStep5()}
      {step === 6 && renderStep6()}
      {step === 7 && renderStep7()}
      {step === 8 && renderStep8()}
      {step === 9 && renderStep9()}
      {step === 10 && renderStep10()}
      {step === 11 && renderStep11()}
      {step === 12 && renderStep12()}
      {step === 13 && renderStep13()}
      {step === 14 && renderStep14()}
      {step === 15 && renderStep15()}
      {step === 16 && renderStep16()}
      {step === 17 && renderStep17()}
      {step === 18 && renderStep18()}
      {step === 19 && renderStep19()}
      {step === 20 && renderStep20()}
      {step === 21 && renderStep21()}
      {step === 22 && renderStep22()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  silhouetteAura: {
    position: 'absolute',
    top: '15%',
    alignSelf: 'center',
    width: 350,
    height: 350,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topLogo: {
    alignItems: 'center',
    marginTop: 20,
  },
  welcomeCenter: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  giantTitle: {
    fontSize: 56,
    fontWeight: 'bold',
    fontFamily: 'Space Grotesk',
    letterSpacing: 10,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 191, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    textAlign: 'center',
    width: '100%',
  },
  welcomeSubtitle: {
    fontSize: 16,
    marginTop: 10,
    letterSpacing: 1,
  },
  centerBoxContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  systemNotification: {
    backgroundColor: 'rgba(8, 10, 15, 0.85)',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#00BFFF',
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  notifBody: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    color: '#FFFFFF',
  },
  acceptButton: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 24,
    backgroundColor: '#080A0F',
  },
  surveyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  surveyProgressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  surveyProgressFill: {
    height: '100%',
    backgroundColor: '#00BFFF',
    shadowColor: '#00BFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  surveyContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  surveyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    lineHeight: 28,
  },
  optionsList: {
    gap: 12,
    paddingVertical: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(0, 191, 255, 0.05)',
  },
  focusCardSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCircleSelected: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
  pickerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  pickerArrow: {
    padding: 8,
  },
  pickerDimmedText: {
    fontSize: 20,
    opacity: 0.3,
    marginVertical: 4,
  },
  pickerFocusBox: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    minWidth: 160,
    marginVertical: 4,
  },
  unitToggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  unitToggleLabel: {
    paddingHorizontal: 8,
  },
  switchTrack: {
    width: 44,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 2,
    marginHorizontal: 8,
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
  },
  sliderCenterSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customSliderContainer: {
    width: '100%',
    height: 30,
    justifyContent: 'center',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  customSliderTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    width: '100%',
  },
  customSliderProgress: {
    position: 'absolute',
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    left: 10,
  },
  sliderTick: {
    position: 'absolute',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 0,
  },
  sliderTickDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  sliderTickDotActive: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  projectionChartContainer: {
    height: 110,
    width: '100%',
    justifyContent: 'center',
  },
  bmiContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  bmiScaleContainer: {
    marginTop: 8,
  },
  bmiTicksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 14,
  },
  bmiTickBar: {
    width: 6,
    height: '100%',
    borderRadius: 1,
  },
  bmiScaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  flexBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  calendarGrid: {
    gap: 10,
    marginVertical: 20,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarDayHeader: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  calendarCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarEmptyCell: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  statusCheckRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  generatingFooter: {
    alignItems: 'center',
    marginTop: 20,
  },
  statsGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  statBox: {
    width: '48%',
    padding: 12,
    marginVertical: 0,
    justifyContent: 'space-between',
    minHeight: 80,
  },
  statBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    backgroundColor: '#EF4444',
  },
  potentialChartContainer: {
    height: 160,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  growthRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingVertical: 12,
    marginVertical: 0,
  },
  checkIconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  dungeonSilhouette: {
    width: '100%',
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  beliefBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  beliefButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 16,
    paddingBottom: 24,
  },
  noOutlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 30,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  yesFilledBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hudIllustrationContainer: {
    height: 220,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  hudPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(8, 10, 15, 0.9)',
    borderWidth: 1.5,
    borderColor: '#00BFFF',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  hudSpinner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#00BFFF',
    borderTopColor: 'transparent',
  },
  resourceSummaryBox: {
    alignItems: 'center',
    paddingVertical: 14,
    marginVertical: 0,
  },
  resourceSideRow: {
    flexDirection: 'row',
    gap: 12,
  },
  // New styles for Name page and Thumb Impression Scanner
  nameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 191, 255, 0.3)',
    borderRadius: 6,
    color: '#FFFFFF',
    fontSize: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontFamily: 'Space Grotesk',
  },
  scanFillOverlay: {
    position: 'absolute',
    top: '35%',
    left: '50%',
    marginLeft: -150,
    marginTop: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0, 191, 255, 0.98)',
    zIndex: 9999,
  },
  scannerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
  },
  scannerButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00BFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  scannerButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(0, 191, 255, 0.1)',
    shadowOpacity: 0.7,
    shadowRadius: 25,
  },
  pulseRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 75,
    borderWidth: 1,
    borderColor: 'rgba(0, 191, 255, 0.4)',
    opacity: 0.5,
  },
});
