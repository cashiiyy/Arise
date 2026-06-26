import * as SQLite from 'expo-sqlite';

// Open or create the database
const db = SQLite.openDatabaseSync('arise.db');

/**
 * Initializes the database tables if they do not exist.
 * This should be called on app startup.
 */
export async function initializeDatabase() {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS Users (
        id TEXT PRIMARY KEY,
        name TEXT,
        age INTEGER,
        height REAL,
        weight REAL,
        goal TEXT,
        rank_index INTEGER DEFAULT 0,
        xp INTEGER DEFAULT 0,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS ExerciseHistory (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        exercise_id TEXT,
        weight REAL,
        reps INTEGER,
        rpe INTEGER,
        timestamp TEXT,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS NutritionLogs (
        id TEXT PRIMARY KEY,
        food_id TEXT,
        serving_g REAL,
        meal_type TEXT,
        kcal REAL,
        protein REAL,
        carbs REAL,
        fat REAL,
        timestamp TEXT,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS WaterLogs (
        id TEXT PRIMARY KEY,
        ml INTEGER,
        timestamp TEXT,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS Quests (
        id TEXT PRIMARY KEY,
        type TEXT,
        title TEXT,
        description TEXT,
        target INTEGER,
        progress INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        timestamp TEXT,
        deadline TEXT,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS WatchTelemetry (
        id TEXT PRIMARY KEY,
        timestamp TEXT,
        steps INTEGER,
        heart_rate INTEGER,
        sleep_score INTEGER,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS Achievements (
        id TEXT PRIMARY KEY,
        type TEXT,
        title TEXT,
        description TEXT,
        timestamp TEXT,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS Statistics (
        id TEXT PRIMARY KEY,
        date TEXT,
        total_xp INTEGER DEFAULT 0,
        total_kcal REAL DEFAULT 0,
        completed_sessions INTEGER DEFAULT 0,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS Settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT
      );
    `);
    console.log('[SQLiteDB] Database initialized successfully.');
  } catch (error) {
    console.error('[SQLiteDB] Initialization error:', error);
    throw error;
  }
}

/**
 * Utility to get the database instance
 */
export function getDB() {
  return db;
}
