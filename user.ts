import { Pool } from "pg";
import bcrypt from "bcryptjs";

export class UserService {
  constructor(private pool: Pool) {}
  async createUser(email: string, password: string, name: string) {
    const hash = await bcrypt.hash(password, 10);
    const res = await this.pool.query(
      `INSERT INTO users (email, password_hash, name) VALUES ($1,$2,$3) RETURNING id`,
      [email, hash, name]
    );
    return res.rows[0].id;
  }
  async validateUser(email: string, password: string) {
    const res = await this.pool.query(`SELECT id, password_hash FROM users WHERE email=$1`, [email]);
    if (res.rowCount === 0) return null;
    const { id, password_hash } = res.rows[0];
    const valid = await bcrypt.compare(password, password_hash);
    return valid ? id : null;
  }
  async updateBrandSettings(userId: string, toneSlider: number, bannedWords: string[]) {
    await this.pool.query(`UPDATE users SET tone_slider=$1, banned_words=$2 WHERE id=$3`, [toneSlider, bannedWords, userId]);
  }
  async getBrandSettings(userId: string) {
    const res = await this.pool.query(`SELECT tone_slider, banned_words FROM users WHERE id=$1`, [userId]);
    return res.rows[0] || { tone_slider: 0, banned_words: [] };
  }
}
