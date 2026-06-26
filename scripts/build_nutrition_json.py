"""
Pre-processes the nutrition CSV datasets into optimized JSON files
for fast loading in the React Native app.
Outputs: Nutrition/indian_foods_data.json and Nutrition/global_foods_data.json
"""
import csv
import json
import os
import re

def safe_float(val, default=0.0):
    try:
        v = float(str(val).strip())
        return round(v, 2) if not (v != v) else default  # NaN check
    except:
        return default

def slugify(name):
    return re.sub(r'[^a-z0-9_]', '_', name.lower().strip())[:50]

# ─── Indian Food Dataset ─────────────────────────────────────────────────────
indian_path = 'Nutrition/Indian_Food_Nutrition_Processed.csv'
indian_foods = []

if os.path.exists(indian_path):
    with open(indian_path, encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            name = row.get('Dish Name', '').strip()
            if not name or len(name) < 2:
                continue
            food = {
                'id': f'in_{i+1:04d}',
                'name': name,
                'source': 'indian',
                'servingG': 100,
                'kcal': safe_float(row.get('Calories (kcal)', 0)),
                'protein': safe_float(row.get('Protein (g)', 0)),
                'carbs': safe_float(row.get('Carbohydrates (g)', 0)),
                'fat': safe_float(row.get('Fats (g)', 0)),
                'fiber': safe_float(row.get('Fibre (g)', 0)),
                'sugar': safe_float(row.get('Free Sugar (g)', 0)),
                'sodium': safe_float(row.get('Sodium (mg)', 0)),
                'calcium': safe_float(row.get('Calcium (mg)', 0)),
                'iron': safe_float(row.get('Iron (mg)', 0)),
                'vitaminC': safe_float(row.get('Vitamin C (mg)', 0)),
            }
            # Only include foods with valid calorie data
            if food['kcal'] > 0:
                indian_foods.append(food)

    print(f'Loaded {len(indian_foods)} Indian foods')
    with open('Nutrition/indian_foods_data.json', 'w', encoding='utf-8') as f:
        json.dump(indian_foods, f, ensure_ascii=False, separators=(',', ':'))
    print(f'Saved Nutrition/indian_foods_data.json ({os.path.getsize("Nutrition/indian_foods_data.json") // 1024} KB)')
else:
    print(f'WARNING: {indian_path} not found')

# ─── Global Food Dataset (GROUP 1-5) ─────────────────────────────────────────
global_foods = []
seen_names = set()
group_files = [
    'Nutrition/FINAL FOOD DATASET/FOOD-DATA-GROUP1.csv',
    'Nutrition/FINAL FOOD DATASET/FOOD-DATA-GROUP2.csv',
    'Nutrition/FINAL FOOD DATASET/FOOD-DATA-GROUP3.csv',
    'Nutrition/FINAL FOOD DATASET/FOOD-DATA-GROUP4.csv',
    'Nutrition/FINAL FOOD DATASET/FOOD-DATA-GROUP5.csv',
]

for file_path in group_files:
    if not os.path.exists(file_path):
        print(f'MISSING: {file_path}')
        continue
    with open(file_path, encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)
        file_count = 0
        for i, row in enumerate(reader):
            name = row.get('food', '').strip()
            if not name or len(name) < 2:
                continue
            # Deduplicate
            name_key = name.lower()
            if name_key in seen_names:
                continue
            seen_names.add(name_key)

            kcal = safe_float(row.get('Caloric Value', 0))
            if kcal <= 0:
                continue

            food = {
                'id': f'gl_{len(global_foods)+1:05d}',
                'name': name.title(),
                'source': 'global',
                'servingG': 100,
                'kcal': kcal,
                'protein': safe_float(row.get('Protein', 0)),
                'carbs': safe_float(row.get('Carbohydrates', 0)),
                'fat': safe_float(row.get('Fat', 0)),
                'fiber': safe_float(row.get('Dietary Fiber', 0)),
                'sugar': safe_float(row.get('Sugars', 0)),
                'sodium': safe_float(row.get('Sodium', 0)) * 1000,  # convert g to mg
                'calcium': safe_float(row.get('Calcium', 0)) * 1000,
                'iron': safe_float(row.get('Iron', 0)) * 1000,
                'vitaminC': safe_float(row.get('Vitamin C', 0)) * 1000,
            }
            global_foods.append(food)
            file_count += 1
        print(f'  {os.path.basename(file_path)}: {file_count} foods')

print(f'\nTotal global foods: {len(global_foods)}')
with open('Nutrition/global_foods_data.json', 'w', encoding='utf-8') as f:
    json.dump(global_foods, f, ensure_ascii=False, separators=(',', ':'))
print(f'Saved Nutrition/global_foods_data.json ({os.path.getsize("Nutrition/global_foods_data.json") // 1024} KB)')
print('\nDone! Both datasets converted to JSON.')
