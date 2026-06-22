import { Worker } from "bullmq";
import Redis from "ioredis";
import { Pool } from "pg";
import { publishToPlatform } from "./adapters";

const redis = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const worker = new Worker(
  "publisher",
  async (job) => {
    const { postId, userId } = job.data;
    const postRes = await pool.query(
      `SELECT * FROM calendar_entries WHERE id=$1 AND user_id=$2`,
      [postId, userId]
    );
    if (postRes.rowCount === 0) throw new Error("Post not found");
    const post = postRes.rows[0];

    const tokenRes = await pool.query(
      `SELECT token_encrypted, platform FROM user_platform_tokens WHERE user_id=$1 AND platform=$2`,
      [userId, post.platform]
    );
    if (tokenRes.rowCount === 0) throw new Error("Platform token missing");

    const tokenEncrypted: Buffer = tokenRes.rows[0].token_encrypted;
    const token = decrypt(tokenEncrypted);

    try {
      const platformId = await publishToPlatform(post.platform, token, post.content, post.media_url);
      await pool.query(
        `UPDATE calendar_entries SET status='published', published_at=NOW(), external_id=$1 WHERE id=$2 AND user_id=$3`,
        [platformId, postId, userId]
      );
      return { platformId };
    } catch (err) {
      await pool.query(
        `UPDATE calendar_entries SET status='failed' WHERE id=$1 AND user_id=$2`,
        [postId, userId]
      );
      throw err;
    }
  },
  { connection: redis as any, concurrency: 5 }
);

import crypto from "crypto";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

function decrypt(encryptedBuffer: Buffer): string {
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const iv = encryptedBuffer.subarray(0, IV_LENGTH);
  const authTag = encryptedBuffer.subarray(IV_LENGTH, IV_LENGTH + 16);
  const encrypted = encryptedBuffer.subarray(IV_LENGTH + 16);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final("utf8");
}
