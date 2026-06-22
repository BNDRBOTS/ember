import { Queue } from "bullmq";
import Redis from "ioredis";

export class PublisherService {
  private queue: Queue;
  constructor(redis: Redis) {
    this.queue = new Queue("publisher", { connection: redis as any });
  }
  async publishPost(postId: string, userId: string) {
    return this.queue.add("publish", { postId, userId });
  }
  async getJobStatus(jobId: string) {
    const job = await this.queue.getJob(jobId);
    if (!job) return null;
    return {
      id: job.id,
      state: await job.getState(),
      progress: job.progress,
      returnvalue: job.returnvalue,
    };
  }
}
