import { Pool } from "pg";

export class AnalyticsService {
  constructor(private pool: Pool) {}
  async getSummary(userId: string, days: number) {
    const res = await this.pool.query(
      `SELECT COALESCE(SUM(pm.impressions),0) as impressions,
              COALESCE(SUM(pm.clicks),0) as clicks,
              COALESCE(COUNT(cev.id),0) as conversions
       FROM calendar_entries ce
       LEFT JOIN platform_metrics pm ON pm.post_id = ce.id
       LEFT JOIN conversion_events cev ON cev.post_id = ce.id
       WHERE ce.user_id = $1 AND ce.scheduled_time > NOW() - $2::INTERVAL`,
      [userId, `${days} days`]
    );
    return res.rows[0];
  }
  async recordConversion(userId: string, postId: string, eventType: string) {
    await this.pool.query(
      `INSERT INTO conversion_events (user_id, post_id, event_type) VALUES ($1,$2,$3)`,
      [userId, postId, eventType]
    );
  }
}
