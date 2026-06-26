/**
 * FoodSearchBar — Searchable food selector with inline results.
 * Connects to the nutrition dataset service.
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SystemText } from './SystemText';
import { SystemCard } from './SystemCard';
import { SystemButton } from './SystemButton';
import { COLORS } from '../theme';
import { FoodItem } from '../nutrition/nutritionTypes';
import { searchFood } from '../nutrition/nutritionService';
import { useNutritionStore } from '../stores/nutritionStore';

interface Props {
  onLogFood?: (food: FoodItem, grams: number, mealType: any) => void;
}

const MEAL_TYPES = [
  { label: '🌅 Breakfast', value: 'breakfast' },
  { label: '💪 Pre-Workout', value: 'pre-workout' },
  { label: '🍱 Lunch', value: 'lunch' },
  { label: '⚡ Post-Workout', value: 'post-workout' },
  { label: '🌙 Dinner', value: 'dinner' },
  { label: '🍎 Snack', value: 'snack' },
] as const;

export const FoodSearchBar: React.FC<Props> = ({ onLogFood }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servingG, setServingG] = useState('100');
  const [mealType, setMealType] = useState<typeof MEAL_TYPES[number]['value']>('lunch');
  const [showModal, setShowModal] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { logFood } = useNutritionStore();

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      const found = searchFood(text, 15);
      setResults(found);
      setSearching(false);
    }, 300);
  }, []);

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setServingG(String(food.servingG));
    setResults([]);
    setQuery(food.name);
    setShowModal(true);
  };

  const handleLog = () => {
    if (!selectedFood) return;
    const grams = parseFloat(servingG) || selectedFood.servingG;
    logFood(selectedFood, grams, mealType);
    if (onLogFood) onLogFood(selectedFood, grams, mealType);
    setShowModal(false);
    setSelectedFood(null);
    setQuery('');
    setServingG('100');
  };

  const scaledKcal = selectedFood
    ? Math.round(selectedFood.kcal * (parseFloat(servingG) || 100) / (selectedFood.servingG || 100))
    : 0;
  const scaledProtein = selectedFood
    ? Math.round(selectedFood.protein * (parseFloat(servingG) || 100) / (selectedFood.servingG || 100) * 10) / 10
    : 0;

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchRow}>
        <View style={styles.inputWrapper}>
          <SystemText style={styles.searchIcon}>🔍</SystemText>
          <TextInput
            style={styles.input}
            placeholder="Search food (Chicken, Idli, Rice...)"
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => { setQuery(''); setResults([]); }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <SystemText style={{ color: COLORS.textMuted, fontSize: 16 }}>✕</SystemText>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results */}
      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => handleSelectFood(item)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <SystemText variant="body" style={styles.foodName} numberOfLines={1}>
                    {item.name}
                  </SystemText>
                  <SystemText variant="muted" style={{ fontSize: 11 }}>
                    {item.source === 'indian' ? '🇮🇳' : '🌍'} {item.servingG}g
                  </SystemText>
                </View>
                <View style={styles.macroPreview}>
                  <SystemText style={styles.kcalBadge}>{item.kcal} kcal</SystemText>
                  <SystemText style={styles.proteinTag}>{item.protein}g P</SystemText>
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
          {searching && (
            <SystemText variant="muted" align="center" style={{ padding: 8, fontSize: 11 }}>
              Searching database...
            </SystemText>
          )}
        </View>
      )}

      {/* Log Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <Pressable>
              <SystemCard style={styles.modalCard}>
                <SystemText variant="h2" style={{ marginBottom: 4 }} numberOfLines={2}>
                  {selectedFood?.name.toUpperCase()}
                </SystemText>
                {selectedFood?.isEstimated && (
                  <SystemText variant="muted" style={{ fontSize: 10, marginBottom: 8 }}>
                    ⚡ AI ESTIMATED VALUES
                  </SystemText>
                )}

                {/* Serving Size */}
                <SystemText variant="muted" style={styles.label}>SERVING SIZE (g)</SystemText>
                <TextInput
                  style={styles.servingInput}
                  value={servingG}
                  onChangeText={setServingG}
                  keyboardType="numeric"
                  returnKeyType="done"
                  placeholderTextColor={COLORS.textMuted}
                />

                {/* Live Preview */}
                <View style={styles.macroRow}>
                  <View style={styles.macroCell}>
                    <SystemText variant="h2" color={COLORS.primary}>{scaledKcal}</SystemText>
                    <SystemText variant="muted" style={{ fontSize: 9 }}>KCAL</SystemText>
                  </View>
                  <View style={styles.macroCell}>
                    <SystemText variant="h2" color={COLORS.danger}>{scaledProtein}g</SystemText>
                    <SystemText variant="muted" style={{ fontSize: 9 }}>PROTEIN</SystemText>
                  </View>
                  <View style={styles.macroCell}>
                    <SystemText variant="h2" color={COLORS.primary}>
                      {Math.round((selectedFood?.carbs ?? 0) * (parseFloat(servingG) || 100) / (selectedFood?.servingG || 100) * 10) / 10}g
                    </SystemText>
                    <SystemText variant="muted" style={{ fontSize: 9 }}>CARBS</SystemText>
                  </View>
                  <View style={styles.macroCell}>
                    <SystemText variant="h2" color={COLORS.gold}>
                      {Math.round((selectedFood?.fat ?? 0) * (parseFloat(servingG) || 100) / (selectedFood?.servingG || 100) * 10) / 10}g
                    </SystemText>
                    <SystemText variant="muted" style={{ fontSize: 9 }}>FAT</SystemText>
                  </View>
                </View>

                {/* Meal Type */}
                <SystemText variant="muted" style={[styles.label, { marginTop: 12 }]}>MEAL TYPE</SystemText>
                <View style={styles.mealTypeGrid}>
                  {MEAL_TYPES.map(mt => (
                    <TouchableOpacity
                      key={mt.value}
                      style={[styles.mealTypeBtn, mealType === mt.value && styles.mealTypeBtnActive]}
                      onPress={() => setMealType(mt.value)}
                      activeOpacity={0.7}
                    >
                      <SystemText
                        style={[styles.mealTypeTxt, mealType === mt.value && { color: COLORS.background }]}
                      >
                        {mt.label}
                      </SystemText>
                    </TouchableOpacity>
                  ))}
                </View>

                <SystemButton
                  title="LOG FOOD"
                  onPress={handleLog}
                  style={{ marginTop: 16 }}
                />
                <SystemButton
                  title="CANCEL"
                  variant="outline"
                  onPress={() => setShowModal(false)}
                  style={{ marginTop: 8 }}
                />
              </SystemCard>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 30, 45, 0.9)',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontFamily: 'SpaceMono',
    padding: 0,
  },
  resultsContainer: {
    backgroundColor: 'rgba(15, 18, 28, 0.98)',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 280,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  foodName: {
    fontSize: 13,
    marginBottom: 2,
  },
  macroPreview: {
    alignItems: 'flex-end',
    gap: 2,
  },
  kcalBadge: {
    fontSize: 12,
    color: COLORS.primary,
    fontFamily: 'SpaceMono',
  },
  proteinTag: {
    fontSize: 10,
    color: COLORS.danger,
    fontFamily: 'SpaceMono',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: 32,
  },
  label: {
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 6,
  },
  servingInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 8,
    color: COLORS.text,
    fontFamily: 'SpaceMono',
    fontSize: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    textAlign: 'center',
    marginBottom: 12,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingVertical: 12,
  },
  macroCell: {
    alignItems: 'center',
  },
  mealTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  mealTypeBtn: {
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mealTypeBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  mealTypeTxt: {
    fontSize: 11,
    color: COLORS.text,
    fontFamily: 'SpaceMono',
  },
});
