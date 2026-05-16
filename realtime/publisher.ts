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
  await redis.publish("realtime", JSON.stringify(event));
};
