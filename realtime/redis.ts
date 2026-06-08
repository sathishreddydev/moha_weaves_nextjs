import Redis from "ioredis";

// Lazy Redis connection — only connects when first accessed at runtime.
// This prevents build-time crashes since REDIS_URL isn't available during `next build`.

let _redis: Redis | null = null;

function getRedis(): Redis {
  if (_redis) return _redis;

  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL environment variable is not set");
  }

  _redis = new Redis(url, {
    maxRetriesPerRequest: 3,
    keepAlive: 30000,
    lazyConnect: false,
  });

  _redis.on("connect", () => {
    console.log("✅ Redis connected");
  });

  _redis.on("error", (err) => {
    console.error("❌ Redis error:", err.message);
  });

  return _redis;
}

// Export a proxy that lazily initializes on first method call
const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    const instance = getRedis();
    return (instance as any)[prop];
  },
});

export default redis;
