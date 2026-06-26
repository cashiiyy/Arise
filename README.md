# 🌌 Arise: Solo Leveling Fitness RPG App

Arise is a Solo Leveling-inspired fitness RPG app that gamifies your workout routine. Level up your real-life strength, agility, and endurance, gain XP, and rank up from E-Rank to S-Rank. It combines high-performance workout tracking, AI-powered customized training schedules, nutrition monitoring, and real-time offline synchronization.

---

## 🌟 Key Features

### 1. Solo Leveling Gamified Interface
* **Rank & XP Progression:** Earn XP by completing workouts and hitting your sets/reps targets. Rank up your character from E-Rank all the way to S-Rank.
* **Futuristic Dark Theme:** Sleek dark-mode interface utilizing neon blue (`#00f0ff`) and purple (`#a100ff`) neon glows to match the futuristic gates/dungeons style.
* **Biometrics & Stats:** Monitor your strength, agility, and intelligence attributes based on your workout consistency and type of exercises.

### 2. Complete Offline-First database (Expo SQLite)
* All user profiles, biometrics, planned workouts, active logs, set histories, and custom entries are persisted directly on your device using `expo-sqlite`. No constant internet connection required.

### 3. Integrated Exercise Dataset
* **Indexed Search Layer:** High-speed lookup indices (`exerciseById`, `exerciseByMuscle`, `exerciseByEquipment`, etc.) initialized once for smooth searching without lag.
* **Visual Guides:** High-quality autoplaying loop GIFs showing exactly how to perform exercises correctly.
* **Manual Additions:** Flexibility to search the database and manually inject any exercise into your active workout session.

### 4. AI-Powered Workout Planner
* **Provider-based Architecture:** Modular AI system under `src/ai` ready for providers like Gemini, OpenAI, Claude, or Ollama, supported by a rule-based deterministic orchestration engine.
* **Custom Generator:** Generates custom daily and weekly workout routines tailored to your specific Rank, target focus areas, and available gym equipment.

### 5. Nutrition & Food Tracker
* Fully scrollable and instant local search of foods and macronutrients to log daily calorie, protein, carb, and fat intake.

---

## 🛠️ Technology Stack
* **Framework:** React Native + Expo (SDK 56+)
* **Navigation:** Expo Router (File-based routing)
* **State Management:** Zustand (Global stores for workouts and user profiles)
* **Database:** Expo SQLite (Native SQLite database wrapper)
* **Styles:** React Native StyleSheet (custom dark-theme layout system)
* **Icons & Visuals:** Lucide React Native, Lottie Animations, Expo Image (high-performance GIF caching)

---

## 🚀 Quick Start & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Prebuild Native Folders
Since this app uses native modules (SQLite, HealthKit, etc.), you must generate the android/ios folders before running:
```bash
npx expo prebuild
```

### 3. Run Locally (Dev Server)
To run the bundler and test on an emulator or physical device via Expo Go / Development Build:
```bash
npx expo start
```
* Press `a` to open on Android Emulator.
* Press `i` to open on iOS Simulator.

---

## 📦 Building for Production (Android APK)

We include a custom powershell build script (`build_apk.ps1`) to bypass system Java configuration issues by automatically downloading and using OpenJDK 17.

To compile a release APK (`app-release.apk`):
1. Open PowerShell in the project directory.
2. Run the build script:
   ```powershell
   .\build_apk.ps1
   ```
3. Once completed, the final APK file will be located at:
   `android/app/build/outputs/apk/release/app-release.apk`
