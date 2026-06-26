import { getDB } from '../database/sqliteDB';

export interface DailyStats {
  date: string;
  totalXp: number;
  totalKcal: number;
  completedSessions: number;
}

export class AnalyticsService {
  /**
   * Retrieves the last N days of statistics.
   */
  static async getRecentStats(days: number = 30): Promise<DailyStats[]> {
    try {
      const db = getDB();
      // SQLite date manipulation to get recent records
      const rows = await db.getAllAsync(`
        SELECT date, total_xp as totalXp, total_kcal as totalKcal, completed_sessions as completedSessions
        FROM Statistics
        ORDER BY date DESC
        LIMIT ?
      `, [days]);
      return rows as DailyStats[];
    } catch (e) {
      console.error('[AnalyticsService] Failed to fetch stats', e);
      return [];
    }
  }

  /**
   * Aggregates total metrics for the user lifetime.
   */
  static async getLifetimeMetrics(): Promise<{ totalWorkouts: number, totalVolumeKg: number }> {
    try {
      const db = getDB();
      const sessionsResult = await db.getAllAsync(`SELECT count(*) as count FROM ExerciseHistory`);
      const count = (sessionsResult[0] as any)?.count || 0;

      const volumeResult = await db.getAllAsync(`SELECT sum(weight * reps) as volume FROM ExerciseHistory`);
      const volume = (volumeResult[0] as any)?.volume || 0;

      return { totalWorkouts: count, totalVolumeKg: volume };
    } catch (e) {
      return { totalWorkouts: 0, totalVolumeKg: 0 };
    }
  }
}
