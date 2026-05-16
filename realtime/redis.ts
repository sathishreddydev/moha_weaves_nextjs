import Redis from "ioredis";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is not set");
}

// Single shared Redis client for pub/sub publishing
const redis = new Redis(process.env.REDIS_URL);

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err);
});

export default redis;
