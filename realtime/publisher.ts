import Redis from "ioredis";

const pub = new Redis(
  process.env.REDIS_URL!
);


interface RealtimeEvent {
  type: string
  [key: string]: any
}

export const publishRealtimeEvent = async (eventType: string, data?: any): Promise<void> => {
  const event: RealtimeEvent = {
    type: eventType,
    ...(data && { data })
  }
  await pub.publish(
    "realtime",
    JSON.stringify(event)
  )
}
