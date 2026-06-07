import redis from "./redis";

interface RealtimeEvent {
  type: string;
  [key: string]: any;
}

export const publishRealtimeEvent = async (eventType: string, data?: any): Promise<void> => {
  const event: RealtimeEvent = {
    type: eventType,
    ...(data && { data }),
  };
  try {
    await redis.publish("realtime", JSON.stringify(event));
  } catch (err) {
    // A Redis failure must never crash the HTTP handler that triggered it
    console.error(`[publishRealtimeEvent] Failed to publish "${eventType}":`, err);
  }
};
