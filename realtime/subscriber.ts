import { sub } from "./redis"
import { RedisMessage, RealtimeEvent } from "./types"
const { getSocketServer } = require("./socket-server")

export class RedisSubscriber {
  private subscriptions: Map<string, (message: RedisMessage) => void> = new Map()

  constructor() {
    this.setupRedisSubscriber()
  }

  private setupRedisSubscriber(): void {
    sub.on("message", (channel: string, message: string) => {
      try {
        const parsedMessage: RedisMessage = {
          channel,
          message,
          timestamp: new Date()
        }

        const handler = this.subscriptions.get(channel)
        if (handler) {
          handler(parsedMessage)
        }

        this.handleRealtimeEvent(channel, message)
      } catch (error) {
      }
    })
  }

  private handleRealtimeEvent(channel: string, message: string): void {
    try {
      const event: RealtimeEvent = JSON.parse(message)

      switch (event.type) {

        case 'user_order_created':
          this.handleUserOrderCreated(event)
          break


        default:
      }
    } catch (error) {
    }
  }

  private handleUserOrderCreated(event: RealtimeEvent): void {
    const io = getSocketServer()
    io.emit("user_order_created", { type: event.type })
  }






  public subscribe(channel: string, callback: (message: RedisMessage) => void): void {
    this.subscriptions.set(channel, callback)
    sub.subscribe(channel)
  }

  public unsubscribe(channel: string): void {
    this.subscriptions.delete(channel)
    sub.unsubscribe(channel)
  }

  public getSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys())
  }

  public close(): void {
    this.subscriptions.clear()
    sub.quit()
  }
}

export const redisSubscriber = new RedisSubscriber()

export const initSubscriber = async () => {

  redisSubscriber.subscribe(
    "realtime",
    (message) => {
    }
  );

  // Subscribe to orders channel from Next.js app
  redisSubscriber.subscribe(
    "orders",
    (message) => {
    }
  );

};