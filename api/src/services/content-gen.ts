import { Queue } from "bullmq";
import Redis from "ioredis";

export class ContentGenService {
  private queue: Queue;
  constructor(redis: Redis) {
    this.queue = new Queue("content-gen", { connection: redis as any });
  }
  async requestGeneration(data: any) {
    return this.queue.add("generate", data, { removeOnComplete: 100, removeOnFail: 500 });
  }
  async requestVoiceExtraction(userId: string, posts: string[]) {
    return this.queue.add("extract-voice", { userId, posts });
  }
  async requestAutoFill(userId: string, weeks: number) {
    return this.queue.add("auto-fill", { userId, weeks });
  }
}
