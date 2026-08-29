import { createClient } from "redis";
import config from "../config/index.js";

const redisClient = createClient({
  url: config.redis_url,
});

redisClient.on("error", (err) => console.error("Redis Client Error:", err.message));

try {
  await redisClient.connect();
  console.log("⚡ Redis connected successfully");
} catch (err: any) {
  console.error("⚠️ Redis connection failed:", err.message);
}

export default redisClient;
