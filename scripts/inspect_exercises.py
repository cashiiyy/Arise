import json

exercises = json.load(open('Exercises/exercisedb_v1_sample/exercises.json'))
print(f'Total exercises: {len(exercises)}')
for e in exercises[:3]:
    keys = list(e.keys())
    print(f'Keys: {keys}')
    print(f'ID: {e.get("exerciseId", "?")}  Name: {e.get("name", "?")}')
    print(f'Body: {e.get("bodyParts", [])}  Target: {e.get("targetMuscles", [])}')
    print(f'Equip: {e.get("equipments", [])}')
    print()
