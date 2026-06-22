import { initScheduler } from "./scheduler";
import Redis from "ioredis";
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", { maxRetriesPerRequest: null });
initScheduler(redis).catch(console.error);
