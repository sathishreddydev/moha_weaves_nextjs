import Redis from "ioredis";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is not set");
}

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  keepAlive: 30000,
  lazyConnect: false,
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  // Log only the message — never the full error which may contain the URL/credentials
  console.error("❌ Redis error:", err.message);
});

export default redis;
