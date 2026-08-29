import { createClient } from "redis";
import env from "./env.js";

export const redisClient = createClient({
  url: env.redis_url,
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err.message);
});

export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log("⚡ Redis connected successfully");
    }
  } catch (err: any) {
    console.error("⚠️ Redis connection failed:", err.message);
  }
};

export default redisClient;
